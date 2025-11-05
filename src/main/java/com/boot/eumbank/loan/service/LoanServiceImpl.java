package com.boot.eumbank.loan.service;

import com.boot.eumbank.loan.dto.LoanProductDTO;
import com.boot.eumbank.loan.dto.LoanProductDetailDTO;
//import com.boot.eumbank.loan.entity.LoanCreditOption;
import com.boot.eumbank.loan.entity.LoanProduct;
//import com.boot.eumbank.loan.repository.LoanCreditRepository;
import com.boot.eumbank.loan.repository.LoanProductRepository;
import com.boot.eumbank.loan.repository.LoanRateOptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Stream;


@Service
@RequiredArgsConstructor
public class LoanServiceImpl implements LoanService {
    private final LoanProductRepository productRepo;
    private final LoanRateOptionRepository rateOptRepo;
//    private final LoanCreditRepository creditOptRepo;

    /** 목록 */
    @Override
    public Page<LoanProductDTO> getProducts(String type, int page, int size) {
        // Jpa 쿼리 isActive 가 true인 것만 조회 -> laonName이 ASC 순으로
        Page<LoanProduct> products = productRepo.findByLoanTypeAndIsActiveTrue(
                type, PageRequest.of(page, size, Sort.by("loanName").ascending()));
        return products.map(this::toListDTO);       // toListDTO로 매핑
    }


    @Override
    public Optional<LoanProductDetailDTO> getProductDetail(String loanCode) {
        LoanProduct p = productRepo.findByLoanCode(loanCode)
                .orElseThrow(() -> new NoSuchElementException("상품 없음: " + loanCode));

        // 👉 모든 타입 공통: rate_option에서 옵션 로드
        var ros = rateOptRepo.findByProduct(p);
        List<LoanProductDetailDTO.RateOption> optionDtos = ros.stream()
                .map(o -> LoanProductDetailDTO.RateOption.builder()
                        .lendRateMin(o.getLendRateMin())
                        .lendRateMax(o.getLendRateMax())
                        .lendRateAvg(o.getLendRateAvg())
                        .rpayTypeNm(o.getRpayTypeNm())
                        .lendRateTypeNm(o.getLendRateTypeNm())
                        .termMonth(null) // 기간은 화면 기본값 사용(옵션에 개별기간이 없다면)
                        .dclsMonth(p.getDclsMonth())
                        .note(o.getNote())
                        .build())
                .toList();

        // 배지(금리유형/상환방식)
        LinkedHashSet<String> badges = new LinkedHashSet<>();
        ros.forEach(o -> {
            if (notBlank(o.getLendRateTypeNm())) badges.add(o.getLendRateTypeNm());
            if (notBlank(o.getRpayTypeNm()))     badges.add(o.getRpayTypeNm());
        });
        // 타입별 기본 기간(옵션에 기간 컬럼을 쓰지 않는 현재 규칙 유지)
        List<Integer> termMonths = defaultTermsByType(p.getLoanType());

        // 요약/설명
        String summary = p.getSummary();

        // 금리 범위: 엔티티 집계값 우선, 없으면 옵션으로 재집계
        BigDecimal rateMin = (p.getRateMin()!=null) ? p.getRateMin()
                : optionDtos.stream().map(LoanProductDetailDTO.RateOption::getLendRateMin)
                .filter(Objects::nonNull).filter(this::gt0lt100).min(BigDecimal::compareTo).orElse(null);

        BigDecimal rateMax = (p.getRateMax()!=null) ? p.getRateMax()
                : optionDtos.stream().map(LoanProductDetailDTO.RateOption::getLendRateMax)
                .filter(Objects::nonNull).filter(this::gt0lt100).max(BigDecimal::compareTo).orElse(null);

        return Optional.of(LoanProductDetailDTO.builder()
                .id(p.getLoanCode())
                .name(p.getLoanName())
                .bankName(p.getBankName())
                .type(mapTypeKo(p.getLoanType()))
                .desc(buildDesc(p))
                .summary(summary)
                .badges(new ArrayList<>(badges))
                .tags(List.of(nvlStr(p.getBankName())))
                .rateMin(nvl(rateMin, new BigDecimal("0.000")))
                .rateMax(nvl(rateMax, new BigDecimal("99.900")))
                .termMonths(termMonths)
                .limitMax(p.getLimitMax())
                .ltvMax(p.getLtvMax())
                .loanLmtRaw(p.getLoanLmtRaw())
                .erlyRpayFee(p.getErlyRpayFee())
                .dlyRate(p.getDlyRate())
                .joinWay(p.getJoinWay())
                .options(optionDtos)
                .docs(List.of(LoanProductDetailDTO.Doc.builder().label("상품설명서").url("#").build()))
                .faq(List.of(LoanProductDetailDTO.Faq.builder()
                        .q("중도상환수수료가 있나요?")
                        .a(nvlStr(p.getErlyRpayFee(), "상품별 상이"))
                        .build()))
                .build());
    }
    private LoanProductDTO toListDTO(LoanProduct p) {
        var ros = rateOptRepo.findByProduct(p);

        // 배지: 금리유형/상환방식
        LinkedHashSet<String> badges = new LinkedHashSet<>();
        ros.forEach(o -> {
            if (notBlank(o.getLendRateTypeNm())) badges.add(o.getLendRateTypeNm());
            if (notBlank(o.getRpayTypeNm()))     badges.add(o.getRpayTypeNm());
        });

        // 타입별 기본 기간
        List<Integer> termMonths = defaultTermsByType(p.getLoanType());

        return LoanProductDTO.builder()
                .id(p.getLoanCode())
                .name(p.getLoanName())
                .type(mapTypeKo(p.getLoanType()))
                .rateMin(nvl(p.getRateMin(), new BigDecimal("2.000")))
                .rateMax(nvl(p.getRateMax(), new BigDecimal("99.900")))
                .limitMax(p.getLimitMax())
                .termMonths(termMonths)
                .badges(new ArrayList<>(badges))
                .tags(List.of(nvlStr(p.getBankName())))
                .desc(buildDesc(p))
                .link("#")
                .build();
    }

