package com.boot.eumbank.mypage.controller;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.mypage.service.MypageServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MypageController {

    @Autowired
    private MypageServiceImpl service;



    @GetMapping("/mypage")
    public ResponseEntity<?> findcustomer() {
        System.out.println("test0");
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();
        String test = customer.getCNameKr();
        int test1 = customer.getCustomerNo();

        System.out.println(test);
        System.out.println(test1);
        Map<String, String> response = new HashMap<>();
        response.put("customerName", test);
        System.out.println(response);
        service.mypageCustomer(test1);
//        System.out.println(tt);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
