import apiConfig from "../config/appConfig"

/**
 * 최종적으로 저장하기
 * @param {*} payload 
 * @returns 
 */
export async function saveAccount(payload) {
    const res = await fetch(`${apiConfig.baseUrl}/api/accountSave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`계좌 저장 실패 (${res.status}) ${text}`);
    }
    return res.json(); // { ok:true, accountId:..., ... } 형태 가정
}

/**
 * OCR 업로드 (파일 + message JSON을 multipart/form-data로 전송)
 * @param {File} file
 * @param {Object} message - CLOVA 스펙 message JSON
 * @returns {Promise<any>} OCR 응답 JSON
 */
export async function ocrCheck(file, message) {
    const form = new FormData();
    form.append("file", file);
    form.append("message", JSON.stringify(message)); // 서버에서 @RequestPart("message")로 받음

    const res = await fetch(`${apiConfig.baseUrl}/api/ocr-file`, {
        method: "POST",
        // ✅ FormData 전송 시 Content-Type 직접 지정하지 말 것!
        body: form,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`OCR 요청 실패 (${res.status}) ${text}`);
    }
    // CLOVA proxy가 JSON을 그대로 문자열로 줄 수도 있으니 먼저 JSON 시도 → 실패 시 파싱 재시도
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return res.json();
    }
    const raw = await res.text();
    try {
        return JSON.parse(raw);
    } catch {
        // 정말로 문자열이라면 원문 반환
        return raw;
    }
}

/**
 * 본인정보 매칭 검증
 * @param {{name:string, rrn6:string, address:string}} payload
 * @returns {Promise<{ok:boolean, message:string, matched:{name:boolean, rrn6:boolean, address:boolean}, score:number}>}
 */
export async function verifyMinSjon(payload) {
    const res = await fetch(`${apiConfig.baseUrl}/api/verifyminsjon`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`검증 요청 실패 (${res.status}) ${text}`);
    }
    return res.json();
}