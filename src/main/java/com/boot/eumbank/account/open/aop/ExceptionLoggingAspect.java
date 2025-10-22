package com.boot.eumbank.account.open.aop;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
public class ExceptionLoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(ExceptionLoggingAspect.class);

    // com.boot.eumbank 패키지 하위의 모든 public 메소드를 대상으로 함
    @Pointcut("within(com.boot.eumbank.account..*)")
    public void applicationPackagePointcut() {
        // Method is empty as this is just a Pointcut, the implementations are in the advices.
    }

    /**
     * 대상 메소드에서 예외가 발생했을 때 실행됩니다.
     * @param joinPoint 프록시된 메소드에 대한 정보
     * @param ex 발생한 예외
     */
    @AfterThrowing(pointcut = "applicationPackagePointcut()", throwing = "ex")
    public void logAfterThrowing(JoinPoint joinPoint, Throwable ex) {
        log.error("==================== EXCEPTION CAUGHT ====================");
        log.error("에러 발생 위치: {}", joinPoint.getSignature().toShortString());
        log.error("메소드 인자: {}", Arrays.toString(joinPoint.getArgs()));
        log.error("에러 종류: {}", ex.getClass().getName());
        log.error("에러 메시지: {}", ex.getMessage());
        log.error("Stack Trace:", ex); // 스택 트레이스를 함께 출력하여 원인 파악 용이
        log.error("==========================================================");
    }
}