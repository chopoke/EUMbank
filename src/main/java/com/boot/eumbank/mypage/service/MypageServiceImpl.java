package com.boot.eumbank.mypage.service;

import com.boot.eumbank.mypage.entity.MypageCustomer;
import com.boot.eumbank.mypage.repository.MypageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MypageServiceImpl {
    @Autowired
    private MypageRepository mypageRepository;

    @Transactional
    public MypageCustomer mypageCustomer(int i) {

        System.out.println("test1");
        MypageCustomer test = mypageRepository.findById(i).orElseThrow(() -> new IllegalArgumentException("게시글 번호를 확인하세요!"));
        System.out.println(test);
        return null;
    }
}
