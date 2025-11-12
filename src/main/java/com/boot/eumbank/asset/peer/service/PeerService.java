package com.boot.eumbank.asset.peer.service;

import com.boot.eumbank.asset.peer.dto.PeerCompareResponse;
import com.boot.eumbank.asset.peer.dto.PeerProfileDto;

public interface PeerService {

    PeerProfileDto getMyProfile(int cNo);  // 없으면 null 반환
    PeerCompareResponse saveProfileAndCompare(int cNo, PeerProfileDto dto);

}
