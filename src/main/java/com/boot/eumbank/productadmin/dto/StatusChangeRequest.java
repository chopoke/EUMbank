// src/main/java/com/boot/eumbank/product/dto/product/StatusChangeRequest.java
package com.boot.eumbank.productadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusChangeRequest {
    private String status; // ACTIVE, DORMANT, SUSPENDED, TERMINATED
}