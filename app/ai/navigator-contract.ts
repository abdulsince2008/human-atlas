import {
  SYSTEMS,
  type Atlas,
  type ClipAxis,
  type Concept,
  type SystemId,
  type View,
} from '../anatomy';
import { CURATED_KNOWLEDGE } from '../anatomy-knowledge';
import type { AnatomySex, FemaleAtlasManifest } from '../female-atlas';
import type { VisualizationMode } from '../tissue-materials';

export type AiActivityRoute =
  | 'learn'
  | 'quiz'
  | 'practical-lab'
  | 'relationships'
  | 'physiology'
  | 'histology'
  | 'clinical'
  | 'present'
  | 'syllabus'
  | 'systems';

export type AiAction =
  | { type: 'switch_sex'; sex: AnatomySex }
  | { type: 'focus_structure'; query: string; isolate?: boolean; ghost?: boolean }
  | {
      type: 'set_systems';
      mode: 'only' | 'show' | 'hide' | 'all' | 'organs' | 'skeleton';
      systems: SystemId[];
    }
  | { type: 'set_camera_view'; view: View }
  | {
      type: 'set_render_mode';
      isolate?: boolean;
      ghostSurroundings?: boolean;
      xrayOpacity?: number;
      explode?: number;
      clipAxis?: ClipAxis | 'none';
      clipOffset?: number;
      visualizationMode?: VisualizationMode;
    }
  | { type: 'reset_view' }
  | { type: 'open_activity'; route: AiActivityRoute; targetId?: string; label?: string };

export interface AiNavigatorResponsePayload {
  reply: string;
  studyTip?: string;
  actions: AiAction[];
  followUpSuggestions: string[];
}

export interface AiExplorerContext {
  anatomySex: AnatomySex;
  selectedConceptId?: string | null;
  selectedConceptName?: string | null;
  visibleSystems: SystemId[];
  studyTrack?: string;
  candidateConcepts?: Array<{ id: string; name: string }>;
}

const VALID_SYSTEM_IDS = new Set<SystemId>(SYSTEMS.map((s) => s.id));
const VALID_VIEWS = new Set<View>(['three-quarter', 'front', 'back', 'left', 'right']);
const VALID_CLIP_AXES = new Set<ClipAxis | 'none'>(['x', 'y', 'z', 'none']);
const VALID_VIS_MODES = new Set<VisualizationMode>([
  'natural',
  'system_highlight',
  'tissue_classification',
  'regional_brain',
]);
const VALID_ACTIVITY_ROUTES = new Set<AiActivityRoute>([
  'learn',
  'quiz',
  'practical-lab',
  'relationships',
  'physiology',
  'histology',
  'clinical',
  'present',
  'syllabus',
  'systems',
]);

const FEMALE_HINT_TERMS = new Set([
  'uterus',
  'endometrium',
  'cervix',
  'ovary',
  'ovaries',
  'fallopian',
  'uterine tube',
  'vagina',
  'clitoris',
  'vulva',
  'labia',
  'mammary',
  'breast',
  'broad ligament',
  'uterine artery',
  'female pelvis',
  'female bladder',
]);

const MALE_HINT_TERMS = new Set([
  'prostate',
  'prostatic utricle',
  'ejaculatory duct',
  'seminal colliculus',
  'testis',
  'testes',
  'testicle',
  'epididymis',
  'seminal vesicle',
  'deferent duct',
  'vas deferens',
  'penis',
  'glans penis',
  'corpus cavernosum',
  'corpus spongiosum',
  'male pelvis',
  'male coccyx',
]);

export function inferRequiredSexFromQuery(text: string): AnatomySex | null {
  const lower = text.toLowerCase();
  for (const term of FEMALE_HINT_TERMS) {
    if (lower.includes(term)) return 'female';
  }
  for (const term of MALE_HINT_TERMS) {
    if (lower.includes(term)) return 'male';
  }
  return null;
}

