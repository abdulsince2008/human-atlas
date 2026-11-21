import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import { ANATOMY_LESSONS } from '../learning-data';
import {
  ACADEMIC_DEPTH_LABELS,
  SYSTEM_TEACHING_METADATA,
  TOPIC_DEPTH_SUPPLEMENTS,
  type AcademicDepthTier,
} from '../learning-supplements';
import { QUIZ_QUESTIONS, type QuizQuestion } from '../quiz-data';

export interface WorksheetOptions {
  systemId: CanonicalSystemId;
  tier: AcademicDepthTier;
  includeAnswerKey?: boolean;
}

export function selectTierQuestionsForSystem(
  systemId: CanonicalSystemId,
  tier: AcademicDepthTier,
): QuizQuestion[] {
  const systemQuestions = QUIZ_QUESTIONS.filter((q) => q.systemId === systemId);
  if (tier === 'school_9_12') {
    const matched = systemQuestions.filter(
      (q) =>
        q.difficulty === 'Grades 9–10 (Matric / O-Level)' ||
        q.difficulty === 'FSc / MDCAT (11–12)',
    );
    return matched.length > 0 ? matched : systemQuestions.slice(0, 3);
  }
  if (tier === 'bs_mbbs') {
    const matched = systemQuestions.filter((q) => q.difficulty === 'MBBS / Nursing');
    return matched.length > 0 ? matched : systemQuestions.slice(0, 3);
  }
  const matched = systemQuestions.filter((q) => q.difficulty === 'BS / MPhil / PhD Research');
  return matched.length > 0 ? matched : systemQuestions.slice(0, 3);
}

export function buildEducatorWorksheetMarkdown({
  systemId,
  tier,
  includeAnswerKey = true,
}: WorksheetOptions): string {
  const system = CANONICAL_SYSTEMS.find((s) => s.id === systemId) ?? CANONICAL_SYSTEMS[0];
  const guide = SYSTEM_TEACHING_METADATA[system.id];
  const tierMeta = ACADEMIC_DEPTH_LABELS[tier];
  const systemLessons = ANATOMY_LESSONS.filter((l) => l.systemId === system.id);
  const topics = systemLessons.flatMap((l) => l.topics);
  const questions = selectTierQuestionsForSystem(system.id, tier);

  const lines: string[] = [];
  lines.push(`# Anatomy 360 — Educator Lesson & Lab Worksheet`);
  lines.push(`**System:** ${system.name.en}  `);
  lines.push(`**Academic Tier:** ${tierMeta.full}  `);
  lines.push(`**Coverage Scope:** ${system.coverageLabel}`);
  lines.push('');

  lines.push('## 1. Bloom’s Learning Objectives');
  for (const obj of guide.bloomObjectives[tier]) {
    lines.push(`- ${obj}`);
  }
  lines.push('');

  lines.push('## 2. Common Student Misconceptions to Address');
  for (const m of guide.commonMisconceptions) {
    lines.push(`- ${m}`);
  }
  lines.push('');

  lines.push('## 3. Recommended 3D Practical Spotter Structures');
  for (const spot of guide.labSpotterFocus) {
    lines.push(`- ${spot}`);
  }
  lines.push('');

  lines.push('## 4. Topic Depth Notes');
  for (const topic of topics) {
    const sup = TOPIC_DEPTH_SUPPLEMENTS[topic.id];
    lines.push(`### ${topic.title.en}`);
    lines.push(sup ? sup[tier] : topic.explanation.en);
    if (sup && tier !== 'school_9_12') {
      lines.push('');
      lines.push(`> **Quantitative / Experimental Lens:** ${sup.quantitativeOrExperimentalNote}`);
    }
    lines.push('');
  }

  if (tier === 'phd_research') {
    lines.push('## 5. Graduate / PhD Seminar Discussion Prompt');
    lines.push(guide.graduateSeminarPrompt);
    lines.push('');
  }

  lines.push(`## ${tier === 'phd_research' ? '6' : '5'}. Concept Assessment Items`);
  const optionLetters = ['A', 'B', 'C', 'D'];
  questions.forEach((q, idx) => {
    lines.push(`${idx + 1}. **[${q.difficulty}]** ${q.prompt}`);
    q.options.forEach((opt, optIdx) => {
      lines.push(`   - ${optionLetters[optIdx] ?? String(optIdx + 1)}) ${opt}`);
    });
    lines.push('');
  });

  if (includeAnswerKey) {
    lines.push('---');
    lines.push('## Instructor Answer Key & Rationale');
    questions.forEach((q, idx) => {
      const letter = optionLetters[q.correctIndex] ?? String(q.correctIndex + 1);
      const ans = q.options[q.correctIndex] ?? '';
      lines.push(`${idx + 1}. **Answer: ${letter}) ${ans}** — ${q.explanation}`);
    });
    lines.push('');
  }

  lines.push(
    '_Generated from Anatomy 360 educational reference modules. Verify alignment with local institutional syllabi and laboratory SOPs prior to examination use._',
  );

  return lines.join('\n');
}
