// src/main/java/com/boot/eumbank/admin/dto/CustomerAdminStats.java
package com.boot.eumbank.admin.dto;

public record CustomerAdminStats(
        long totalUsers,
        long activeUsers,
        long pendingVerifications,
        long verifiedUsers,
        long pepCount,
        long sanctionHitCount,
        long highRiskCount
) {}
