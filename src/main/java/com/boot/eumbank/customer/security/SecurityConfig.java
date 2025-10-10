// src/main/java/com/boot/eumbank/security/SecurityConfig.java
package com.boot.eumbank.customer.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final JwtAuthenticationEntryPoint entryPoint;
    private final CorsProperties corsProps;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(c -> c.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e.authenticationEntryPoint(entryPoint))
                .authorizeHttpRequests(reg -> reg
                        // ✅ 인증 무시(permitAll) 영역
                        .requestMatchers(
                                "/api/auth/**",          // signup, login, refresh, logout, health 등
                                "/actuator/health",
                                "/", "/index.html", "/favicon.ico",
                                "/assets/**", "/static/**", "/public/**"
                        ).permitAll()
                        // (선택) 특정 POST 경로 별도 허용이 필요하면 유지
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // ✅ 그 외 보호 API
                        .anyRequest().authenticated()
                )
                // ✅ JWT 필터는 UsernamePasswordAuthenticationFilter 앞에
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean public BCryptPasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    /** app.cors.allowed-origins 에서 CORS 허용 */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var config = new CorsConfiguration();

        // origins from properties (comma separated)
        List<String> origins = Arrays.stream(corsProps.getAllowedOrigins().split(","))
                .map(String::trim).toList();
        config.setAllowedOrigins(origins);

        // 요청 메서드
        config.setAllowedMethods(Arrays.asList("GET","POST","PUT","PATCH","DELETE","OPTIONS"));

        // 요청 헤더(프론트가 보낼 수 있는 헤더)
        config.setAllowedHeaders(Arrays.asList(
                "Authorization", "Content-Type", "X-Requested-With", "Origin", "Accept"
        ));

        // 응답에서 브라우저에 노출할 헤더(필요 시)
        config.setExposedHeaders(Arrays.asList("Authorization"));

        // 쿠키/자격증명 허용 (HttpOnly 쿠키 등)
        config.setAllowCredentials(true);

        // 프리플라이트 캐시
        config.setMaxAge(Duration.ofHours(1));

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
