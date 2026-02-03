# Claude Code Cockpit

> Claude Code를 위한 차세대 실시간 대시보드

[English](./README.md)

Claude Code를 위한 고급 HUD 시스템으로, 5가지 테마, Skill 추적, 상세 보기 모드를 지원합니다.

## ✨ 기능

- 🎨 **5가지 테마**: Aurora, Neon, Mono, Zen, Retro
- 🔧 **도구 추적**: Read, Edit, Bash, Grep 등 모든 도구 추적
- 🤖 **에이전트 추적**: Task 서브에이전트 실시간 모니터링
- ✅ **Todo 진행률**: TodoWrite 진행 상황 표시
- ⚡ **Skill 추적**: /commit, /review-pr 등 Skill 호출 추적
- 📊 **Git 상태**: 브랜치, dirty 표시
- 💰 **비용 추정**: 모델별 토큰 비용 계산
- 🚨 **알림 시스템**: 컨텍스트/비용/세션 경고
- 📱 **반응형 레이아웃**: 터미널 너비에 따라 자동 조정
- 🚀 **Zero Dependency**: Node.js 내장 모듈만 사용

## 🚀 Installation

### Marketplace (권장)

Claude Code 내에서 실행:

```bash
# 1. Add marketplace source
/plugin marketplace add baeseokjae/claude-code-cockpit

# 2. Install plugin
/plugin install claude-code-cockpit

# 3. Setup statusline
/claude-code-cockpit:setup
```

### Local Development

```bash
# Clone repository
git clone https://github.com/baeseokjae/claude-code-cockpit.git
cd claude-code-cockpit

# Install dependencies and build
pnpm install
pnpm build

# Test locally
cc --plugin-dir .
```

## 📋 커맨드

Claude Code Cockpit은 세션을 자세히 모니터링할 수 있는 여러 대화형 커맨드를 제공합니다:

### 세션 모니터링 커맨드

- `/claude-code-cockpit:dashboard` - 모든 통계를 포함한 종합 세션 대시보드 표시
- `/claude-code-cockpit:tools` - 도구 사용량 상세 통계 및 기록 표시
- `/claude-code-cockpit:agents` - 에이전트 실행 상태 및 설명 표시
- `/claude-code-cockpit:todos` - 할일 목록과 완료 상태 표시
- `/claude-code-cockpit:usage` - API 사용량 통계 및 rate limit 표시

### 설정 커맨드

- `/claude-code-cockpit:setup` - Claude Code statusline을 claude-code-cockpit으로 설정
- `/claude-code-cockpit:configure` - 테마 및 표시 옵션을 대화형으로 설정

모든 커맨드는 세션 중에 자동으로 업데이트되는 `/tmp/cockpit-session.md` 파일을 읽습니다.

## 🎨 테마

### Aurora (기본)
북극광(Aurora Borealis)에서 영감을 받은 색상 시스템. 극지방 밤하늘과 오로라의 초록-청록-보라 그라데이션.

**출력 예시:**

![Aurora Theme](./assets/theme-aurora.svg)

### Neon
사이버펑크 네온사인 감성. 형광 그린, 시안, 핫핑크의 고대비 조합.

**출력 예시:**

![Neon Theme](./assets/theme-neon.svg)

### Mono
순수 흑백 미니멀. ASCII 호환, 접근성 우선 설계.

**출력 예시:**

![Mono Theme](./assets/theme-mono.svg)

### Zen
초미니멀 디자인. 한지와 먹에서 영감받은 차분한 톤.

**출력 예시:**

![Zen Theme](./assets/theme-zen.svg)

### Retro
80년대 CRT 인광 모니터 감성. 녹색 인광색과 터미널 향수.

**출력 예시:**

![Retro Theme](./assets/theme-retro.svg)

## 🌟 상세 기능

### 실시간 모니터링
- **세션 시간 추적** - 현재 세션이 실행된 시간 추적
- **토큰 사용량** - 입력/출력/캐시 토큰을 실시간으로 모니터링
- **비용 계산** - 모델 및 토큰 사용량에 따른 자동 비용 추정
- **API rate limit 모니터링** - 5시간 및 7일 API 사용량 창과 리셋 타이머 추적

### 대화형 커맨드
- **종합 대시보드** - `/claude-code-cockpit:dashboard`로 전체 세션 개요 확인
- **도구 사용량 통계** - `/claude-code-cockpit:tools`로 상세한 도구 호출 기록 확인
- **에이전트 실행 추적** - `/claude-code-cockpit:agents`로 서브에이전트 상태 및 설명 확인
- **할일 목록 모니터링** - `/claude-code-cockpit:todos`로 작업 진행률 추적
- **API 사용량 분석** - `/claude-code-cockpit:usage`로 rate limit 및 사용량 통계 확인

### 토큰 속도 추적
- **출력 토큰 생성 속도** - 실시간 tok/s 계산
- **입력 토큰 처리 속도** - 입력 처리 속도 모니터링
- **설정 가능한 표시** - `showTokenSpeed` 옵션으로 토글

### Git 통합
- **현재 브랜치 및 dirty 상태** - 커밋되지 않은 변경사항 표시와 함께 현재 git 브랜치 확인
- **파일 수정 통계** - 수정/추가/삭제/추적되지 않는 파일 개수 추적
- **모노레포 지원** - 여러 하위 디렉토리의 브랜치 표시
- **클릭 가능한 GitHub 링크** - GitHub 브랜치 URL로 연결되는 터미널 하이퍼링크 (터미널 의존적)

