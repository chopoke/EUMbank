package com.boot.eumbank.asset.peer.dto;

import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PeerProfileDto {

    private String gender;     // "M"/"F"
    private Integer ageBand;   // 20,30,40...
    private String incomeBand; // "I1" ~ "I6"
    private String jobGroup;   // "J1" ~ "J8"
    private String region;     // ex) "서울"

}
