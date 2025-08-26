FROM node:18-alpine

WORKDIR /app

# 패키지 설치
COPY package*.json ./
RUN npm ci

# 앱 소스 복사
COPY . .

EXPOSE 5173

# compose에서 dev 명령을 넘기므로 여기 CMD는 선택
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]