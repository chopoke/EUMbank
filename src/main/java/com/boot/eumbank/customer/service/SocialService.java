package com.boot.eumbank.customer.service;

import com.boot.eumbank.customer.dto.AgreeRequest;
import com.boot.eumbank.customer.dto.LinkRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;

public interface SocialService {

    //AuthResponse refreshRotate(HttpServletRequest request, HttpServletResponse response);
    void updateAgree(AgreeRequest req);
    AgreeRequest getAgree();
    ResponseEntity<?> linkNaverId(LinkRequest req, HttpServletRequest request, HttpServletResponse response);
}
