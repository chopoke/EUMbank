package com.boot.eumbank.loan.service;

import com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO;
import com.boot.eumbank.loan.dto.LoanProductDTO;
import com.boot.eumbank.loan.dto.LoanProductDetailDTO;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Finlife (금감원 API) 호출 담당 Service
 * 각 메서드 역할 
 * -> API를 호출해서 JSON반환(raw)
 * getMortgageProductRaw : 주택담보대출 API호출
 * getJeonseProductRaw : 전세자금대출 API호출
 * getCreditProductRaw : 신용대출 API 호출
 * -
 * topFinGrpNo 은 금융사 코드라고 할 수 있음 지금처럼 020000?은 은행이고 050000은 보험 
 * -> 일단 은행것만 끌어올라궁
 */

@Slf4j
@Service
public class FssFinlifeService {

    private final RestClient client;
    private final String apiKey;

    private final ObjectMapper om = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .findAndRegisterModules();

    public FssFinlifeService(RestClient finlifeRestClient, @Value("${finlife.api-key}") String apiKey) {
        this.client = finlifeRestClient;
        this.apiKey = apiKey;
    }

    //  FSS RAW 호출 ----------------------
    public String getMortgageProductsRaw(String topFinGrpNo, int pageNo){
        // Uri 컴포넌트 빌더 : URI를 구성하는 컴포넌트의 조합을 쉽게 만드어주는 클래스
        // .fromPath("String") : 주어진 경로로 초기화된 URI 주소 빌더(생성)
        // .queryParam(String name, Optional <value>) 주어진 값이 쿼리 매개변수로 들어감
        var uri = UriComponentsBuilder.fromPath("/finlifeapi/mortgageLoanProductsSearch.json")
                .queryParam("auth", apiKey)
                .queryParam("topFinGrpNo", topFinGrpNo)
                .queryParam("pageNo", pageNo)
                .build(true).toUri();       // .toUri()로 빌드

        // 로그 마스크용
        String masked = apiKey == null ? "null"
                : (apiKey.length()>6 ? apiKey.substring(0,3)+"****"+apiKey.substring(apiKey.length()-3):"***");
        log.info("[FSS] GET {} (auth={})", uri, masked);

        var resp = client.get().uri(uri).retrieve().toEntity(String.class);
        log.info("[FSS] STATUS={}, HEADERS={}", resp.getStatusCode(), resp.getHeaders());

        String body = resp.getBody();
        log.info("[FSS] BODY {}", body == null ? "null" : body.substring(0, Math.min(200, body.length())));

        if (body == null || body.isBlank()) {
            throw new IllegalStateException("FSS empty body (status=" + resp.getStatusCode() + ")");
        }
        return body;
    }

    // 전세대출 원본 호출
    public String getJeonseProductsRaw(String topFinGrpNo, int pageNo) {
        var uri = UriComponentsBuilder.fromPath("/finlifeapi/rentHouseLoanProductsSearch.json")
                .queryParam("auth", apiKey)
                .queryParam("topFinGrpNo", topFinGrpNo)
                .queryParam("pageNo", pageNo)
                .build(true).toUri();
        var resp = client.get().uri(uri).retrieve().toEntity(String.class);
        String body = resp.getBody();
        if (body == null || body.isBlank()) throw new IllegalStateException("FSS empty body (jeonse)");
        return body;
    }

    // 신용대출 원본 호출
    public String getCreditProductsRaw(String topFinGrpNo, int pageNo) {
        var uri = UriComponentsBuilder.fromPath("/finlifeapi/creditLoanProductsSearch.json")
                .queryParam("auth", apiKey)
                .queryParam("topFinGrpNo", topFinGrpNo)
                .queryParam("pageNo", pageNo)
                .build(true).toUri();
        var resp = client.get().uri(uri).retrieve().toEntity(String.class);
        String body = resp.getBody();
        if (body == null || body.isBlank()) throw new IllegalStateException("FSS empty body (credit)");
        return body;
    }

    //  파서 유틸(문구 → 숫자) -----------
    private static final java.util.regex.Pattern P_EOK =
            java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*억(?:원)?");
    private static final java.util.regex.Pattern P_CHEONMAN =
            java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*천\\s*만(?:원)?");
    private static final java.util.regex.Pattern P_MAN =
            java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*만(?:원)?");
    private static final java.util.regex.Pattern P_WON =
            java.util.regex.Pattern.compile("(\\d{1,3}(?:,\\d{3})+|\\d+)\\s*원");

    private static final BigDecimal U_EOK      = new BigDecimal("100000000");
    private static final BigDecimal U_CHEONMAN = new BigDecimal("10000000");
    private static final BigDecimal U_MAN      = new BigDecimal("10000");

    /** "3천만~2억" "1.5억" "250만" "123,456,789원" 등에서 최대 원화 금액 추출 */
    private static BigDecimal extractMaxWon(String raw){
        if (raw == null) return null;
        String s = raw.replaceAll("\\s+", "");
        BigDecimal max = null;
        max = maxOf(max, scanAll(s, P_EOK, U_EOK, false));
        max = maxOf(max, scanAll(s, P_CHEONMAN, U_CHEONMAN, false));
        max = maxOf(max, scanAll(s, P_MAN, U_MAN, false));
        max = maxOf(max, scanAll(s, P_WON, BigDecimal.ONE, true));
        return max;
    }

