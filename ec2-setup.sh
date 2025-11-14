#!/bin/bash

# EC2 서버 초기 설정 스크립트
# 이 스크립트를 EC2 서버에서 실행하세요
# 사용법: chmod +x ec2-setup.sh && ./ec2-setup.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info "EC2 서버 초기 설정을 시작합니다..."

# 1. 시스템 업데이트
print_info "시스템 업데이트 중..."
sudo apt-get update
sudo apt-get upgrade -y

# 2. Java 17 설치
print_info "Java 17 설치 중..."
sudo apt-get install -y openjdk-17-jdk
java -version

# 3. Git 설치
print_info "Git 설치 중..."
sudo apt-get install -y git
git --version

# 4. MariaDB 설치
print_info "MariaDB 설치 중..."
sudo apt-get install -y mariadb-server mariadb-client
sudo systemctl start mariadb
sudo systemctl enable mariadb

print_warn "MariaDB 보안 설정을 진행하세요:"
print_warn "sudo mysql_secure_installation"

# 5. Nginx 설치
print_info "Nginx 설치 중..."
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 6. Node.js 설치
print_info "Node.js 18.x 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v

# 7. 방화벽 설정
print_info "방화벽 설정 중..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 8081
sudo ufw --force enable
sudo ufw status

# 8. 애플리케이션 디렉토리 생성
print_info "애플리케이션 디렉토리 생성 중..."
mkdir -p /home/ubuntu/app/eumbank
mkdir -p /home/ubuntu/app/eumbank/certs
mkdir -p /home/ubuntu/app/eumbank/logs
mkdir -p /var/log/eumbank

# 9. 로그 디렉토리 권한 설정
sudo chown -R ubuntu:ubuntu /var/log/eumbank

# 10. Systemd 서비스 파일 생성
print_info "Systemd 서비스 파일 생성 중..."
sudo tee /etc/systemd/system/eumbank.service > /dev/null <<EOF
[Unit]
Description=EUMbank Spring Boot Application
After=network.target mariadb.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/app/eumbank
Environment="JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
Environment="SPRING_PROFILES_ACTIVE=prod"
ExecStart=/usr/bin/java -jar \\
    -Djavax.net.ssl.trustStore=/home/ubuntu/app/eumbank/certs/exim-cacerts.jks \\
    -Djavax.net.ssl.trustStorePassword=changeit \\
    -Djavax.net.ssl.trustStoreType=JKS \\
    /home/ubuntu/app/eumbank/eumbank-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload

print_info "✅ 초기 설정이 완료되었습니다!"
print_warn "다음 단계를 진행하세요:"
print_warn "1. MariaDB 보안 설정: sudo mysql_secure_installation"
print_warn "2. 데이터베이스 및 사용자 생성"
print_warn "3. 환경 변수 설정 (.env 파일 또는 /etc/environment)"
print_warn "4. 애플리케이션 배포"
print_warn "5. Nginx 설정"

