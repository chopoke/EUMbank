#!/bin/bash

# EUMbank AWS EC2 배포 스크립트
# 사용법: ./deploy.sh <EC2_IP> <KEY_FILE>

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 변수 설정
EC2_IP=${1:-""}
KEY_FILE=${2:-"eumbank-key.pem"}
REMOTE_USER="ubuntu"
REMOTE_DIR="/home/ubuntu/app/eumbank"
SERVICE_NAME="eumbank"

# 함수 정의
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 인자 확인
if [ -z "$EC2_IP" ]; then
    print_error "EC2 IP 주소를 입력해주세요."
    echo "사용법: ./deploy.sh <EC2_IP> [KEY_FILE]"
    echo "예시: ./deploy.sh 3.34.123.45 eumbank-key.pem"
    exit 1
fi

# 키 파일 확인
if [ ! -f "$KEY_FILE" ]; then
    print_error "키 파일을 찾을 수 없습니다: $KEY_FILE"
    exit 1
fi

# 키 파일 권한 설정
chmod 400 "$KEY_FILE"

print_info "배포를 시작합니다..."
print_info "EC2 IP: $EC2_IP"
print_info "키 파일: $KEY_FILE"

# 1. 로컬에서 빌드
print_info "로컬에서 애플리케이션 빌드 중..."
./gradlew clean build -x test

if [ ! -f "build/libs/eumbank-0.0.1-SNAPSHOT.jar" ]; then
    print_error "빌드 실패: JAR 파일을 찾을 수 없습니다."
    exit 1
fi

print_info "빌드 완료"

# 2. 원격 디렉토리 생성
print_info "EC2 서버에 디렉토리 생성 중..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$REMOTE_USER@$EC2_IP" \
    "mkdir -p $REMOTE_DIR/certs"

# 3. JAR 파일 업로드
print_info "JAR 파일 업로드 중..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no \
    build/libs/eumbank-0.0.1-SNAPSHOT.jar \
    "$REMOTE_USER@$EC2_IP:$REMOTE_DIR/"

# 4. 인증서 파일 업로드 (있는 경우)
if [ -d "certs" ]; then
    print_info "인증서 파일 업로드 중..."
    scp -i "$KEY_FILE" -o StrictHostKeyChecking=no \
        -r certs/* \
        "$REMOTE_USER@$EC2_IP:$REMOTE_DIR/certs/"
fi

# 5. Firebase 키 파일 업로드 (있는 경우)
if [ -f "src/main/resources/eumbank-86fbd-firebase-adminsdk-fbsvc-d3d743c1eb.json" ]; then
    print_info "Firebase 키 파일 업로드 중..."
    ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$REMOTE_USER@$EC2_IP" \
        "mkdir -p $REMOTE_DIR/src/main/resources"
    scp -i "$KEY_FILE" -o StrictHostKeyChecking=no \
        src/main/resources/eumbank-86fbd-firebase-adminsdk-fbsvc-d3d743c1eb.json \
        "$REMOTE_USER@$EC2_IP:$REMOTE_DIR/src/main/resources/"
fi

# 6. 원격 서버에서 서비스 재시작
print_info "애플리케이션 서비스 재시작 중..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$REMOTE_USER@$EC2_IP" << 'ENDSSH'
    sudo systemctl daemon-reload
    sudo systemctl restart eumbank
    sleep 5
    sudo systemctl status eumbank --no-pager
ENDSSH

# 7. 상태 확인
print_info "배포 상태 확인 중..."
sleep 3

if ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$REMOTE_USER@$EC2_IP" \
    "sudo systemctl is-active --quiet $SERVICE_NAME"; then
    print_info "✅ 배포 성공! 애플리케이션이 정상적으로 실행 중입니다."
    print_info "애플리케이션 URL: http://$EC2_IP:8081"
else
    print_error "❌ 배포 실패: 서비스가 실행되지 않습니다."
    print_warn "로그를 확인하세요: ssh -i $KEY_FILE $REMOTE_USER@$EC2_IP 'sudo journalctl -u $SERVICE_NAME -n 50'"
    exit 1
fi

print_info "배포 완료!"

