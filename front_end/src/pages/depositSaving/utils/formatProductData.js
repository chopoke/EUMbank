/**
 * 원본 상품 데이터를 화면에 표시하기 좋은 형태로 가공
 */
export const formatProductData = (productList) => {
    if (!productList) return null;

    const parseAmount = (amountStr) => {
        if (!amountStr) return null;
        const match = amountStr.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
    };

    const minAmount = parseAmount(productList.minAmount) || 1000000;
    const maxAmount = parseAmount(productList.maxAmount) || 100000000;
    const minMonths = productList.minMonths || 6;
    const maxMonths = productList.maxMonths || 36;

    // ✅ 동적으로 6개월 간격으로 옵션 생성
    const generateTermOptions = () => {
        const options = [];
        const interval = 6; // 6개월 간격
        
        for (let months = minMonths; months <= maxMonths; months += interval) {
            options.push(months);
        }
        
        return options;
    };

    const termOptions = generateTermOptions();

    // ✅ 동적으로 금리 정보 생성
    const generateRateInfo = () => {
        const baseRate = parseFloat(productList.rate);
        const rateInfo = [];
        
        for (let months = minMonths; months <= maxMonths; months += 6) {
            // 기준 금리에서 기간에 따라 차등 적용
            // 12개월 기준으로 ±0.1%p씩 조정
            const rateAdjustment = ((months - 12) / 12) * 0.2;
            const adjustedRate = (baseRate + rateAdjustment).toFixed(2);
            
            rateInfo.push({
                term: `${months}개월`,
                base: adjustedRate + '%',
                max: adjustedRate + '%'
            });
        }
        
        return rateInfo;
    };

    return {
        name: productList.name || "상품명 정보 없음",
        description: productList.description || "상품 설명 정보 없음",
        tags: [productList.category] || ["예금"],
        baseRate: productList.rate || "0.0%",
        minAmount: minAmount,
        maxAmount: maxAmount,
        minMonths: minMonths,
        maxMonths: maxMonths,
        termOptions: termOptions,
        summary: {
            code: productList.id || "N/A",
            limit: `${minAmount.toLocaleString()}원 ~ ${maxAmount.toLocaleString()}원`,
            taxRate: "15.4%",
            type: productList.paymentType || "정기예금"
        },
        rateInfo: generateRateInfo(),
        faqs: [
            { q: "중도해지 시 금리는 어떻게 적용되나요?", a: "가입 상품의 약관을 확인해주세요." },
            { q: "비대면으로도 가입 가능한가요?", a: "네, 모바일 앱을 통해 가입 가능합니다." },
        ]
    };
};