package com.boot.eumbank.chat.service.Impl;

import com.boot.eumbank.chat.dto.*;
import com.boot.eumbank.chat.service.ClaudeChatService;
import com.boot.eumbank.product.dto.product.ProductDto;
import com.boot.eumbank.product.jpa.repository.DepositQueryRepository;
import com.boot.eumbank.product.jpa.repository.InstallQueryRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GeminiChatServiceImpl implements ClaudeChatService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-2.5-pro}")
    private String model;

    private final WebClient webClient;  // WebChatConfig가 아니라 WebClient!
    private final DepositQueryRepository depositQueryRepository;
    private final InstallQueryRepository installQueryRepository;

    // @Qualifier로 특정 빈 이름 지정
    public GeminiChatServiceImpl(@Qualifier("webClientGemini") WebClient webClient,
                                 DepositQueryRepository depositQueryRepository,
                                 InstallQueryRepository installQueryRepository) {
        this.webClient = webClient;
        this.depositQueryRepository = depositQueryRepository;
        this.installQueryRepository = installQueryRepository;
    }

    @Override
    public String chat(ChatRequest chatRequest) {
        // 1. DB에서 예금/적금 상품 정보 조회
        String productsInfo = getProductsInfoFromDB();

        // 2. 시스템 프롬프트 + DB 데이터 결합
        String systemPrompt = createSystemPrompt(productsInfo);

        // 3. Gemini API 요청 생성
        List<GeminiContent> contents = new ArrayList<>();

        // 대화 이력 추가
        if (chatRequest.getHistory() != null) {
            for (Message msg : chatRequest.getHistory()) {
                contents.add(createContent(msg.getContent(), msg.getRole()));
            }
        }

        // 현재 메시지에 시스템 프롬프트 포함
        String userMessageWithContext = systemPrompt + "\n\n사용자 질문: " + chatRequest.getMessage();
        contents.add(createContent(userMessageWithContext, "user"));

        // 4. 요청 Body 생성
        GeminiRequest geminiRequest = GeminiRequest.builder()
                .contents(contents)
                .generationConfig(GeminiGenerationConfig.builder()
                        .temperature(0.7)
                        .maxOutputTokens(2048)
                        .build())
                .build();

        try {
            // 5. Gemini Pro API 호출 - webClient.post() 사용
            Map<String, Object> response = webClient.post()
                    .uri("/" + model + ":generateContent?key=" + apiKey)
                    .bodyValue(geminiRequest)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            // 6. 응답 파싱
            return parseGeminiResponse(response);

        } catch (Exception e) {
            e.printStackTrace();
            return "죄송합니다. 일시적인 오류가 발생했습니다. eum_bank 고객센터 1544-2311로 연락 주세요.";
        }
    }

    /**
     * DB에서 예금/적금 상품 정보 조회 및 문자열로 변환
     */
    private String getProductsInfoFromDB() {
        StringBuilder productsInfo = new StringBuilder();

        // 예금 상품 정보
        List<ProductDto> deposits = depositQueryRepository.findAllDepositProducts();
        if (!deposits.isEmpty()) {
            productsInfo.append("=== 예금 상품 ===\n\n");
            productsInfo.append(deposits.stream()
                    .map(this::formatDepositProduct)
                    .collect(Collectors.joining("\n---\n")));
            productsInfo.append("\n\n");
        }

        // 적금 상품 정보
        List<ProductDto> installments = installQueryRepository.findInstallmentProducts();
        if (!installments.isEmpty()) {
            productsInfo.append("=== 적금 상품 ===\n\n");
            productsInfo.append(installments.stream()
                    .map(this::formatInstallmentProduct)
                    .collect(Collectors.joining("\n---\n")));
        }

        if (productsInfo.length() == 0) {
            return "현재 조회 가능한 상품 정보가 없습니다.";
        }

        return productsInfo.toString();
    }

    /**
     * 예금 상품 정보 포맷팅
     */
    private String formatDepositProduct(ProductDto product) {
        return String.format("""
            [예금] %s (%s)
            - 상품코드: %s
            - 설명: %s
            - 상품유형: %s
            - 금리: %s
            - 가입금액: %s ~ %s
            - 가입기간: %s개월 ~ %s개월
            - 이자지급방식: %s
            - 주요특징: %s
            """,
                product.getName(),
                product.getId(),
                product.getId(),
                product.getDescription() != null ? product.getDescription() : "상세 설명 없음",
                product.getType() != null ? product.getType() : "일반형",
                product.getRate() != null ? product.getRate() : "문의",
                product.getMinAmount() != null ? product.getMinAmount() : "문의",
                product.getMaxAmount() != null ? product.getMaxAmount() : "문의",
                product.getMinMonths() != null ? product.getMinMonths() : "문의",
                product.getMaxMonths() != null ? product.getMaxMonths() : "문의",
                product.getPaymentType() != null ? product.getPaymentType() : "문의",
                product.getFeature() != null ? product.getFeature() : "상세 특징은 고객센터로 문의"
        );
    }

    /**
     * 적금 상품 정보 포맷팅
     */
    private String formatInstallmentProduct(ProductDto product) {
        return String.format("""
            [적금] %s (%s)
            - 상품코드: %s
            - 설명: %s
            - 상품유형: %s
            - 금리: %s
            - 월 납입금액: %s ~ %s
            - 가입기간: %s개월 ~ %s개월
            - 이자지급방식: %s
            - 주요특징: %s
            """,
                product.getName(),
                product.getId(),
                product.getId(),
                product.getDescription() != null ? product.getDescription() : "상세 설명 없음",
                product.getType() != null ? product.getType() : "자유적립식",
                product.getRate() != null ? product.getRate() : "문의",
                product.getMinAmount() != null ? product.getMinAmount() : "문의",
                product.getMaxAmount() != null ? product.getMaxAmount() : "문의",
                product.getMinMonths() != null ? product.getMinMonths() : "문의",
                product.getMaxMonths() != null ? product.getMaxMonths() : "문의",
                product.getPaymentType() != null ? product.getPaymentType() : "문의",
                product.getFeature() != null ? product.getFeature() : "상세 특징은 고객센터로 문의"
        );
    }

    /**
     * 시스템 프롬프트 생성
     */
    private String createSystemPrompt(String productsInfo) {
        return String.format("""
            당신은 eum_bank의 고객 상담 AI 챗봇입니다.
            
            **응답 규칙:**
            1. 아래 제공된 eum_bank 금융 상품 정보만 참고하여 답변합니다.
            2. 다음 질문은 답변하지 않습니다:
               - 다른 은행 상품 비교
               - 개인 계좌 정보 조회
               - 계좌 개설/해지
               - 대출 심사 결과
               - 비밀번호 관련
            3. 상세 상담이 필요한 경우: "상담원 연결이 필요합니다. eum_bank 고객센터 1544-2311로 연락 주세요."
            4. 친절하고 간결하게 답변합니다.
            5. 제공된 상품 정보에 없는 내용은 "해당 정보는 고객센터로 문의해주세요"라고 안내합니다.
            6. 금리나 금액 등 구체적인 수치는 정확히 전달하되, "문의"로 표시된 항목은 고객센터 안내를 권장합니다.
            
            **eum_bank 금융 상품 정보:**
            %s
            """, productsInfo);
    }

    /**
     * Gemini Content 객체 생성
     */
    private GeminiContent createContent(String text, String role) {
        String geminiRole = "assistant".equals(role) ? "model" : role;

        GeminiPart part = GeminiPart.builder()
                .text(text)
                .build();

        return GeminiContent.builder()
                .parts(List.of(part))
                .role(geminiRole)
                .build();
    }

    /**
     * Gemini 응답 파싱
     */
    private String parseGeminiResponse(Map<String, Object> response) {
        try {
            List<Map<String, Object>> candidates =
                    (List<Map<String, Object>>) response.get("candidates");

            if (candidates != null && !candidates.isEmpty()) {
                Map<String, Object> content =
                        (Map<String, Object>) candidates.get(0).get("content");
                List<Map<String, Object>> parts =
                        (List<Map<String, Object>>) content.get("parts");

                if (parts != null && !parts.isEmpty()) {
                    return (String) parts.get(0).get("text");
                }
            }

            return "응답을 생성할 수 없습니다.";

        } catch (Exception e) {
            e.printStackTrace();
            return "응답 처리 중 오류가 발생했습니다.";
        }
    }
}