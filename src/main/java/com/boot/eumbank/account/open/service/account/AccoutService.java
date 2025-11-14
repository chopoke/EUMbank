package com.boot.eumbank.account.open.service.account;

import com.boot.eumbank.account.open.dto.account.CustomerDTO;
import com.boot.eumbank.account.open.enums.PasswordChangeResult;
import com.boot.eumbank.account.open.enums.PinChangeResult;

import java.util.Map;

public interface AccoutService {

    public void registerAccount(CustomerDTO customer, Map<String, Object> body);

    public boolean checkPinExists();

    public Map<String, Object> verifyPin(String submittedPin);

    /**
     * PIN 번호 변경
     */
    PinChangeResult changePinNumber(String pin);

    /**
     * 비밀번호 변경
     */
    PasswordChangeResult changePassword(String currentPassword, String newPassword);
}
