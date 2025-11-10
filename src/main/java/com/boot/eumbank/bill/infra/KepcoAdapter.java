package com.boot.eumbank.bill.infra;

import java.math.BigDecimal;

public interface KepcoAdapter {
    BigDecimal fetchAvgUnitPrice(int year, int month, String areaCd);
}
