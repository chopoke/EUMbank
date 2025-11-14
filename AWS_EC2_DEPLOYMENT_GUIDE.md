# AWS EC2 무료 배포 가이드

이 가이드는 Spring Boot 애플리케이션을 AWS EC2 무료 티어로 배포하는 방법을 설명합니다.

## 📋 목차
1. [사전 준비사항](#사전-준비사항)
2. [EC2 인스턴스 생성](#ec2-인스턴스-생성)
3. [EC2 서버 설정](#ec2-서버-설정)
4. [데이터베이스 설정](#데이터베이스-설정)
5. [애플리케이션 배포](#애플리케이션-배포)
6. [프론트엔드 빌드 및 배포](#프론트엔드-빌드-및-배포)
7. [자동 배포 설정](#자동-배포-설정)
8. [보안 그룹 설정](#보안-그룹-설정)
9. [비용 최적화 팁](#비용-최적화-팁)

---

## 사전 준비사항

### 1. AWS 계정 생성
- AWS 계정이 없다면 [AWS 공식 사이트](https://aws.amazon.com/)에서 계정 생성
- 신용카드 등록 필요 (무료 티어 사용 시에도 필요)

### 2. 필요한 도구
- Git
- SSH 클라이언트 (Windows: PuTTY, WSL 또는 Git Bash)
- 로컬 개발 환경 (Java 17, Gradle)

---

## EC2 인스턴스 생성

### 1. EC2 대시보드 접속
1. AWS 콘솔에 로그인
2. 서비스 검색에서 "EC2" 입력
3. EC2 대시보드로 이동

### 2. 인스턴스 시작
1. **"인스턴스 시작"** 버튼 클릭

2. **이름 및 태그**
   - 인스턴스 이름: `eumbank-server` (원하는 이름)

3. **애플리케이션 및 OS 이미지(Amazon Machine Image)**
   - **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type** 선택
   - 무료 티어 사용 가능 표시 확인

4. **인스턴스 유형**
   - **t2.micro** 선택 (무료 티어)
   - vCPU: 1, 메모리: 1GB

5. **키 페어(로그인)**
   - 새 키 페어 생성 또는 기존 키 페어 선택
   - 키 페어 이름: `eumbank-key`
   - 키 페어 유형: RSA
   - 프라이빗 키 파일 형식: `.pem` (OpenSSH)
   - **"키 페어 생성"** 클릭
   - **⚠️ 중요**: `.pem` 파일을 안전한 곳에 저장 (다시 다운로드 불가능)

6. **네트워크 설정**
   - VPC: 기본 VPC 선택
   - 서브넷: 기본 서브넷 선택
   - 퍼블릭 IP 자동 할당: 활성화
   - 보안 그룹: 새 보안 그룹 생성
     - 보안 그룹 이름: `eumbank-sg`
     - 설명: `EUMbank application security group`
     - 인바운드 규칙:
       - SSH (22): 내 IP
       - HTTP (80): 모든 IPv4 트래픽 (0.0.0.0/0)
       - HTTPS (443): 모든 IPv4 트래픽 (0.0.0.0/0)
       - 커스텀 TCP (8081): 모든 IPv4 트래픽 (0.0.0.0/0) - 개발용

7. **스토리지 구성**
   - 볼륨 크기: 8GB (무료 티어 범위 내)
   - 볼륨 유형: gp3 (범용 SSD)

8. **고급 세부 정보**
   - 사용자 데이터 (선택사항): 아래 스크립트 사용 가능
   ```bash
   #!/bin/bash
   apt-get update
   apt-get install -y openjdk-17-jdk
   ```

9. **인스턴스 시작** 클릭

### 3. Elastic IP 할당 (선택사항, 권장)
- EC2 인스턴스 재시작 시 퍼블릭 IP가 변경될 수 있음
- 고정 IP가 필요하면 Elastic IP 할당 후 인스턴스에 연결

---

## EC2 서버 설정

### 1. SSH 접속
```bash
# Windows (Git Bash 또는 WSL)
ssh -i "eumbank-key.pem" ubuntu@<EC2-퍼블릭-IP>

# 예시
ssh -i "eumbank-key.pem" ubuntu@3.34.123.45
```

**Windows PuTTY 사용 시:**
1. PuTTYgen으로 `.pem` 파일을 `.ppk`로 변환
2. PuTTY에서 변환된 `.ppk` 파일 사용

### 2. 시스템 업데이트 및 필수 패키지 설치
```bash
# 시스템 업데이트
sudo apt-get update
sudo apt-get upgrade -y

# Java 17 설치
sudo apt-get install -y openjdk-17-jdk

# Java 버전 확인
java -version

# Git 설치
sudo apt-get install -y git

# MariaDB 설치
sudo apt-get install -y mariadb-server mariadb-client

# MariaDB 시작 및 자동 시작 설정
sudo systemctl start mariadb
sudo systemctl enable mariadb

# MariaDB 보안 설정
sudo mysql_secure_installation
# - root 비밀번호 설정
# - 익명 사용자 제거: Y
# - 원격 root 로그인 비활성화: Y
# - test 데이터베이스 제거: Y
# - 권한 테이블 다시 로드: Y

# Nginx 설치 (리버스 프록시 및 정적 파일 서빙)
sudo apt-get install -y nginx

# Nginx 시작 및 자동 시작 설정
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3. 방화벽 설정
```bash
# UFW 방화벽 활성화
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 8081
sudo ufw enable
sudo ufw status
```

---

## 데이터베이스 설정

### 1. MariaDB 데이터베이스 및 사용자 생성
```bash
# MariaDB 접속
sudo mysql -u root -p

# MariaDB 내에서 실행
CREATE DATABASE eum_bank CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'eumbank_user'@'localhost' IDENTIFIED BY '안전한_비밀번호_입력';
GRANT ALL PRIVILEGES ON eum_bank.* TO 'eumbank_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. 데이터베이스 스키마 적용
로컬에서 SQL 스크립트가 있다면:
```bash
# 로컬에서
scp -i "eumbank-key.pem" schema.sql ubuntu@<EC2-IP>:/home/ubuntu/

# EC2에서
mysql -u eumbank_user -p eum_bank < schema.sql
```

---

## 애플리케이션 배포

### 1. 애플리케이션 디렉토리 생성
```bash
# EC2에서
cd /home/ubuntu
mkdir -p app/eumbank
cd app/eumbank
```

### 2. 프로젝트 클론 또는 파일 업로드

**방법 1: Git 사용 (권장)**
```bash
# EC2에서
git clone <your-repository-url> .
# 또는
git clone https://github.com/your-username/eumbank.git .
```

**방법 2: SCP로 파일 업로드**
```bash
# 로컬에서 프로젝트 압축
tar -czf eumbank.tar.gz --exclude='node_modules' --exclude='.git' --exclude='build' .

# EC2로 업로드
scp -i "eumbank-key.pem" eumbank.tar.gz ubuntu@<EC2-IP>:/home/ubuntu/app/

# EC2에서 압축 해제
cd /home/ubuntu/app
tar -xzf eumbank.tar.gz -C eumbank
```

### 3. 프로덕션 설정 파일 생성
```bash
# EC2에서
cd /home/ubuntu/app/eumbank
nano src/main/resources/application-prod.yml
```

`application-prod.yml` 내용:
```yaml
server:
  port: 8081

spring:
  datasource:
    url: jdbc:mariadb://localhost:3306/eum_bank?sessionVariables=time_zone='+09:00'
    username: eumbank_user
    password: ${DB_PASS}  # 환경 변수로 설정

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

  security:
    oauth2:
      client:
        registration:
          naver:
            redirect-uri: http://<EC2-퍼블릭-IP>:8081/login/oauth2/code/naver
            # 또는 도메인 사용 시: https://yourdomain.com/login/oauth2/code/naver
          google:
            redirect-uri: http://<EC2-퍼블릭-IP>:8081/login/oauth2/code/google

app:
  cors:
    allowed-origins:
      - http://<EC2-퍼블릭-IP>:3000
      - http://<EC2-퍼블릭-IP>
      # 또는 도메인 사용 시
      - https://yourdomain.com

logging:
  level:
    root: INFO
    com.boot.eumbank: INFO
```

### 4. 환경 변수 설정
```bash
# EC2에서
sudo nano /etc/environment
```

다음 내용 추가:
```
DB_USER=eumbank_user
DB_PASS=your_database_password
CLOVA_OCR_URL=your_clova_url
CLOVA_OCR_SECRET=your_clova_secret
GEMINI_API_KEY=your_gemini_key
```

또는 `.env` 파일 사용:
```bash
cd /home/ubuntu/app/eumbank
nano .env
```

### 5. 애플리케이션 빌드 및 실행

**로컬에서 빌드 후 업로드 (권장)**
```bash
# 로컬에서
./gradlew clean build -x test
scp -i "eumbank-key.pem" build/libs/eumbank-0.0.1-SNAPSHOT.jar ubuntu@<EC2-IP>:/home/ubuntu/app/eumbank/
```

**EC2에서 직접 빌드**
```bash
# EC2에서
cd /home/ubuntu/app/eumbank
chmod +x gradlew
./gradlew clean build -x test
```

### 6. Systemd 서비스 파일 생성
```bash
sudo nano /etc/systemd/system/eumbank.service
```

다음 내용 입력:
```ini
[Unit]
Description=EUMbank Spring Boot Application
After=network.target mariadb.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/app/eumbank
Environment="JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
Environment="SPRING_PROFILES_ACTIVE=prod"
EnvironmentFile=/home/ubuntu/app/eumbank/.env
ExecStart=/usr/bin/java -jar -Djavax.net.ssl.trustStore=/home/ubuntu/app/eumbank/certs/exim-cacerts.jks -Djavax.net.ssl.trustStorePassword=changeit -Djavax.net.ssl.trustStoreType=JKS /home/ubuntu/app/eumbank/eumbank-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

서비스 활성화 및 시작:
```bash
sudo systemctl daemon-reload
sudo systemctl enable eumbank
sudo systemctl start eumbank
sudo systemctl status eumbank
```

로그 확인:
```bash
sudo journalctl -u eumbank -f
```

---

## 프론트엔드 빌드 및 배포

### 1. Node.js 및 npm 설치
```bash
# Node.js 18.x 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 버전 확인
node -v
npm -v
```

### 2. 프론트엔드 빌드
```bash
# 로컬에서 빌드
cd front_end
npm install
npm run build

# 빌드된 파일을 EC2로 업로드
scp -i "eumbank-key.pem" -r build/* ubuntu@<EC2-IP>:/var/www/html/
```

또는 EC2에서 직접 빌드:
```bash
# EC2에서
cd /home/ubuntu/app/eumbank/front_end
npm install
npm run build
sudo cp -r build/* /var/www/html/
```

### 3. Nginx 설정
```bash
sudo nano /etc/nginx/sites-available/eumbank
```

다음 내용 입력:
```nginx
server {
    listen 80;
    server_name <EC2-퍼블릭-IP>;  # 또는 도메인

    # 프론트엔드 정적 파일
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 프록시
    location /api {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Spring Boot 애플리케이션 프록시
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

심볼릭 링크 생성 및 Nginx 재시작:
```bash
sudo ln -s /etc/nginx/sites-available/eumbank /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 자동 배포 설정

### 1. 배포 스크립트 생성
`deploy.sh` 파일을 프로젝트 루트에 생성 (이미 생성됨)

### 2. GitHub Actions 사용 (선택사항)
`.github/workflows/deploy.yml` 파일 생성하여 자동 배포 설정 가능

---

## 보안 그룹 설정

### AWS 콘솔에서 보안 그룹 수정
1. EC2 대시보드 → 보안 그룹
2. `eumbank-sg` 선택
3. 인바운드 규칙 편집:
   - SSH (22): 내 IP만 허용
   - HTTP (80): 0.0.0.0/0
   - HTTPS (443): 0.0.0.0/0
   - 커스텀 TCP (8081): 필요시 특정 IP만 허용

---

## 비용 최적화 팁

### 1. 무료 티어 활용
- **EC2 t2.micro**: 750시간/월 (1년간 무료)
- **Elastic IP**: 인스턴스에 연결된 경우 무료
- **데이터 전송**: 월 1GB 무료

### 2. 비용 절감 방법
- 사용하지 않을 때 인스턴스 중지 (스토리지 비용만 발생)
- 스냅샷 정기적으로 생성하여 백업
- CloudWatch로 모니터링 설정 (무료 티어 포함)

### 3. 무료 티어 한도 초과 시
- t2.micro 인스턴스: 약 $0.0116/시간
- 월 약 $8.5 (24시간 실행 시)

---

## 트러블슈팅

### 애플리케이션이 시작되지 않을 때
```bash
# 로그 확인
sudo journalctl -u eumbank -n 50

# 포트 사용 확인
sudo netstat -tlnp | grep 8081

# Java 프로세스 확인
ps aux | grep java
```

### 데이터베이스 연결 오류
```bash
# MariaDB 상태 확인
sudo systemctl status mariadb

# MariaDB 접속 테스트
mysql -u eumbank_user -p eum_bank
```

### Nginx 오류
```bash
# Nginx 상태 확인
sudo systemctl status nginx

# 설정 파일 문법 확인
sudo nginx -t

# 에러 로그 확인
sudo tail -f /var/log/nginx/error.log
```

---

## 추가 리소스

- [AWS EC2 무료 티어](https://aws.amazon.com/ko/free/)
- [Spring Boot 프로덕션 배포 가이드](https://spring.io/guides/gs/spring-boot-for-azure/)
- [Nginx 공식 문서](https://nginx.org/en/docs/)

---

## 주의사항

⚠️ **보안**
- 프로덕션 환경에서는 하드코딩된 비밀번호 제거
- 환경 변수 또는 AWS Secrets Manager 사용
- HTTPS 설정 (Let's Encrypt 무료 SSL 인증서 사용)
- 정기적인 보안 업데이트

⚠️ **백업**
- 데이터베이스 정기 백업 설정
- EC2 스냅샷 정기 생성

⚠️ **모니터링**
- CloudWatch로 리소스 모니터링
- 애플리케이션 로그 모니터링

