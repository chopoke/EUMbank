package com.boot.eumbank.asset.peer.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class PeerRepository {

    private JPAQueryFactory queryFactory;
}
