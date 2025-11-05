import {formatAccountNumber} from '../../utils/formatUtils';

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

    console.log("test", userAccounts);
    // 데이터 확인용
    console.log('userAccounts:', userAccounts);
    console.log('중복 체크:', userAccounts.map(acc => ({
        appId: acc.appId,
        accountNumber: acc.accountNumber,
        accountNo: acc.accountNo
    })));

    const handleAccountChange = (e) => {
        const formatted = formatAccountNumber(e.target.value);
        setSavingAccount(formatted);
    };

    const handleDateChange = (e) => {
        const selectedDay = e.target.value;
        setPaymentStartDate(selectedDay);
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
                            <option key={account.ano} value={account.accountNumber}>
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
                        placeholder="220-XXX-XXXXXX 형식으로 입력"
                        autoComplete="off"
                        maxLength="100"
                        style={{ width: '100%' }}
                    />
                </div>

                {/* 납입일 선택 */}
                <div className="form-group">
                    <label htmlFor="paymentStartDate">납입일 (매월 자동 출금일) *</label>
                    <select
                        id="paymentStartDate"
                        value={paymentStartDate}
                        onChange={handleDateChange}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '14px',
                            border: '1px solid #ddd',
                            borderRadius: '6px'
                        }}
                    >
                        <option value="">날짜를 선택하세요</option>
                        {Array.from({ length: 1 }, (_, i) => 25).map(day => {
                            return (
                                <option
                                    key={day}
                                    value={day}
                                >
                                    {day}일
                                </option>
                            );
                        })}
                    </select>
                    {paymentStartDate && (
                        <div style={{
                            marginTop: '10px',
                            padding: '12px',
                            background: '#e7f3ff',
                            borderRadius: '6px',
                            border: '1px solid #007bff'
                        }}>
                            <strong style={{ color: '#007bff', fontSize: '15px' }}>
                                📅 매월 <strong style={{ color: '#007bff' }}>{paymentStartDate}일</strong>에 자동 출금됩니다
                            </strong>
                        </div>
                    )}
                    <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                        * 이음은행 적금은 매월 25일이 기본 납입일입니다<br />
                        * 25일이 주말인 경우 그 전 평일(23일 또는 24일)을 선택할 수 있습니다
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
