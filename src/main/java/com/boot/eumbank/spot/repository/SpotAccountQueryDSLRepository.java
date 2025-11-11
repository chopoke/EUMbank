package com.boot.eumbank.spot.repository;

/**
 * 이 클래스는 현물 관련 Account 조회를 위한 QueryDSL 커스텀 리포지토리입니다.
 * 목적
 *  - 표준 JPA로 해결하기 어려운 동적 조건/집계 쿼리 수행
 * 사용
 *  - 서비스 레이어에서 현물 정산/잔고 로직에 활용됩니다.
 */

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.account.open.entity.account.QAccount;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class SpotAccountQueryDSLRepository {

	private final JPAQueryFactory queryFactory;

	public List<Account> getAccountsByCustomerNo(Integer customerNo) {
		QAccount a = QAccount.account;
		return queryFactory
				.selectFrom(a)
				.where(a.cNo.eq(customerNo))
				.orderBy(a.openedAt.desc())
				.fetch();
	}

	public Optional<Account> getActiveAccountByCustomerNo(Integer customerNo) {
		QAccount a = QAccount.account;
		Account result = queryFactory
				.selectFrom(a)
				.where(a.cNo.eq(customerNo)
						.and(a.status.eq("ACTIVE")))
				.orderBy(a.openedAt.desc())
				.fetchFirst();
		return Optional.ofNullable(result);
	}

	/**
	 * 고객의 활성 입출금 계좌 목록 조회
	 */
	public List<Account> getActiveDepositAccountsByCustomerNo(Integer customerNo) {
		QAccount a = QAccount.account;
		return queryFactory
				.selectFrom(a)
				.where(a.cNo.eq(customerNo)
						.and(a.status.eq("ACTIVE"))
						.and(a.accountType.eq("입출금")))
				.orderBy(a.openedAt.desc())
				.fetch();
	}

	/**
	 * 계좌 번호로 계좌 조회
	 */
	public Optional<Account> getAccountByAccountNo(Integer accountNo) {
		QAccount a = QAccount.account;
		Account result = queryFactory
				.selectFrom(a)
				.where(a.aNo.eq(accountNo)
						.and(a.status.eq("ACTIVE")))
				.fetchOne();
		return Optional.ofNullable(result);
	}

	public void updateAccountBalance(Integer accountNo, BigDecimal newBalance) {
		QAccount a = QAccount.account;
		queryFactory
				.update(a)
				.set(a.balance, newBalance)
				.set(a.updatedAt, LocalDateTime.now())
				.set(a.lastTxAt, LocalDateTime.now())
				.where(a.aNo.eq(accountNo))
				.execute();
	}

	public BigDecimal getAccountBalance(Integer accountNo) {
		QAccount a = QAccount.account;
		return queryFactory
				.select(a.balance)
				.from(a)
				.where(a.aNo.eq(accountNo))
				.fetchOne();
	}
}
