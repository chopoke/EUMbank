// src/main/java/com/boot/eumbank/bill/dto/PayReq.java
package com.boot.eumbank.bill.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public record PayReq(@JsonAlias({"aNo","a_no","ano","accountNo","account_no"}) Integer aNo) {}
