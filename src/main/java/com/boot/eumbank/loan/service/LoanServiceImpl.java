package com.boot.eumbank.loan.service;

import com.boot.eumbank.loan.dto.LoanProductDTO;
import com.boot.eumbank.loan.dto.LoanProductDetailDTO;
import com.boot.eumbank.loan.entity.LoanProduct;
import com.boot.eumbank.loan.entity.LoanProductOption;
import com.boot.eumbank.loan.repository.LoanProductOptionRepository;
import com.boot.eumbank.loan.repository.LoanProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;


@Service
@RequiredArgsConstructor
public class LoanServiceImpl implements LoanService {
    private final LoanProductRepository productRepo;
    private final LoanProductOptionRepository optionRepo;

    /** 목록 */
    @Override
    public Page<LoanProductDTO> getProducts(String type, int page, int size) {
        Page<LoanProduct> products = productRepo.findByLoanTypeAndStatus(
                type, "Y", PageRequest.of(page, size, Sort.by("loanName").ascending()));

        return products.map(this::toListDTO);
    }

    /** 상세 */
    @Override
    public Optional<LoanProductDetailDTO> getProductDetail(String loanCode) {
        LoanProduct p = productRepo.findByLoanCode(loanCode)
                .orElseThrow(() -> new NoSuchElementException("상품 없음: " + loanCode));

        List<LoanProductOption> opts = optionRepo.findByProduct(p);

        // 배지(금리유형/상환방식)
        LinkedHashSet<String> badges = new LinkedHashSet<>();
        for (var o : opts) {
            if (notBlank(o.getLendRateTypeNm()))        // 금리 타입이 있다면
                badges.add(o.getLendRateTypeNm());      // 뱃지에 추가
            if (notBlank(o.getRpayTypeNm()))     
                badges.add(o.getRpayTypeNm());
        }

        // 옵션 DTO
        var optionDtos = opts.stream()
                .map(o -> LoanProductDetailDTO.RateOption.builder()
                        .lendRateMin(o.getLendRateMin())
                        .lendRateMax(o.getLendRateMax())
                        .lendRateAvg(o.getLendRateAvg())
                        .rpayTypeNm(o.getRpayTypeNm())
                        .lendRateTypeNm(o.getLendRateTypeNm())
                        .termMonth(o.getTermMonth())
                        .dclsMonth(o.getDclsMonth())
                        .isOverdraft(o.getIsOverdraft())
                        .note(o.getNote())
                        .build()
                ).toList();

        // 금리 범위 (엔티티에 집계값 없으면 옵션에서 재집계)
        BigDecimal rateMin = (p.getRateMin() != null) ? p.getRateMin()
                : optionDtos.stream()
                .map(LoanProductDetailDTO.RateOption::getLendRateMin)
                .filter(Objects::nonNull)
                .filter(r -> gt0lt50(r))
                .min(BigDecimal::compareTo)
                .orElse(new BigDecimal("0.000"));

        BigDecimal rateMax = (p.getRateMax() != null) ? p.getRateMax()
                : optionDtos.stream()
                .map(LoanProductDetailDTO.RateOption::getLendRateMax)
                .filter(Objects::nonNull)
                .filter(r -> gt0lt50(r))
                .max(BigDecimal::compareTo)
                .orElse(new BigDecimal("99.900"));

        // 기간 목록(옵션에 있으면 distinct 정렬, 없으면 기본값)
        List<Integer> termMonths = opts.stream()
                .map(LoanProductOption::getTermMonth)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();
        if (termMonths.isEmpty()) termMonths = List.of(120, 240, 360);

        return Optional.ofNullable(LoanProductDetailDTO.builder()
                .id(p.getLoanCode())
                .name(p.getLoanName())
                .bankName(p.getBankName())
                .type(mapTypeKo(p.getLoanType()))
                .desc(buildDesc(p))
                .badges(new ArrayList<>(badges))
                .tags(List.of(nvlStr(p.getBankName())))
                .rateMin(rateMin)
                .rateMax(rateMax)
                .termMonths(termMonths)
                .limitMax(p.getLimitMax()) // BigDecimal 그대로
                .ltvMax(p.getLtvMax())
                .loanLmtRaw(p.getLoanLmtRaw())
                .erlyRpayFee(p.getPolicyCode()) // 실제 매핑 컬럼에 맞게 유지
                .dlyRate(null)                  // 컬럼 추가 시 매핑
                .joinWay(p.getJoinWay())
                .etcNote(p.getEtcNote())
                .options(optionDtos)
                .docs(List.of(LoanProductDetailDTO.Doc.builder().label("상품설명서").url("#").build()))
                .faq(List.of(LoanProductDetailDTO.Faq.builder()
                        .q("중도상환수수료가 있나요?")
                        .a(nvlStr(p.getPolicyCode(), "상품별 상이"))
                        .build()))
                .build());
    }

    private LoanProductDTO toListDTO(LoanProduct p) {
        // 기간 목록(간단 버전: 옵션 조회해서 뽑거나, 없으면 기본값)
        List<Integer> termMonths = optionRepo.findByProduct(p).stream()
                .map(LoanProductOption::getTermMonth)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();
        if (termMonths.isEmpty()) termMonths = List.of(120, 240, 360);

        // 배지(간단 버전: 상위 몇 개만)
        LinkedHashSet<String> badges = new LinkedHashSet<>();
        optionRepo.findByProduct(p).forEach(o -> {
            if (notBlank(o.getLendRateTypeNm())) badges.add(o.getLendRateTypeNm());
            if (notBlank(o.getRpayTypeNm()))     badges.add(o.getRpayTypeNm());
        });

        return LoanProductDTO.builder()
                .id(p.getLoanCode())
                .name(p.getLoanName())
                .type(mapTypeKo(p.getLoanType()))
                .rateMin(nvl(p.getRateMin(), new BigDecimal("0.000")))
                .rateMax(nvl(p.getRateMax(), new BigDecimal("99.900")))
                .limitMax(p.getLimitMax()) // BigDecimal 그대로
                .termMonths(termMonths)
                .badges(new ArrayList<>(badges))
                .tags(List.of(nvlStr(p.getBankName())))
                .desc(buildDesc(p))
                .link("#")
                .build();
    }

    // 유틸 ------------------------------------------
    private static boolean gt0lt50(BigDecimal v) {
        return v.compareTo(BigDecimal.ZERO) > 0 && v.compareTo(new BigDecimal("50")) < 0;
    }

    private static String mapTypeKo(String type){
        return switch (type == null ? "" : type) {
            case "MORTGAGE" -> "주택담보";
            case "JEONSE"   -> "전세자금";
            case "PERSONAL" -> "신용대출";
            default         -> "대출";
        };
    }

    private static String buildDesc(LoanProduct p){
        String jb = nvlStr(p.getJoinWay());
        String en = nvlStr(p.getEtcNote());
        String bk = nvlStr(p.getBankName());
        return (bk + " " + jb + (en.isEmpty()? "" : " " + en)).trim();
    }

    private static BigDecimal nvl(BigDecimal v, BigDecimal d){ return v == null ? d : v; }
    private static String nvlStr(String s){ return s == null ? "" : s; }
    private static String nvlStr(String s, String d){ return (s == null || s.isBlank()) ? d : s; }
    private static boolean notBlank(String s){ return s != null && !s.isBlank(); }
}
