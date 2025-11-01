package com.boot.eumbank.foreign.infra;

import com.boot.eumbank.foreign.service.FxRateService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty; // ★ 이거 추가
import java.time.LocalDate;

@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(
        prefix = "foreign.rates.bootstrap",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class ForeignRatesBootstrap {

    private final FxRateService fxRateService;

    @Value("${foreign.rates.bootstrap.lookback-days:60}")
    private int lookbackDays;

    @Bean
    ApplicationRunner seedRecentRatesOnStartup() {
        return args -> {
            var to = LocalDate.now();
            var from = to.minusDays(lookbackDays);
            fxRateService.backfill(from, to);
        };
    }
}
