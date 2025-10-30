package com.boot.eumbank.bill.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name="BILL_PROVIDER_TBL")
@Getter
@Setter
public class BillProvider {
    @Id
    @Column(name="bpv_code", length=32)
    private String bpvCode;

    @Column(name="bpv_name", length=100, nullable=false)
    private String bpvName;

    @Column(name="bpv_api_base_url", length=255)
    private String bpvApiBaseUrl;

    @Column(name="bpv_auth_type", length=32)
    private String bpvAuthType;

    @Column(name="bpv_active", length=1, nullable=false)
    private String bpvActive; // Y/N

    @Column(name="bpv_created_at")
    private LocalDateTime bpvCreatedAt;

    @Column(name="bpv_updated_at")
    private LocalDateTime bpvUpdatedAt;
}
