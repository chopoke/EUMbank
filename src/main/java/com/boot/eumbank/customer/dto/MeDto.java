package com.boot.eumbank.customer.dto;

import java.util.List;

public record MeDto(Integer customerNo, String c_user_id, List<String> roles) {
}
