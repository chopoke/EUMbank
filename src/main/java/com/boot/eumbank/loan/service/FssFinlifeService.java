package com.boot.eumbank.loan.service;

import com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO;
import com.boot.eumbank.loan.dto.LoanProductDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class FssFinlifeService {

    private final RestClient client;
    private final String apiKey;
    private final ObjectMapper om = new ObjectMapper();

    public FssFinlifeService(RestClient finlifeRestClient, @Value("${finlife.api-key}") String apiKey) {
        this.client = finlifeRestClient;
        this.apiKey = apiKey;
    }

    public String getMortgageProducts(String topFinGrpNo, int pageNo){
        return client.get()
                .uri(uri -> uri.path("/mortgageLoanProductsSearch.json")
                        .queryParam("auth", apiKey)
                        .queryParam("topFinGrpNo", topFinGrpNo)
                        .queryParam("pageNo", pageNo)
                        .build()
                )
                .retrieve()
                .body(String.class);
    }

    // 원본 JSON을 그대로 받고 싶으면 String 반환 메서드 유지
    public String getMortgageProductsRaw(String topFinGrpNo, int pageNo){
        return client.get()
                .uri(uri -> uri.path("/mortgageLoanProductsSearch.json")
                        .queryParam("auth", apiKey)
                        .queryParam("topFinGrpNo", topFinGrpNo) // 은행: "020000"
                        .queryParam("pageNo", pageNo)
                        .build()
                )
                .retrieve()
                .body(String.class);
    }

    /** 화면 목록용으로 가공 */
    public List<LoanProductDTO> getMortgageProductsForList(String topFinGrpNo, int pageNo) {
        String json = getMortgageProductsRaw(topFinGrpNo, pageNo);

        try {
            FinlifeMortgageResponseDTO res =
                    om.readValue(json, FinlifeMortgageResponseDTO.class);

            var baseList = Optional.ofNullable(res.getResult())
                    .map(FinlifeMortgageResponseDTO.Result::getBaseList)
                    .orElse(List.of());

            var optList = Optional.ofNullable(res.getResult())
                    .map(FinlifeMortgageResponseDTO.Result::getOptionList)
                    .orElse(List.of());

            Map<String, List<FinlifeMortgageResponseDTO.Option>> optByPrdt =
                    optList.stream()
                            .collect(Collectors.groupingBy(FinlifeMortgageResponseDTO.Option::getFinPrdtCd));

            List<Integer> defaultTerms = List.of(120, 240, 360); // 10/20/30년 가정

            return baseList.stream().map(b -> {
                var opts = optByPrdt.getOrDefault(b.getFinPrdtCd(), List.of());

                Double minRate = opts.stream()
                        .map(FinlifeMortgageResponseDTO.Option::getLendRateMin)
                        .filter(Objects::nonNull)
                        .min(Double::compareTo)
                        .orElse(null);

                Double maxRate = opts.stream()
                        .map(FinlifeMortgageResponseDTO.Option::getLendRateMax)
                        .filter(Objects::nonNull)
                        .max(Double::compareTo)
                        .orElse(null);

                // ✅ 배지 수집 로직 보강 (변동/고정 등 금리유형 + 원리금균등/만기일시 등 상환방식)
                var badges = new LinkedHashSet<String>();
                opts.forEach(o -> {
                    if (o.getLendRateTypeNm() != null && !o.getLendRateTypeNm().isBlank())
                        badges.add(o.getLendRateTypeNm());
                    if (o.getRpayTypeNm() != null && !o.getRpayTypeNm().isBlank())
                        badges.add(o.getRpayTypeNm());
                });

                // ✅ 한도 안전 파싱 (숫자 외 문자 제거 후 파싱)
                Integer limit = null;
                if (b.getLoanLmt() != null) {
                    String digits = b.getLoanLmt().replaceAll("[^0-9]", "");
                    if (!digits.isBlank()) {
                        try { limit = Integer.parseInt(digits); } catch (NumberFormatException ignored) {}
                    }
                }

                String desc = ((b.getKorCoNm() != null) ? (b.getKorCoNm() + " ") : "")
                        + Optional.ofNullable(b.getJoinWay()).orElse("")
                        + Optional.ofNullable(b.getEtcNote()).map(s -> " " + s).orElse("");

                return new LoanProductDTO(
                        b.getFinPrdtCd(),
                        b.getFinPrdtNm(),
                        "주택담보",
                        minRate, // null 허용 → 프론트에서 처리
                        maxRate,
                        limit,   // null이면 "표시 없음" 처리 가능
                        defaultTerms,
                        new ArrayList<>(badges),
                        List.of(Optional.ofNullable(b.getKorCoNm()).orElse("")),
                        desc.trim(),
                        "#" // 상세 링크는 추후 라우팅 연결
                );
            }).toList();

        } catch (Exception e) {
            throw new RuntimeException("Finlife 응답 파싱 실패", e);
        }
    }
}
