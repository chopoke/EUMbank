package com.boot.eumbank.bill.infra;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface KepcoAdapter {
    BigDecimal fetchAvgUnitPrice(int year, int month, String areaCd);
}
