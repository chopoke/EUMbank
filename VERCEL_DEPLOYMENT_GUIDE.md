# Vercel 무료 배포 가이드

이 가이드는 React 프론트엔드를 Vercel에 무료로 배포하는 방법을 설명합니다.

## 📋 목차
1. [Vercel 배포 가능 여부](#vercel-배포-가능-여부)
2. [사전 준비사항](#사전-준비사항)
3. [프로젝트 설정](#프로젝트-설정)
4. [Vercel 배포](#vercel-배포)
5. [환경 변수 설정](#환경-변수-설정)
6. [백엔드 연결](#백엔드-연결)
7. [자동 배포 설정](#자동-배포-설정)
8. [트러블슈팅](#트러블슈팅)

---

## Vercel 배포 가능 여부

### ✅ 배포 가능
- **React 프론트엔드**: Vercel에 완벽하게 배포 가능
- **정적 파일 서빙**: 최적화된 CDN 제공
- **무료 티어**: 충분한 용량 제공

### ❌ 배포 불가능
- **Spring Boot 백엔드**: Vercel은 Java 런타임을 지원하지 않음
  - 백엔드는 별도로 배포 필요 (AWS EC2, Railway, Render 등)

### 💡 권장 아키텍처
```
┌─────────────────┐         ┌─────────────────┐
│   Vercel        │  API    │   AWS EC2       │
│  (프론트엔드)    │ ──────> │  (백엔드)       │
│  React App      │         │  Spring Boot    │
└─────────────────┘         └─────────────────┘
```

---

## 사전 준비사항

### 1. Vercel 계정 생성
- [Vercel 공식 사이트](https://vercel.com/)에서 계정 생성
- GitHub, GitLab, Bitbucket 계정으로 로그인 가능

### 2. 필요한 도구
- Git
- Node.js 18 이상
- npm 또는 yarn

### 3. 백엔드 배포 완료
- Spring Boot 백엔드가 이미 배포되어 있어야 함
- API 엔드포인트 URL 확인 (예: `http://your-ec2-ip:8081`)

---

## 프로젝트 설정

### 1. 환경 변수 설정 파일 생성

프로젝트 루트에 `.env.production` 파일 생성:

```bash
# front_end/.env.production
REACT_APP_API_URL=http://your-ec2-ip:8081
# 또는 도메인 사용 시
# REACT_APP_API_URL=https://api.yourdomain.com
```

### 2. API 엔드포인트 하드코딩 제거

여러 파일에서 `localhost:8081`을 환경 변수로 변경해야 합니다.

**수정이 필요한 파일들:**
- `front_end/src/api/axios.js` ✅ (이미 환경 변수 지원)
- `front_end/src/pages/login/login.js`
- `front_end/src/pages/spot/components/PriceChart.js`
- `front_end/src/pages/mypage/getdata.js`
- `front_end/src/pages/admin/components/Sidebar.jsx`
- `front_end/src/common/header.js`
- `front_end/src/pages/main.js`

### 3. Vercel 설정 파일 생성

프로젝트 루트에 `vercel.json` 파일 생성 (이미 생성됨)

---

## Vercel 배포

### 방법 1: Vercel CLI 사용 (권장)

#### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

#### 2. 로그인
```bash
vercel login
```

#### 3. 프론트엔드 디렉토리로 이동
```bash
cd front_end
```

#### 4. 배포
```bash
vercel
```

처음 배포 시:
- 프로젝트 이름 설정
- 디렉토리: `front_end` 선택
- 빌드 명령어: `npm run build` (자동 감지)
- 출력 디렉토리: `build` (자동 감지)

#### 5. 프로덕션 배포
```bash
vercel --prod
```

### 방법 2: GitHub 연동 (자동 배포)

#### 1. GitHub에 프로젝트 푸시
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

#### 2. Vercel 대시보드에서 프로젝트 가져오기
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. **"Add New..."** → **"Project"** 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - **Framework Preset**: Create React App
   - **Root Directory**: `front_end`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. **"Deploy"** 클릭

---

## 환경 변수 설정

### Vercel 대시보드에서 설정

1. 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수 추가:

```
REACT_APP_API_URL = http://your-ec2-ip:8081
```

**주의**: 
- 프로덕션, 프리뷰, 개발 환경별로 설정 가능
- 환경 변수 변경 후 재배포 필요

### 환경별 설정 예시

```
Production:
  REACT_APP_API_URL = https://api.yourdomain.com

Preview:
  REACT_APP_API_URL = http://your-ec2-ip:8081

Development:
  REACT_APP_API_URL = http://localhost:8081
```

---

## 백엔드 연결

### 1. CORS 설정 확인

백엔드 `application-prod.yml`에서 CORS 설정:

```yaml
app:
  cors:
    allowed-origins:
      - https://your-vercel-app.vercel.app
      - https://yourdomain.com
```

### 2. API 프록시 설정 (선택사항)

Vercel의 `vercel.json`에서 API 프록시 설정 가능:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://your-ec2-ip:8081/api/:path*"
    }
  ]
}
```

이 경우 프론트엔드에서 `/api/...`로 호출하면 자동으로 백엔드로 프록시됩니다.

---

## 자동 배포 설정

### GitHub Actions (선택사항)

`.github/workflows/vercel-deploy.yml` 파일 생성:

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
    paths:
      - 'front_end/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./front_end
```

---

## 트러블슈팅

### 빌드 실패

**문제**: `npm run build` 실패

**해결**:
1. 로컬에서 빌드 테스트:
   ```bash
   cd front_end
   npm install
   npm run build
   ```

2. 의존성 문제 확인:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### 환경 변수 미적용

**문제**: 환경 변수가 적용되지 않음

**해결**:
1. 환경 변수 이름이 `REACT_APP_`로 시작하는지 확인
2. Vercel 대시보드에서 환경 변수 재설정
3. 재배포 실행

### API 연결 오류 (CORS)

**문제**: API 호출 시 CORS 오류

**해결**:
1. 백엔드 CORS 설정 확인
2. Vercel 도메인을 허용 목록에 추가
3. `vercel.json`에서 프록시 사용 고려

### 라우팅 오류 (404)

**문제**: 새로고침 시 404 오류

**해결**:
`vercel.json`에 다음 설정 추가:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Vercel 무료 티어 제한사항

### ✅ 제공 사항
- **대역폭**: 월 100GB
- **빌드 시간**: 월 6000분
- **함수 실행 시간**: 월 100GB-시간
- **도메인**: 커스텀 도메인 무제한
- **SSL 인증서**: 자동 발급

### ⚠️ 제한사항
- **함수 타임아웃**: 10초 (Hobby 플랜)
- **함수 메모리**: 1024MB
- **동시 실행**: 제한 없음

**대부분의 React 앱은 무료 티어로 충분합니다!**

---

## 추가 최적화

### 1. 커스텀 도메인 설정

1. Vercel 대시보드 → 프로젝트 → Settings → Domains
2. 도메인 추가
3. DNS 레코드 설정 (Vercel이 안내)

### 2. 성능 모니터링

Vercel Analytics (유료) 또는 Google Analytics 사용

### 3. 이미지 최적화

Vercel의 Image Optimization API 사용:

```jsx
import Image from 'next/image'; // Next.js 사용 시
// 또는 Vercel의 이미지 최적화 기능 활용
```

---

## 비용

### 무료 티어
- ✅ **완전 무료** (개인 프로젝트)
- ✅ 제한 내에서 무제한 사용

### 유료 플랜 (필요 시)
- Pro: $20/월
- Enterprise: 맞춤 가격

**대부분의 경우 무료 티어로 충분합니다!**

---

## 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Create React App 배포 가이드](https://create-react-app.dev/docs/deployment/#vercel)
- [Vercel 환경 변수 설정](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 주의사항

⚠️ **보안**
- API 키는 환경 변수로 관리
- 백엔드 URL을 하드코딩하지 않기

⚠️ **성능**
- 이미지 최적화 활용
- 코드 스플리팅 확인

⚠️ **백엔드**
- Spring Boot는 별도로 배포 필요
- EC2, Railway, Render 등 사용 가능

