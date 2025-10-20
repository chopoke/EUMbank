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
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@RequiredArgsConstructor
/*확인용*/
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final JwtAuthenticationEntryPoint entryPoint;
    private final AuthenticationSuccessHandler socialSuccessHandler;
    private final CorsProperties corsProps; // app.cors.allowed-origins 사용

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(c -> c.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e.authenticationEntryPoint(entryPoint))
                .authorizeHttpRequests(reg -> reg
                        // ✅ 인증 없이 허용할 엔드포인트(두 설정의 합집합)
                        .requestMatchers(
                                "/api/auth/**",        // 로그인/회원가입/리프레시 등
                                "/api/address/**",     // 주소 API
                                "/api/email/**",       // 이메일 API(사용 시)
                                "/actuator/health",
                                "/", "/index.html", "/favicon.ico",
                                "/assets/**", "/static/**", "/public/**",
                                "/api/v1/auth/**",
                                "/api/v1/join/**",
                                "/api/v1/email/**",
                                "/api/v1/customers/exists-email",
                                "/api/foreign/exchange/calculate",
                                "/api/foreign/exchange"

                        ).permitAll()
                        // actuator 전부 허용
                        .requestMatchers("/actuator/**").permitAll()
                        // (원하는 공개 API들)
                        .requestMatchers("/api/foreign/rates", "/api/healthz").permitAll()
                        // 환율 조회만 공개
                        .requestMatchers(HttpMethod.GET,
                                "/api/foreign/rates", "/api/foreign/rates/**"
                        ).permitAll()

                        // 그 외는 모두 보호
                        .anyRequest().authenticated()
                )
                // ✅ JWT 필터는 UsernamePasswordAuthenticationFilter 앞
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        http
                .oauth2Login(oauth2 -> oauth2.successHandler(socialSuccessHandler));

        return http.build();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }


    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    /** CORS: app.cors.allowed-origins 에 정의된 도메인 허용(쉼표 구분) */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var config = new CorsConfiguration();

        // 프로퍼티 값을 수정가능 리스트로 수집
        List<String> origins = Arrays.stream(
                        (corsProps.getAllowedOrigins() == null ? "" : corsProps.getAllowedOrigins()).split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());

        if (!origins.contains("http://localhost:3000")) origins.add("http://localhost:3000"); // CRA
        if (!origins.contains("http://localhost:5173")) origins.add("http://localhost:5173");
        if (!origins.contains("http://127.0.0.1:5173")) origins.add("http://127.0.0.1:5173");

        config.setAllowedOrigins(origins);
        config.setAllowedMethods(Arrays.asList("GET","POST","PUT","PATCH","DELETE","OPTIONS"));

        config.setAllowedHeaders(Arrays.asList("Authorization","Content-Type","X-Requested-With","Origin","Accept"));
        config.setExposedHeaders(Arrays.asList("Authorization", "Set-Cookie"));
        config.setAllowCredentials(true);
        config.setMaxAge(Duration.ofHours(1));

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
