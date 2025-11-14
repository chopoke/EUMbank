package com.boot.eumbank.customer.security;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.CustomerRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final CustomerRepo customerRepo;

    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        Customer c = customerRepo.findByUserId(userId)
                .orElseThrow(() -> new UsernameNotFoundException("No customer: " + userId));

        if (!c.isActive()) throw new org.springframework.security.authentication.DisabledException("ACCOUNT_STATUS_BLOCKED");

        return new CustomUserDetails(c);
    }
}
