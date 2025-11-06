import api from "../../../api/axios";

/**
 * 최종적으로 저장하기
 * @param {*} params 
 * @returns 
 */
export async function saveAccount(params) {
  try {
    const res = await api.post("/api/accountSave", params);

    console.log(res);

  } catch (error) {
    console.error("계좌 저장 실패:", error.response?.data || error.message);
    throw new Error(`계좌 저장 실패 (${error.response?.status})`);
  }
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
  form.append("message", JSON.stringify(message));

  try {
    const res = await api.post("/api/ocr-file", form);
    return res.data;
  } catch (error) {
    console.error("OCR 요청 실패:", error.response?.data || error.message);
    throw new Error(`OCR 요청 실패 (${error.response?.status})`);
  }
}


/**
 * 본인정보 매칭 검증
 * @param {{name:string, rrn6:string, address:string}} params
 * @returns {Promise<{ok:boolean, message:string, matched:{name:boolean, rrn6:boolean, address:boolean}, score:number}>}
 */
export async function verifyMinSjon(params) {
  try {
    const res = await api.post("/api/verifyminsjon", params);
    return res.data;
  } catch (error) {
    console.error("검증 요청 실패:", error.response?.data || error.message);
    throw new Error(`검증 요청 실패 (${error.response?.status})`);
  }
}

/**
 * // 계좌개설쪽 핀번호 체크하기
 * @param {*} params 
 * @returns 
 */
export async function checkPinNumber() {
  try {
    const res = await api.post("/api/checkPinNumber");
    return res.data;
  } catch (error) {
    console.error("검증 요청 실패:", error.response?.data || error.message);
    throw new Error(`검증 요청 실패 (${error.response?.status})`);
  }
}

/**
 * PIN 재설정
 * @param {string} pin - 새로운 6자리 PIN
 * @returns {Promise<{ok:boolean, message:string}>}
 */
export async function resetPin(pin) {
    try {
        const res = await api.put("/api/pin-change", { pin: pin });
        return res.data;
    } catch (error) {
        console.error("PIN 재설정 실패:", error.response?.data || error.message);
        throw new Error(
            error.response?.data?.message ||
            `PIN 재설정 실패 (${error.response?.status})`
        );
    }
}


/**
 * 패스워드 재설정
 * @returns {Promise<{ok:boolean, message:string}>}
 * @param principlePassword
 * @param newPassword
 * @param confirmPassword
 */
export async function resetPassword(principlePassword, newPassword, confirmPassword) {
    try {
        const res = await api.put("/api/password-change", {
            principlePassword: principlePassword,
            newPassword: newPassword,
            confirmPassword: confirmPassword
        });
        return res.data;
    } catch (error) {
        console.error("PIN 재설정 실패:", error.response?.data || error.message);
        throw new Error(
            error.response?.data?.message ||
            `PIN 재설정 실패 (${error.response?.status})`
        );
    }
}

/**
 * pin번호 검증
 * @param data
 */
export async function verifyExistingPin(data) {

  const res = await api.post("/api/verifyExistingPin", data);
  return res.data;

}

/**
 * pin번호 변경
 */
export async function changePin(data) {

    const res = await api.post("/api/changePin", data);
    return res.data;

}