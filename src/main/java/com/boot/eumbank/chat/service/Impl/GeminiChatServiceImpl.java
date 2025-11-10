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
        // 1. 매번 최신 DB에서 상품 정보 조회
        String productsInfo = getProductsInfoFromDB();

        // 2. 시스템 프롬프트 + DB 데이터 결합
        String systemPrompt = createSystemPrompt(productsInfo);

        // 3. Gemini API 요청 생성
        List<GeminiContent> contents = new ArrayList<>();

        // 방법 A: 시스템 프롬프트를 별도 system role로 추가 (Gemini가 지원한다면)
        // Gemini는 system role을 직접 지원하지 않으므로, 매 user 메시지에 포함

        // 대화 히스토리 추가 (시스템 프롬프트 제외)
        if (chatRequest.getHistory() != null) {
            for (Message msg : chatRequest.getHistory()) {
                // 히스토리에서 시스템 프롬프트 부분 제거 (원본 질문만 유지)
                String cleanContent = msg.getContent();
                if (msg.getContent().contains("사용자 질문:")) {
                    cleanContent = msg.getContent().substring(
                            msg.getContent().lastIndexOf("사용자 질문:") + 10
                    ).trim();
                }
                contents.add(createContent(cleanContent, msg.getRole()));
            }
        }

        // 현재 메시지에 최신 시스템 프롬프트 포함
        String currentMessageWithContext = systemPrompt + "\n\n사용자 질문: " + chatRequest.getMessage();
        contents.add(createContent(currentMessageWithContext, "user"));

        // 3. 요청 Body 생성
        GeminiRequest geminiRequest = GeminiRequest.builder()
                .contents(contents)
                .generationConfig(GeminiGenerationConfig.builder()
                        .temperature(0.3)  // ⚠️ 창의성 낮춤 (0.7 → 0.3)
                        .maxOutputTokens(2048)
                        .topP(0.8)  // ⚠️ 더 보수적으로 (0.95 → 0.8)
                        .topK(20)   // ⚠️ 더 제한적으로 (40 → 20)
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

            // 5. 응답 파싱
            return parseGeminiResponse(response);

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Gemini API Error: " + e.getMessage());
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

        System.out.println("deposits: " + deposits);
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
        
        ⚠️ **절대 규칙: 데이터베이스에 있는 정보만 사용**
        
        **현재 데이터베이스의 전체 상품 목록:**
        %s
       
        ⚠️ 위 목록에 없는 상품명을 언급하지 마세요.
        ⚠️ 위 목록에 있는 금리/조건만 말하세요.
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
                    String responseText = (String) parts.get(0).get("text");

                    // ⚠️ 응답 검증: 의심스러운 패턴 체크
                    if (containsSuspiciousContent(responseText)) {
                        System.err.println("⚠️ 의심스러운 응답 감지: " + responseText);
                        return "죄송합니다. 정확한 답변을 위해 eum_bank 고객센터 1544-2311로 문의해주세요.";
                    }

                    return responseText;
                }
            }

            return "응답을 생성할 수 없습니다.";

        } catch (Exception e) {
            e.printStackTrace();
            return "응답 처리 중 오류가 발생했습니다.";
        }
    }

    /**
     * 의심스러운 내용 체크 (DB에 없는 상품명 등)
     */
    private boolean containsSuspiciousContent(String response) {
        // DB에 없는 일반적인 금융 상품명들
        String[] suspiciousKeywords = {
                "프리미엄", "골드", "플래티넘", "VIP", "슈퍼", "스페셜",
                "새마을금고", "신협", "농협", "우체국"  // 다른 은행
        };

        for (String keyword : suspiciousKeywords) {
            if (response.contains(keyword)) {
                // DB에서 해당 키워드를 포함한 상품이 실제 있는지 확인
                String productsInfo = getProductsInfoFromDB();
                if (!productsInfo.contains(keyword)) {
                    return true;  // DB에 없는데 응답에 포함되어 있음
                }
            }
        }

        return false;
    }
}