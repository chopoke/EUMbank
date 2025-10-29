import { formatDepositAccount } from '../../utils/formatUtils';

const AccountInfoSection = ({ 
    linkedAccount, 
    setLinkedAccount, 
    depositAccount, 
    setDepositAccount, 
    pin, 
    setPin, 
    userAccounts 
}) => {
    const handleDepositAccountChange = (e) => {
        const formatted = formatDepositAccount(e.target.value);
        setDepositAccount(formatted);
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
                    <label htmlFor="depositAccount">입금 계좌 (예금계좌 번호) *</label>
                    <input
                        type="text"
                        id="depositAccount"
                        value={depositAccount}
                        onChange={handleDepositAccountChange}
                        placeholder="110-XXX-XXXXXX 형식으로 입력"
                        autoComplete="off"
                        maxLength="100"
                    />
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

export default AccountInfoSection;