// com.boot.eumbank.foreign.service.ForeignProductService.java
package com.boot.eumbank.foreign.service;

import com.boot.eumbank.foreign.domain.ForeignProduct;
import com.boot.eumbank.foreign.dto.ForeignProductDto;
import com.boot.eumbank.foreign.repo.ForeignProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ForeignProductService {
    private final ForeignProductRepository repo;

    public Page<ForeignProductDto> search(String q, String dp, String type, Pageable pageable) {
        return repo.search(emptyToNull(q), emptyToNull(dp), emptyToNull(type), pageable)
                .map(this::toDto);
    }

    public ForeignProductDto get(Integer id) {
        return repo.findById(id).map(this::toDto).orElse(null);
    }

    private String emptyToNull(String s) { return (s == null || s.isBlank()) ? null : s; }

    private ForeignProductDto toDto(ForeignProduct f) {
        return new ForeignProductDto(
                f.getId(), f.getCurUnit(), f.getCurNm(),
                f.getTtb(), f.getTts(), f.getDealBasR(),
                f.getApy(), f.getDpProtectYn(), f.getIoYn(),
                f.getTermMon(), f.getProdType()
        );
    }
}
