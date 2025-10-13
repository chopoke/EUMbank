package com.boot.eumbank.customer.service;

import com.boot.eumbank.customer.repo.CustomerRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
class CustomerServiceImpl implements CustomerService {

    private final CustomerRepo customerRepo;

    CustomerServiceImpl(CustomerRepo customerRepo) {
        this.customerRepo = customerRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean emailExists(String email) {
        if (!StringUtils.hasText(email)) return false;

        // [이메일 중복체크]
        return customerRepo.existsByEmailIgnoreCase(email.trim());

    }
}

