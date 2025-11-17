// src/main/java/com/boot/eumbank/admin/dto/CustomerAdminRow.java
package com.boot.eumbank.admin.dto;

import java.time.Instant;

/** 관리자 회원 목록 Row */
public record CustomerAdminRow(
        Integer id,       // 고객번호
        String  name,     // 이름
        String  email,    // 이메일
        Instant joinDate, // 가입일시(Instant)
        String  status,   // 상태 : 정상/휴면/정지 (뷰 변환/라벨링은 템플릿에서)
        String  risk      // 위험등급 : 낮음/보통/높음/매우 높음
) {}