export function resolveConceptForAiQuery(
  query: string,
  activeAtlas: Atlas | null,
  femaleOverlay?: FemaleAtlasManifest | null,
): { concept: Concept; requiresSex?: AnatomySex } | null {
  const term = query.trim().toLowerCase();
  if (!term || !activeAtlas) return null;

  const findInConcepts = (concepts: Concept[]): Concept | null => {
    const byId = concepts.find((c) => c.id.toLowerCase() === term);
    if (byId) return byId;

    const exact = concepts.find((c) => c.name.toLowerCase() === term);
    if (exact) return exact;

    const conceptMap = new Map(concepts.map((c) => [c.id, c]));
    for (const k of CURATED_KNOWLEDGE) {
      if (!k.inModel) continue;
      if (
        k.commonName.toLowerCase() === term ||
        k.synonyms.some((syn) => syn.toLowerCase() === term)
      ) {
        const hit = conceptMap.get(k.conceptId);
        if (hit) return hit;
      }
    }

    const prefixHits = concepts
      .filter((c) => c.name.toLowerCase().startsWith(term))
      .sort((a, b) => a.name.length - b.name.length);
    if (prefixHits.length > 0) return prefixHits[0];

    for (const k of CURATED_KNOWLEDGE) {
      if (!k.inModel) continue;
      if (
        k.commonName.toLowerCase().includes(term) ||
        k.synonyms.some((syn) => syn.toLowerCase().includes(term))
      ) {
        const hit = conceptMap.get(k.conceptId);
        if (hit) return hit;
      }
    }

    const partialHits = concepts
      .filter((c) => c.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.length - b.name.length);
    return partialHits[0] ?? null;
  };

  const activeMatch = findInConcepts(activeAtlas.concepts);
  if (activeMatch) {
    return { concept: activeMatch };
  }

  if (femaleOverlay) {
    const femaleMatch = findInConcepts(femaleOverlay.concepts);
    if (femaleMatch) {
      return { concept: femaleMatch, requiresSex: 'female' };
    }
  }

  return null;
}

export function validateAndNormalizeAiResponse(raw: unknown): AiNavigatorResponsePayload {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const reply =
    typeof obj.reply === 'string' && obj.reply.trim()
      ? obj.reply.trim().slice(0, 1400)
      : 'Here is how we can explore that in Anatomy 360.';
  const studyTip =
    typeof obj.studyTip === 'string' && obj.studyTip.trim()
      ? obj.studyTip.trim().slice(0, 260)
      : undefined;

  const followUpSuggestions = Array.isArray(obj.followUpSuggestions)
    ? obj.followUpSuggestions
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim().slice(0, 90))
        .slice(0, 3)
    : [];

  const actions: AiAction[] = [];
  if (Array.isArray(obj.actions)) {
    for (const item of obj.actions.slice(0, 6)) {
      if (!item || typeof item !== 'object') continue;
      const a = item as Record<string, unknown>;
      switch (a.type) {
        case 'switch_sex': {
          if (a.sex === 'male' || a.sex === 'female') {
            actions.push({ type: 'switch_sex', sex: a.sex });
          }
          break;
        }
        case 'focus_structure': {
          if (typeof a.query === 'string' && a.query.trim()) {
            actions.push({
              type: 'focus_structure',
              query: a.query.trim().slice(0, 120),
              isolate: typeof a.isolate === 'boolean' ? a.isolate : undefined,
              ghost: typeof a.ghost === 'boolean' ? a.ghost : undefined,
            });
          }
          break;
        }
        case 'set_systems': {
          const mode =
            a.mode === 'only' ||
            a.mode === 'show' ||
            a.mode === 'hide' ||
            a.mode === 'all' ||
            a.mode === 'organs' ||
            a.mode === 'skeleton'
              ? a.mode
              : null;
          if (!mode) break;
          const systems = Array.isArray(a.systems)
            ? a.systems.filter((s): s is SystemId => VALID_SYSTEM_IDS.has(s as SystemId))
            : [];
          actions.push({ type: 'set_systems', mode, systems });
          break;
        }
        case 'set_camera_view': {
          if (VALID_VIEWS.has(a.view as View)) {
            actions.push({ type: 'set_camera_view', view: a.view as View });
          }
          break;
        }
        case 'set_render_mode': {
          const next: Extract<AiAction, { type: 'set_render_mode' }> = {
            type: 'set_render_mode',
          };
          if (typeof a.isolate === 'boolean') next.isolate = a.isolate;
          if (typeof a.ghostSurroundings === 'boolean') next.ghostSurroundings = a.ghostSurroundings;
          if (typeof a.xrayOpacity === 'number' && Number.isFinite(a.xrayOpacity)) {
            next.xrayOpacity = Math.max(0.05, Math.min(1, a.xrayOpacity));
          }
          if (typeof a.explode === 'number' && Number.isFinite(a.explode)) {
            next.explode = Math.max(0, Math.min(1, a.explode));
          }
          if (VALID_CLIP_AXES.has(a.clipAxis as ClipAxis | 'none')) {
            next.clipAxis = a.clipAxis as ClipAxis | 'none';
          }
          if (typeof a.clipOffset === 'number' && Number.isFinite(a.clipOffset)) {
            next.clipOffset = Math.max(0, Math.min(1, a.clipOffset));
          }
          if (VALID_VIS_MODES.has(a.visualizationMode as VisualizationMode)) {
            next.visualizationMode = a.visualizationMode as VisualizationMode;
          }
          actions.push(next);
          break;
        }
        case 'reset_view': {
          actions.push({ type: 'reset_view' });
          break;
        }
        case 'open_activity': {
          if (VALID_ACTIVITY_ROUTES.has(a.route as AiActivityRoute)) {
            actions.push({
              type: 'open_activity',
              route: a.route as AiActivityRoute,
              targetId: typeof a.targetId === 'string' ? a.targetId.slice(0, 80) : undefined,
              label: typeof a.label === 'string' ? a.label.slice(0, 80) : undefined,
            });
          }
          break;
        }
      }
    }
  }

  return { reply, studyTip, actions, followUpSuggestions };
}

