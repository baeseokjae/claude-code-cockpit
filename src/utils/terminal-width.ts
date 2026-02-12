/**
 * 터미널 폭 감지 유틸리티
 * stdout이 pipe로 연결된 경우에도 실제 터미널 폭을 감지합니다.
 */

export function getTerminalWidth(): number {
  // 1. stdout TTY (정상 동작 시)
  if (process.stdout.columns) return process.stdout.columns;

  // 2. stderr TTY (stdout이 pipe일 때)
  if (process.stderr.columns) return process.stderr.columns;

  // 3. COLUMNS 환경변수 (부모 프로세스가 설정)
  const envCols = parseInt(process.env.COLUMNS || '', 10);
  if (envCols > 0 && Number.isFinite(envCols)) return envCols;

  // 4. 기본값
  return 80;
}
