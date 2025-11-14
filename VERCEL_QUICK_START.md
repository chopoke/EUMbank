# Vercel 빠른 시작 가이드

## 🚀 5분 안에 배포하기

### 1. Vercel CLI 설치 및 로그인
```bash
npm install -g vercel
vercel login
```

### 2. 프론트엔드 디렉토리로 이동
```bash
cd front_end
```

### 3. 배포
```bash
vercel
```

처음 배포 시 질문에 답변:
- **Set up and deploy?** → Yes
- **Which scope?** → 본인 계정 선택
- **Link to existing project?** → No
- **Project name?** → eumbank-frontend (원하는 이름)
- **Directory?** → `./` (현재 디렉토리)
- **Override settings?** → No

### 4. 환경 변수 설정
```bash
vercel env add REACT_APP_API_URL
```
- **Environment:** Production
- **Value:** `http://your-ec2-ip:8081` (백엔드 URL)

### 5. 프로덕션 배포
```bash
vercel --prod
```

### 6. 완료! 🎉
배포된 URL이 표시됩니다: `https://eumbank-frontend.vercel.app`

---

## GitHub 연동 (자동 배포)

### 1. GitHub에 푸시
```bash
git add .
git commit -m "Add Vercel deployment config"
git push origin main
```

### 2. Vercel 대시보드에서
1. [vercel.com/dashboard](https://vercel.com/dashboard) 접속
2. **Add New Project** 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - **Root Directory:** `front_end`
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
5. **Environment Variables** 추가:
   - `REACT_APP_API_URL` = `http://your-ec2-ip:8081`
6. **Deploy** 클릭

이제 `main` 브랜치에 푸시할 때마다 자동으로 배포됩니다!

---

## 중요 사항

⚠️ **백엔드는 별도 배포 필요**
- Spring Boot는 Vercel에 배포 불가능
- AWS EC2, Railway, Render 등에 배포 필요

⚠️ **CORS 설정**
- 백엔드에서 Vercel 도메인 허용 필요
- `application-prod.yml`의 CORS 설정 확인

---

## 문제 해결

### 빌드 실패
```bash
cd front_end
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 환경 변수 미적용
- Vercel 대시보드에서 환경 변수 재설정
- 재배포 실행

