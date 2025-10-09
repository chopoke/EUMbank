package com.boot.eumbank.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** application.properties 의 app.cors.* 값을 바인딩 */
@Getter @Setter
@Component
@ConfigurationProperties(prefix = "app.cors")
public class CorsProperties {
    /** 콤마(,)로 여러 개 허용 가능: http://localhost:3000,http://127.0.0.1:3000 */
    private String allowedOrigins = "http://localhost:3000";
}
