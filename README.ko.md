# Claude Code Cockpit

<div align="center">

> Claude Code를 위한 차세대 실시간 대시보드

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/baeseokjae/claude-code-cockpit)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-321%20passing-brightgreen.svg)](#-개발)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

[English](./README.md) • [한국어](./README.ko.md)

</div>

5가지 커스터마이징 가능한 테마, 종합 세션 모니터링, 제로 디펜던시를 갖춘 Claude Code용 고급 HUD 시스템입니다.

## 🚀 빠른 시작

```bash
# 플러그인 설치
/plugin install claude-code-cockpit

# 상태표시줄 설정 (최초 1회)
/claude-code-cockpit:setup

# 대시보드 확인
/claude-code-cockpit:dashboard
```

완료! 이제 Claude Code 상태표시줄이 실시간 모니터링으로 강화되었습니다.

## 🎨 테마

WCAG 준수 5가지 프리미엄 테마.

### 🌌 Aurora (기본)
오로라 그라데이션의 극지방 밤하늘 — 균형 잡힌 대비, 눈 편안함.

![Aurora Theme](./assets/theme-aurora.svg)

### ⚡ Neon
사이버펑크 형광 on 딥 블랙 — 높은 가시성, 대담함.

![Neon Theme](./assets/theme-neon.svg)

### ⚫ Mono
순수 흑백 — ASCII 호환, 최대 접근성.

![Mono Theme](./assets/theme-mono.svg)

### 🧘 Zen
차분한 대지 톤 — 집중 작업, 최소 방해.

![Zen Theme](./assets/theme-zen.svg)

### 📺 Retro
검은색 위 녹색 인광 — 클래식 CRT 향수.

![Retro Theme](./assets/theme-retro.svg)

### 테마 비교

| 테마 | 대비 | 색상 | 사용 사례 | 접근성 |
|------|------|------|-----------|--------|
| **Aurora** | 중간 | 🌈 다색상 | 일반, 균형 | ✅ WCAG AA |
| **Neon** | 높음 | 🎨 밝은 네온 | 고가시성, 다크모드 | ✅ WCAG AAA |
| **Mono** | 높음 | ⚫⚪ 흑백만 | 최대 호환 | ✅ WCAG AAA |
| **Zen** | 낮음 | 🎨 대지 톤 | 집중, 미니멀 | ✅ WCAG AA |
| **Retro** | 중간 | 💚 녹색 단색 | 향수 | ✅ WCAG AA |

### 테마 전환

```bash
# 대화형 (권장)
/claude-code-cockpit:configure

# 환경 변수
export COCKPIT_THEME=neon

# 설정 파일 (~/.claude/plugins/claude-code-cockpit/config.json)
{ "theme": "zen" }
```

## ✨ 기능

- **5가지 프리미엄 테마** — Aurora, Neon, Mono, Zen, Retro + 반응형 3단계 레이아웃
- **도구 추적** — 모든 도구 활동을 상태 표시와 함께 모니터링 (◐ 진행 중, ✓ 성공, ✗ 오류) 및 성공률
- **에이전트 추적** — 모델 표시와 함께 실시간 Task 서브에이전트 모니터링 ([h]aiku, [s]onnet, [o]pus)
- **Todo 진행률** — 완료 퍼센티지와 함께 TodoWrite 작업 상태 추적
- **Skill 추적** — /commit, /review-pr 등 Skill 호출 모니터링
- **Git 통합** — 브랜치 상태, dirty 표시, 태그, 파일 통계, 모노레포 & worktree 지원
- **비용 추정** — 모델별(Opus/Sonnet/Haiku) 토큰 기반 비용 계산
- **토큰 속도** — 입출력을 위한 실시간 tok/s 추적
- **캐시 메트릭** — 캐시 히트율 및 예상 절약 금액 표시
- **API 사용량** — 리셋 타이머와 함께 5시간 및 7일 사용량 한도
- **라인 위젯** — 코드 추가/삭제 (+152 -48)
- **Bash 오류 추적** — exit code와 함께 실패한 명령어
- **스마트 알림** — 컨텍스트, 비용, 세션 시간 경고 (설정 가능한 임계값)
- **컴팩트 제안** — 도구 호출이 임계값을 초과할 때 `/compact` 권장
- **코드 위반 감지** — 하드코딩된 시크릿, console.log, 대용량 파일, TODO/FIXME 감지
- **워크플로우 단계** — PLAN/IMPLEMENT/REVIEW 단계 자동 감지 (신뢰도 점수 포함)
- **테스트 커버리지** — 프레임워크 독립적 커버리지 표시 (vitest, jest, mocha, ava)
- **Pass@k 메트릭** — AI 코드 생성 품질 측정
- **MCP 상태** — 서버별 도구 사용량 통계 및 영향 추적
- **터미널 하이퍼링크** — 클릭 가능한 파일 경로 및 GitHub URL (OSC 8)
- **제로 디펜던시** — Node.js 내장 모듈만 사용, < 50ms 렌더링, 321개 테스트 통과

## 📋 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/claude-code-cockpit:dashboard` | 모든 통계를 포함한 전체 세션 개요 |
| `/claude-code-cockpit:tools` | 상세한 도구 사용량 통계 및 기록 |
| `/claude-code-cockpit:agents` | 에이전트 실행 세부사항 및 상태 |
| `/claude-code-cockpit:todos` | 완료 상태와 함께 할일 목록 |
| `/claude-code-cockpit:usage` | API 사용량 통계 및 사용량 한도 |
| `/claude-code-cockpit:setup` | 상태표시줄 설정 (최초 1회) |
| `/claude-code-cockpit:configure` | 대화형 테마 및 표시 옵션 마법사 |

모든 커맨드는 세션 중 자동 업데이트되는 `/tmp/cockpit-session.md`를 읽습니다.

## ⚙️ 설정

### 환경 변수

```bash
export COCKPIT_THEME=aurora        # aurora, neon, mono, zen, retro
export COCKPIT_PRESET=developer    # minimal, developer, full
export COCKPIT_DETAIL=1            # 0=끔, 1=켬 (고급 기능)
export COCKPIT_PATH_LEVELS=2       # 표시할 디렉토리 레벨 수
```

### Presets

| Preset | 설명 |
|--------|------|
| `minimal` | 핵심만: 모델, 컨텍스트%, 비용, 시간. 알림은 항상 켜짐 |
| `developer` | 기본 + gitActivity, toolStats 활성화 |
| `full` | 모든 표시 옵션 활성화 |

**우선순위:** 기본값 → Preset → 사용자 재정의

### 설정 파일

`~/.claude/plugins/claude-code-cockpit/config.json`:

```json
{
  "theme": "aurora",
  "preset": "developer",
  "detailMode": false,
  "display": {
    "showGit": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showCost": true,
    "showUsage": true,
    "showBashErrors": true,
    "showCompactSuggestion": true,
    "showViolations": true
  }
}
```

<details>
<summary><strong>전체 표시 옵션 레퍼런스</strong></summary>

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `showGit` | ✅ | Git 브랜치 및 상태 |
| `showTools` | ✅ | 도구 사용량 (Read, Edit, Bash 등) |
| `showAgents` | ✅ | 에이전트 실행 상태 |
| `showTodos` | ✅ | Todo 진행률 추적 |
| `showSkills` | ❌ | Skill 호출 (/commit, /review-pr) |
| `showUsage` | ✅ | API 사용량 통계 |
| `showCost` | ✅ | 비용 추정 |
| `showAbsoluteTokens` | ❌ | 퍼센티지 대신 절대 토큰 수 표시 |
| `showTokenSpeed` | ❌ | 토큰 생성 속도 (tok/s) |
| `showSessionName` | ✅ | 상태 표시줄의 세션/플랜 이름 |
| `showGitTag` | ❌ | 브랜치 옆 최신 git 태그 |
| `showGitActivity` | ❌ | 세션 중 생성된 커밋 및 PR |
| `showGitFileStats` | ❌ | 수정/추가/삭제된 파일 개수 |
| `showAllBranches` | ❌ | 하위 디렉토리의 브랜치 (모노레포) |
| `showAllBranchesDepth` | 2 | 하위 디렉토리 스캔 최대 깊이 |
| `showGitWorktrees` | ❌ | Git worktree 상태 |
| `showLines` | ✅ | 코드 추가/삭제 (+152 -48) |
| `showCacheMetrics` | ❌ | 캐시 히트율 및 절약 금액 |
| `showConfigCounts` | ❌ | .claude.md, rules, MCP, hooks 개수 |
| `showToolStats` | ❌ | 전체 도구 성공/실패율 |
| `showBashErrors` | ✅ | exit code와 함께 실패한 bash 명령어 |
| `showCompactSuggestion` | ✅ | 임계값 초과 시 `/compact` 제안 |
| `showViolations` | ✅ | 코드 위반 (시크릿, console.log) |
| `showMcpImpact` | ❌ | MCP 서버 설정 및 도구 개수 |
| `showWorkflowPhase` | ❌ | 현재 워크플로우 단계 (PLAN/IMPLEMENT/REVIEW) |
| `showTestCoverage` | ❌ | 테스트 커버리지 퍼센티지 |
| `showPassAtK` | ❌ | Pass@k 코드 생성 품질 메트릭 |
| `showMcpStatus` | ❌ | MCP 서버 사용량 통계 |
| `showPerformanceMetrics` | ❌ | 빌드/테스트 성능 (실험적) |
| `showInstanceSync` | ❌ | 멀티 인스턴스 동기화 (실험적) |
| `sevenDayThreshold` | 80 | 7일 사용량 경고 표시 % 임계값 |

**알림 옵션:** `compactWarningThreshold` (기본: 75), `compactSuggestionThreshold` (기본: 50)

**사용량 옵션:** `usage.enabled` (기본: true), `usage.cacheMinutes` (기본: 10)

**성능 옵션:** `maxTools` (기본: 20), `maxAgents` (기본: 20)

**추가 옵션:** `rightMargin` (기본: 2), `maxActivityWidgets` (기본: 8), `pathLevels` (기본: 1)

</details>

<details>
<summary><strong>예시 설정</strong></summary>

#### 미니멀 (성능 중심)
```json
{
  "theme": "mono",
  "detailMode": false,
  "display": {
    "showGit": true, "showTools": true, "showAgents": false,
    "showTodos": false, "showUsage": false, "showCost": true
  },
  "performance": { "maxTools": 10, "maxAgents": 5 }
}
```

#### 전체 기능 (파워 유저)
```json
{
  "theme": "aurora",
  "preset": "full",
  "detailMode": true,
  "performance": { "maxTools": 50, "maxAgents": 50 }
}
```

#### 보안 중심
```json
{
  "theme": "neon",
  "detailMode": true,
  "display": { "showViolations": true, "showBashErrors": true }
}
```

</details>

## 🚨 알림

| 알림 | 임계값 | 표시 |
|------|--------|------|
| 🔴 컨텍스트 치명적 | 90%+ | `⚠ CTX 95%!` (빨간색 볼드) |
| 🟡 컨텍스트 경고 | 75-89% | `⚠ CTX 80%` (노란색) |
| 💰 높은 비용 | $1.00+ | 비용 강조 표시 |
| ⏰ 긴 세션 | 30분+ / 60분+ | 세션 시간 강조 표시 |
| 📦 컴팩트 제안 | 50+ 도구 호출 | `⚠️ 75 calls try /compact` |
| 📊 API 사용량 | 80%+ (5시간/7일) | `⚠️ 5h:85%` 노란색/빨간색 |

임계값은 설정 파일의 `notifications` 섹션에서 설정 가능합니다.

## 🚀 설치

### 사전 요구사항

- **Claude Code** 2.0+
- **Node.js** 18.0.0+
- **터미널** ANSI 색상 지원 (권장: iTerm2, VSCode Terminal, Windows Terminal, Kitty)

### 방법 1: 마켓플레이스에서 설치 (권장)

```bash
/plugin install claude-code-cockpit
/claude-code-cockpit:setup
/claude-code-cockpit:dashboard
```

### 방법 2: 수동 설치

```bash
git clone https://github.com/baeseokjae/claude-code-cockpit.git
cd claude-code-cockpit
pnpm install
pnpm build
pnpm link --global
```

그런 다음 Claude Code에서:
```bash
/plugin install <클론한-저장소-경로>
/claude-code-cockpit:setup
```

### 방법 3: 개발 모드

```bash
pnpm dev  # 워치 모드

# 다른 터미널에서
cc --plugin-dir .

# 또는 stdin 직접 테스트
echo '{"model":{"display_name":"Opus"}}' | node dist/index.js
```

## 📦 개발

### 시작하기

```bash
git clone https://github.com/baeseokjae/claude-code-cockpit.git
cd claude-code-cockpit
pnpm install
pnpm build    # 한 번 빌드
pnpm dev      # 워치 모드
```

### 테스트

27개 테스트 파일에 걸쳐 321개 테스트 (270+ 단위, 16 통합, 25 테마 테스트).

```bash
pnpm test                    # 모든 테스트 실행
pnpm test:watch              # 워치 모드
pnpm test:coverage           # 커버리지 보고서
pnpm test:update-snapshots   # 스냅샷 업데이트
pnpm lint                    # 타입 체크
```

<details>
<summary><strong>수동 테스트 & 디버깅</strong></summary>

```bash
# 기본 테스트
echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":45},"cwd":"/test"}' | node dist/index.js

# 디버그 모드
echo '{"model":{"display_name":"Opus"}}' | DEBUG=* node dist/index.js

# 특정 디버그 네임스페이스
DEBUG=main,git,transcript node dist/index.js < sample.json
# (총 27개 네임스페이스 사용 가능 - 모두 보려면 DEBUG=* 사용)
```

</details>

### 기여하기

1. 저장소 포크 및 클론
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항에 대한 테스트 작성
4. 테스트 통과 (`pnpm test`) 및 타입 체크 (`pnpm lint`) 확인
5. 커밋 후 Pull Request 생성

**PR 체크리스트:**
- [ ] 테스트 통과 (`pnpm test`)
- [ ] 타입 체크 통과 (`pnpm lint`)
- [ ] 문서 업데이트
- [ ] 기존 코드 스타일 준수

## 🙏 영감을 받은 프로젝트

- **[jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud)** – Claude Code용 터미널 기반 HUD 플러그인의 원조 영감
- **Terminal powerline 도구** – 다단계 반응형 레이아웃 시스템의 영감

## 📄 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](./LICENSE)를 참조하세요.

Copyright (c) 2026 baeseokjae

---

<div align="center">

**[⬆ 맨 위로](#claude-code-cockpit)**

Claude Code 커뮤니티를 위해 ❤️로 제작

</div>
