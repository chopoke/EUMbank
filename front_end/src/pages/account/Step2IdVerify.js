// Step2IdVerify.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Frame, Header, Stepper, AsideHelp, Checkbox } from "./commom/ui";
import { checkPinNumber, ocrCheck, verifyExistingPin, verifyMinSjon } from "./api/accountApi";
import { useAccountOpenStore } from './state/accountOpenStore';
import Modal from "./component/pinConponent/Modal";
import { PinPadModal } from "./component/pinConponent/PinPadModal";

const NEXT_PATH = "/account/open/step3";

export default function Step2IdVerify() {
    const nav = useNavigate();
    const setStep2 = useAccountOpenStore(s => s.setStep2);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false);

    const [pinVerified, setPinVerified] = useState(false); // 기존 PIN 인증 성공 여부
    const [modalMode, setModalMode] = useState('register'); // 모달의 모드 ('register' 또는 'verify')

    // 현재 로그인한 유저가 핀번호를 가지고 있는지 파악
    const [checkPin, setCheckPin] = useState('');
    // 핀번호 초기 입력
    const [pinNumber, setPinNumber] = useState('');
    // 핀번호 확인용
    const [pinReNumber, setRePinNumber] = useState('');
    // 핀번호 2번입력에 대한 각기 상태값
    const [pinStep, setPinStep] = useState('enter');

    // 백엔드에서 받은 에러 관련 UI에 뿌려주기위한 방법
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const checkPinFunction = async () => {
            try {
                const verifyRes = await checkPinNumber();

                if (verifyRes?.ok) {
                    console.log("성공했다.");
                    setCheckPin(verifyRes?.state);
                } else {
                    console.log("실패했다.");
                    setCheckPin(verifyRes?.state);
                }
            } catch (error) {
                setCheckPin(false);
                console.log(error);
            }
        }
        checkPinFunction();
    }, [])

    const onFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setVerified(false);
        setMsg("");
        setError("");
    };

    // ocr 이미지 분석
    const handleOcr = async () => {
        if (!file || !checked || loading) return;

        try {
            setLoading(true);
            setError("");
            setMsg("이미지 업로드 및 분석 중…");

            // CLOVA 스펙에 맞춘 message
            const message = {
                version: "V2",
                requestId: Math.random().toString(36).slice(2),
                timestamp: Date.now(),
                images: [
                    {
                        format: (file.type?.split("/")[1] || "png").replace("jpeg", "jpg"),
                        name: "idcard_test",
                    },
                ],
            };

            const ocr = await ocrCheck(file, message);

            // 2) OCR 응답에서 신분증 정보 추출
            const { name, rrn6, address, rrn13 } = extractIdInfo(ocr);
            if (!name && !rrn6 && !address) {
                throw new Error("신분증 정보 추출 실패");
            }

            setMsg(`추출됨: ${name ?? ""} / ${rrn6 ? rrn6 + "-*******" : ""}`);

            // 3) 백엔드 DB와 매칭 요청
            const verifyRes = await verifyMinSjon({ name, rrn6, address });

            if (verifyRes?.ok) {
                setVerified(true);

                console.log(verifyRes);

                // ✅ 응답에서 email, phone 추출
                const { email, phone } = verifyRes;

                // ✅ Zustand 스토어에 모든 정보 저장
                setStep2({ verified: true, name, rrn6, rrn13, address, email, phone });
                setMsg("본인 확인 완료. 다음 단계로 진행할 수 있습니다.");
            } else {
                setVerified(false);
                setError(verifyRes?.message || "본인 정보가 일치하지 않습니다. 다시 촬영/업로드해주세요.");
            }
        } catch (e) {
            setVerified(false);
            setError(e?.response?.data?.message || e.message || "OCR 처리 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
            setMsg("");
        }
    };

    // ✅ 1. 기존 PIN을 입력받아 백엔드에 검증을 요청하는 함수를 새로 만듭니다.
    const handleVerifyPin = async (pin) => {
        setLoading(true);
        setError("");
        try {
            // 새로 추가해야 할 API 함수: verifyExistingPin
            const res = await verifyExistingPin({ pinNumber: pin });

            // ✅ 응답에서 email, phone 추출
            const { name, rrn6, address, rrn13, email, phone } = res;

            // ✅ Zustand 스토어에 모든 정보 저장
            setStep2({ verified: true, name, rrn6, rrn13, address, email, phone });

            setPinVerified(true);
            setMsg(res.message);
            closeModal();
        } catch (e) {
            setError(e?.message);
            closeModal();
        } finally {
            setLoading(false);
        }
    };

    // ✅ 2. 최종 "다음" 버튼 클릭 로직을 명확하게 분리합니다.
    const goToNextStep = () => {
        if (!checked) {
            alert("개인정보 수집·이용에 동의해주세요.");
            return;
        }

        // 분기 A: 기존 PIN 사용자인 경우
        if (checkPin) {
            if (pinVerified) {
                // 백엔드에서 인증이 끝났으므로, 다음 단계로 넘어갈 수 있다는 사실만 저장
                setStep2({ verified: true, pinVerified: true });
                nav(NEXT_PATH);
            } else {
                alert("PIN 인증을 완료해야 다음으로 진행할 수 있습니다.");
            }
            return;
        }

        // 분기 B: 신규 PIN 등록 사용자인 경우
        const pinIsSet = pinNumber !== '' && pinNumber === pinReNumber;
        if (verified && pinIsSet) {
            setStep2({ pinNumber }); // 새로 등록한 PIN 번호를 저장
            nav(NEXT_PATH);
        }
    };

    const canStart = !!file && checked && !loading;
    // 🚨 수정: verified 상태이면서, PIN 번호가 일치할 때 '다음'으로 표시
    const pinIsSet = pinNumber !== '' && pinNumber === pinReNumber;


    // ✅ 3. 모달 열기 함수를 모드에 따라 분리합니다.
    const openRegisterModal = () => {
        setModalMode('register');
        setPinStep('enter');
        setPinNumber('');
        setRePinNumber('');
        setModalOpen(true);
    };

    const openVerifyModal = () => {
        setModalMode('verify');
        setModalOpen(true);
    };

    // 모달 작업창 부분 시작 ------
    // 참고사이트 : https://velog.io/@phrygia/2021-09-21-react-modal
    const [modalOpen, setModalOpen] = useState(false);

    const closeModal = () => {
        setModalOpen(false);
        setPinStep('enter');
    };
    // 모달 작업창 부분 끝...

    return (
        <Frame>
            <Header breadcrumbs={["개인", "계좌 개설"]} />
            <main className="mx-auto max-w-6xl px-4 py-6">
                <Stepper current={2} />
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                    <section className="rounded-2xl border bg-white shadow-sm">

                        <div className="px-5 py-4 border-b">
                            <h2 className="text-base font-semibold">2. 본인인증</h2>
                        </div>
                        <div className="p-5 space-y-6">
                            {checkPin && (
                                <div className="text-center p-4">
                                    <p className="text-sm text-gray-700 mb-4">
                                        기존에 등록된 PIN 번호가 확인되었습니다. <br />
                                        PIN 번호를 입력하여 본인 인증을 완료해주세요.
                                    </p>
                                    <button
                                        onClick={openVerifyModal}
                                        disabled={pinVerified} // 이미 인증했으면 비활성화
                                        className={`min-w-[120px] rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${pinVerified ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                            }`}
                                    >
                                        {pinVerified ? "인증 완료" : "PIN으로 인증하기"}
                                    </button>
                                </div>
                            )}

                            {/* checkPin이 false일 때만 신분증 업로드 UI를 보여줌 */}
                            {!checkPin && (
                                <>
                                    <p className="text-sm text-gray-700">
                                        주민등록증/운전면허증 앞면 이미지를 업로드하세요. 빛 반사/흐림 없이 전체가 보이도록 촬영해 주세요.
                                    </p>

                                    <label className="block rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-gray-300 cursor-pointer">
                                        <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                                        {preview ? (
                                            <img src={preview} alt="미리보기" className="mx-auto max-h-56 rounded-lg" />
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="text-sm font-medium">이미지 업로드</div>
                                                <div className="text-xs text-gray-500">PNG, JPG, HEIC 지원</div>
                                            </div>
                                        )}
                                    </label>

                                    <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>민감정보는 HTTPS/TLS로 암호화 전송됩니다.</li>
                                            <li>주민등록번호는 화면/서버에서 마스킹 처리됩니다.</li>
                                            <li>업로드 이미지는 검증 후 즉시 파기합니다.</li>
                                        </ul>
                                    </div>
                                </>
                            )}
                            <Checkbox
                                checked={checked}
                                onChange={() => setChecked(!checked)}
                                label={
                                    <span>
                                        개인정보 수집·이용에 동의합니다{" "}
                                        <span className="text-xs text-gray-500">(필수)</span>
                                    </span>
                                }
                            />

                            {/* 상태 출력 */}
                            {msg && <p className="text-sm text-blue-600">{maskRRN(msg)}</p>}
                            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{maskRRN(error)}</div>}

                            <div className="flex justify-between pt-2">
                                <button
                                    type="button"
                                    className="min-w-[96px] rounded-xl px-5 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    onClick={() => nav(-1)}
                                >
                                    이전
                                </button>

                                <div className="flex gap-2">
                                    {!verified && error && (
                                        <button
                                            type="button"
                                            className="min-w-[96px] rounded-xl px-5 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            onClick={() => {
                                                setError("");
                                                setMsg("");
                                                setVerified(false);
                                            }}
                                        >
                                            재시도
                                        </button>
                                    )}

                                    {/* ✅ Case A: 기존 PIN 사용자 '다음' 버튼 */}
                                    {checkPin && (
                                        <button
                                            type="button"
                                            disabled={!checked || !pinVerified}
                                            onClick={goToNextStep}
                                            className={`min-w-[96px] rounded-xl px-5 py-2.5 text-sm font-semibold ${(!checked || !pinVerified)
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-blue-600 text-white hover:bg-blue-700"
                                                }`}
                                        >
                                            다음
                                        </button>
                                    )}

                                    {/* ✅ Case B-1: 신규 사용자 'OCR 시작' 버튼 */}
                                    {!checkPin && !verified && (
                                        <button
                                            type="button"
                                            disabled={!canStart}
                                            onClick={handleOcr}
                                            className={`min-w-[96px] rounded-xl px-5 py-2.5 text-sm font-semibold ${!canStart
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-blue-600 text-white hover:bg-blue-700"
                                                }`}
                                        >
                                            {loading ? "검증 중..." : "인증 시작"}
                                        </button>
                                    )}

                                    {/* ✅ Case B-2: OCR 성공 후 'PIN 등록' 버튼 */}
                                    {!checkPin && verified && !pinIsSet && (
                                        <button
                                            type="button"
                                            onClick={openRegisterModal}
                                            className="min-w-[96px] rounded-xl px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                            PIN 등록
                                        </button>
                                    )}

                                    {/* ✅ Case B-3: PIN 등록 후 '다음' 버튼 */}
                                    {!checkPin && verified && pinIsSet && (
                                        <button
                                            type="button"
                                            disabled={!checked}
                                            onClick={goToNextStep}
                                            className={`min-w-[96px] rounded-xl px-5 py-2.5 text-sm font-semibold ${!checked
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-blue-600 text-white hover:bg-blue-700"
                                                }`}
                                        >
                                            다음
                                        </button>
                                    )}
                                    {/* ✅ 4. 모달 로직을 'verify'와 'register' 모드에 따라 분기 처리합니다. */}
                                    <Modal open={modalOpen} close={closeModal} header={
                                        modalMode === 'verify' ? "PIN 6자리 입력"
                                            : (pinStep === 'enter' ? "PIN 6자리 입력" : "PIN 6자리 확인")
                                    }>
                                        <PinPadModal
                                            key={`${modalMode}-${pinStep}`} // 모드가 바뀔 때도 초기화되도록 key 수정
                                            length={6}
                                            onSubmit={async (pin) => {
                                                if (modalMode === 'verify') {
                                                    await handleVerifyPin(pin);
                                                } else { // 'register' mode
                                                    if (pinStep === 'enter') {
                                                        setPinNumber(pin);
                                                        setPinStep('confirm');
                                                    } else {
                                                        if (pinNumber === pin) {
                                                            setRePinNumber(pin);
                                                            closeModal();
                                                        } else {
                                                            alert("PIN이 일치하지 않습니다. 다시 입력해주세요.");
                                                            setPinStep('enter'); // 첫 단계로 리셋
                                                            setPinNumber('');
                                                            // PinPadModal이 리셋되도록 에러 throw
                                                            throw new Error("PIN mismatch");
                                                        }
                                                    }
                                                }
                                            }}
                                            onCancel={closeModal}
                                        />
                                    </Modal>
                                </div>
                            </div>
                        </div>
                    </section>

                    <AsideHelp />
                </div>
            </main >
        </Frame >
    );
}

