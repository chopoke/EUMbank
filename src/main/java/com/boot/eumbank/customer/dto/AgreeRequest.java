package com.boot.eumbank.customer.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class AgreeRequest {

    private String c_agree_terms;
    private String c_agree_privacy;
    private String c_agree_marketing;
}
