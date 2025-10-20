package com.boot.eumbank.customer.service;

import com.boot.eumbank.customer.dto.AgreeRequest;
import com.boot.eumbank.customer.dto.AuthResponse;
import com.boot.eumbank.customer.dto.CustomOAuth2User;
import com.boot.eumbank.customer.dto.SignupRequest;
import com.boot.eumbank.customer.entity.AuthRefreshToken;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.AuthRefreshTokenRepo;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.customer.security.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SocialService extends DefaultOAuth2UserService {

    private final CustomerRepo customers;
    private final AuthRefreshTokenRepo refreshTokens;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider jwt;

    // 네이버 로그인
    @Override
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) throws OAuth2AuthenticationException {
        System.out.println("<<< SocialService loadUser >>>");

        // 부모 메서드 호출
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);

        Map<String, Object> attributes;
        List<GrantedAuthority> authorities = List.of();;

        String userId;
        String rawPw;
        String nameKr;
        String email;
        String phone;
        String birthyear;
        String birthday;
        String fullDate;
        LocalDate birthDt = null;

        // 네이버로그인이 맞는지 확인
        String registrationId = oAuth2UserRequest.getClientRegistration().getRegistrationId().toUpperCase();
        if(registrationId.equals("NAVER")) {
            attributes = (Map<String, Object>) oAuth2User.getAttributes().get("response");

            System.out.println("attributes: " + attributes);

            String idValue = attributes.get("id").toString();
            userId = idValue.length() > 20 ? idValue.substring(0, 20) : idValue;
            rawPw = idValue;
            nameKr = attributes.get("name").toString();
            email = attributes.get("email").toString();
            phone = attributes.get("mobile").toString();
            birthyear = attributes.get("birthyear").toString();
            birthday = attributes.get("birthday").toString();
            fullDate = birthyear + "-" + birthday;
            birthDt = LocalDate.parse(fullDate, DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        } else if(registrationId.equals("GOOGLE")) {
            attributes = (Map<String, Object>) oAuth2User.getAttributes();

            System.out.println("attributes: " + attributes);

            String idValue = attributes.get("sub").toString();
            userId = idValue.length() > 20 ? idValue.substring(0, 20) : idValue;
            //rawPw = attributes.get("password").toString();
            rawPw = "password";
            nameKr = attributes.get("name").toString();
            email = attributes.get("email").toString();
            phone = "000-0000-0000";

        } else {
            throw new OAuth2AuthenticationException("지원하지 않은 소셜 로그인입니다.");
        }

        // DB에 있는지 확인 -> 없으면 추가, 있으면 업데이트
        Optional<Customer> customer = customers.findByUserIdAndLoginType(userId, "NAVER");
        //Optional<Customer> customer = customers.findByUserIdAndLoginType(userId, "GOOGLE");
        if(customer.isPresent()) {
            // 기존 정보 업데이트
            SignupRequest signupRequest = new SignupRequest();
            signupRequest.setC_password(encoder.encode(rawPw));
            signupRequest.setC_name_kr(nameKr);
            signupRequest.setC_email(email);
            signupRequest.setC_phone_mobile(phone);
            signupRequest.setC_birth_dt(birthDt);
            //signupRequest.setC_phone_mobile(customer.get().getCPhoneMobile());

            customer.get().updateCustomer(signupRequest);

            customers.save(customer.get());
        } else {
            // DB에 추가
            Customer newCustomer = Customer.builder()
                    .userId(userId)
                    .cId(userId)
                    .cPassword(encoder.encode(rawPw))
                    .cNameKr(nameKr)
                    .cBirthDt(LocalDate.from(birthDt))
                    .cEmail(email)
                    .cPhoneMobile(phone)
                    .cNationalityCd("KOR")
                    .cAuthLevel(1)
                    .cRiskGrade("LOW")
                    .cIsPep("N")
                    .cIsSanctionHit("N")
                    .cStatus("ACTIVE")
                    .cCreatedAt(Instant.now())
                    .cCreatedBy("SYSTEM")
                    .cAgreeTerms("N")
                    .cAgreePrivacy("N")
                    .cAgreeMarketing("N")
                    .loginType("NAVER")
                    .build();

            customers.save(newCustomer);
        }

        return new CustomOAuth2User(attributes, authorities, userId);
    }

    // 네이버 로그인 성공후 쿠키에 저장한 Refresh 토큰으로 다시 전달
    @Transactional
    public AuthResponse refreshRotate(HttpServletRequest request, HttpServletResponse response) {
        System.out.println("<<< SocialService refreshRotate >>>");

        Cookie[] cookies = request.getCookies();
        if(cookies == null) {
            throw new RuntimeException("쿠키가 존재하지 않습니다.");
        }

        String refreshToken = null;
        for (Cookie cookie : cookies) {
            if("refreshToken".equals(cookie.getName())) {
                refreshToken = cookie.getValue();
                break;
            }
        }

        if(refreshToken == null) {
            throw new RuntimeException("refreshToken 쿠키가 없습니다.");
        }

        boolean isValid = jwt.validateRefreshToken(refreshToken);
        if(!isValid) {
            throw new RuntimeException("유효하지 않은 refreshToken입니다.");
        }

        // DB에서 해시 매칭(회수되지 않은 토큰이어야 함)
        String hash = sha256(refreshToken);
        AuthRefreshToken saved = refreshTokens.findByRtHashAndDeleteAtIsNull(hash)
                .orElseThrow(() -> new IllegalArgumentException("토큰이 존재하지 않거나 이미 만료/회수되었습니다."));

        // 만료 체크(서명 OK라도 서버 정책상 만료 또는 회수되었을 수 있음)
        if (saved.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("토큰이 만료되었습니다. 다시 로그인하세요.");
        }

        String userId = jwt.getSubjectFromRefresh(refreshToken);
        Customer customer = customers.findByUserIdAndLoginType(userId, "NAVER")
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
//        Customer customer = customers.findByUserIdAndLoginType(userId, "GOOGLE")
//                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        String userAgent = request.getHeader("User-Agent");
        String xff = request.getHeader("X-Forwarded-For");
        String clientIp;
        if (xff != null && !xff.isBlank()) {
            clientIp = xff.split(",")[0].trim();
        } else {
            clientIp = request.getRemoteAddr();
        }

        // 기존 토큰 만료
        saved.setDeleteAt(Instant.now());
        saved.setDeleteReason("COOKIE");
        refreshTokens.saveAndFlush(saved);

        // 토큰 생성
        String newAccess = jwt.createAccessToken(userId);
        String newRefresh = jwt.createRefreshToken(userId);
        String newRefreshHash = sha256(newRefresh);

        // 혹시 기존 토큰 해시와 동일하면 새로 생성
        if (newRefreshHash.equals(saved.getRtHash())) {
            newRefresh = jwt.createRefreshToken(userId);
            newRefreshHash = sha256(newRefresh);
        }

        AuthRefreshToken refresh = new AuthRefreshToken();
        refresh.setCustomerNo(customer.getCustomerNo());
        refresh.setRtHash(newRefreshHash);
        refresh.setIssuedAt(Instant.now());
        refresh.setExpiresAt(jwt.getExpiryFromRefresh(newRefresh));
        refresh.setTFrom("COOKIE");
        refresh.setLastUsedAt(Instant.now());
        refresh.setLastUsedIp(clientIp);
        refresh.setUserAgent(userAgent);

        Instant now = Instant.now();
        // 같은 사용자 오래된 토큰 정리 정책(선택): 10개 이상이면 전체 삭제
        if (refreshTokens.countByCustomerNoAndExpiresAtAfterAndDeleteAtIsNull(customer.getCustomerNo(), now) >= 10) {
            refreshTokens.markAllDeletedByCustomerWithQueryDsl(customer.getCustomerNo(),Instant.now(),"TOO_MANY_TOKENS");
        }

        refreshTokens.save(refresh);

        // 기존 쿠키 제거
        Cookie refreshCookie = new Cookie("refreshToken", null);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(10);
        response.addCookie(refreshCookie);

        return AuthResponse.builder()
                .accessToken(newAccess)
                .tokenType("Bearer")
                .refreshToken(newRefresh)
                .build();
    }

    private String sha256(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (Exception e) {
            throw new IllegalStateException("해시 계산 실패", e);
        }
    }

    // 약관 동의
    public void agree(AgreeRequest req) {
        System.out.println("<<< SocialService agree >>>");

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();

        customer.setCAgreeTerms(req.getC_agree_terms());
        customer.setCAgreePrivacy(req.getC_agree_privacy());
        customer.setCAgreeMarketing(req.getC_agree_marketing());

        customers.save(customer);

    }

    // 약관 동의 여부 확인
    public AgreeRequest getAgree() {
        System.out.println("<<< SocialService getAgree >>>");

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();

        AgreeRequest agree = new AgreeRequest();
        agree.setC_agree_terms(customer.getCAgreeTerms());
        agree.setC_agree_privacy(customer.getCAgreePrivacy());

        return agree;
    }
}