    // 유틸 ============================================================================
    // 금리 값 검증 (50보다 크면 버리기)
    private boolean gt0lt100(BigDecimal v){
        return v.compareTo(BigDecimal.ZERO)>0 && v.compareTo(new BigDecimal("100"))<0;
    }
    private static String mapTypeKo(String type){
        return switch (type==null? "" : type.toUpperCase()) {
            case "MORTGAGE" -> "주택담보";
            case "JEONSE"   -> "전세자금";
            case "CREDIT"   -> "신용대출";
            case "PERSONAL" -> "신용대출";
            default         -> "대출";
        };
    }

    private static List<Integer> defaultTermsByType(String type) {
        String t = type == null ? "" : type.toUpperCase();
        return switch (t) {
            case "MORTGAGE" -> List.of(120, 240, 360);
            // 자동차/전세/개인대출 등은 1~3년 범용 기본값
            case "AUTO", "JEONSE", "PERSONAL", "" -> List.of(12, 24, 36);
            default -> List.of(12, 24, 36);
        };
    }

    private static String buildDesc(LoanProduct p){
        String jb = nvlStr(p.getJoinWay());
        String bk = nvlStr(p.getBankName());
        return (bk + " " + jb).trim();
    }
    private static boolean notBlank(String s){ return s!=null && !s.isBlank(); }
    private static String nvlStr(String s){ return s==null? "" : s; }
    private static String nvlStr(String s, String d){ return (s==null||s.isBlank())? d : s; }
    private static BigDecimal nvl(BigDecimal v, BigDecimal d){ return v==null? d : v; }

//    // 신용 등급 min/max 계산
//    private static BigDecimal minGrades(LoanCreditOption o){
//        return Stream.of(o.getG1(),o.getG4(),o.getG5(),o.getG6(),o.getG10(),o.getG11(),o.getG12(),o.getG13())
//                .filter(Objects::nonNull).min(BigDecimal::compareTo).orElse(null);
//    }
//    private static BigDecimal maxGrades(LoanCreditOption o){
//        return Stream.of(o.getG1(),o.getG4(),o.getG5(),o.getG6(),o.getG10(),o.getG11(),o.getG12(),o.getG13())
//                .filter(Objects::nonNull).max(BigDecimal::compareTo).orElse(null);
//    }
}