export function buildAiSystemPrompt(context: AiExplorerContext): string {
  const candidatesLine =
    context.candidateConcepts && context.candidateConcepts.length > 0
      ? context.candidateConcepts.map((c) => `${c.id}:${c.name}`).join(', ')
      : 'Use standard FMA / BodyParts3D anatomical names.';

  return [
    'You are the built-in Anatomy 360 Study & 3D Navigation Assistant.',
    'Help medical, FSc, MDCAT, nursing, and biology students understand anatomy and control the live 3D model effortlessly.',
    'Keep explanations scientifically accurate, concise (2-5 crisp sentences), and tailored to the active student context.',
    '',
    'Current 3D Explorer Context:',
    `- Active Anatomical Sex Model: ${context.anatomySex}`,
    `- Currently Selected Structure: ${context.selectedConceptName ?? 'None'}${context.selectedConceptId ? ` (${context.selectedConceptId})` : ''}`,
    `- Visible Systems: ${context.visibleSystems.join(', ') || 'None'}`,
    `- Student Track: ${context.studyTrack ?? 'MBBS / Medical'}`,
    `- Candidate Atlas Structures: ${candidatesLine}`,
    '',
    'Action Rules:',
    '- Always respond with valid JSON matching the schema.',
    '- When the user asks to view, inspect, isolate, highlight, cut, rotate, or switch male/female anatomy, emit matching typed actions in "actions".',
    '- Available system IDs: skeletal, muscular, cardiac, sensory, arterial, venous, nervous, respiratory, digestive, urinary, lymphatic, endocrine, reproductive, integumentary, connective.',
    '- If the user asks about female structures (uterus, ovary, Fallopian tube, vagina, clitoris, mammary gland, broad ligament) while on male, emit switch_sex="female" BEFORE focus_structure.',
    '- If the user asks about male structures (prostate, testis, epididymis, seminal vesicle, penis) while on female, emit switch_sex="male" BEFORE focus_structure.',
    '- Only emit open_activity when the student asks to take a quiz, flashcards, practical lab, relationships, physiology simulation, histology, clinical cases, 3D presentations, or syllabus view.',
  ].join('\n');
}
