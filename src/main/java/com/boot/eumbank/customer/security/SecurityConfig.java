package com.boot.eumbank.customer.security;

import com.boot.eumbank.customer.repo.AuthRefreshTokenRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
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
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Instant;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final JwtAuthenticationEntryPoint entryPoint;
    private final AuthenticationSuccessHandler socialSuccessHandler;
    private final RefreshAuthFilter refreshAuthFilter;
    private final CookieUtil cookieUtil;
    private final AuthRefreshTokenRepo refreshRepo;
//    private final CorsProperties corsProps; // app.cors.allowed-origins 사용

    /** 관리자: RT 쿠키 기반, CSRF on, CORS off */
    @Bean
    @Order(1)
    public SecurityFilterChain adminChain(HttpSecurity http) throws Exception {
        http.securityMatcher("/admin/**")
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
                .cors(AbstractHttpConfigurer::disable)
                .exceptionHandling(e -> e.authenticationEntryPoint(entryPoint))
                .authorizeHttpRequests(reg -> reg
                        .requestMatchers("/admin/enter", "/admin/forbidden").permitAll()
                        .anyRequest().hasRole("ADMIN"))
                .addFilterBefore(refreshAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .oauth2Login(oauth2 -> oauth2.successHandler(socialSuccessHandler))
                .logout(l -> l
                        .logoutUrl("/admin/logout") // POST /logout
                        .addLogoutHandler((req, res, auth) -> {
                            String rt = cookieUtil.getRefreshCookie(req).orElse(null);
                            if (rt != null) {
                                String hash = RefreshAuthFilter.sha256(rt);
                                refreshRepo.findByRtHashAndDeleteAtIsNull(hash).ifPresent(t -> {
                                    t.setDeleteAt(Instant.now());
                                    t.setDeleteReason("logout");
                                    refreshRepo.save(t);
                                });
                            }
                            cookieUtil.deleteRefreshCookie(res);
                        })
                        .logoutSuccessHandler((req, res, auth) -> {
                            res.sendRedirect("http://localhost:3000/"); // React 메인으로
                        })
                );
        return http.build();
    }

    /** API: AT(Bearer) 기반, CSRF off, CORS on */
    @Bean
    @Order(2)
    public SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/**")
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(AbstractHttpConfigurer::disable)
                .cors(c -> c.configurationSource(corsConfigurationSource()))
                .exceptionHandling(e -> e.authenticationEntryPoint(entryPoint))
                .authorizeHttpRequests(reg -> reg
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/address/**",
                                "/api/email/**",
                                "/api/social/link",
                                "/api/v1/auth/**",
                                "/api/v1/join/**",
                                "/api/v1/email/**",
                                "/api/v1/customers/exists-email",
                                "/api/foreign/exchange/calculate",
                                "/api/foreign/exchange",
                                "/api/foreign/rates/**",
                                "/api/healthz",
                                "/actuator/**",
                                "/actuator/health"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/foreign/products/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .oauth2Login(oauth2 -> oauth2.successHandler(socialSuccessHandler));
        return http.build();
    }

    /** CORS: API 체인에서만 사용 */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS","PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean public BCryptPasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}
