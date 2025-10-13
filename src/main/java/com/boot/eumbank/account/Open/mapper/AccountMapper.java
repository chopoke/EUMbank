package com.boot.eumbank.account.Open.mapper;

import com.boot.eumbank.account.Open.dto.CustomerDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AccountMapper {

    CustomerDTO getCustomerByACustomerId(@Param("nameFromId") String nameFromId, @Param("rrn6FromId") String rrn6FromId);

}
