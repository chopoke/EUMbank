package com.boot.eumbank.account.open.service;

import com.boot.eumbank.account.open.dto.CustomerDTO;
import java.util.Map;

public interface Custom {

    /**
     *  계좌 저장을 위해서 고객의 아이디 가져오기
     */
    public CustomerDTO getAccount(Map<String, Object> map);

}
