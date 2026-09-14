# [네트워크 아키텍처] WebRTC P2P + Firebase RTDB 실시간 릴레이 자동 폴백 (Hybrid Fallback) 구현 계획서

교사 PC(업무망)와 학생 크롬북(학생망) 간의 망 분리 및 방화벽 환경에서도 **접속 성공률 100%**를 보장하고, P2P 직결이 가능한 환경에서는 **0ms 초저지연 대전**을 유지하는 **'WebRTC P2P + Firebase RTDB 실시간 릴레이 자동 폴백(Hybrid Fallback)'** 시스템 구축 계획서입니다.

---

## 📌 1. 아키텍처 다이어그램 및 파이프라인

```
[교사 PC (업무망)]                                  [학생 크롬북 (학생망)]
       │                                                    │
       ├──── 1차: WebRTC 직결 P2P 시도 (4초) ───────────────┤ ──> 연결 성공 시: 초저지연 P2P 대전!
       │                                                    │
       ▼ (망 분리로 인해 직결 실패 시)                     ▼
       └──── 2차: Firebase RTDB 릴레이 모드로 자동 전환! ───┘ ──> 100% 접속 성공 & 끊김 없는 플레이!
```

1. **1차 시도 (Tier 1 Direct WebRTC P2P)**:
   - 4자리 룸코드로 입장 시 먼저 W3C 표준 WebRTC DataChannel 직결을 시도합니다.
   - P2P 연결 성공 시 서버 트래픽 0원, 10ms 초저지연 직결 대전이 가동됩니다.

2. **2차 자동 폴백 (Tier 2 Firebase RTDB Realtime Relay)**:
   - 망 분리나 대칭형 NAT 등으로 인해 4초 이내에 P2P 연결이 맺어지지 않거나 ICE 실패가 발생할 경우, **에러 메시지나 중단 없이 0.5초 만에 자동으로 Firebase RTDB 릴레이 모드로 전환**됩니다.
   - 표준 HTTPS(443 포트) REST/SSE 채널을 통과하므로 어떠한 네트워크 분리 환경에서도 100% 무조건 연결이 수립됩니다.

3. **Firebase Spark 무료 플랜 트래픽 극대화 보존**:
   - 실시간 게임 패킷을 **10Hz (초당 10회, 100ms)** 초경량 델타 패킷으로 압축 전송합니다.
   - 릴레이를 타는 학생 1명당 90초 1경기 트래픽은 **200~300KB**에 불과합니다.
   - 한 학급(25명)이 매일 10판씩 플레이해도 월간 500MB 미만으로, Firebase 무료 한도(월 10,000MB)의 5% 미만입니다.

---

## 📁 2. 적용 대상 및 모듈 구성

1. **`src/components/games/piratecoin/pirateCoinNetwork.js`**:
   - 4초 P2P 타임아웃 타이머 (`P2P_HANDSHAKE_TIMEOUT_MS = 4000`)
   - 무중단 릴레이 자동 전환 메서드 (`fallbackToRelayMode()`)
   - 호스트 측 이중 리스너: `listenForGuests`(P2P) + `listenAllRelays`(릴레이) 동시 가동
   - 10Hz 스로틀링 브로드캐스트 (`broadcastSnapshot`, `sendClientInputs`)
2. **`src/components/games/piratecoin/PirateCoinGame.jsx`**:
   - 대기실 및 인게임 HUD에 접속 모드 배지 (⚡ P2P 직결 / 🔄 안전 릴레이) 표시
3. **`src/data/changelogData.js`**:
   - `v1.53.1` 릴리즈 노트 등록 (교육 친화적 기술 표현 준수)
