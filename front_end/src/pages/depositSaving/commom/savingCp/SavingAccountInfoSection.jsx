import { formatAccountNumber } from '../../utils/formatUtils';
import { 
    getTodayString, 
    getDayFromDateString, 
    formatDateKorean, 
    isWeekend, 
    getDayOfWeekName 
} from '../../utils/dateUtils';

const SavingAccountInfoSection = ({ 
    linkedAccount, 
    setLinkedAccount, 
    savingAccount, 
    setSavingAccount, 
    pin, 
    setPin, 
    userAccounts,
    paymentStartDate,
    setPaymentStartDate
}) => {
    const handleAccountChange = (e) => {
        const formatted = formatAccountNumber(e.target.value);
        setSavingAccount(formatted);
    };

    const handleDateChange = (e) => {
        const selectedDateStr = e.target.value;
        const today = getTodayString();
        
        // 오늘 이후인지 확인
        if (selectedDateStr < today) {
            alert('오늘 이후 날짜만 선택 가능합니다.');
            e.target.value = '';
            setPaymentStartDate('');
            return;
        }
        
        // 주말 체크
        if (isWeekend(selectedDateStr)) {
            alert('주말(토요일, 일요일)은 선택할 수 없습니다. 평일을 선택해주세요.');
            e.target.value = '';
            setPaymentStartDate('');
            return;
        }
        
        // 1~28일만 허용
        if (selectedDateStr >= today) {
            setPaymentStartDate(selectedDateStr);
        } else {
            alert('매월 1일부터 28일 사이의 날짜만 선택 가능합니다.');
            e.target.value = '';
            setPaymentStartDate('');
        }
    };

    return (
        <section className="info-section">
            <h3>계좌 정보</h3>
            <div className="subscription-form">
                <div className="form-group">
                    <label htmlFor="linkedAccount">출금 계좌 *</label>
                    <select 
                        id="linkedAccount" 
                        value={linkedAccount} 
                        onChange={(e) => setLinkedAccount(e.target.value)}
                    >
                        <option value="">계좌를 선택하세요</option>
                        {userAccounts.map(account => (
                            <option key={account.appId} value={account.accountNumber}>
                                {account.accountName} ({account.accountNo}) - 계좌 종류 : {account.accountType}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="savingAccount">입금 계좌 (적금계좌 번호) *</label>
                    <input
                        type="text"
                        id="savingAccount"
                        value={savingAccount}
                        onChange={handleAccountChange}
                        placeholder="110-XXX-XXXXXX 형식으로 입력"
                        autoComplete="off"
                        maxLength="100"
                    />
                </div>

                {/* 첫 납입일 선택 */}
                <div className="form-group">
                    <label htmlFor="paymentStartDate">첫 납입일 *</label>
                    <input
                        type="date"
                        id="paymentStartDate"
                        value={paymentStartDate}
                        onChange={handleDateChange}
                        min={getTodayString()}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '14px',
                            border: '1px solid #ddd',
                            borderRadius: '6px'
                        }}
                    />
                    {paymentStartDate && (
                        <div style={{ 
                            marginTop: '10px', 
                            padding: '12px', 
                            background: '#e7f3ff', 
                            borderRadius: '6px',
                            border: '1px solid #007bff'
                        }}>
                            <strong style={{ color: '#007bff', fontSize: '15px' }}>
                                📅 {formatDateKorean(paymentStartDate)} ({getDayOfWeekName(paymentStartDate)})
                            </strong>
                            <br />
                            매월 <strong style={{ color: '#007bff' }}>{getDayFromDateString(paymentStartDate)}일</strong>에 자동 출금됩니다
                        </div>
                    )}
                    <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                        * 평일(월~금)만 선택 가능하며, 29~31일은 선택할 수 없습니다
                    </small>
                </div>

                <div className="form-group">
                    <label htmlFor="pin">계좌 비밀번호 *</label>
                    <input
                        type="password"
                        id="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        maxLength="6"
                        placeholder="숫자 6자리"
                        autoComplete="off"
                    />
                </div>
            </div>
        </section>
    );
};

export default SavingAccountInfoSection;