# Compact Mode UI Optimization Research

> 4명의 전문 에이전트(UI/UX, Technical Architect, Reference Researcher, Critic)가
> 과학적 토론을 거쳐 도출한 합의 문서

## 1. Problem Statement

### 현재 상태
```
Opus 4.6 [51974eb8] │ ▰▰▰▰▰▰▰▱▱▱ 37% │ claude-code-coc… (main*) +252 -193 │ $4.…
● Tools: Bash+3  Edit+5  Read+7  Grep+5
● Usage: 5h:42%  7d:35%
```

### 핵심 문제
- **Line 1에 11개 독립 요소**가 존재하여 80-col 터미널에서 overflow (worst-case 102+ chars)
- Cost(`$4.50`)와 Duration(`5m32s`)이 `…`으로 잘림
- 인지 과부하: Miller의 법칙(7±2)을 초과하는 정보 단위
- Width-adaptive 전략 부재로 터미널 폭에 따른 graceful degradation 없음

### Line 1 요소별 Width Budget (현재)

| 요소 | 예시 | Visual Cols | 우선순위 |
|------|------|:-----------:|:--------:|
| Model name | `Opus 4.6` | 8 | P0 |
| Session ID | ` [51974eb8]` | 12 | P4 |
| pipeSep | ` │ ` | 3 x3 = 9 | - |
| Progress bar | `▰▰▰▰▰▰▰▱▱▱` | 10 | P1 |
| Percent | ` 37%` | 4 | P0 |
| Context hint | ` /compact` | 9 | P4 |
| Project name | `claude-code-coc…` | 16 | P2 |
| Branch | ` (main*)` | 8 | P2 |
| File stats | ` !3 +2 ✘1 ?1` | ~14 | P3 |
| Lines changed | ` +252 -193` | 10 | P3 |
| Cost | `$4.50` | 5 | P1 |
| Duration | ` 5m32s` | 6 | P0 |
| **Total** | | **~102+** | |

## 2. Research Summary

### 2.1 UI/UX Research (ux-researcher)
- **Gestalt 근접성 원리**: 색상 차이가 모노스페이스에서 강력한 그룹핑 역할
- **색상-정보 인코딩**: `getPercentColor`의 4단계 색상(green/yellow/peach/red)이 이미 위험 수준을 표현 → progress bar와 percent가 동일 정보를 중복 인코딩
- **레퍼런스 비교**: Starship(40-60자), vim-airline(60-80자) 대비 이 프로젝트(91+자)는 과밀
- **초기 제안**: progress bar 완전 제거(12자 절감), pipe→double-space(3자), session ID 제거(11자) = 26자 절감

### 2.2 Technical Architecture (tech-architect)
- **정밀 측정**: worst-case 102자 (세션명 없이), 세션명 포함 시 113자+
- **동적 요소 변동**: git activity + lines + file stats만으로 0~40 columns 범위
- **Ambiguous-width 위험**: `│`, `▰`, `▱`, `●` 등이 CJK 터미널에서 2-col 가능
- **초기 제안**: P0-P4 priority dropping, 구분자 비용 절감, 요소 압축, 멀티라인 재배분

### 2.3 Reference Implementation (ref-researcher)
- **7개 도구 분석**: Starship, Powerlevel10k, tmux, vim-airline, lualine.nvim, oh-my-posh, iTerm2
- **공통 패턴 6가지**:
  1. Priority-based Progressive Disclosure
  2. 3단계 Graceful Degradation (Full → Abbreviated → Hidden)
  3. Left-Fill-Right 레이아웃
  4. 시각적 계층으로 축약 상태 표시
  5. 컨텍스트 인식 표시
  6. Width Threshold 기반 단계적 레이아웃
- **최적 참조**: lualine.nvim (trunc() 함수), iTerm2 (priority-based layout), Powerlevel10k (시각적 피드백)

### 2.4 Critical Review (critic)
- **핵심 도전**: "어떻게 더 많이 넣을까"가 아니라 **"무엇을 보여주지 않을까"**
- **Miller's Law**: Line 1의 11개 독립 정보 단위는 인지적 과부하 (7±2 초과)
- **Progress bar 제거 반대**: pre-attentive processing 채널 상실 — 주변시(peripheral vision)에서 bar는 숫자보다 빠르게 인지
- **Separator 변경 반대**: 색맹 사용자(남성 8%), 16색 터미널 접근성 문제
- **제안**: "Radical Simplicity" — Line 1을 5개 요소로 제한, 고정 배치, adaptive engine 불필요

## 3. Debate Resolution

### 토론에서 변경된 입장

