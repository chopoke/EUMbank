import apiConfig from "../config/appConfig";

/**
 * 예금 관련 저장
 */

export async function depositSave(params) {
    try {
        const res = await apiConfig.post("/api/depositSave", params);
    } catch (error) {

    }

}


/**
 * 적금 관련 저장
 */

export async function savingsSave(params) {
    try {
        const res = await apiConfig.post("/api/savingsSave", params);
    } catch (error) {

    }

}