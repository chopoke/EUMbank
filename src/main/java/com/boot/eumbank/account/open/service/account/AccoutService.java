package com.boot.eumbank.account.open.service.account;

import com.boot.eumbank.account.open.dto.account.CustomerDTO;

import java.util.Map;

public interface AccoutService {

    public void registerAccount(CustomerDTO customer, Map<String, Object> body);

    public boolean checkPinExists();

    public Map<String, Object> verifyPin(String submittedPin);

}
