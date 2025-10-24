package com.boot.eumbank.customer.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;

@Component
public class CookieUtil {

    public static final String RT_NAME = "rt"; // <- 전역 고정 이름(진짜 중요함)

    public void addHttpOnlyCookie(HttpServletResponse response, String name, String value, long maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true)
//                .secure(true) // 로컬에서는 https 환경 필요 (나중에 dev/prod 분리)
                .secure(false) // http 환경
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    public void deleteCookie(HttpServletResponse response, String name) {
        ResponseCookie cookie = ResponseCookie.from(name, "")
                .httpOnly(true)
//                .secure(true)
                .secure(false)  // http
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    public Optional<String> getCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return Optional.empty();
        return Arrays.stream(request.getCookies())
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    // ---- 편의 메서드 (이걸 쓰면 이름 오탈자 원천 차단) ----
    public void addRefreshCookie(HttpServletResponse res, String value, long maxAgeSeconds) {
        addHttpOnlyCookie(res, RT_NAME, value, maxAgeSeconds);
    }
    public void deleteRefreshCookie(HttpServletResponse res) {
        deleteCookie(res, RT_NAME);
    }
    public Optional<String> getRefreshCookie(HttpServletRequest req) {
        return getCookie(req, RT_NAME);
    }
}
