// src/pages/admin/components/ProductFormModal.jsx
import { useState, useEffect, useMemo } from 'react';
import { createDepositProduct } from '../api/depositManagementApi';
import { createInstallmentProduct } from '../api/installmentManagementApi';


/**
 * 적금/예금 상품 등록하는 모달
 * @param activeType
 * @param onSuccess
 * @param onClose
 * @returns {React.JSX.Element}
 * @constructor
 */
export default function ProductFormModal({ activeType, onSuccess, onClose }) {
    const isDeposit = activeType === '예금';

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        type: '',
        rate: '',
        minAmount: '',
        maxAmount: '',
        minMonths: '',
        maxMonths: '',
        ealryTerminationRate: '',
        interestPaymentType: '',
        feature: [],
        buttonText: '',
        href: '',
        isActive: 'Y'
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // 상품 코드 자동 생성 및 기본값 설정을 위한 useEffect
    useEffect(() => {
        // 1. 상품 코드 생성
        const prefix = isDeposit ? 'D' : 'S';
        // 5자리 난수 생성 (10000 ~ 99999)
        const randomDigits = Math.floor(Math.random() * 90000) + 10000;
        const generatedCode = `${prefix}${randomDigits}`;

        // 2. isDeposit 값에 따른 기본값 설정
        const defaultButtonText = isDeposit ? '예금상품개설' : '적금상품가입';
        const defaultHref = isDeposit ? '/deposit/open' : '/savings/open';

        // 3. formData state 업데이트
        setFormData(prev => ({
            ...prev,
            code: generatedCode,         // 자동 생성된 코드
            buttonText: defaultButtonText, // 기본 버튼 텍스트
            href: defaultHref          // 기본 링크
        }));

    }, [isDeposit]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newState = { ...prev, [name]: value };

            // 💡 [수정된 부분]
            // 만약 '최소 기간'이 변경되면, '최대 기간' 값을 초기화합니다.
            if (name === 'minMonths') {
                newState.maxMonths = '';
            }

            return newState;
        });

        // 에러 초기화
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
        // [수정된 부분] 최소 기간 변경 시, 최대 기간 에러도 함께 초기화
        if (name === 'minMonths' && errors.maxMonths) {
            setErrors(prev => ({ ...prev, maxMonths: null }));
        }
    };

    /**
     * 상품 특징 체크박스 변경 핸들러
     */
    const handleFeatureChange = (e) => {
        const { value, checked } = e.target;

        setFormData(prevData => {
            // 현재 feature 배열을 복사
            let newFeatures = [...prevData.feature];

            if (checked) {
                // 체크된 경우, 배열에 추가
                newFeatures.push(value);
            } else {
                // 체크 해제된 경우, 배열에서 제거
                newFeatures = newFeatures.filter(item => item !== value);
            }

            // 업데이트된 배열로 formData state를 설정
            return {
                ...prevData,
                feature: newFeatures
            };
        });
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.code) newErrors.code = '상품 코드는 필수입니다';
        if (!formData.name) newErrors.name = '상품명은 필수입니다';
        if (!formData.type) newErrors.type = '상품 유형은 필수입니다';


        if (!formData.minAmount) newErrors.minAmount = '최소 금액은 필수입니다';
        if (!formData.maxAmount) newErrors.maxAmount = '최대 금액은 필수입니다';

        if (!formData.ealryTerminationRate) newErrors.ealryTerminationRate = '조기금리 입력은 필수 입니다.';

        if (!formData.minMonths) newErrors.minMonths = '최소 기간은 필수입니다';
        if (!formData.maxMonths) newErrors.maxMonths = '최대 기간은 필수입니다';
        if (!formData.interestPaymentType) newErrors.interestPaymentType = '이자 지급 방식은 필수입니다';
        if (!formData.rate) newErrors.rate = '금리는 필수입니다';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            alert('필수 항목을 입력해주세요');
            return;
        }

        setLoading(true);

        try {
            // DTO 형식으로 변환
            const dto = {
                code: formData.code,
                name: formData.name,
                description: formData.description,
                type: formData.type,
                rate: Number(formData.rate),
                minAmount: Number(formData.minAmount),
                maxAmount: Number(formData.maxAmount),
                minMonths: Number(formData.minMonths),
                maxMonths: Number(formData.maxMonths),
                ealryTerminationRate: Number(formData.ealryTerminationRate),
                paymentType: formData.interestPaymentType,
                features: formData.feature.join(','),
                href: formData.href,
                buttonText: formData.buttonText,
                isActive: formData.isActive
            };

            if (isDeposit) {
                await createDepositProduct(dto);
            } else {
                await createInstallmentProduct(dto);
            }

            alert(`${activeType} 상품이 등록되었습니다`);
            onSuccess();
        } catch (error) {
            console.error('등록 실패:', error);
            alert('등록에 실패했습니다: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const featuresList = [
        "월 관리수수료 없음", "편리한 온라인 이체", "모바일로 바로 입금", "24시간 고객지원", "높은 이자율 제공", "우선 고객 서비스", "무료 송금 서비스", "전담 상담사 배정",
        "기업 특화 서비스", "다중 사용자 권한", "당좌예금 연계", "자금 관리 리포트", "온라인 환전 간편 신청", "공항 및 지점 수령 가능", "실시간 환율 정보 제공",
        "주요 통화 환율 우대","빠르고 안전한 해외 송금", "전 세계 금융 네트워크", "모바일로 간편 송금", "송금 진행상황 실시간 조회","환테크에 유리한 조건",
        "환차익 비과세 혜택", "다양한 통화 보유", "자유로운 입출금"
    ];

    /**
     * 💡 [추가 1] 최소 기간 옵션 목록 (6개월 ~ 72개월, 6개월 단위)
     */
    const minMonthOptions = useMemo(() => {
        const options = [];
        for (let period = 6; period <= 72; period += 6) {
            options.push(period);
        }
        return options;
    }, []); // 빈 배열이므로 컴포넌트 마운트 시 1번만 실행

    /**
     * 💡 [추가 2] 최대 기간 옵션 목록
     * formData.minMonths 값이 변경될 때만 이 목록을 다시 계산합니다.
     */
    const maxMonthOptions = useMemo(() => {
        const startPeriod = Number(formData.minMonths);

        // 최소 기간이 선택되지 않았으면 빈 배열 반환
        if (isNaN(startPeriod) || startPeriod < 6) {
            return [];
        }

        const options = [];
        // 선택된 최소 기간부터 72개월까지 6개월 단위로 옵션 추가
        for (let period = startPeriod; period <= 72; period += 6) {
            options.push(period);
        }
        return options;

    }, [formData.minMonths]); // formData.minMonths가 바뀔 때만 실행

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {activeType} 상품 등록
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <i className="ri-close-line text-2xl"></i>
                    </button>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* 기본 정보 */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">기본 정보</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    상품 코드 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={isDeposit ? "예: DEP-001" : "예: INST-001"}
                                    disabled
                                />
                                {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    상품명 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={isDeposit ? "예: 정기예금 12개월" : "예: 자유적금 12개월"}
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                상품 유형 <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">선택하세요</option>
                                {isDeposit ? (
                                    <>
                                        <option value="정기예금">정기예금</option>
                                        <option value="자유적립식예금">자유적립식예금</option>
                                        <option value="정기적금">정기예끔</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="정액적립식">정액적립식</option>
                                        <option value="자유적립식">자유적립식</option>
                                        <option value="정기적금">정기적금</option>
                                    </>
                                )}
                            </select>
                            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                상품 설명
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="상품에 대한 상세 설명을 입력하세요"
                            />
                        </div>
                    </div>

                    {/* 금액 정보 */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                            {isDeposit ? '예치 금액' : '월 납입액'}
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    최소 {isDeposit ? '금액' : '월 납입액'} (원) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name={"minAmount"}
                                    value={formData.minAmount}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="100000"
                                />
                                {errors.minAmount && <p className="text-red-500 text-sm mt-1">{errors.minAmount}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    최대 {isDeposit ? '금액' : '월 납입액'} (원) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name={"maxAmount"}
                                    value={formData.maxAmount}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="100000000"
                                />
                                {errors.maxAmount && <p className="text-red-500 text-sm mt-1">{errors.maxAmount}</p>}
                            </div>
                        </div>
                    </div>

                    {/* [수정된 JSX] 기간 정보 */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">계약 기간</h3>

                        <div className="grid grid-cols-2 gap-4">
                            {/* 1. 최소 기간 (Select) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    최소 기간 (개월) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="minMonths"
                                    value={formData.minMonths}
                                    onChange={handleChange} // ⬅️ 수정된 handleChange 사용
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">최소 기간 선택</option>
                                    {minMonthOptions.map(period => (
                                        <option key={period} value={period}>
                                            {period} 개월
                                        </option>
                                    ))}
                                </select>
                                {errors.minMonths && <p className="text-red-500 text-sm mt-1">{errors.minMonths}</p>}
                            </div>

                            {/* 2. 최대 기간 (Select) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    최대 기간 (개월) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="maxMonths"
                                    value={formData.maxMonths}
                                    onChange={handleChange}
                                    // 최소 기간이 설정되지 않았으면 비활성화
                                    disabled={!formData.minMonths}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                                >
                                    <option value="">
                                        {formData.minMonths ? '최대 기간 선택' : '최소 기간 먼저 선택'}
                                    </option>

                                    {/* useMemo로 생성된 옵션 목록을 렌더링 */}
                                    {maxMonthOptions.map(period => (
                                        <option key={period} value={period}>
                                            {period} 개월
                                        </option>
                                    ))}
                                </select>
                                {errors.maxMonths && <p className="text-red-500 text-sm mt-1">{errors.maxMonths}</p>}
                            </div>
                        </div>
                    </div>

                    {/* ... (금리 정보, 추가 정보 등) ... */}

                    {/* 금리 정보 */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">금리 정보</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    기본 금리 (%) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="rate"
                                    value={formData.rate}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="3.5"
                                />
                                {errors.rate && <p className="text-red-500 text-sm mt-1">{errors.rate}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    조기 금리 (%) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="ealryTerminationRate"
                                    value={formData.ealryTerminationRate}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="3.5"
                                />
                                {errors.ealryTerminationRate && <p className="text-red-500 text-sm mt-1">{errors.ealryTerminationRate}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                이자 지급 방식 <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="interestPaymentType"
                                value={formData.interestPaymentType}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">선택하세요</option>
                                <option value="만기일시지급">만기일시지급</option>
                                <option value="월지급">월지급</option>
                                <option value="분기지급">분기지급</option>
                            </select>
                            {errors.interestPaymentType && <p className="text-red-500 text-sm mt-1">{errors.interestPaymentType}</p>}
                        </div>
                    </div>

                    {/* 추가 정보 */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">추가 정보</h3>

                        {/* flex-wrap: 줄바꿈 허용
                          gap-x-4: 좌우 간격
                          gap-y-2: 상하 간격
                        */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 border border-gray-300 rounded-lg">
                            {featuresList.map((featureName) => (
                                <label key={featureName} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="feature"
                                        value={featureName}
                                        // formData.feature 배열에 이 항목이 포함되어 있는지 여부로 checked 상태 결정
                                        checked={formData.feature.includes(featureName)}
                                        onChange={handleFeatureChange} // ⬅️ 위에서 만든 전용 핸들러 사용
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{featureName}</span>
                                </label>
                            ))}
                        </div>

                        {/* (선택 사항) 현재 선택된 값을 확인하기 위한 디버그용 코드 */}
                        <div className="mt-2 text-xs text-gray-500">
                            선택된 값: {formData.feature.join(', ')}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div hidden>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    버튼 텍스트
                                </label>
                                <input
                                    type="text"
                                    name="buttonText"
                                    value={formData.buttonText}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="예금상품개설"
                                />
                            </div>
                            <div hidden>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    링크 URL
                                </label>
                                <input
                                    type="text"
                                    name="href"
                                    value={formData.href}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="/deposit/open"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                활성 상태
                            </label>
                            <div className="flex items-center space-x-6">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="isActive"
                                        value="Y"
                                        checked={formData.isActive === 'Y'}
                                        onChange={handleChange}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">판매중</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="isActive"
                                        value="N"
                                        checked={formData.isActive === 'N'}
                                        onChange={handleChange}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">판매중지</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 버튼 */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            disabled={loading}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
                            disabled={loading}
                        >
                            {loading ? '등록 중...' : '등록'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}