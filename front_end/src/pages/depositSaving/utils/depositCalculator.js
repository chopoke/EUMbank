/**
 * 만기 수익 계산
 */
export const calculateMaturityAmount = (amount, term, rateInfo) => {
    const principal = amount;
    const rateObject = rateInfo.find(r => r.term === `${term}개월`);
    const interestRate = rateObject ? parseFloat(rateObject.base) / 100 : 0;

    const interest = Math.floor(principal * interestRate * (term / 12));
    const tax = Math.floor(interest * 0.154);
    const afterTaxAmount = interest - tax;
    const total = principal + afterTaxAmount;

    return { interest, tax, afterTaxAmount, total };
};