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
    const [maskedPreview, setMaskedPreview] = useState(null); // 마스킹된 미리보기
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false);

    const [pinVerified, setPinVerified] = useState(false);
    const [modalMode, setModalMode] = useState('register');

    const [checkPin, setCheckPin] = useState('');
    const [pinNumber, setPinNumber] = useState('');
    const [pinReNumber, setRePinNumber] = useState('');
    const [pinStep, setPinStep] = useState('enter');

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

    // ✅ 이미지 마스킹 함수
    const maskImageRRN = (imageFile) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;

                // 원본 이미지 그리기
                ctx.drawImage(img, 0, 0);

                // 주민등록증 뒷자리 영역에 검은 박스 그리기
                const boxWidth = img.width * 0.23;  // 이미지 너비의 25%
                const boxHeight = img.height * 0.08; // 이미지 높이의 5%
                const boxX = img.width * 0.28;       // 이미지 왼쪽에서 52% 위치 (뒷자리 시작점)
                const boxY = img.height * 0.46;      // 이미지 위에서 42% 위치

                ctx.fillStyle = 'black';
                ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

                // Canvas를 Data URL로 변환
                const maskedDataUrl = canvas.toDataURL(imageFile.type);
                resolve(maskedDataUrl);
            };

            img.onerror = () => {
                reject(new Error('이미지 로드 실패'));
            };

            img.src = URL.createObjectURL(imageFile);
        });
    };

    // ✅ 파일 선택 시 원본만 저장, 미리보기는 숨김
    const onFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;

        setFile(f);
        setPreview(null); // 미리보기 숨김
        setMaskedPreview(null); // 마스킹된 미리보기 초기화
        setVerified(false);
        setMsg("");
        setError("");
    };

    // ✅ OCR 처리 후 마스킹된 이미지 생성
    const handleOcr = async () => {
        if (!file || !checked || loading) return;

        try {
            setLoading(true);
            setError("");
            setMsg("이미지 업로드 및 분석 중…");

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

            console.log(ocr);

            const { name, rrn6, address, rrn13 } = extractIdInfo(ocr);
            if (!name && !rrn6 && !address) {
                throw new Error("신분증 정보 추출 실패");
            }

            setMsg(`추출됨: ${name ?? ""} / ${rrn6 ? rrn6 + "-*******" : ""}`);

            const verifyRes = await verifyMinSjon({ name, rrn6, address });

            if (verifyRes?.ok) {
                setVerified(true);

                console.log(verifyRes);

                const { email, phone } = verifyRes;

                setStep2({ verified: true, name, rrn6, rrn13, address, email, phone });
                setMsg("본인 확인 완료. 다음 단계로 진행할 수 있습니다.");

                // ✅ OCR 성공 후 마스킹된 이미지 생성 및 표시
                const masked = await maskImageRRN(file);
                setMaskedPreview(masked);
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

    const handleVerifyPin = async (pin) => {
        setLoading(true);
        setError("");
        try {
            const res = await verifyExistingPin({ pinNumber: pin });

            const { name, rrn6, address, rrn13, email, phone } = res;

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

    const goToNextStep = () => {
        if (!checked) {
            alert("개인정보 수집·이용에 동의해주세요.");
            return;
        }

        if (checkPin) {
            if (pinVerified) {
                setStep2({ verified: true, pinVerified: true });
                nav(NEXT_PATH);
            } else {
                alert("PIN 인증을 완료해야 다음으로 진행할 수 있습니다.");
            }
            return;
        }

        const pinIsSet = pinNumber !== '' && pinNumber === pinReNumber;
        if (verified && pinIsSet) {
            setStep2({ pinNumber });
            nav(NEXT_PATH);
        }
    };

    const canStart = !!file && checked && !loading;
    const pinIsSet = pinNumber !== '' && pinNumber === pinReNumber;

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

    const [modalOpen, setModalOpen] = useState(false);

    const closeModal = () => {
        setModalOpen(false);
        setPinStep('enter');
    };

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
                                        disabled={pinVerified}
                                        className={`min-w-[120px] rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${pinVerified ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                    >
                                        {pinVerified ? "인증 완료" : "PIN으로 인증하기"}
                                    </button>
                                </div>
                            )}

                            {!checkPin && (
                                <>
                                    <p className="text-sm text-gray-700">
                                        주민등록증/운전면허증 앞면 이미지를 업로드하세요. 빛 반사/흐림 없이 전체가 보이도록 촬영해 주세요.
                                    </p>

                                    <label className="block rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-gray-300 cursor-pointer">
                                        <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                                        {/* ✅ OCR 처리 후에만 마스킹된 이미지 표시 */}
                                        {maskedPreview ? (
                                            <div className="relative">
                                                <img src={maskedPreview} alt="마스킹된 신분증" className="mx-auto max-h-56 rounded-lg" />
                                                <p className="text-xs text-green-600 mt-2 font-medium">✓ 본인 인증 완료 (주민등록번호 뒷자리 마스킹 처리됨)</p>
                                            </div>
                                        ) : file ? (
                                            // ✅ 파일은 선택되었지만 OCR 처리 전 - 업로드 완료 표시만
                                            <div className="space-y-2">
                                                <div className="text-4xl">📄</div>
                                                <div className="text-sm font-medium text-green-600">이미지 업로드 완료</div>
                                                <div className="text-xs text-gray-500">{file.name}</div>
                                                <div className="text-xs text-blue-600 mt-2">
                                                    보안을 위해 인증 완료 후 이미지가 표시됩니다.
                                                </div>
                                            </div>
                                        ) : (
                                            // ✅ 파일 선택 전
                                            <div className="space-y-2">
                                                <div className="text-sm font-medium">이미지 업로드</div>
                                                <div className="text-xs text-gray-500">PNG, JPG, HEIC 지원</div>
                                            </div>
                                        )}
                                    </label>

                                    <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>민감정보는 HTTPS/TLS로 암호화 전송됩니다.</li>
                                            <li>주민등록번호 뒷자리는 자동으로 마스킹 처리됩니다.</li>
                                            <li>신분증 이미지는 인증 완료 후에만 표시됩니다.</li>
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
                                                setFile(null);
                                                setMaskedPreview(null);
                                            }}
                                        >
                                            재시도
                                        </button>
                                    )}

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

                                    {!checkPin && verified && !pinIsSet && (
                                        <button
                                            type="button"
                                            onClick={openRegisterModal}
                                            className="min-w-[96px] rounded-xl px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                            PIN 등록
                                        </button>
                                    )}

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

                                    <Modal open={modalOpen} close={closeModal} header={
                                        modalMode === 'verify' ? "PIN 6자리 입력"
                                            : (pinStep === 'enter' ? "PIN 6자리 입력" : "PIN 6자리 확인")
                                    }>
                                        <PinPadModal
                                            key={`${modalMode}-${pinStep}`}
                                            length={6}
                                            onSubmit={async (pin) => {
                                                if (modalMode === 'verify') {
                                                    await handleVerifyPin(pin);
                                                } else {
                                                    if (pinStep === 'enter') {
                                                        setPinNumber(pin);
                                                        setPinStep('confirm');
                                                    } else {
                                                        if (pinNumber === pin) {
                                                            setRePinNumber(pin);
                                                            closeModal();
                                                        } else {
                                                            alert("PIN이 일치하지 않습니다. 다시 입력해주세요.");
                                                            setPinStep('enter');
                                                            setPinNumber('');
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

function maskRRN(s = "") {
    return s.replace(/(\d{6})-(\d{7})/g, (_, a) => `${a}-*******`);
}

const cleanName = (s = "") =>
    s.replace(/\(.*?\)/g, "")
        .replace(/\s+/g, "")
        .replace(/[^가-힣A-Za-z]/g, "");

const looksLikeDate = (s = "") => /\d{4}\.\d{1,2}\.\d{1,2}/.test(s);

function extractIdInfo(ocrJson) {
    const fields =
        ocrJson?.images?.[0]?.fields ||
        ocrJson?.images?.[0]?.inferResult?.fields ||
        [];

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

        let addrParts = [];
        for (let i = 3; i < fields.length; i++) {
            const t = (fields[i]?.inferText ?? fields[i]?.text ?? "").trim();
            if (!t) continue;
            if (looksLikeDate(t)) break;
            addrParts.push(t);
            if (addrParts.length >= 4) break;
        }
        const address = addrParts.join(" ").replace(/\s+/g, " ").trim();

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

        const m = text.match(/(\d{6})[- ]?(\d{7})/);
        console.log("민증" + m);
        if (m) {
            rrn6 = m[1];
        }

        if (!address && /시|군|구|동|읍|면|로|길|번지|아파트|대로/.test(text) && /\d/.test(text)) {
            address = text;
        }

        const hangul = text.replace(/[^가-힣]/g, "");
        if (/성명|이름/.test(text) && f?.value?.inferText) {
            const v = f.value.inferText.replace(/[^가-힣]/g, "");
            if (v) bestName = { text: v, conf: 1 };
        } else if (hangul.length >= 2 && hangul.length <= 4 && conf > bestName.conf) {
            bestName = { text: hangul, conf };
        }

        const emailMatch = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
        if (emailMatch) {
            email = emailMatch[0];
        }

        const phoneMatch = text.match(/010[-.\s]?\d{4}[-.\s]?\d{4}/);
        if (phoneMatch) {
            phone = phoneMatch[0].replace(/\D/g, '');
        }
    }
    name = cleanName(bestName.text);

    return { name, rrn6, address, email, phone };
}