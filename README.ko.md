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

## 🎨 Themes

### Aurora (기본)
북극광(Aurora Borealis)에서 영감을 받은 색상 시스템. 극지방 밤하늘과 오로라의 초록-청록-보라 그라데이션.

### Neon
사이버펑크 네온사인 감성. 형광 그린, 시안, 핫핑크의 고대비 조합.

### Mono
순수 흑백 미니멀. ASCII 호환, 접근성 우선 설계.

### Zen
초미니멀 디자인. 한지와 먹에서 영감받은 차분한 톤.

### Retro
80년대 CRT 인광 모니터 감성. 녹색 인광색과 터미널 향수.

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
    "showUsage": false,
    "showCost": true
  }
}
```

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
