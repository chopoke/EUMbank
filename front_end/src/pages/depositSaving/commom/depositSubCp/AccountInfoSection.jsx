import { formatDepositAccount } from '../../utils/formatUtils';
import {useEffect} from "react";

const AccountInfoSection = ({
    linkedAccount,
    setLinkedAccount,
    depositAccount,
    setDepositAccount,
    pin,
    setPin,
    userAccounts
}) => {
    // 입금 계좌 input용 핸들러
    const handleDepositAccountChange = (e) => {
        const formatted = formatDepositAccount(e.target.value);
        setDepositAccount(formatted);
    };

    // 출금 계좌 select용 핸들러
    const handleAccountChange = (e) => {
        const selectedOption = e.target.selectedOptions[0];
        const ano = selectedOption.dataset.ano;
        const accountNumber = e.target.value;

        const selectedAccount = {
            ano: ano,
            accountNumber: accountNumber,
        };

        console.log("selectedAccount:", selectedAccount);

        setLinkedAccount(selectedAccount);
    };

    // 난수 생성
    useEffect(() => {
        const part1 = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        const part2 = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
        const randomAccount = `220-${part1}-${part2}`;

        // state에 생성된 난수 저장
        setDepositAccount(randomAccount);

    }, []);

    return (
        <section className="info-section">
            <h3>계좌 정보</h3>
            <div className="subscription-form">
                <div className="form-group">
                    <label htmlFor="linkedAccount">출금 계좌 *</label>
                    <select
                        id="linkedAccount"
                        value={linkedAccount.accountNumber}
                        onChange={handleAccountChange}
                    >
                        <option value="">계좌를 선택하세요</option>
                        {userAccounts.map(account => (
                            <option key={account.ano} value={account.accountNumber} data-ano={account.ano}>
                                {account.ano}/{account.accountName} ({account.accountNo}) - 계좌 종류 : {account.accountType}
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
                        readOnly
                        placeholder="220-XXX-XXXXXX 입력해주세요."
                        autoComplete="off"
                        style={{ width: '100%' }}
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