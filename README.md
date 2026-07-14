# 클라이밍 크루 채점표

클라이밍 크루 행사용 실시간 채점 웹서비스. 크루원은 난이도(색상)별로 푼 문제 수를 입력하고, 운영진은 순위 집계·배점 설정·마감/발표를 제어한다. 모바일 우선 반응형 UI.

## 기술 스택

- **Next.js 16** (App Router) + **TypeScript** — 풀스택 단일 프로젝트
- **SQLite** (`better-sqlite3`) — `data/climbing.db` 단일 파일
- **iron-session** — HttpOnly 서명 쿠키 세션
- **Tailwind CSS v4** — 모바일 우선 UI
- **canvas-confetti** — 결과 발표 축하 효과
- 실시간성: 상태 폴링(약 6초)

## 환경 변수

`.env.local` 파일에 설정 (`.env.example` 참고):

| 변수 | 설명 | 필수 |
|---|---|---|
| `SESSION_SECRET` | iron-session 서명 비밀키. **32자 이상**. 운영 환경 필수 | 운영 시 필수 |
| `SEED_ADMIN_NICKNAME` | 초기 시드 운영진 닉네임 (기본값 `운영진`) | 선택 |

> 운영 환경에서 `SESSION_SECRET` 미설정 시 서버가 시작 요청에서 에러를 던진다.

## 개발

```bash
npm install
npm run dev        # 개발 서버 (http://localhost:3000)
npm run test       # 단위 테스트 (ranking / score)
npm run build      # 프로덕션 빌드
npm run start      # 프로덕션 서버
```

첫 실행 시 `data/climbing.db`가 자동 생성되고 다음이 시드된다:
- 난이도 11색 (빨강~흰색, 초기 배점 1~11점)
- 전역 행사 상태 1행 (`OPEN`)
- 운영진 계정 1개 (`SEED_ADMIN_NICKNAME`)

이후 크루원은 운영진이 **크루원 관리(`/admin/members`)**에서 추가한다.

## 로그인

닉네임만 입력한다. 사전 등록된 닉네임만 접근 가능하며, 미등록 시 에러를 표시한다.

## 주요 화면

| 경로 | 대상 | 설명 |
|---|---|---|
| `/login` | 전체 | 닉네임 입력 |
| `/` | 크루원·운영진 | 점수 입력 (상태에 따라 집계중 안내로 자동 전환) |
| `/result` | 전체 | 결과 발표 — 시상대 + 성적표 + 컨페티 (`ANNOUNCED` 시) |
| `/admin/ranking` | 운영진 | 순위표 (실시간 갱신) |
| `/admin/scoring` | 운영진 | 난이도별 배점 설정 |
| `/admin/control` | 운영진 | 마감 / 발표 / 마감 취소 |
| `/admin/members` | 운영진 | 크루원 추가·삭제·권한 변경 |

## 행사 상태 흐름

```
OPEN(진행중) ──마감──> CLOSED(집계중) ──발표──> ANNOUNCED(발표됨)
                  <──── 마감 취소 ────┘  (OPEN으로 복귀)
```

- `OPEN`에서만 점수 입력 가능. 그 외 상태에서 기록 API 호출 시 409.
- 상태 전이는 운영진만 가능하며, 모든 관리 API는 서버에서 `admin` 권한을 검증한다.

## 순위 산정

1. 총점(`Σ 개수 × 배점`) 내림차순
2. 동점 시 가장 높은 난이도(흰색)부터 순서대로 푼 개수 비교
3. 완전 동일하면 공동 순위 (공동 2등 2명 → 다음 4등)

## 배포 (Vultr VPS + nginx)

Node 앱을 프로세스 매니저(예: `pm2`, `systemd`)로 실행하고 nginx가 리버스 프록시로 앞단다.

```bash
npm ci
npm run build
SESSION_SECRET=<32자 이상 랜덤 문자열> npm run start   # 기본 3000 포트
```

nginx (HTTPS 종료는 nginx 담당):

```nginx
server {
  listen 443 ssl;
  server_name your-domain;
  # ssl_certificate / ssl_certificate_key ...

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 백업

DB는 SQLite 단일 파일이다. 행사 전후로 파일을 복사해 백업한다:

```bash
cp data/climbing.db backups/climbing-$(date +%Y%m%d-%H%M).db
```

> WAL 모드를 사용하므로 서버 중지 상태에서 복사하거나 `data/climbing.db`, `-wal`, `-shm` 파일을 함께 복사하는 것을 권장.
