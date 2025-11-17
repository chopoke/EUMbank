package com.boot.eumbank.loan.dto.apply;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor @AllArgsConstructor
public class LoanSignCustDTO {
    private Integer customerNo;
    private String name;
    private String rrn;          // 주민등록번호
    private String phoneMobile;  //핸폰번호
    private String address;         // 주소
}
