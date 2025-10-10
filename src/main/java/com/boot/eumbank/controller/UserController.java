package com.boot.eumbank.controller;

import com.boot.eumbank.dto.CustomerDTO;
import com.boot.eumbank.dto.VerifyMinSjonRequest;
import com.boot.eumbank.dto.VerifyMinSjonResponse;
import com.boot.eumbank.service.account.Impl.AccountRepositoryImpl;
import com.boot.eumbank.service.account.AccountService;
import com.boot.eumbank.service.account.KycVerifyService;
import com.boot.eumbank.util.ImageFormats;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private Logger logger = LoggerFactory.getLogger(UserController.class);

    @Value("${clova.ocr.url}")
    private String clovaUrl;

    @Value("${clova.ocr.secret}")
    private String clovaSecret;

    private final RestTemplate rest = new RestTemplate();

    private final KycVerifyService kycVerifyService;

    private final AccountRepositoryImpl registerAccountRepository;

    private final AccountService accountService;


    @PostMapping(value = "/ocr-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> proxyToClova(
            @RequestPart("file") MultipartFile file,
            @RequestPart("message") String messageJson
    ) {
        logger.info("UserController => proxyToClova()");
        try {
            byte[] bytes = file.getBytes();

            // (A) 실제 바이트 포맷 판별
            String actual = ImageFormats.sniff(bytes);         // jpg/png/tiff/pdf/heic/unknown
            var allowed = Set.of("jpg","png","tiff","pdf");

            if (!allowed.contains(actual)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "ok", false,
                        "code", "OCR_UNSUPPORTED_FORMAT",
                        "message", "지원하지 않는 이미지 형식입니다. jpg/png/tiff/pdf만 허용됩니다.",
                        "meta", Map.of(
                                "actual", actual,
                                "filename", file.getOriginalFilename(),
                                "contentType", file.getContentType()
                        )
                ));
            }

            // (B) message JSON 보정 (format/name 일치)
            ObjectMapper om = new ObjectMapper();
            ObjectNode msg = (ObjectNode) om.readTree(messageJson);
            ArrayNode images = (ArrayNode) msg.withArray("images");
            if (images.isEmpty()) images.addObject();
            ObjectNode img0 = (ObjectNode) images.get(0);
            img0.put("format", ImageFormats.canonical(actual));                 // "jpg" 등
            img0.put("name", baseName(file.getOriginalFilename()));

            // (C) 멀티파트 조립
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.add("X-OCR-SECRET", clovaSecret);

            var body = new LinkedMultiValueMap<String, Object>();

            ByteArrayResource resource = new ByteArrayResource(bytes) {
                @Override public String getFilename() { return file.getOriginalFilename(); }
            };
            HttpHeaders fileHeaders = new HttpHeaders();
            fileHeaders.setContentType(springMediaType(ImageFormats.canonical(actual)));
            body.add("file", new HttpEntity<>(resource, fileHeaders));

            HttpHeaders msgHeaders = new HttpHeaders();
            msgHeaders.setContentType(MediaType.APPLICATION_JSON);
            body.add("message", new HttpEntity<>(om.writeValueAsString(msg), msgHeaders));

            ResponseEntity<String> res = rest.postForEntity(clovaUrl, new HttpEntity<>(body, headers), String.class);
            return ResponseEntity.status(res.getStatusCode()).body(res.getBody());

        } catch (org.springframework.web.client.HttpStatusCodeException ex) {
            String upstream = ex.getResponseBodyAsString();
            // upstream JSON에 traceId/code가 있을 때 꺼내 보기
            String code = "OCR_UPSTREAM_" + ex.getStatusCode().value();
            try {
                var node = new ObjectMapper().readTree(upstream);
                if (node.has("code")) code = node.get("code").asText();
            } catch (Exception ignore) {}

            return ResponseEntity.status(ex.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "ok", false,
                            "code", code,
                            "message", "OCR 요청이 거부되었습니다. 포맷/메시지 스펙을 확인하세요.",
                            "upstream", upstream
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "ok", false,
                    "code", "OCR_PROXY_ERROR",
                    "message", "OCR 중 서버 내부 오류가 발생했습니다.",
                    "meta", Map.of("cause", e.getClass().getSimpleName())
            ));
        }
    }

    private static String baseName(String filename){
        if (filename == null) return "image";
        int p = filename.lastIndexOf('.');
        return (p>0) ? filename.substring(0,p) : filename;
    }
    private static MediaType springMediaType(String fmt) {
        return switch (fmt) {
            case "jpg" -> MediaType.IMAGE_JPEG;
            case "png" -> MediaType.IMAGE_PNG;
            case "tiff" -> MediaType.parseMediaType("image/tiff");
            case "pdf" -> MediaType.APPLICATION_PDF;
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }

    @PostMapping(value = "/verifyminsjon", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<VerifyMinSjonResponse> verifyMinSjon(@RequestBody VerifyMinSjonRequest request) {
        // 로그에 주민번호 전체가 찍히지 않도록 마스킹
        logger.info("UserController => verifyMinSjon()");

        VerifyMinSjonResponse result = kycVerifyService.verify(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/accountSave", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> accountSave(@RequestBody Map<String, Object> body) {
        logger.info("account/save payload = {}", body);

        // 다음과 같이 데이터가 들어옴...
        // account/save payload =
        //{
        //consent={all=true, eContract=true, privacy=true, marketing=true}, verification={verified=true, nameFromId=둘리, rrn6FromId=830422, addressFromId=부천시 원미구 상1동 412-3번지 들리의 거리},
        //customer={name=이충현, rrn=9002220-19222224, phone=010-1234-2264, email=l306227@naverr.com, address=경북일산},
        //product={type=saving, fromAccount=입출금통장 · 110-508-770121, newAccountNo=110-201-858598, mPin=231111},
        //meta={createdAt=2025-10-09T02:50:03.594Z}
        //}

        // 넘어온 정보로 해당 고객의 ID 가져오기 참조(외래키 설정을 위해서)
        CustomerDTO dto = accountService.getAccount(body);

        // 최종적으로 저장하는 곳
        registerAccountRepository.registerAccount(dto, body);

        // 프런트 payload 구조 예: consent/verification/customer/product/meta
        Map<String, Object> product = (Map<String, Object>) body.get("product");
        String newAccountNo = product != null ? (String) product.get("newAccountNo") : null;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("ok", true);
        res.put("accountId", UUID.randomUUID().toString());
        res.put("accountNo", newAccountNo);        // 프런트가 준 계좌번호 그대로 회신(임시)
        res.put("createdAt", Instant.now().toString());
        return ResponseEntity.ok(res);
    }

}