| 연구자 | 원래 주장 | 토론 후 수정 |
|--------|----------|-------------|
| ux-researcher | Progress bar 완전 제거 | **5칸 축소로 변경** (pre-attentive processing 근거 수용) |
| ux-researcher | Pipe → double-space | **철회** (접근성 문제 수용) |
| tech-architect | Priority-based dynamic dropping | **고정 배치로 변경** (muscle memory + 예측 가능성) |
| tech-architect | Width-adaptive bar (3/5/10) | **Compact에서 5 고정** (Stable Positioning 원칙) |
| ref-researcher | lualine trunc() 직접 적용 | **원리만 적용** (ANSI 환경 차이 인정) |
| critic | Radical Simplicity (bar 유지 10) | **5칸 축소 수용** (공간 절약 필요성 인정) |

## 4. Final Consensus (전원 합의)

### 4.1 핵심 원칙: "DO NOT FIT EVERYTHING"

> Line 1은 **4-5개 핵심 요소**로 제한한다.
> 나머지 정보는 하위 라인으로 이동하거나 compact에서 제거한다.

### 4.2 합의된 5가지 변경사항

#### (1) Line 1 요소를 5개로 축소
- **유지**: Model, Progress Bar(5칸), Percent, Project(branch), Cost, Duration
- **제거**: Session ID, File stats, Git activity, Lines changed, Context hint
- Lines changed(`+252 -193`)는 기존대로 Line 1의 project/branch 뒤에 유지 가능하나, overflow 시 첫 번째 drop 대상

#### (2) Progress bar 10 → 5 (compact 고정)
- **근거**: pre-attentive processing 보존 + 5칸 절감
- compact 내에서 width-adaptive 하지 않음 (Stable Positioning)
- Full 모드에서는 10칸 유지

#### (3) 고정 배치 원칙
- Dynamic rebalancing 대신 요소별 라인 위치 확정
- Muscle memory 보존, 테스트 용이성, 예측 가능한 UX
- Tier 간(minimal/compact/full)에서만 레이아웃 차이

#### (4) 렌더링 전 결정 (Pre-render Decision)
- 완성된 문자열을 truncate하지 않고, 세그먼트 variant를 조립 전에 결정
- ANSI escape code 중간 절단 문제를 근본적으로 회피
- `writer.ts`의 truncation은 마지막 안전장치로만 작동

#### (5) Separator(pipe) 유지
- 접근성 우선: 색맹(남성 8%), 16색 터미널 호환
- 문자 절약(3자)보다 시각적 그루핑이 중요

### 4.3 합의된 레이아웃

#### 80-col (compact)
```
Opus 4.6 │ ▰▰▰▱▱ 37% │ claude-co… (main*) │ $4.50 5m32s    [~62자]
● Tools: Bash+3  Edit+5  Read+7  Grep+5
● Usage: 5h:42%  7d:35%  +252 -193
```

#### 100-col (compact)
```
Opus 4.6 │ ▰▰▰▱▱ 37% │ claude-code-cockpit (main*) +252 -193 │ $4.50 5m32s  [~85자]
● Tools: Bash+3  Edit+5  Read+7  Grep+5  ✓98% ✗2% (28)
● Agents: 8 [S]general-purpose⚡37
● Usage: 5h:42%  7d:35%
```

#### 120-col → Full 모드 (renderFull) 사용

### 4.4 Width Budget 검증

**80-col Line 1** (합의안):

| 요소 | Cols |
|------|:----:|
| `Opus 4.6` | 8 |
| ` │ ` | 3 |
| `▰▰▰▱▱` (5칸 bar) | 5 |
| ` 37%` | 4 |
| ` │ ` | 3 |
| `claude-co…` (12자 project) | 11 |
| ` (main*)` | 8 |
| ` │ ` | 3 |
| `$4.50` | 5 |
| ` 5m32s` | 6 |
| **Total** | **56** |

80-col에서 **24자 여유** — 긴 모델명, 긴 브랜치, cost 증가에도 충분한 버퍼.

## 5. Unresolved Issues (향후 검토)

| 쟁점 | 설명 | 권장 |
|------|------|------|
| `/compact` context hint | 90%+에서 9자 추가로 overflow 악화 | compact에서 제거, 색상만으로 대체 |
| peach 색상 충돌 | cost와 percent(75-89%)에서 동일 색상 사용 | palette 재검토 |
| Model name 축약 | `Claude Sonnet 4.5`(18자) 등 긴 이름, `getModelName()`에 축약 로직 없음 | tier별 maxLen 추가 (tier1:8, tier2:12, tier3:20) |
| Session ID default | compact에서 `showSessionName` 기본값 | `false`로 변경 권장 |

## 6. Implementation Priority

1. **Line 1 요소 축소** — session ID, file stats, context hint 제거
2. **Progress bar 10→5** — `createProgressBar` 호출 시 length 파라미터 변경
3. **Lines changed 위치** — overflow 시 Usage 라인으로 이동
4. **Pre-render width check** — `visualLength` 체크 후 lowest-priority 요소 drop

---

*Research conducted by: ux-researcher, tech-architect, ref-researcher, critic*
*Date: 2025-02-13*
