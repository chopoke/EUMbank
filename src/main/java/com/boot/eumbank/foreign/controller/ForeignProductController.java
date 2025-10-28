// com.boot.eumbank.foreign.controller.ForeignProductController.java
package com.boot.eumbank.foreign.controller;

import com.boot.eumbank.foreign.dto.ForeignProductDto;
import com.boot.eumbank.foreign.service.ForeignProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/foreign/products")
@RequiredArgsConstructor
public class ForeignProductController {

    private final ForeignProductService service;

    @GetMapping
    public ResponseEntity<Page<ForeignProductDto>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String dp,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort
    ) {
        Sort s = Sort.by(sort.split(",")[0]).descending();
        if (sort.endsWith(",asc")) s = Sort.by(sort.split(",")[0]).ascending();
        Pageable pageable = PageRequest.of(page, Math.max(1, Math.min(size, 100)), s);
        return ResponseEntity.ok(service.search(q, dp, type, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ForeignProductDto> get(@PathVariable Integer id) {
        ForeignProductDto dto = service.get(id);
        return dto == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(dto);
    }
}