### 터미널 하이퍼링크
- **클릭 가능한 파일 경로** - file:// 프로토콜 링크를 위한 OSC 8 escape sequences
- **클릭 가능한 GitHub URL** - GitHub 브랜치 페이지로 직접 연결되는 링크
- **자동 호환성 감지** - 터미널 하이퍼링크 지원 자동 감지
- **지원 터미널**: iTerm2, Apple Terminal, VSCode Terminal, Kitty, Windows Terminal, Ghostty

### 세션 파일 내보내기
- **자동 생성 세션 요약** - `/tmp/cockpit-session.md`에 Markdown 파일 생성
- **모든 커맨드에서 사용** - 모든 `/claude-code-cockpit:*` 커맨드가 이 파일 읽기
- **종합 데이터** - 도구, 에이전트, 할일, 사용량 통계, git 상태 포함

## ⚙️ Configuration

설치 후 `/claude-code-cockpit:configure` 명령으로 테마와 표시 옵션을 설정하거나, 환경변수로 설정할 수 있습니다.

### Environment Variables

```bash
# Select theme
export COCKPIT_THEME=aurora   # aurora, neon, mono, zen, retro

# Enable detail mode
export COCKPIT_DETAIL=1

# Path display depth
export COCKPIT_PATH_LEVELS=2
```

### Configuration File

`~/.claude/plugins/claude-code-cockpit/config.json`:

```json
{
  "theme": "aurora",
  "detailMode": false,
  "display": {
    "showGit": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showSkills": true,
    "showUsage": true,
    "showConfigCounts": true,
    "showCost": true,
    "showAbsoluteTokens": false,
    "showSessionName": true,
    "showTokenSpeed": true,
    "showGitFileStats": false,
    "showAllBranches": false,
    "showAllBranchesDepth": 2,
    "sevenDayThreshold": 80
  },
  "usage": {
    "enabled": true,
    "cacheMinutes": 10
  },
  "performance": {
    "maxTools": 20,
    "maxAgents": 10
  }
}
```

### 표시 옵션

#### 기본 표시
- `showGit` (기본값: true) - git 브랜치와 상태 표시
- `showTools` (기본값: true) - 도구 사용량 표시
- `showAgents` (기본값: true) - 에이전트 실행 표시
- `showTodos` (기본값: true) - 할일 진행률 표시
- `showSkills` (기본값: true) - 스킬 호출 표시
- `showUsage` (기본값: true) - API 사용량 통계 표시
- `showCost` (기본값: true) - 비용 추정 표시

#### 토큰 표시
- `showAbsoluteTokens` (기본값: false) - 퍼센트 대신 절대 토큰 수 표시
- `showTokenSpeed` (기본값: true) - 토큰 생성 속도 (tok/s) 표시

#### 세션 정보
- `showSessionName` (기본값: true) - 상태 표시줄에 세션/플랜 이름 표시

#### Git 정보
- `showGitFileStats` (기본값: false) - 수정/추가/삭제된 파일 개수 표시
- `showAllBranches` (기본값: false) - 하위 디렉토리의 브랜치 표시 (모노레포 지원)
- `showAllBranchesDepth` (기본값: 2) - 하위 디렉토리 git 스캔 최대 깊이

#### 설정 개수
- `showConfigCounts` (기본값: true) - .claude.md, rules, MCP 서버, hooks 개수 표시

#### 사용량 경고
- `sevenDayThreshold` (기본값: 80) - 7일 사용량 표시 임계값 백분율 (0-100)

### 사용량 옵션

- `enabled` (기본값: true) - API 사용량 추적 활성화
- `cacheMinutes` (기본값: 10) - 사용량 데이터 캐시 지속 시간(분)

### 성능 옵션

- `maxTools` (기본값: 20) - 추적할 최대 도구 개수
- `maxAgents` (기본값: 10) - 추적할 최대 에이전트 개수

## 🚨 Alerts

컨텍스트 사용량이 높거나 비용이 임계값을 초과하면 자동으로 경고가 표시됩니다:

- **Context Critical (90%+)**: 빨간색 볼드 `⚠ CTX 95%!`
- **Context Warning (75%+)**: 노란색 `⚠ CTX 80%`
- **Cost Warning ($1+)**: 비용 경고
- **Session Long (30m+)**: 세션 시간 정보

## 📦 Development

```bash
# Build
pnpm build

# Type check
pnpm lint

# Test
pnpm test

# Test stdin
echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":45},"cwd":"/test"}' | node dist/index.js

# Debug mode
echo '{"model":{"display_name":"Opus"}}' | DEBUG=* node dist/index.js
```

## 📁 Project Structure

```
claude-code-cockpit/
├── .claude-plugin/
│   └── plugin.json      # Plugin manifest
├── commands/
│   ├── setup.md         # /claude-code-cockpit:setup
│   └── configure.md     # /claude-code-cockpit:configure
├── src/
│   ├── index.ts         # Main entry point
│   ├── types/           # Type definitions
│   ├── input/           # stdin, transcript parsing
│   ├── data/            # Git, time, cost, alerts
│   ├── config/          # Config loader
│   ├── themes/          # Theme system
│   ├── render/          # Rendering utilities
│   ├── output/          # Output handling
│   └── utils/           # Debug, constants
├── tests/               # Test files
└── dist/                # Build output
```

## 💡 Inspired By

claude-code-cockpit 제작에 영감을 준 프로젝트들입니다. 🙏

- [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) – Claude Code용 터미널 기반 HUD 플러그인
- Terminal powerline 도구들의 statusbar

## 📄 License

MIT
