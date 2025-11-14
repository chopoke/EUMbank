// src/main/java/com/boot/eumbank/product/dto/product/ProductManagementDTO.java
package com.boot.eumbank.productadmin.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ProductManagementDTO {
    private Integer id;
    private String code;
    private String name;
    private String description;
    private String type;
    private String rate;
    private Long minAmount;
    private Long maxAmount;
    private Integer minMonths;
    private Integer maxMonths;
    private String ealryTerminationRate;
    private String period;
    private String paymentType;
    private String isActive;
    private String features;
    private String href;
    private String buttonText;

}