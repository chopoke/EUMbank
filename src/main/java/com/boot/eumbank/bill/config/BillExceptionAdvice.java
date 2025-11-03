package com.boot.eumbank.bill.config;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.Map;

@RestControllerAdvice
public class BillExceptionAdvice {
    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<?> idem() {
        return ResponseEntity.status(409).body(Map.of("message","duplicate idempotency key"));
    }
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> bad(IllegalStateException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
