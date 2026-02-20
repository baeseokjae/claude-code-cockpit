export type WorkflowPhase = 'PLAN' | 'IMPLEMENT' | 'REVIEW' | 'UNKNOWN';

export interface WorkflowState {
  currentPhase: WorkflowPhase;
  phaseStartTime: Date | null;
  phaseDuration: number; // ms
  phaseHistory: Array<{
    phase: WorkflowPhase;
    startTime: Date;
    endTime: Date;
    duration: number;
  }>;
  confidence: number; // 0-100
}
