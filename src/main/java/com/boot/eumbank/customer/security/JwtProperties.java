package com.boot.eumbank.customer.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** application.properties 의 app.jwt.* 값을 바인딩 */
@Getter @Setter
@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {
    /** 최소 64바이트 이상 권장 */
    private String secret;
    /** 액세스 토큰 만료(분) */
    private long accessExpMin = 30;
    /** 리프레시 토큰 만료(일) */
    private long refreshExpDay = 1;
}
