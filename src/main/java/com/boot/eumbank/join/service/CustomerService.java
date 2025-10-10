package com.boot.eumbank.join.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 고객 관련 DB 조회
 * - 이메일 중복 여부 확인
 */
@Service
public class CustomerService {

    private final JdbcTemplate jdbc;

    public CustomerService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * DB에 동일 이메일이 존재하는지 확인
     * @return true 이면 이미 존재
     */
    public boolean emailExists(String email) {
        if (!StringUtils.hasText(email)) return false;

        String sql =
                "SELECT EXISTS(SELECT 1 " +
                        "FROM CUSTOMER_TBL " +
                        "WHERE LOWER(c_email) = LOWER(?))";

        Boolean exists = jdbc.queryForObject(sql, Boolean.class, email.trim());
        return Boolean.TRUE.equals(exists);
    }

}
