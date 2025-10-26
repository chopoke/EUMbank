package com.boot.eumbank.customer.service;

import com.boot.eumbank.customer.dto.AgreeRequest;
import com.boot.eumbank.customer.dto.AuthResponse;
import com.boot.eumbank.customer.dto.CustomOAuth2User;
import com.boot.eumbank.customer.dto.LinkRequest;
import com.boot.eumbank.customer.entity.AuthRefreshToken;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.AuthRefreshTokenRepo;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.customer.security.CookieUtil;
import com.boot.eumbank.customer.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
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
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SocialServiceImpl extends DefaultOAuth2UserService implements SocialService  {

    private Logger logger = LoggerFactory.getLogger(SocialServiceImpl.class);

    private final CustomerRepo customers;
    private final AuthRefreshTokenRepo refreshTokens;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider jwt;
    private final CookieUtil cookieUtil;

    // 네이버 로그인
    @Override
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) throws OAuth2AuthenticationException {
        logger.info("<<< SocialService loadUser >>>");

        // 부모 메서드 호출
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);

        Map<String, Object> attributes;
        List<GrantedAuthority> authorities = List.of();

        String naverId = "";
        String googleId;
        String userId = "";
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

            logger.info("attributes: " + attributes);

            naverId = attributes.get("id").toString();
            userId = naverId.length() > 20 ? naverId.substring(0, 20) : naverId;
            nameKr = attributes.get("name").toString();
            email = attributes.get("email").toString();
            phone = attributes.get("mobile").toString();
            birthyear = attributes.get("birthyear").toString();
            birthday = attributes.get("birthday").toString();
            fullDate = birthyear + "-" + birthday;
            birthDt = LocalDate.parse(fullDate, DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        } else if(registrationId.equals("GOOGLE")) {
            attributes = (Map<String, Object>) oAuth2User.getAttributes();

            logger.info("attributes: " + attributes);

            googleId = attributes.get("sub").toString();
            userId = googleId.length() > 20 ? googleId.substring(0, 20) : googleId;
            nameKr = attributes.get("name").toString();
            email = attributes.get("email").toString();
            phone = "000-0000-0000";

        } else {
            throw new OAuth2AuthenticationException("지원하지 않은 소셜 로그인입니다.");
        }

        // DB에 있는지 확인 -> 없으면 통합회원 / 신규 회원, 있으면 바로 로그인
        if(!customers.existsByNaverId(naverId)) {
            Optional<Customer> customer = customers.findByEmail(email);
            if(customer.isPresent()) {
                logger.info("customer: " + customer.get());
                // 연동 여부 확인 필요
                Map<String, String> payload = Map.of(
                  "userId", customer.get().getUserId(),
                  "email", email,
                  "naverId", naverId
                );

                attributes.put("need_link_confirmation", true);
                attributes.put("payload", payload);

                return new CustomOAuth2User(attributes, authorities, userId);

            } else {
                // DB에 추가
                Customer newCustomer = Customer.builder()
                        .userId(userId)
                        .cId(userId)
                        .cPassword(encoder.encode(randomPassword()))
                        .cNameKr(nameKr)
                        .cBirthDt(LocalDate.from(birthDt))
                        .email(email)
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
                        .naverId(naverId)
                        .build();

                customers.save(newCustomer);
            }

        } else {
            Optional<Customer> customer = customers.findByNaverId(naverId);
            userId = customer.get().getUserId();
            return new CustomOAuth2User(attributes, authorities, userId);
        }

        return new CustomOAuth2User(attributes, authorities, userId);
    }

    private String randomPassword() {
        // 32바이트(256비트) 난수 → Base64URL(= 쿠키/로그에 안전한 문자셋), 패딩 제거
        byte[] buf = new byte[32];
        new SecureRandom().nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
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
    @Override
    public void updateAgree(AgreeRequest req) {
        logger.info("<<< SocialService agree >>>");

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();

        customer.setCAgreeTerms(req.getC_agree_terms());
        customer.setCAgreePrivacy(req.getC_agree_privacy());
        customer.setCAgreeMarketing(req.getC_agree_marketing());

        customers.save(customer);

    }

    // 약관 동의 여부 확인
    @Override
    public AgreeRequest getAgree() {
        logger.info("<<< SocialService getAgree >>>");

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();

        AgreeRequest agree = new AgreeRequest();
        agree.setC_agree_terms(customer.getCAgreeTerms());
        agree.setC_agree_privacy(customer.getCAgreePrivacy());

        return agree;
    }

    // 네이버 연동 확정 시: RT를 쿠키로, 바디에는 AT만
    @Override
    public ResponseEntity<?> linkNaverId(LinkRequest req, HttpServletRequest request, HttpServletResponse response) {
        logger.info("<<< SocialService linkNaverId >>>");
        Optional<Customer> customer = customers.findByUserId(req.getC_user_id());

        if (customer.isEmpty()) return ResponseEntity.badRequest().body("해당  없음");

        Customer c = customer.get();
        c.setNaverId(req.getC_naver_id());
        c.setCUpdatedAt(Instant.now());
        c.setCUpdatedBy("SOCIAL_LINK");
        c.setLoginType("NAVER");
        customers.save(c);

        String userId = c.getUserId();

        String access = jwt.createAccessToken(userId);
        String refresh = jwt.createRefreshToken(userId);
        String refreshHash = sha256(refresh);

        String userAgent = request.getHeader("User-Agent");
        String xff = request.getHeader("X-Forwarded-For");
        String clientIp = (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : request.getRemoteAddr();

        Instant now = Instant.now();
        AuthRefreshToken row = new AuthRefreshToken();
        row.setCustomerNo(c.getCustomerNo());
        row.setRtHash(refreshHash);
        row.setIssuedAt(now);
        row.setExpiresAt(jwt.getExpiryFromRefresh(refresh));
        row.setTFrom("LOGIN");
        row.setLastUsedAt(now);
        row.setLastUsedIp(clientIp);
        row.setUserAgent(userAgent);
        refreshTokens.save(row);

        // 쿠키로만 RT 전달
        cookieUtil.addRefreshCookie(response, refresh, jwt.getRefreshTtlSec());

        AuthResponse body = AuthResponse.builder()
                .accessToken(access)
                .tokenType("Bearer")
                .refreshToken(null)
                .build();

        return ResponseEntity.ok(body);
    }
}


// 네이버 로그인 성공 후: RT → AT 교환(멱등 처리 포함)
//    @Transactional
//    @Override
//    public AuthResponse refreshRotate(HttpServletRequest request, HttpServletResponse response) {
//        logger.info("<<< SocialService refreshRotate >>>");
//
//        // 1) rt 쿠키
//        String refreshToken = cookieUtil.getRefreshCookie(request)
//                .orElseThrow(() -> new IllegalArgumentException("MISSING_RT_COOKIE"));
//        logger.info("[EXCHANGE] rt.len={}, rt.prefix={}", refreshToken.length(),
//                refreshToken.substring(0, Math.min(12, refreshToken.length())));
//
//        // 2) 서명 검증
//        if (!jwt.validateRefreshToken(refreshToken)) {
//            logger.warn("[EXCHANGE] INVALID_SIGNATURE");
//            throw new IllegalArgumentException("INVALID_SIGNATURE");
//        }
//
//        // 3) 해시
//        String hash = sha256(refreshToken);
//        logger.info("[EXCHANGE] rt.hash={}", hash);
//
//        // 4) 활성 RT 조회
//        Optional<AuthRefreshToken> aliveOpt = refreshTokens.findByRtHashAndDeleteAtIsNull(hash);
//        AuthRefreshToken saved;
//
//        if (aliveOpt.isEmpty()) {
//            // 4-1) 최근에 이미 회전된 중복 요청 → 멱등 처리
//            Instant since = Instant.now().minusSeconds(30);
//            boolean recentlyRotated = refreshTokens
//                    .findByRtHashAndDeleteAtAfterAndDeleteReason(hash, since, "ROTATED_BY_OAUTH2")
//                    .isPresent();
//            if (!recentlyRotated) {
//                logger.warn("[EXCHANGE] RT_NOT_FOUND(idempotent miss)");
//                throw new IllegalArgumentException("RT_NOT_FOUND");
//            }
//
//            String userId = jwt.getSubjectFromRefresh(refreshToken);
//            Customer customer = customers.findByUserIdAndLoginType(userId, "NAVER")
//                    .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
//
//            // 새 AT/RT 재발급 후 정상 응답
//            String at  = jwt.createAccessToken(userId);
//            String rt  = jwt.createRefreshToken(userId);
//            String h   = sha256(rt);
//
//            AuthRefreshToken nt = new AuthRefreshToken();
//            nt.setCustomerNo(customer.getCustomerNo());
//            nt.setRtHash(h);
//            nt.setIssuedAt(Instant.now());
//            nt.setExpiresAt(jwt.getExpiryFromRefresh(rt));
//            nt.setTFrom("OAUTH2_IDEMPOTENT");
//            nt.setLastUsedAt(Instant.now());
//            nt.setLastUsedIp(request.getRemoteAddr());
//            nt.setUserAgent(request.getHeader("User-Agent"));
//            refreshTokens.save(nt);
//
//            cookieUtil.addRefreshCookie(response, rt, jwt.getRefreshTtlSec());
//            return AuthResponse.builder().tokenType("Bearer").accessToken(at).refreshToken(null).build();
//        }
//
//        saved = aliveOpt.get();
//        if (saved.getExpiresAt().isBefore(Instant.now())) {
//            logger.warn("[EXCHANGE] RT_EXPIRED at={}", saved.getExpiresAt());
//            throw new IllegalArgumentException("RT_EXPIRED");
//        }
//
//        String userId = jwt.getSubjectFromRefresh(refreshToken);
//        Customer customer = customers.findByUserIdAndLoginType(userId, "NAVER")
//                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
//
//        // 5) 기존 RT 회수
//        saved.setDeleteAt(Instant.now());
//        saved.setDeleteReason("ROTATED_BY_OAUTH2");
//        refreshTokens.saveAndFlush(saved);
//
//        // 6) 새 AT/RT 발급 (DB 유니크 충족까지 루프)
//        String newAT = jwt.createAccessToken(userId);
//
//        String newRT, newHash;
//        int tries = 0;
//        do {
//            newRT  = jwt.createRefreshToken(userId);
//            newHash = sha256(newRT);
//        } while ((newHash.equals(saved.getRtHash()) || refreshTokens.existsByRtHash(newHash))
//                && ++tries < 10);
//
//        if (refreshTokens.existsByRtHash(newHash)) {
//            newRT  = jwt.createRefreshToken(userId);
//            newHash = sha256(newRT);
//        }
//
//        AuthRefreshToken nt = new AuthRefreshToken();
//        nt.setCustomerNo(customer.getCustomerNo());
//        nt.setRtHash(newHash);
//        nt.setIssuedAt(Instant.now());
//        nt.setExpiresAt(jwt.getExpiryFromRefresh(newRT));
//        nt.setTFrom("OAUTH2");
//        nt.setLastUsedAt(Instant.now());
//        nt.setLastUsedIp(request.getRemoteAddr());
//        nt.setUserAgent(request.getHeader("User-Agent"));
//        refreshTokens.save(nt);
//
//        // 7) 새 RT 쿠키
//        cookieUtil.addRefreshCookie(response, newRT, jwt.getRefreshTtlSec());
//
//        return AuthResponse.builder()
//                .tokenType("Bearer")
//                .accessToken(newAT)
//                .refreshToken(null)
//                .build();
//    }


//        Cookie[] cookies = request.getCookies();
//        if(cookies == null) {
//            throw new RuntimeException("쿠키가 존재하지 않습니다.");
//        }
//
//        String refreshToken = null;
//        for (Cookie cookie : cookies) {
//            if("refreshToken".equals(cookie.getName())) {
//                refreshToken = cookie.getValue();
//                break;
//            }
//        }
//
//        if(refreshToken == null) {
//            throw new RuntimeException("refreshToken 쿠키가 없습니다.");
//        }
//
//        boolean isValid = jwt.validateRefreshToken(refreshToken);
//        if(!isValid) {
//            throw new RuntimeException("유효하지 않은 refreshToken입니다.");
//        }
//
//        // DB에서 해시 매칭(회수되지 않은 토큰이어야 함)
//        String hash = sha256(refreshToken);
//        AuthRefreshToken saved = refreshTokens.findByRtHashAndDeleteAtIsNull(hash)
//                .orElseThrow(() -> new IllegalArgumentException("토큰이 존재하지 않거나 이미 만료/회수되었습니다."));
//
//        // 만료 체크(서명 OK라도 서버 정책상 만료 또는 회수되었을 수 있음)
//        if (saved.getExpiresAt().isBefore(Instant.now())) {
//            throw new IllegalArgumentException("토큰이 만료되었습니다. 다시 로그인하세요.");
//        }
//
//        String userId = jwt.getSubjectFromRefresh(refreshToken);
//        Customer customer = customers.findByUserIdAndLoginType(userId, "NAVER")
//                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
////        Customer customer = customers.findByUserIdAndLoginType(userId, "GOOGLE")
////                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
//
//        String userAgent = request.getHeader("User-Agent");
//        String xff = request.getHeader("X-Forwarded-For");
//        String clientIp;
//        if (xff != null && !xff.isBlank()) {
//            clientIp = xff.split(",")[0].trim();
//        } else {
//            clientIp = request.getRemoteAddr();
//        }
//
//        // 기존 토큰 만료
//        saved.setDeleteAt(Instant.now());
//        saved.setDeleteReason("COOKIE");
//        refreshTokens.saveAndFlush(saved);
//
//        // 토큰 생성
//        String newAccess = jwt.createAccessToken(userId);
//        String newRefresh = jwt.createRefreshToken(userId);
//        String newRefreshHash = sha256(newRefresh);
//
//        // 혹시 기존 토큰 해시와 동일하면 새로 생성
//        if (newRefreshHash.equals(saved.getRtHash())) {
//            newRefresh = jwt.createRefreshToken(userId);
//            newRefreshHash = sha256(newRefresh);
//        }
//
//        AuthRefreshToken refresh = new AuthRefreshToken();
//        refresh.setCustomerNo(customer.getCustomerNo());
//        refresh.setRtHash(newRefreshHash);
//        refresh.setIssuedAt(Instant.now());
//        refresh.setExpiresAt(jwt.getExpiryFromRefresh(newRefresh));
//        refresh.setTFrom("COOKIE");
//        refresh.setLastUsedAt(Instant.now());
//        refresh.setLastUsedIp(clientIp);
//        refresh.setUserAgent(userAgent);
//
////        Instant now = Instant.now();
//        // 같은 사용자 오래된 토큰 정리 정책(선택): 10개 이상이면 전체 삭제
////        if (refreshTokens.countByCustomerNoAndExpiresAtAfterAndDeleteAtIsNull(customer.getCustomerNo(), now) >= 10) {
////            refreshTokens.markAllDeletedByCustomerWithQueryDsl(customer.getCustomerNo(),Instant.now(),"TOO_MANY_TOKENS");
////        }
//
//        refreshTokens.save(refresh);
//
//        // 기존 쿠키 제거
//        Cookie refreshCookie = new Cookie("refreshToken", null);
//        refreshCookie.setHttpOnly(true);
//        refreshCookie.setSecure(false);
//        refreshCookie.setPath("/");
//        refreshCookie.setMaxAge(10);
//        response.addCookie(refreshCookie);
//
//        return AuthResponse.builder()
//                .accessToken(newAccess)
//                .tokenType("Bearer")
//                .refreshToken(newRefresh)
//                .build();
//    }