// --------------- 신용대출버전
// 상세 */
//    @Override
//    public Optional<LoanProductDetailDTO> getProductDetail(String loanCode) {
//        LoanProduct p = productRepo.findByLoanCode(loanCode)
//                .orElseThrow(() -> new NoSuchElementException("상품 없음: " + loanCode));
//
//        // 타입별로 옵션 읽기
//        List<LoanProductDetailDTO.RateOption> optionDtos;
//        LinkedHashSet<String> badges = new LinkedHashSet<>();
//        List<Integer> termMonths;
//
//        if ("CREDIT".equalsIgnoreCase(p.getLoanType())) {
//            // 신용: A(대출금리) 옵션들을 '표시용 옵션'으로 변환
//            List<LoanCreditOption> cos = creditOptRepo.findByLoanProduct(p);
//            List<LoanCreditOption> aList = cos.stream()
//                    .filter(o -> "A".equalsIgnoreCase(nvlStr(o.getRateType())))
//                    .toList();
//
//            optionDtos = aList.stream().map(a -> LoanProductDetailDTO.RateOption.builder()
//                            .lendRateTypeNm(nvlStr(a.getRateTypeNm(), "대출금리"))
//                            .rpayTypeNm(null)
//                            .lendRateMin(minGrades(a))
//                            .lendRateMax(maxGrades(a))
//                            .lendRateAvg(a.getAvg())
//                            .termMonth(null)
//                            .dclsMonth(p.getDclsMonth())
//                            .note(null)
//                            .build())
//                    .toList();
//
//            // 배지: "대출금리" 등
//            if (!optionDtos.isEmpty()) badges.add("대출금리");
//            if (notBlank(p.getCrdtPrdtTypeNm())) badges.add(p.getCrdtPrdtTypeNm());
//            // 기간: 신용은 API에 없음 -> 표시용 기본값
//            termMonths = List.of(12, 24, 36);
//
//        } else {
//            // 주담/전세: 금리옵션 그대로
//            var ros = rateOptRepo.findByProduct(p);
//            optionDtos = ros.stream().map(o -> LoanProductDetailDTO.RateOption.builder()
//                            .lendRateMin(o.getLendRateMin())
//                            .lendRateMax(o.getLendRateMax())
//                            .lendRateAvg(o.getLendRateAvg())
//                            .rpayTypeNm(o.getRpayTypeNm())
//                            .lendRateTypeNm(o.getLendRateTypeNm())
//                            .termMonth(null )
//                            .dclsMonth(p.getDclsMonth())
//                            .note(o.getNote())
//                            .build())
//                    .toList();
//
//            // 배지(금리유형/상환방식)
//            ros.forEach(o -> {
//                if (notBlank(o.getLendRateTypeNm())) badges.add(o.getLendRateTypeNm());
//                if (notBlank(o.getRpayTypeNm()))     badges.add(o.getRpayTypeNm());
//            });
//            // 타입별 표시용 기본 기간
//            termMonths = "MORTGAGE".equalsIgnoreCase(p.getLoanType())
//                    ? List.of(120, 240, 360)
//                    : List.of(12, 24, 36); // JEONSE
//        }
//
//        // === 요약/설명 (DB값 우선, 없으면 타입별 기본문구/원문 조합) ===
//        String typeEn = Optional.ofNullable(p.getLoanType()).orElse("").toUpperCase();
//        String summary = p.getSummary();
//
//        // 금리 범위: 엔티티 집계값이 있으면 사용, 없으면 옵션에서 재집계
//        BigDecimal rateMin = (p.getRateMin()!=null) ? p.getRateMin()
//                : optionDtos.stream().map(LoanProductDetailDTO.RateOption::getLendRateMin)
//                .filter(Objects::nonNull).filter(this::gt0lt100).min(BigDecimal::compareTo)
//                .orElse(null);
//
//        BigDecimal rateMax = (p.getRateMax()!=null) ? p.getRateMax()
//                : optionDtos.stream().map(LoanProductDetailDTO.RateOption::getLendRateMax)
//                .filter(Objects::nonNull).filter(this::gt0lt100).max(BigDecimal::compareTo)
//                .orElse(null);
//
//        return Optional.of(LoanProductDetailDTO.builder()
//                .id(p.getLoanCode())
//                .name(p.getLoanName())
//                .bankName(p.getBankName())
//                .type(mapTypeKo(p.getLoanType()))
//                .desc(buildDesc(p))
//                .summary(summary)
//                .badges(new ArrayList<>(badges))
//                .tags(List.of(nvlStr(p.getBankName())))
//                .rateMin(nvl(rateMin, new BigDecimal("0.000")))
//                .rateMax(nvl(rateMax, new BigDecimal("99.900")))
//                .termMonths(termMonths)
//                .limitMax(p.getLimitMax())
//                .ltvMax(p.getLtvMax())
//                .loanLmtRaw(p.getLoanLmtRaw())
//                .erlyRpayFee(p.getErlyRpayFee())
//                .dlyRate(p.getDlyRate())
//                .joinWay(p.getJoinWay())
//                .options(optionDtos)
//                .docs(List.of(LoanProductDetailDTO.Doc.builder().label("상품설명서").url("#").build()))
//                .faq(List.of(LoanProductDetailDTO.Faq.builder()
//                        .q("중도상환수수료가 있나요?")
//                        .a(nvlStr(p.getErlyRpayFee(), "상품별 상이"))
//                        .build()))
//                .build());
//    }
///** 목록 DTO 매핑 */
//private LoanProductDTO toListDTO(LoanProduct p) {
//    List<Integer> termMonths;
//    LinkedHashSet<String> badges = new LinkedHashSet<>();
//
//    if ("PERSONAL".equalsIgnoreCase(p.getLoanType()) || "CREDIT".equalsIgnoreCase(p.getLoanType())) {
//        // 신용: 기간 없음 (표시용임)
//        termMonths = List.of(12,24,36);
//        // 배지: 타입명 정도만 노출
//        if (notBlank(p.getCrdtPrdtTypeNm())) badges.add(p.getCrdtPrdtTypeNm());
//    } else {
//        var ros = rateOptRepo.findByProduct(p);
//        // 기간은 더 이상 DB에서 읽지 않음 타입별 기본값
//        termMonths = "MORTGAGE".equalsIgnoreCase(p.getLoanType())
//                ? List.of(120, 240, 360)
//                : List.of(12, 24, 36);
//
//        ros.forEach(o -> {
//            if (notBlank(o.getLendRateTypeNm())) badges.add(o.getLendRateTypeNm());
//            if (notBlank(o.getRpayTypeNm()))     badges.add(o.getRpayTypeNm());
//        });
//    }
//
//    return LoanProductDTO.builder()
//            .id(p.getLoanCode())
//            .name(p.getLoanName())
//            .type(mapTypeKo(p.getLoanType()))
//            .rateMin(nvl(p.getRateMin(), new BigDecimal("2.000")))
//            .rateMax(nvl(p.getRateMax(), new BigDecimal("99.900")))
//            .limitMax(p.getLimitMax())
//            .termMonths(termMonths)
//            .badges(new ArrayList<>(badges))
//            .tags(List.of(nvlStr(p.getBankName())))
//            .desc(buildDesc(p))
//            .link("#")
//            .build();
//}
// ---- 신용대출용 유틸
//private static String defaultSummaryByType(String typeEn) {
//    return switch (typeEn) {
//        case "CREDIT", "PERSONAL" -> "직장인을 위한 신용대출";
//        case "JEONSE"             -> "내집마련을 위한 전세자금대출";
//        case "MORTGAGE"           -> "밑거름 삼아 발돋움하는 주택담보대출";
//        default                   -> "맞춤형 금융 상품";
//    };
//}