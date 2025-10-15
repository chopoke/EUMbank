package com.boot.eumbank.account.Open.mapper;

import com.boot.eumbank.account.Open.dto.AccountDTO;
import com.boot.eumbank.account.Open.dto.CustomerDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AccountMapper {

    CustomerDTO getCustomerByACustomerId(@Param("nameFromId") String nameFromId, @Param("rrn6FromId") String rrn6FromId);

    // 외화계좌 개설용
    int insertAccount(AccountDTO dto);
    boolean existsByAccountId(@Param("aId") String aId);
    boolean existsByAccountNo(@Param("accountNo") String accountNo);
}
