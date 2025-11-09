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
    private final QAccount payoutAcc = new QAccount("payoutAcc");
    private final QAccount repayAcc = new QAccount("repayAcc");

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

        var row = queryFactory
                .select(
                        loanApplication,
                        loanProduct.loanName,
                        payoutAcc.accountNo,
                        repayAcc.accountNo
                )
                .from(loanApplication)
                .leftJoin(loanProduct).on(loanProduct.loanNo.eq(loanApplication.loanProductNo))
                .leftJoin(payoutAcc).on(payoutAcc.aNo.eq(loanApplication.payoutAccountNo))
                .leftJoin(repayAcc).on(repayAcc.aNo.eq(loanApplication.repayAccountNo))
                .where(loanApplication.laId.eq(laId))
                .fetchOne();

        if (row == null) {
            return Optional.empty();
        }

        var app = row.get(loanApplication);
        var productName = row.get(loanProduct.loanName);
        var payoutAccountNumber = row.get(payoutAcc.accountNo);
        var repayAccountNumber = row.get(repayAcc.accountNo);

        // 채우기 summary
        var summary = LoanApplySummaryDTO.builder()
                .laNo(app.getLaNo())
                .laId(app.getLaId())
                .cNo(app.getCustomerNo())
                .lpdNo(app.getLoanProductNo())
                .productName(productName)
                .applyStatus(app.getStatus())
                .applyAmount(app.getAppliedAmount())
                .desiredTerm(app.getDesiredTerm())
                .purposeCode(app.getPurposeCode())
                .channel(app.getChannel())
                .submitDate(app.getSubmittedAt())
                .payoutAccountNo(app.getPayoutAccountNo())
                .repayAccountNo(app.getRepayAccountNo())
                .build();

        var dto = LoanApplyDetailDTO.builder()
                .summary(summary)
                .applicationForm(app.getContextJson())
                .attachedDocs(null)
                .reviewedAt(app.getDecidedAt())
                .rejectReason(app.getDecisionReason())
                .approvedAmount(app.getApprovedAmount())
                .approvedTerm(app.getApprovedTerm())
                .approvedRate(app.getApprovedRate())
                .payoutAccountNumber(payoutAccountNumber)
                .repayAccountNumber(repayAccountNumber)
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
