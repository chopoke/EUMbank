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

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanServiceImpl implements LoanService{
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
    public LoanProductDetailDTO getProductDetail(String loanCode) {
        LoanProduct p = productRepo.findByLoanCode(loanCode)
                .orElseThrow(() -> new NoSuchElementException("상품 없음: " + loanCode));

        List<LoanProductOption> opts = optionRepo.findByProduct(p);

        // 배지
        LinkedHashSet<String> badges = new LinkedHashSet<>();
        for (var o : opts) {
            if (notBlank(o.getLendRateTypeNm())) badges.add(o.getLendRateTypeNm());
            if (notBlank(o.getRpayTypeNm()))     badges.add(o.getRpayTypeNm());
        }

        var optionDtos = opts.stream().map(o -> LoanProductDetailDTO.RateOption.builder()
                .lendRateMin(o.getLendRateMin())
                .lendRateMax(o.getLendRateMax())
                .lendRateAvg(o.getLendRateAvg())
                .rpayTypeNm(o.getRpayTypeNm())
                .lendRateTypeNm(o.getLendRateTypeNm())
                .build()
        ).collect(Collectors.toList());

        Double rateMin = p.getRateMin()!=null ? p.getRateMin()
                : optionDtos.stream().map(LoanProductDetailDTO.RateOption::getLendRateMin)
                .filter(Objects::nonNull).min(Double::compareTo).orElse(0.0);

        Double rateMax = p.getRateMax()!=null ? p.getRateMax()
                : optionDtos.stream().map(LoanProductDetailDTO.RateOption::getLendRateMax)
                .filter(Objects::nonNull).max(Double::compareTo).orElse(99.9);

        return LoanProductDetailDTO.builder()
                .id(p.getLoanCode())
                .name(p.getLoanName())
                .bankName(p.getBankName())
                .type(mapTypeKo(p.getLoanType()))
                .desc(buildDesc(p))
                .badges(new ArrayList<>(badges))
                .tags(List.of(nvlStr(p.getBankName())))
                .rateMin(rateMin)
                .rateMax(rateMax)
                .termMonths(List.of(120,240,360))
                .limitMax(p.getLimitMax()==null? null :
                        (p.getLimitMax() > Integer.MAX_VALUE ? Integer.MAX_VALUE : p.getLimitMax().intValue()))
                .ltvMax(p.getLtvMax())
                .loanLmtRaw(p.getLoanLmtRaw())
                .erlyRpayFee(p.getPolicyCode()) // 컬럼에 맞게 조정
                .dlyRate(null)                  // 컬럼 추가했다면 매핑
                .joinWay(p.getJoinWay())
                .etcNote(p.getEtcNote())
                .options(optionDtos)
                .docs(List.of(LoanProductDetailDTO.Doc.builder().label("상품설명서").url("#").build()))
                .faq(List.of(LoanProductDetailDTO.Faq.builder()
                        .q("중도상환수수료가 있나요?")
                        .a(nvlStr(p.getPolicyCode(), "상품별 상이"))
                        .build()))
                .build();
    }

    private LoanProductDTO toListDTO(LoanProduct p){
        return LoanProductDTO.builder()
                .id(p.getLoanCode())
                .name(p.getLoanName())
                .type(mapTypeKo(p.getLoanType()))
                .rateMin(nvl(p.getRateMin(), 0.0))
                .rateMax(nvl(p.getRateMax(), 99.9))
                .limitMax(p.getLimitMax()==null? null :
                        (p.getLimitMax() > Integer.MAX_VALUE ? Integer.MAX_VALUE : p.getLimitMax().intValue()))
                .termMonths(List.of(120,240,360))
                .badges(List.of()) // 필요시 옵션 집계해서 넣어도 됨
                .tags(List.of(nvlStr(p.getBankName())))
                .desc(buildDesc(p))
                .link("#")
                .build();
    }

    private static String mapTypeKo(String type){
        return switch (type==null? "" : type) {
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
    private static Double nvl(Double v, Double d){ return v==null? d: v; }
    private static String nvlStr(String s){ return s==null? "" : s; }
    private static String nvlStr(String s, String d){ return (s==null||s.isBlank())? d: s; }
    private static boolean notBlank(String s){ return s!=null && !s.isBlank(); }
}
