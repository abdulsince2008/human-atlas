import type { SystemId, View } from '../anatomy';
import type { CanonicalSystemId } from '../anatomy-systems';

export type ExamSystemScope = CanonicalSystemId | 'all';

export type ExamMode = 'identify' | 'locate' | 'knowledge' | 'mixed';

export type ConcreteStationMode = 'identify' | 'locate' | 'knowledge';

export type ExamDifficulty = 'foundational' | 'intermediate' | 'advanced' | 'all';

export type ConcreteDifficulty = 'foundational' | 'intermediate' | 'advanced';

export type ExamPreset = 'strict' | 'guided';

export type ExamQuestionCount = 10 | 20 | 30;

export type ExamTimerMode = 'untimed' | 'timed';

export type KnowledgeAspect =
  | 'location'
  | 'function'
  | 'classification'
  | 'relationship'
  | 'terminology';

export interface ExamConfig {
  scope: ExamSystemScope;
  mode: ExamMode;
  difficulty: ExamDifficulty;
  questionCount: number; // Supports 10, 20, 30 or exact capped available pool for narrow systems / weak practice
  timerMode: ExamTimerMode;
  secondsPerQuestion: number;
  preset: ExamPreset;
  weakPracticeConceptIds?: string[];
  label?: string;
}

export interface SpotterCandidate {
  conceptId: string;
  anatomicalName: string;
  commonName: string;
  canonicalSystem: CanonicalSystemId;
  meshSystem: SystemId;
  elementIds: string[];
  boundingSize: number;
  difficulty: ConcreteDifficulty;
  hasCuratedKnowledge: boolean;
  preferredView: View;
  regionClue: string;
  synonyms: string[];
}

export interface VerifiedExplanation {
  verifiedName: string;
  commonName?: string;
  systemName: string;
  systemId: CanonicalSystemId;
  location: string;
  mainFunction: string;
  characteristics: string[];
  terminology: { term: string; meaning: string }[];
  coverageNote?: string;
}

export interface PracticalQuestion {
  id: string;
  index: number;
  mode: ConcreteStationMode;
  difficulty: ConcreteDifficulty;
  canonicalSystem: CanonicalSystemId;
  targetConceptId: string;
  targetName: string;
  targetElementIds: string[];
  preferredView: View;
  prompt: string;
  clueText: string;
  options?: string[];
  correctIndex?: number;
  knowledgeAspect?: KnowledgeAspect;
  explanation: VerifiedExplanation;
}

export type StationStatus = 'unanswered' | 'retry_available' | 'submitted';

export interface QuestionSubmission {
  questionId: string;
  status: StationStatus;
  isCorrect: boolean;
  attemptsUsed: number;
  selectedOptionIndex?: number;
  clickedPartId?: string;
  clickedConceptId?: string;
  clickedName?: string;
  clueUsed: boolean;
  timeSpentSec: number;
  missReason?: string;
}

export interface PerSystemScore {
  systemId: CanonicalSystemId;
  systemName: string;
  correct: number;
  total: number;
  accuracyPct: number;
}

export interface ExamAttemptSummary {
  id: string;
  completedAt: number;
  scope: ExamSystemScope;
  mode: ExamMode;
  difficulty: ExamDifficulty;
  preset: ExamPreset;
  timerMode: ExamTimerMode;
  isWeakPractice: boolean;
  score: number;
  attempted: number;
  totalQuestions: number;
  accuracyPct: number;
  durationSec: number;
  timedOut: boolean;
  perSystem: PerSystemScore[];
  missedConceptIds: string[];
}

export interface WeakConceptStats {
  conceptId: string;
  name: string;
  canonicalSystem: CanonicalSystemId;
  missCount: number;
  correctCount: number;
  lastMissedAt: number;
  lastPracticedAt?: number;
}

export interface PracticalLabStorageState {
  version: 1;
  attempts: ExamAttemptSummary[];
  weakStructures: Record<string, WeakConceptStats>;
}

export interface PoolAvailability {
  totalAvailable: number;
  supports10: boolean;
  supports20: boolean;
  supports30: boolean;
  systemCoverageNote?: string;
}
