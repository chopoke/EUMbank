package com.boot.eumbank.loan.admin.service;

import com.boot.eumbank.loan.admin.dto.LoanProductSearchDTO;
import com.boot.eumbank.loan.entity.LoanProduct;
import com.boot.eumbank.loan.entity.LoanRateOption;
import com.boot.eumbank.loan.repository.LoanProductRepository;
import com.boot.eumbank.loan.repository.LoanRateOptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * 관리자 - 대출 상품 관리 로직
 */
@Service
@RequiredArgsConstructor
public class ProductAdminServiceImpl implements ProductAdminService {

    private final LoanProductRepository loanProductRepository;
    private final LoanRateOptionRepository loanRateOptionRepository;

    // ========= 유틸 =========
    private boolean isEmpty(String s) { return s == null || s.isBlank(); }
    private boolean notBlank(String s) { return s != null && !s.isBlank(); }
    private String nullToEmpty(String s) { return s == null ? "" : s; }

    private boolean containsIgnoreCase(String src, String keyword) {
        return src != null && keyword != null &&
                src.toLowerCase().contains(keyword.toLowerCase());
    }

    /** L + 6자리 중복 없는 코드 생성 */
    private String genRandomCode() {
        for (int i = 0; i < 50; i++) {
            int n = ThreadLocalRandom.current().nextInt(0, 1_000_000);      // 0부터 999999
            String code = "L" + String.format("%06d", n);
            if (!loanProductRepository.existsByLoanCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("상품코드 자동 생성 실패");
    }

    /** 공통 기본값 세팅 */
    private void applyBaseDefaults(LoanProduct p, boolean isNew) {
        if (p.getIsActive() == null) p.setIsActive(true);
        if (p.getSourceType() == null) p.setSourceType("ADMIN");
        if (isEmpty(p.getBankName())) p.setBankName("EumBank");
        if (isEmpty(p.getFinCoNo())) p.setFinCoNo("0000001");

        // 새로운 옵션들 값 설정 (포맷)
        if (isNew) {
            LocalDate today = LocalDate.now();
            DateTimeFormatter ymd = DateTimeFormatter.ofPattern("yyyyMMdd");
            DateTimeFormatter ym = DateTimeFormatter.ofPattern("yyyyMM");

            if (isEmpty(p.getDclsMonth()))    p.setDclsMonth(today.format(ym));
            if (isEmpty(p.getDclsStartDay())) p.setDclsStartDay(today.format(ymd));
            if (isEmpty(p.getFinCoSubmDay())) p.setFinCoSubmDay(today.format(ymd));
            if (isEmpty(p.getDclsEndDay()))   p.setDclsEndDay(today.plusYears(2).format(ymd));

            // 기본으로 들어가있을 문구 설정
            if (isEmpty(p.getJoinWay()))
                p.setJoinWay("인터넷(이음은행 사이트)을 통해 신청 가능합니다.");
            if (isEmpty(p.getLoanLmtRaw()))
                p.setLoanLmtRaw("심사 결과에 따라 한도 및 금리가 결정되며, 최대 한도는 내부 기준에 따릅니다.");
            if (isEmpty(p.getErlyRpayFee()))
                p.setErlyRpayFee("중도상환 시 잔존기간 및 상환금액에 따라 일정 비율의 수수료가 부과될 수 있습니다.");
            if (isEmpty(p.getDlyRate()))
                p.setDlyRate("정상이자율 + 3%p 이내, 최고 연 15% 이내에서 적용됩니다.");
        }
    }

    // =====================목록
    @Override
    public Page<LoanProduct> searchProducts(LoanProductSearchDTO dto) {
        int page = (dto.getPage() == null || dto.getPage() < 0) ? 0 : dto.getPage();
        int size = (dto.getSize() == null || dto.getSize() < 1) ? 20 : dto.getSize();

        List<LoanProduct> all = loanProductRepository.findAll();

        List<LoanProduct> filtered = all.stream()
                .filter(p -> isEmpty(dto.getKeyword())
                        || containsIgnoreCase(p.getLoanCode(), dto.getKeyword())
                        || containsIgnoreCase(p.getLoanName(), dto.getKeyword()))
                .filter(p -> isEmpty(dto.getLoanType())
                        || dto.getLoanType().equalsIgnoreCase(nullToEmpty(p.getLoanType())))
                .filter(p -> dto.getActive() == null
                        || (p.getIsActive() != null && p.getIsActive().equals(dto.getActive())))
                .sorted((a, b) -> Long.compare(
                        b.getLoanNo() == null ? 0L : b.getLoanNo(),
                        a.getLoanNo() == null ? 0L : a.getLoanNo())
                )
                .collect(Collectors.toList());

        int from = page * size;
        int to = Math.min(from + size, filtered.size());
        List<LoanProduct> content = (from >= filtered.size())
                ? Collections.emptyList()
                : filtered.subList(from, to);

        return new PageImpl<>(content, PageRequest.of(page, size), filtered.size());
    }

    // =================== 신규 폼
    @Override
    public LoanProduct prepareNewProduct() {
        LoanProduct p = new LoanProduct();
        p.setIsActive(true);
        p.setSourceType("ADMIN");
        p.setBankName("EumBank");
        p.setFinCoNo("0000001");
        applyBaseDefaults(p, true);
        return p;
    }

    // ========================= 조회
    @Override
    public LoanProduct getProductOrThrow(Long id) {
        return loanProductRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("상품 없음: " + id));
    }

    @Override
    public List<LoanRateOption> getRateOptions(Long productId) {
        LoanProduct p = getProductOrThrow(productId);
        List<LoanRateOption> list = loanRateOptionRepository.findByProduct(p);
        list.sort(Comparator.comparing(LoanRateOption::getLroNo));
        return list;
    }

    // ================================= 생성
    @Override
    public LoanProduct createProduct(LoanProduct product,
                                     List<String> rpayTypes,
                                     List<String> lendTypes,
                                     List<BigDecimal> mins,
                                     List<BigDecimal> maxs,
                                     List<String> notes) {

        product.setLoanCode(null);      // 혹시나외부입력으로 들어왔을 때 무시하기
        applyBaseDefaults(product, true);

        String code = genRandomCode();
        product.setLoanCode(code);

        LoanProduct saved = loanProductRepository.save(product);

        saveRateOptionsFromRequest(saved, rpayTypes, lendTypes, mins, maxs, notes);
        recalcProductRateRange(saved);

        return saved;
    }

    // ================================ 수정
    @Override
    public LoanProduct updateProduct(Long id,
                                     LoanProduct form,
                                     List<String> rpayTypes,
                                     List<String> lendTypes,
                                     List<BigDecimal> mins,
                                     List<BigDecimal> maxs,
                                     List<String> notes) {

        LoanProduct p = getProductOrThrow(id);

        if (isEmpty(p.getLoanCode())) {
            p.setLoanCode(genRandomCode());
        }

        // 상품 필드 업데이트
        p.setLoanName(form.getLoanName());
        p.setLoanType(form.getLoanType());
        p.setLimitMax(form.getLimitMax());
        p.setLtvMax(form.getLtvMax());
        p.setIsActive(form.getIsActive());
        p.setSourceType(form.getSourceType());
        p.setSummary(form.getSummary());
        p.setBankName(notBlank(form.getBankName()) ? form.getBankName() : "EumBank");
        p.setFinCoNo(notBlank(form.getFinCoNo()) ? form.getFinCoNo() : "0000001");

        p.setJoinWay(form.getJoinWay());
        p.setLoanLmtRaw(form.getLoanLmtRaw());
        p.setErlyRpayFee(form.getErlyRpayFee());
        p.setDlyRate(form.getDlyRate());

        applyBaseDefaults(p, false);

        LoanProduct saved = loanProductRepository.save(p);

        saveRateOptionsFromRequest(saved, rpayTypes, lendTypes, mins, maxs, notes);
        recalcProductRateRange(saved);

        return saved;
    }

    // =========================== 삭제
    @Override
    public void deleteProduct(Long id) {
        loanProductRepository.deleteById(id);
    }

    // ======================== 옵션 저장
    private void saveRateOptionsFromRequest(
            LoanProduct product,
            List<String> rpayTypes,
            List<String> lendTypes,
            List<BigDecimal> mins,
            List<BigDecimal> maxs,
            List<String> notes
    ) {
        // 기존 옵션 싹 삭제 후 재생성: 단순 & 명확
        List<LoanRateOption> existing = loanRateOptionRepository.findByProduct(product);
        if (!existing.isEmpty()) {
            loanRateOptionRepository.deleteAll(existing);
        }

        boolean noInput =
                (rpayTypes == null || rpayTypes.isEmpty()) &&
                        (lendTypes == null || lendTypes.isEmpty()) &&
                        (mins == null || mins.isEmpty()) &&
                        (maxs == null || maxs.isEmpty()) &&
                        (notes == null || notes.isEmpty());

        if (noInput) {
            // 옵션이 하나도 없으면 그냥 종료 (상품 rateMin/Max는 recalc에서 null 처리)
            return;
        }

        String loanType = nullToEmpty(product.getLoanType());
        boolean isMortgage = "MORTGAGE".equalsIgnoreCase(loanType);

        int size = 0;
        if (rpayTypes != null) size = Math.max(size, rpayTypes.size());
        if (lendTypes != null) size = Math.max(size, lendTypes.size());
        if (mins != null) size = Math.max(size, mins.size());
        if (maxs != null) size = Math.max(size, maxs.size());
        if (notes != null) size = Math.max(size, notes.size());

        for (int i = 0; i < size; i++) {
            String rpay = (rpayTypes != null && i < rpayTypes.size()) ? rpayTypes.get(i) : null;
            String lend = (lendTypes != null && i < lendTypes.size()) ? lendTypes.get(i) : null;
            BigDecimal min = (mins != null && i < mins.size()) ? mins.get(i) : null;
            BigDecimal max = (maxs != null && i < maxs.size()) ? maxs.get(i) : null;
            String note = (notes != null && i < notes.size()) ? notes.get(i) : null;

            // 완전 빈 행은 스킵
            if (isEmpty(rpay) && isEmpty(lend) && min == null && max == null && isEmpty(note)) {
                continue;
            }

            // min/max 둘 다 있고 min > max면 여기서 검증하거나, 그냥 두거나 선택.
            // 필요하면 IllegalArgumentException 던지자.
            if (min != null && max != null && min.compareTo(max) > 0) {
                // 상황에 따라 swap하거나 예외 던질 수 있음. 일단 예외로 명확히:
                throw new IllegalArgumentException("옵션 최저금리가 최고금리보다 클 수 없습니다. (row " + (i+1) + ")");
            }

            // 평균금리 자동 계산
            BigDecimal avg = null;
            if (min != null && max != null) {
                avg = min.add(max)
                        .divide(new BigDecimal("2.00"), 2, RoundingMode.HALF_UP);
            }

            LoanRateOption opt = new LoanRateOption();
            opt.setProduct(product);
            opt.setRpayTypeNm(rpay);
            opt.setLendRateTypeNm(lend);
            opt.setLendRateMin(min);
            opt.setLendRateMax(max);
            opt.setLendRateAvg(avg);

            // 주택담보일 때만 note 저장
            if (isMortgage && notBlank(note)) {
                opt.setNote(note);
            } else {
                opt.setNote(null);
            }

            loanRateOptionRepository.save(opt);
        }
    }

    /** 옵션 기준으로 상품 최저/최고 금리 재계산 */
    private void recalcProductRateRange(LoanProduct product) {
        List<LoanRateOption> opts = loanRateOptionRepository.findByProduct(product);

        BigDecimal minAll = opts.stream()
                .map(LoanRateOption::getLendRateMin)
                .filter(Objects::nonNull)
                .min(BigDecimal::compareTo)
                .orElse(null);

        BigDecimal maxAll = opts.stream()
                .map(LoanRateOption::getLendRateMax)
                .filter(Objects::nonNull)
                .max(BigDecimal::compareTo)
                .orElse(null);

        product.setRateMin(minAll);
        product.setRateMax(maxAll);
        loanProductRepository.save(product);
    }
}