/* ================= 유틸: OCR 파싱/마스킹 ================= */

// 화면/로그 안전 마스킹
function maskRRN(s = "") {
    return s.replace(/(\d{6})-(\d{7})/g, (_, a) => `${a}-*******`);
}

// 공통 클린업
const cleanName = (s = "") =>
    s.replace(/\(.*?\)/g, "")           // 괄호 안 제거
        .replace(/\s+/g, "")               // 공백 제거
        .replace(/[^가-힣A-Za-z]/g, "");   // 한글/영문 외 제거

const looksLikeDate = (s = "") => /\d{4}\.\d{1,2}\.\d{1,2}/.test(s);

/** CLOVA 응답에서 이름/주민등록번호/주소 추출 (고정인덱스 우선 + 휴리스틱 폴백) */
function extractIdInfo(ocrJson) {
    const fields =
        ocrJson?.images?.[0]?.fields ||
        ocrJson?.images?.[0]?.inferResult?.fields ||
        [];

    // ---------- 1) 고정 인덱스 우선 파싱 ----------
    if (fields.length >= 3) {
        const nameRaw = fields[1]?.inferText ?? fields[1]?.text ?? "";
        const rrnRaw = fields[2]?.inferText ?? fields[2]?.text ?? "";

        let name = cleanName(nameRaw);
        let rrn6 = "";
        let rrn13 = "";

        const m = rrnRaw.match(/(\d{6})[- ]?(\d{7})/);
        console.log(m);

        if (m) {
            rrn6 = m[1];
            rrn13 = m[0];
        }

        // 주소는 3~6번 인덱스까지 이어붙이다가 날짜(발급일) 같은 패턴 만나면 중단
        let addrParts = [];
        for (let i = 3; i < fields.length; i++) {
            const t = (fields[i]?.inferText ?? fields[i]?.text ?? "").trim();
            if (!t) continue;
            if (looksLikeDate(t)) break; // 2003.4.22 같은 발급일 나오면 중단
            addrParts.push(t);
            // 너무 길어지지 않도록 3~4개 정도까지만
            if (addrParts.length >= 4) break;
        }
        const address = addrParts.join(" ").replace(/\s+/g, " ").trim();

        // 최소 요건 충족 시 바로 반환
        if (name || rrn6 || address || rrn13) {
            return { name, rrn6, address, rrn13 };
        }
    }

    let name = "";
    let rrn6 = "";
    let address = "";
    let bestName = { text: "", conf: 0 };
    let email = "";
    let phone = "";

    for (const f of fields) {
        const text = (f.inferText || f.text || "").trim();
        const conf = Number(f?.inferConfidence ?? f?.confidence ?? 0);

        console.log(text);

        // 주민등록번호
        const m = text.match(/(\d{6})[- ]?(\d{7})/);
        console.log("민증" + m);
        if (m) {
            rrn6 = m[1];
        }

        // 주소 후보(간단 키워드 + 숫자 포함)
        if (!address && /시|군|구|동|읍|면|로|길|번지|아파트|대로/.test(text) && /\d/.test(text)) {
            address = text;
        }

        // 이름 후보
        const hangul = text.replace(/[^가-힣]/g, "");
        if (/성명|이름/.test(text) && f?.value?.inferText) {
            const v = f.value.inferText.replace(/[^가-힣]/g, "");
            if (v) bestName = { text: v, conf: 1 };
        } else if (hangul.length >= 2 && hangul.length <= 4 && conf > bestName.conf) {
            bestName = { text: hangul, conf };
        }

        // ✅ 이메일 후보 (정규식 사용)
        const emailMatch = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
        if (emailMatch) {
            email = emailMatch[0];
        }

        // ✅ 전화번호 후보 (정규식 사용)
        const phoneMatch = text.match(/010[-.\s]?\d{4}[-.\s]?\d{4}/);
        if (phoneMatch) {
            phone = phoneMatch[0].replace(/\D/g, ''); // 숫자만 추출
        }
    }
    name = cleanName(bestName.text);

    return { name, rrn6, address, email, phone };
}