package com.boot.eumbank.loan.admin.repository;

import com.boot.eumbank.account.open.entity.account.QAccount;
import com.boot.eumbank.loan.admin.dto.LoanApplyDetailDTO;
import com.boot.eumbank.loan.admin.dto.LoanApplySearchDTO;
import com.boot.eumbank.loan.admin.dto.LoanApplySummaryDTO;
import com.boot.eumbank.loan.entity.LoanApplication;
import com.boot.eumbank.loan.entity.QLoanApplication;
import com.boot.eumbank.loan.entity.QLoanProduct;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;

@Slf4j @RequiredArgsConstructor
public class LoanAdminRepositoryImpl implements LoanAdminRepositoryCustom{

    private final EntityManager em;
    private final JPAQueryFactory queryFactory;

    private final QLoanApplication loanApplication = QLoanApplication.loanApplication;
    private final QLoanProduct loanProduct = QLoanProduct.loanProduct;
    private final QAccount account= QAccount.account;

    @Override
    public Page<LoanApplySummaryDTO> search(LoanApplySearchDTO search) {
        int page = search.getPage() == null || search.getPage() < 0 ? 0 : search.getPage();
        int size = search.getSize() == null || search.getSize() < 1 ? 20 : search.getSize();

        var base = queryFactory.select(
                        // Projections.constructor : 엔티티 전체가 아니라, 조회 대상을 지정해 원하는 필드만 가져오기
                        Projections.constructor(LoanApplySummaryDTO.class,
                                        loanApplication.laNo.as("laNo"),
                                        loanApplication.laId.as("laId"),
                                        loanApplication.customerNo.as("cNo"),
                                        loanApplication.loanProductNo.as("lpdNo"),
                                        loanProduct.loanName.as("loanName"),
                                        loanApplication.status.as("applyStatus"),
                                        loanApplication.appliedAmount.as("applyAmount"),
                                        loanApplication.desiredTerm.as("desiredTerm"),
                                        loanApplication.purposeCode.as("purposeCode"),
                                        loanApplication.channel.as("channel"),
                                        loanApplication.submittedAt.as("submitDate"),
                                        // 표시용
                                        loanApplication.payoutAccountNo.as("payoutAccountNo"),
                                        loanApplication.repayAccountNo.as("repayAccountNo")
                        )
                )
                .from(loanApplication)
                .leftJoin(loanProduct).on(loanProduct.loanNo.eq(loanApplication.loanProductNo))
//                .leftJoin(account).on(account.accountNo.eq((Integer) loanApplication.payoutAccountNo))
                .where(
                        // 동적 조건
                        keywordSearch(search.getKeyword()),
                        statusSearch(search.getStatus()),
                        lpdSearch(search.getLpdNo()),
                        customerNoSearch(search.getCNo()),
                        betweenSubmit(search.getFrom(), search.getTo()),
                        channelSearch(search.getChannel())
                );

        // 정렬
        var sorted = switch (String.valueOf(search.getSort())){
            case "amountDesc" -> base.orderBy(loanApplication.appliedAmount.desc());        // 금액높은순
            case "amountAsc" -> base.orderBy(loanApplication.appliedAmount.asc());          // 금액 낮은순
            default ->  base.orderBy(loanApplication.submittedAt.desc());                   // 최신순
        };

        var content = sorted
                .offset((long) page * size)
                .limit(size)
                .fetch();

        Long total = queryFactory.select(loanApplication.count())
                .from(loanApplication)
                .where(
                        keywordSearch(search.getKeyword()),
                        statusSearch(search.getStatus()),
                        lpdSearch(search.getLpdNo()),
                        customerNoSearch(search.getCNo()),
                        betweenSubmit(search.getFrom(), search.getTo()),
                        channelSearch(search.getChannel())
                )
                .fetchOne();

        return new PageImpl<>(content, PageRequest.of(page, size), total ==  null ? 0 : total);
    }

    @Override
    public Optional<LoanApplyDetailDTO> getDetail(String laId) {

        var result = queryFactory.selectFrom(loanApplication)
                .where(loanApplication.laId.eq(laId))
                .fetchOne();
        if(result == null) return Optional.empty();

        // productName구하기
        var productName = queryFactory.select(loanProduct.loanName)
                .from(loanProduct)
                .where(loanProduct.loanNo.eq(result.getLoanProductNo()))
                .fetchOne();

        var summary = LoanApplySummaryDTO.builder()
                .laNo(result.getLaNo())
                .laId(result.getLaId())
                .cNo(result.getCustomerNo())
                .lpdNo(result.getLoanProductNo())
                .productName(productName)
                .applyStatus(result.getStatus())
                .applyAmount(result.getAppliedAmount())
                .desiredTerm(result.getDesiredTerm())
                .purposeCode(result.getPurposeCode())
                .channel(result.getChannel())
                .submitDate(result.getSubmittedAt())
                .payoutAccountNo(result.getPayoutAccountNo())
                .repayAccountNo(result.getRepayAccountNo())
                .build();

        var dto = LoanApplyDetailDTO.builder()
                .summary(summary)
                .applicationForm(result.getContextJson())       // json문자열은 프론트에서 파싱
                .attachedDocs(null)
                .reviewedAt(result.getDecidedAt())
                .rejectReason(result.getDecisionReason())
                .approvedAmount(result.getApprovedAmount())
                .approvedTerm(result.getApprovedTerm())
                .approvedRate(result.getApprovedRate())
                .build();

        return Optional.of(dto);
    }

    @Override
    public Optional<LoanApplication> findEntityByLaId(String laId, LockModeType lock) {
        // laId가 PK가 아니면 Query로 조회하고 Lock 적용
        var result = queryFactory.selectFrom(loanApplication)
                .where(loanApplication.laId.eq(laId))
                .fetchOne();

        if(result == null) return Optional.empty();
        em.lock(result, lock);
        return Optional.of(result);
    }


    // 동적 검색 헬퍼유틸====================
    // BooleanExpression : null 발생시 바로 제외

    // 키워드 검색
    private BooleanExpression keywordSearch(String keyword){
        if(keyword == null || keyword.isBlank()) return null;       // 입력 키워드 없으면 제외
        return loanApplication.laId.containsIgnoreCase(keyword)
                .or(loanApplication.payoutAccountNo.stringValue().containsIgnoreCase(keyword))
                .or(loanApplication.repayAccountNo.stringValue().containsIgnoreCase(keyword));
    }
    // 상태검색
    public  BooleanExpression statusSearch(String status){
        if (status == null || status.isBlank()) return null;
        var list = Arrays.stream(status.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        return list.size() == 1 ? loanApplication.status.eq(list.get(0))
                : loanApplication.status.in(list);
    }
    // 상품명 핑터
    public BooleanExpression lpdSearch(Long lpdNo){
        return lpdNo == null ? null : loanApplication.loanProductNo.eq(lpdNo);
    }
    public BooleanExpression customerNoSearch(Integer customerNo){
        return customerNo == null ? null : loanApplication.customerNo.eq(customerNo);
    }
    // 승인날짜 검색
    private BooleanExpression betweenSubmit(LocalDateTime from, LocalDateTime to) {
        if (from == null && to == null) return null;
        if (from != null && to != null) return loanApplication.submittedAt.between(from, to);
        if (from != null) return loanApplication.submittedAt.goe(from);
        return loanApplication.submittedAt.loe(to);
    }
    // 가입루트 서치
    private BooleanExpression channelSearch(String channel){
        return (channel == null || channel.isBlank()) ? null : loanApplication.channel.eq(channel);
    }
}
