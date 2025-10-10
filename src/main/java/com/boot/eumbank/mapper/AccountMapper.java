package com.boot.eumbank.mapper;

import com.boot.eumbank.dto.CustomerDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AccountMapper {

    CustomerDTO getCustomerByACustomerId(@Param("nameFromId") String nameFromId, @Param("rrn6FromId") String rrn6FromId);

}
