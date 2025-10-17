package com.boot.eumbank.loan.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanProductDTO {
    private String id;
    private String name;
    private String type;         // "주택담보"
    private Double rateMin;
    private Double rateMax;
    private Integer limitMax;           // 숫자로 정규화
    private List<Integer> termMonths;   // 보통 120/240/360 개월로 표기
    private List<String> badges;        // ["고정", "변동", "원리금균등"]
    private List<String> tags;          // ["은행명", ...]
    private String desc;
    private String link;
}
