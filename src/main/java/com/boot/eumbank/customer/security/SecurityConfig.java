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

    // SecurityConfig.java (핵심만)
    @Bean
    @Order(1)
    public SecurityFilterChain adminChain(HttpSecurity http) throws Exception {
        final String FRONT_HOME = "http://localhost:3000/";

        http.securityMatcher("/admin/**", "/oauth2/**", "/login/**")
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
                .cors(AbstractHttpConfigurer::disable)
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req,res,ex) -> {
                            if (req.getRequestURI().startsWith("/admin")) res.sendRedirect(FRONT_HOME);
                            else res.sendError(401);
                        })
                        .accessDeniedHandler((req,res,ex) -> {
                            if (req.getRequestURI().startsWith("/admin")) res.sendRedirect(FRONT_HOME);
                            else res.sendError(403);
                        })
                )
                .authorizeHttpRequests(reg -> reg
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()
                        .requestMatchers("/admin/enter", "/admin/forbidden").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .anyRequest().permitAll()
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(socialSuccessHandler)   // ← 핸들러에서 메인으로 보냄
                )
                .addFilterBefore(refreshAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .logout(l -> l
                        .logoutUrl("/admin/logout")
                        .addLogoutHandler((req,res,auth) -> { /* RT 삭제 로직 그대로 */ })
                        .logoutSuccessHandler((req,res,auth) -> res.sendRedirect(FRONT_HOME))
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
                                "/api/loan/products",
                                "/api/health",
                                "/actuator/**",
                                "/actuator/health",
                                "/api/rates/**",
                                "/api/bills/rates/**",
                                "/api/bills/utility-bills"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/bills/*/invoices").permitAll()
                        .requestMatchers(HttpMethod.POST,   "/api/bills/*/pay-now", "/api/bills/*/autopay").authenticated()
                        .requestMatchers(HttpMethod.PATCH,  "/api/bills/autopay/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/bills/autopay/*").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/bills/payments/*/receipt").authenticated()
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
