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

@Configuration
@RequiredArgsConstructor
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
                                "/deposit/products"
                        ).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/foreign/products/**").permitAll()
                        // ✅ 그 외는 보호
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

        List<String> origins = Arrays.stream(corsProps.getAllowedOrigins().split(","))
                .map(String::trim)
                .toList();
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