    private static BigDecimal scanAll(String s, java.util.regex.Pattern p, BigDecimal unit, boolean stripComma) {
        var m = p.matcher(s);
        BigDecimal max = null;
        while (m.find()) {
            String n = m.group(1);
            if (stripComma) n = n.replace(",", "");
            try {
                BigDecimal v = new BigDecimal(n).multiply(unit);
                max = maxOf(max, v);
            } catch (Exception ignore) {}
        }
        return max;
    }

    private static BigDecimal maxOf(BigDecimal a, BigDecimal b) {
        if (b == null) return a;
        if (a == null) return b;
        return a.max(b);
    }

    /** "% 숫자"들 중 최댓값 정수로 */
    private static Integer extractMaxLtv(String raw){
        if (raw == null) return null;
        var m = java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*%").matcher(raw);
        BigDecimal max = null;
        while (m.find()) {
            try {
                BigDecimal v = new BigDecimal(m.group(1));
                max = (max == null) ? v : max.max(v);
            } catch (Exception ignore) {}
        }
        return (max == null) ? null : max.setScale(0, RoundingMode.HALF_UP).intValue();
    }

    private static boolean notBlank(String s){ return s != null && !s.isBlank(); }


    //  목록 가공 ---------------------
//    public List<LoanProductDTO> getMortgageProductsForList(String topFinGrpNo, int pageNo) {
//        try {
//            String json = getMortgageProductsRaw(topFinGrpNo, pageNo);
//            FinlifeMortgageResponseDTO res = om.readValue(json, FinlifeMortgageResponseDTO.class);
//
//            var baseList = Optional.ofNullable(res.getResult())
//                    .map(FinlifeMortgageResponseDTO.Result::getBaseList)
//                    .orElse(List.of());
//
//            var optList = Optional.ofNullable(res.getResult())
//                    .map(FinlifeMortgageResponseDTO.Result::getOptionList)
//                    .orElse(List.of());
//
//            var optByPrdt = optList.stream()
//                    .collect(Collectors.groupingBy(FinlifeMortgageResponseDTO.Option::getFinPrdtCd));
//
//            List<Integer> defaultTerms = List.of(120, 240, 360); // 10/20/30년 가정(표시용)
//
//            var list = baseList.stream().map(b -> {
//                var opts = optByPrdt.getOrDefault(b.getFinPrdtCd(), List.of());
//
//                BigDecimal minRate = opts.stream()
//                        .map(FinlifeMortgageResponseDTO.Option::getLendRateMin)
//                        .filter(Objects::nonNull)
//                        .filter(r -> r.compareTo(BigDecimal.ZERO) > 0 && r.compareTo(new BigDecimal("50")) < 0)
//                        .min(BigDecimal::compareTo)
//                        .orElse(new BigDecimal("0.000"));
//
//                BigDecimal maxRate = opts.stream()
//                        .map(FinlifeMortgageResponseDTO.Option::getLendRateMax)
//                        .filter(Objects::nonNull)
//                        .filter(r -> r.compareTo(BigDecimal.ZERO) > 0 && r.compareTo(new BigDecimal("50")) < 0)
//                        .max(BigDecimal::compareTo)
//                        .orElse(new BigDecimal("99.900"));
//
//                // 배지(금리유형/상환방식)
//                var badges = new LinkedHashSet<String>();
//                opts.forEach(o -> {
//                    if (notBlank(o.getLendRateTypeNm())) badges.add(o.getLendRateTypeNm());
//                    if (notBlank(o.getRpayTypeNm()))     badges.add(o.getRpayTypeNm());
//                });
//
//                BigDecimal limitWon = extractMaxWon(b.getLoanLmt());
//                Integer ltvMax = extractMaxLtv(b.getLoanLmt());
//
//                String desc = (b.getKorCoNm() == null ? "" : (b.getKorCoNm()+" "))
//                        + Optional.ofNullable(b.getJoinWay()).orElse("")
//                        + Optional.ofNullable(b.getEtcNote()).map(s -> " " + s).orElse("");
//
//                return LoanProductDTO.builder()
//                        .id(b.getFinPrdtCd())
//                        .name(b.getFinPrdtNm())
//                        .type("주택담보")
//                        .rateMin(minRate)
//                        .rateMax(maxRate)
//                        .limitMax(limitWon)
//                        .termMonths(defaultTerms)
//                        .badges(new ArrayList<>(badges))
//                        .tags(List.of(Optional.ofNullable(b.getKorCoNm()).orElse("")))
//                        .desc(desc.trim())
//                        .link("#")
//                        .build();
//            }).toList();
//
//            log.info("[FSS] mapped products size={}", list.size());
//            return list;
//
//        } catch (Exception e) {
//            log.error("[FSS] mortgage processing error (topFinGrpNo={}, pageNo={})", topFinGrpNo, pageNo, e);
//            throw new RuntimeException("Finlife 응답 파싱 실패", e);
//        }
//    }
//
//    //  단건 상세 가공 (주담대) =--------------------
//    public LoanProductDetailDTO getMortgageProductDetail(String topFinGrpNo, int pageNo, String finPrdtCd) {
//        final String json = getMortgageProductsRaw(topFinGrpNo, pageNo);
//
//        try {
//            final FinlifeMortgageResponseDTO res = om.readValue(json, FinlifeMortgageResponseDTO.class);
//
//            final List<FinlifeMortgageResponseDTO.Base> baseList =
//                    Optional.ofNullable(res.getResult())
//                            .map(FinlifeMortgageResponseDTO.Result::getBaseList)
//                            .orElse(List.of());
//
//            final List<FinlifeMortgageResponseDTO.Option> optList =
//                    Optional.ofNullable(res.getResult())
//                            .map(FinlifeMortgageResponseDTO.Result::getOptionList)
//                            .orElse(List.of());
//
//            final FinlifeMortgageResponseDTO.Base base = baseList.stream()
//                    .filter(b -> finPrdtCd.equals(b.getFinPrdtCd()))
//                    .findFirst()
//                    .orElseThrow(() -> new NoSuchElementException("상품을 찾을 수 없습니다: " + finPrdtCd));
//
//            final List<LoanProductDetailDTO.RateOption> options = optList.stream()
//                    .filter(o -> finPrdtCd.equals(o.getFinPrdtCd()))
//                    .map(o -> LoanProductDetailDTO.RateOption.builder()
//                            .rpayTypeNm(o.getRpayTypeNm())
//                            .lendRateTypeNm(o.getLendRateTypeNm())
//                            .lendRateMin(o.getLendRateMin())
//                            .lendRateMax(o.getLendRateMax())
//                            .lendRateAvg(o.getLendRateAvg())
//                            .build())
//                    .toList();
//
//            final BigDecimal rateMin = options.stream()
//                    .map(LoanProductDetailDTO.RateOption::getLendRateMin)
//                    .filter(Objects::nonNull)
//                    .filter(r -> r.compareTo(BigDecimal.ZERO) > 0 && r.compareTo(new BigDecimal("50")) < 0)
//                    .min(BigDecimal::compareTo)
//                    .orElse(new BigDecimal("0.000"));
//
//            final BigDecimal rateMax = options.stream()
//                    .map(LoanProductDetailDTO.RateOption::getLendRateMax)
//                    .filter(Objects::nonNull)
//                    .filter(r -> r.compareTo(BigDecimal.ZERO) > 0 && r.compareTo(new BigDecimal("50")) < 0)
//                    .max(BigDecimal::compareTo)
//                    .orElse(new BigDecimal("99.900"));
//
//            final LinkedHashSet<String> badges = new LinkedHashSet<>();
//            options.forEach(o -> {
//                if (notBlank(o.getLendRateTypeNm())) badges.add(o.getLendRateTypeNm());
//                if (notBlank(o.getRpayTypeNm()))     badges.add(o.getRpayTypeNm());
//            });
//
//            final BigDecimal limitWon = extractMaxWon(base.getLoanLmt());
//            final Integer ltvMax = extractMaxLtv(base.getLoanLmt());
//
//            final String desc = (base.getKorCoNm()==null? "" : base.getKorCoNm()+" ")
//                    + Optional.ofNullable(base.getJoinWay()).orElse("")
//                    + Optional.ofNullable(base.getEtcNote()).map(s -> " " + s).orElse("");
//
//            return LoanProductDetailDTO.builder()
//                    .id(base.getFinPrdtCd())
//                    .name(base.getFinPrdtNm())
//                    .bankName(base.getKorCoNm())
//                    .type("주택담보")
//                    .desc(desc.trim())
//                    .badges(new ArrayList<>(badges))
//                    .tags(List.of(Optional.ofNullable(base.getKorCoNm()).orElse("")))
//                    .rateMin(rateMin)
//                    .rateMax(rateMax)
//                    .termMonths(List.of(120,240,360)) // FSS 목록 API엔 기간항목이 없어 표시용 기본값
//                    .limitMax(limitWon)
//                    .ltvMax(ltvMax)
//                    .loanLmtRaw(base.getLoanLmt())
//                    .erlyRpayFee(base.getErlyRpayFee())
//                    .dlyRate(base.getDlyRate())
//                    .joinWay(base.getJoinWay())
//                    .etcNote(base.getEtcNote())
//                    .options(options)
//                    .docs(List.of(LoanProductDetailDTO.Doc.builder().label("상품설명서").url("#").build()))
//                    .faq(List.of(LoanProductDetailDTO.Faq.builder()
//                            .q("중도상환수수료가 있나요?")
//                            .a(Optional.ofNullable(base.getErlyRpayFee()).orElse("상품별 상이"))
//                            .build()))
//                    .build();
//
//        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
//            log.error("[FSS] JSON parse error: {}", e.getMessage());
//            log.error("[FSS] RAW (head 500): {}", json.substring(0, Math.min(500, json.length())));
//            throw new RuntimeException("Finlife 응답 파싱 실패(JSON)", e);
//        }
//    }
}
