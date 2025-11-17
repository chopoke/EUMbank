package com.boot.eumbank.asset.peer.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PeerProfileDto {

    @NotBlank
    @Pattern(regexp = "^[MF]$", message = "gender는 M/F만 허용")
    private String gender;     // "M"/"F"

    @NotNull
    @Min(20) @Max(50)
    private Integer ageBand;   // 20,30,40...

    @NotBlank
    @Pattern(regexp = "^I[1-6]$", message = "incomeCd는 I1~I6")
    private String incomeCd; // "I1" ~ "I6"

    @NotBlank
    @Pattern(regexp = "^J[1-5]$", message = "jobCd는 J1~J5")
    private String jobCd;   // "J1" ~ "J5"

    @NotBlank
    @Pattern(regexp = "^R[1-5]$", message = "regionCd는 R1~R5")
    private String regionCd;     // "R1" ~ "R5"

}
