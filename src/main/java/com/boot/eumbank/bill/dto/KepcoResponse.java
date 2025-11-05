package com.boot.eumbank.bill.dto;

import lombok.Data;

import java.util.List;

@Data
public class KepcoResponse {
    private Header header; private Body body;
    @Data public static class Header { String resultCode; String resultMsg; }
    @Data public static class Body { List<Item> items; int totalCount; }
    @Data public static class Item {
        String year, month, metroCd, cityCd, svcKindCd, contractTypeNm, usage, fee;
    }
}
