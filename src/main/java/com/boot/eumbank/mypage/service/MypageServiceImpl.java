package com.boot.eumbank.mypage.service;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.mypage.dto.MypageCustomerDTO;
import com.boot.eumbank.mypage.entity.MypageCustomer;
import com.boot.eumbank.mypage.repository.MypageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MypageServiceImpl {

    private final MypageRepository mypageRepository;
    private final CustomerRepo customerRepo;

    @Transactional(readOnly = true)
    public MypageCustomer mypageCustomer(int i) {
        System.out.println("test1");
        MypageCustomer myc = mypageRepository.findById(i)
                .orElseThrow(() -> new IllegalArgumentException("게시글 번호를 확인하세요!"));
        System.out.println(myc);
        return myc;
    }

    @Transactional
    public MypageCustomer updateMypage(MypageCustomer dto) {
        System.out.println(dto);
        return mypageRepository.save(dto);
    }

    // 프로필용: 로그인 사용자 + 성별 포함 DTO 응답
    @Transactional(readOnly = true)
    public MypageCustomerDTO me() {
        String userId = currentUserId();
        Customer c = customerRepo.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("고객 정보를 찾을 수 없습니다."));

        MypageCustomerDTO dto = new MypageCustomerDTO();
        dto.setCNo(c.getCustomerNo());
        dto.setNameKr(c.getCNameKr());
        dto.setEmail(c.getEmail());
        dto.setGenderCd(c.getCGenderCd()); // 'M' / 'F' / null
        return dto;
    }

    // 현재 로그인한 사용자의 userId(username) 얻기
    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            throw new IllegalStateException("로그인이 필요합니다.");

        Object p = auth.getPrincipal();
        if (p instanceof UserDetails ud) return ud.getUsername();
        if (p instanceof String s) return s;
        return auth.getName();
    }
}
