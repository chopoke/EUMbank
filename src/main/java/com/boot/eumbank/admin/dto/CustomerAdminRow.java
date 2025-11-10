// src/main/java/com/boot/eumbank/admin/dto/CustomerAdminRow.java
package com.boot.eumbank.admin.dto;

import java.time.Instant;

/**
 * 관리자 회원 목록 Row (이메일/휴대폰 제거 버전)
 */
public record CustomerAdminRow(
        Integer id,            // 고객번호
        String  name,          // 이름
        Instant joinDate,      // 가입일시(Instant)
        String  status,      // 상태  : 정상/휴면/정지
        String  verification,// 인증상태: 인증완료/대기중/거부됨
        String  risk        // 위험등급: 낮음/보통/높음/매우 높음
) {}
