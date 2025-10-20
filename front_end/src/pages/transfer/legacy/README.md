# Legacy 파일 보관소

## 📦 이 폴더의 목적

이 폴더는 React로 전환하기 이전에 사용하던 HTML 기반 파일들을 보관하는 공간입니다.

현재 프로젝트에서는 사용되지 않지만, 참고용으로 보관합니다.

---

## 📁 보관된 파일 목록

### HTML 파일 (4개)
1. **transfer.html**
   - 구 이체 메인 페이지
   - React로 전환: `TransferPage.js`

2. **transfer_confirm_modal.html**
   - 구 이체 확인 모달
   - React로 전환: TransferPage.js 내 `TransferConfirmModal` 컴포넌트

3. **transfer_confirm_page.html**
   - 구 이체 확인 페이지
   - React로 전환: TransferPage.js에 통합

4. **transfer_done이체완료.html**
   - 구 이체 완료 페이지
   - React로 전환: `TransferComplete.js`

### 컴포넌트 폴더
- **components/TransferConfirmModal.js**
  - 분리된 모달 컴포넌트
  - 현재 미사용 (각 페이지에 모달이 별도 구현됨)

---

## 🔄 전환 내역

### 변경 전 (HTML)
```
transfer.html → 정적 HTML
├── transfer_confirm_modal.html
├── transfer_confirm_page.html
└── transfer_done이체완료.html
```

### 변경 후 (React)
```
TransferPage.js → React 컴포넌트
├── TransferConfirmModal (내장)
├── 이체 확인 로직 (통합)
└── TransferComplete.js (완료 페이지)
```

---

## ⚠️ 주의사항

- 이 폴더의 파일들은 현재 프로젝트에서 **사용되지 않습니다**
- 삭제해도 프로젝트 동작에 영향 없음
- 참고용으로만 보관 중

---

## 🗑️ 삭제 가능 여부

**삭제 가능**: ✅  
**단, 참고용으로 보관 권장**

이전 HTML 기반 UI를 참고할 필요가 있을 경우를 대비하여 보관합니다.

---

작성일: 2025-10-10
