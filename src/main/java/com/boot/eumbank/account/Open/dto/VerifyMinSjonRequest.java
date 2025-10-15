package com.boot.eumbank.account.Open.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter @Setter @ToString
public class VerifyMinSjonRequest {
    private String name;    // 예: "둘리"
    private String rrn6;    // 예: "830422
}