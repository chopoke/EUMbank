package com.boot.eumbank.loan.service;

import com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO;
import com.boot.eumbank.loan.dto.LoanProductDTO;
import com.boot.eumbank.loan.dto.LoanProductDetailDTO;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class FssFinlifeService {

    private final RestClient client;
    private final String apiKey;

    private final ObjectMapper om = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    public FssFinlifeService(RestClient finlifeRestClient, @Value("${finlife.api-key}") String apiKey) {
        this.client = finlifeRestClient;
        this.apiKey = apiKey;
    }

    // 원본 JSON 그대로 받기 (주택담보대출)
    public String getMortgageProductsRaw(String topFinGrpNo, int pageNo){
        var uri = UriComponentsBuilder.fromPath("/finlifeapi/mortgageLoanProductsSearch.json")
                .queryParam("auth", apiKey)
                .queryParam("topFinGrpNo", topFinGrpNo)
                .queryParam("pageNo", pageNo)
                .build(true).toUri();

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

    // 전세자금대출(원본)
    public String getJeonseProductsRaw(String topFinGrpNo, int pageNo) {
        var uri = UriComponentsBuilder.fromPath("/finlifeapi/rentHouseLoanProductsSearch.json")
                .queryParam("auth", apiKey)
                .queryParam("topFinGrpNo", topFinGrpNo)
                .queryParam("pageNo", pageNo)
                .build(true).toUri();
        var resp = client.get().uri(uri).retrieve().toEntity(String.class);
        String body = resp.getBody();
        if (body == null || body.isBlank()) {
            throw new IllegalStateException("FSS empty body (jeonse)");
        }
        return body;
    }
    // 신용대출(원본)
    public String getCreditProductsRaw(String topFinGrpNo, int pageNo) {
        var uri = UriComponentsBuilder.fromPath("/finlifeapi/creditLoanProductsSearch.json")
                .queryParam("auth", apiKey)
                .queryParam("topFinGrpNo", topFinGrpNo)
                .queryParam("pageNo", pageNo)
                .build(true).toUri();
        var resp = client.get().uri(uri).retrieve().toEntity(String.class);
        String body = resp.getBody();
        if (body == null || body.isBlank()) {
            throw new IllegalStateException("FSS empty body (credit)");
        }
        return body;
    }

    // 화면 목록에 띄우기 위해 가공
    public List<LoanProductDTO> getMortgageProductsForList(String topFinGrpNo, int pageNo) {
        try {
            String json = getMortgageProductsRaw(topFinGrpNo, pageNo);
            FinlifeMortgageResponseDTO res = om.readValue(json, FinlifeMortgageResponseDTO.class);

            var baseList = Optional.ofNullable(res.getResult())
                    .map(FinlifeMortgageResponseDTO.Result::getBaseList)
                    .orElse(List.of());

            var optList = Optional.ofNullable(res.getResult())
                    .map(FinlifeMortgageResponseDTO.Result::getOptionList)
                    .orElse(List.of());

            var optByPrdt = optList.stream()
                    .collect(Collectors.groupingBy(FinlifeMortgageResponseDTO.Option::getFinPrdtCd));

            List<Integer> defaultTerms = List.of(120, 240, 360); // 10/20/30년 가정

            var list = baseList.stream().map(b -> {
                var opts = optByPrdt.getOrDefault(b.getFinPrdtCd(), List.of());

                // 금리 없으면 기본값(0.0 ~ 99.9)로 세팅해서 프론트 필터(0.0~10.0 시작값)에 안 잘리게 함
                Double minRate = opts.stream()
                        .map(FinlifeMortgageResponseDTO.Option::getLendRateMin)
                        .filter(Objects::nonNull)
                        .min(Double::compareTo)
                        .orElse(0.0);

                Double maxRate = opts.stream()
                        .map(FinlifeMortgageResponseDTO.Option::getLendRateMax)
                        .filter(Objects::nonNull)
                        .max(Double::compareTo)
                        .orElse(99.9);

                // 배지(금리유형/상환방식)
                var badges = new LinkedHashSet<String>();
                opts.forEach(o -> {
                    if (o.getLendRateTypeNm() != null && !o.getLendRateTypeNm().isBlank())
                        badges.add(o.getLendRateTypeNm());
                    if (o.getRpayTypeNm() != null && !o.getRpayTypeNm().isBlank())
                        badges.add(o.getRpayTypeNm());
                });


                Long limitWon = extractMaxWon(b.getLoanLmt());
                Integer ltvMax = extractMaxLtv(b.getLoanLmt());
                Integer limitInt = (limitWon == null ? null
                        : (limitWon > Integer.MAX_VALUE ? Integer.MAX_VALUE : limitWon.intValue()));

                String desc = (b.getKorCoNm() == null ? "" : (b.getKorCoNm()+" "))
                        + Optional.ofNullable(b.getJoinWay()).orElse("")
                        + Optional.ofNullable(b.getEtcNote()).map(s -> " " + s).orElse("");

                return LoanProductDTO.builder()
                        .id(b.getFinPrdtCd())
                        .name(b.getFinPrdtNm())
                        .type("주택담보")
                        .rateMin(minRate)
                        .rateMax(maxRate)
                        .limitMax(limitInt)          // ← 명시적으로 limitMax에 맵핑
                        .termMonths(defaultTerms)
                        .badges(new ArrayList<>(badges))
                        .tags(List.of(Optional.ofNullable(b.getKorCoNm()).orElse("")))
                        .desc(desc.trim())
                        .link("#")
                        .build();

            }).toList();

            log.info("[FSS] mapped products size={}", list.size());
            return list;

        } catch (Exception e) {
            log.error("[FSS] mortgage processing error (topFinGrpNo={}, pageNo={})", topFinGrpNo, pageNo, e);
            throw new RuntimeException("Finlife 응답 파싱 실패", e);
        }
    }


    // 원단위 매핑
    private static Long extractMaxWon(String raw){
        if (raw == null) return null;
        String s = raw.replace(",", "");
        double max = -1;

        // 억 (소수점 허용): 1.5억, 10억, 10억원
        max = Math.max(max, scanMax(s, "(\\d+(?:\\.\\d+)?)\\s*억(?:원)?", 100_000_000));

        // 천만원 / 백만원 / 만원
        max = Math.max(max, scanMax(s, "(\\d+)\\s*천만(?:원)?", 10_000_000));
        max = Math.max(max, scanMax(s, "(\\d+)\\s*백만(?:원)?", 1_000_000));
        max = Math.max(max, scanMax(s, "(\\d+(?:\\.\\d+)?)\\s*만(?:원)?", 10_000));

        // 그냥 '원' 숫자 (예: 500000000원)
        max = Math.max(max, scanMax(s, "(\\d+)\\s*원", 1));

        return (max < 0) ? null : (long)Math.floor(max);
    }
    private static double scanMax(String s, String regex, double unit){
        var m = java.util.regex.Pattern.compile(regex).matcher(s);
        double max = -1;
        while (m.find()){
            try {
                double v = Double.parseDouble(m.group(1)) * unit;
                if (v > max) max = v;
            } catch (Exception ignore) {}
        }
        return max;
    }

    private static Integer extractMaxLtv(String raw){
        if (raw == null) return null;
        String s = raw;
        var m = java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*%").matcher(s);
        double max = -1;
        while (m.find()){
            try {
                double v = Double.parseDouble(m.group(1));
                if (v > max) max = v;
            } catch (Exception ignore) {}
        }
        return (max < 0) ? null : (int)Math.round(max);
    }


    /**
     * 단일 상품 상세 가공 메서드
     * - FSS "목록" API 응답에서 fin_prdt_cd 로 해당 상품을 찾아 상세 DTO로 변환
     * - 서버에서 가공/조립
     */
    public LoanProductDetailDTO getMortgageProductDetail(String topFinGrpNo, int pageNo, String finPrdtCd) {
        // 1) 원문 JSON 호출
        final String json = getMortgageProductsRaw(topFinGrpNo, pageNo);

        try {
            // 2) JSON → DTO 역직렬화
            final FinlifeMortgageResponseDTO res = om.readValue(json, FinlifeMortgageResponseDTO.class);

            // 3) 널/빈 리스트 방어
            final List<FinlifeMortgageResponseDTO.Base> baseList =
                    Optional.ofNullable(res.getResult())
                            .map(FinlifeMortgageResponseDTO.Result::getBaseList)
                            .orElse(List.of());

            final List<FinlifeMortgageResponseDTO.Option> optList =
                    Optional.ofNullable(res.getResult())
                            .map(FinlifeMortgageResponseDTO.Result::getOptionList)
                            .orElse(List.of());

            // 4) 대상 상품(Base) 찾기 (없으면 404/예외)
            final FinlifeMortgageResponseDTO.Base base = baseList.stream()
                    .filter(b -> finPrdtCd.equals(b.getFinPrdtCd()))
                    .findFirst()
                    .orElseThrow(() -> new NoSuchElementException("상품을 찾을 수 없습니다: " + finPrdtCd));

            // 5) 옵션 모으기 (상환방식/금리유형/금리범위)
            final List<LoanProductDetailDTO.RateOption> options = optList.stream()
                    .filter(o -> finPrdtCd.equals(o.getFinPrdtCd()))
                    .map(o -> LoanProductDetailDTO.RateOption.builder()
                            .rpayTypeNm(o.getRpayTypeNm())
                            .lendRateTypeNm(o.getLendRateTypeNm())
                            .lendRateMin(o.getLendRateMin())
                            .lendRateMax(o.getLendRateMax())
                            .lendRateAvg(o.getLendRateAvg())
                            .build())
                    .toList();

            // 6) 금리 범위 계산 (옵션이 없으면 0.0 ~ 99.9)
            final Double rateMin = options.stream()
                    .map(LoanProductDetailDTO.RateOption::getLendRateMin)
                    .filter(Objects::nonNull)
                    .min(Double::compareTo)
                    .orElse(0.0);

            final Double rateMax = options.stream()
                    .map(LoanProductDetailDTO.RateOption::getLendRateMax)
                    .filter(Objects::nonNull)
                    .max(Double::compareTo)
                    .orElse(99.9);

            // 7) 배지(금리유형/상환방식) 추출
            final LinkedHashSet<String> badges = new LinkedHashSet<>();
            options.forEach(o -> {
                if (o.getLendRateTypeNm()!=null && !o.getLendRateTypeNm().isBlank()) badges.add(o.getLendRateTypeNm());
                if (o.getRpayTypeNm()!=null     && !o.getRpayTypeNm().isBlank())      badges.add(o.getRpayTypeNm());
            });

            // 8) 한도/ LTV 파싱 (문자열에서 최대값만 뽑아 숫자화)
            final Long limitWon = extractMaxWon(base.getLoanLmt());
            final Integer limitInt = (limitWon==null? null
                    : (limitWon > Integer.MAX_VALUE ? Integer.MAX_VALUE : limitWon.intValue()));
            final Integer ltvMax = extractMaxLtv(base.getLoanLmt());

            // 9) 요약 설명
            final String desc = (base.getKorCoNm()==null? "" : base.getKorCoNm()+" ")
                    + Optional.ofNullable(base.getJoinWay()).orElse("")
                    + Optional.ofNullable(base.getEtcNote()).map(s -> " " + s).orElse("");

            // 10) 최종 DTO 구성
            return LoanProductDetailDTO.builder()
                    .id(base.getFinPrdtCd())
                    .name(base.getFinPrdtNm())
                    .bankName(base.getKorCoNm())
                    .type("주택담보")
                    .desc(desc.trim())
                    .badges(new ArrayList<>(badges))
                    .tags(List.of(Optional.ofNullable(base.getKorCoNm()).orElse("")))
                    .rateMin(rateMin)
                    .rateMax(rateMax)
                    .termMonths(List.of(120,240,360)) // FSS 응답에 기간이 명시되지 않아 프론트 기본 가정
                    .limitMax(limitInt)
                    .ltvMax(ltvMax)
                    .loanLmtRaw(base.getLoanLmt())
                    .erlyRpayFee(base.getErlyRpayFee())
                    .dlyRate(base.getDlyRate())
                    .joinWay(base.getJoinWay())
                    .etcNote(base.getEtcNote())
                    .options(options)
                    .docs(List.of(LoanProductDetailDTO.Doc.builder().label("상품설명서").url("#").build()))
                    .faq(List.of(LoanProductDetailDTO.Faq.builder()
                            .q("중도상환수수료가 있나요?")
                            .a(Optional.ofNullable(base.getErlyRpayFee()).orElse("상품별 상이"))
                            .build()))
                    .build();

        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            // 역직렬화 실패 디버깅: 앞 500자만 로그
            log.error("[FSS] JSON parse error: {}", e.getMessage());
            log.error("[FSS] RAW (head 500): {}", json.substring(0, Math.min(500, json.length())));
            throw new RuntimeException("Finlife 응답 파싱 실패(JSON)", e);
        }
    }


}
