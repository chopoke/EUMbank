/**
 * 숫자를 한국 원화 형식으로 포맷
 */
export const formatWon = (n) => n.toLocaleString('ko-KR');

/**
 * 예금 계좌번호 자동 포맷팅 (110-XXX-XXXXXX)
 */
export const formatDepositAccount = (value) => {
    // "110-"로 시작하지 않으면 자동으로 추가
    if (!value.startsWith('110-')) {
        value = '110-' + value.replace(/^110-?/, '');
    }
    
    // 숫자와 하이픈만 허용
    value = value.replace(/[^0-9-]/g, '');
    
    // "110-XXX-XXXXXX" 형식으로 자동 포맷팅
    const parts = value.split('-');
    if (parts.length > 0) {
        let formatted = '110';
        
        if (parts[1]) {
            formatted += '-' + parts[1].slice(0, 3);
            
            if (parts[2]) {
                formatted += '-' + parts[2].slice(0, 6);
            } else if (parts[1].length > 3) {
                formatted += '-' + parts[1].slice(3, 9);
            }
        }
        
        return formatted;
    }
    
    return value;
};

/**
 * 적금/예금 계좌번호 자동 포맷팅 (110-XXX-XXXXXX)
 */
export const formatAccountNumber = (value) => {
    // "110-"로 시작하지 않으면 자동으로 추가
    if (!value.startsWith('110-')) {
        value = '110-' + value.replace(/^110-?/, '');
    }
    
    // 숫자와 하이픈만 허용
    value = value.replace(/[^0-9-]/g, '');
    
    // "110-XXX-XXXXXX" 형식으로 자동 포맷팅
    const parts = value.split('-');
    if (parts.length > 0) {
        let formatted = '110';
        
        if (parts[1]) {
            formatted += '-' + parts[1].slice(0, 3);
            
            if (parts[2]) {
                formatted += '-' + parts[2].slice(0, 6);
            } else if (parts[1].length > 3) {
                formatted += '-' + parts[1].slice(3, 9);
            }
        }
        
        return formatted;
    }
    
    return value;
};