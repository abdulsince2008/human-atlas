import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import { CLINICAL_CASES } from '../data/clinical-data';
import { HISTOLOGY_ENTRIES } from '../data/histology-data';
import { PHYSIOLOGY_MODULES } from '../data/physiology-data';
import { EDUCATION_TOPICS, resolveExplanationForTrack } from '../education/education-content';
import { CURRICULUM_FRAMEWORKS } from '../education/education-curricula';
import type { CurriculumAuthorityId, EducationDomainId, EducationTrackId } from '../education/education-types';
import { ANATOMY_LESSONS } from '../learning-data';
import {
  ACADEMIC_DEPTH_LABELS,
  SYSTEM_TEACHING_METADATA,
  TOPIC_DEPTH_SUPPLEMENTS,
  type AcademicDepthTier,
} from '../learning-supplements';
import { QUIZ_QUESTIONS, type QuizQuestion } from '../quiz-data';
import {
  getDomainCoverageBreakdown,
  getRegistrySubjectByDomain,
  getRegistryTopicById,
  getRegistryTopicsForDomain,
  getRegistryTopicsForFramework,
  REGISTRY_COVERAGE_LABELS,
  REGISTRY_REVIEW_LABELS,
} from '../registry/knowledge-registry';
import type { RegistryTopicNode } from '../registry/registry-types';
import type { CustomSyllabusProfile } from '../syllabus/syllabus-types';

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

// ---------------------------------------------------------------------------
// Universal Educator Workspace Exporter (16 Domains + Official & Custom Syllabi)
// ---------------------------------------------------------------------------

export type UniversalExportKind = 'lecture_outline' | 'student_worksheet';

export interface UniversalEducatorExportOptions {
  sourceKind: 'domain' | 'framework' | 'custom_syllabus';
  domainId?: EducationDomainId;
  frameworkId?: CurriculumAuthorityId;
  customSyllabus?: CustomSyllabusProfile;
  orderedTopicIds?: string[];
  tier: AcademicDepthTier;
  exportKind: UniversalExportKind;
  includeAnswerKey?: boolean;
}

export interface UniversalQuizItem {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceLabel: string;
}

export function getEducatorQuestionsForTopics(
  topics: RegistryTopicNode[],
  tier: AcademicDepthTier,
): UniversalQuizItem[] {
  const out: UniversalQuizItem[] = [];
  const seen = new Set<string>();

  for (const tp of topics) {
    if (tp.sourceKind === 'education_topic') {
      const et = EDUCATION_TOPICS.find((e) => e.id === tp.id);
      if (et) {
        for (const sc of et.selfChecks) {
          if (seen.has(sc.id)) continue;
          seen.add(sc.id);
          out.push({
            id: sc.id,
            prompt: sc.question,
            options: sc.options,
            correctIndex: sc.correctIndex,
            explanation: sc.explanation,
            sourceLabel: tp.title,
          });
        }
      }
    } else if (tp.systemId) {
      for (const q of selectTierQuestionsForSystem(tp.systemId, tier)) {
        if (seen.has(q.id)) continue;
        seen.add(q.id);
        out.push({
          id: q.id,
          prompt: q.prompt,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          sourceLabel: q.difficulty,
        });
      }
    }
  }

  return out.slice(0, 12);
}

export function resolveEducatorTopicSelection(
  options: Pick<
    UniversalEducatorExportOptions,
    'sourceKind' | 'domainId' | 'frameworkId' | 'customSyllabus' | 'orderedTopicIds'
  >,
): {
  title: string;
  subtitle: string;
  topics: RegistryTopicNode[];
  knownGaps: string[];
} {
  let baseTopics: RegistryTopicNode[] = [];
  let title = 'Anatomy 360 Teaching Package';
  let subtitle = '';
  const knownGaps: string[] = [];

  if (options.sourceKind === 'domain' && options.domainId) {
    const subj = getRegistrySubjectByDomain(options.domainId);
    const breakdown = getDomainCoverageBreakdown(options.domainId);
    baseTopics = getRegistryTopicsForDomain(options.domainId);
    title = subj ? `${subj.title}` : options.domainId;
    subtitle = subj ? `Domain ${subj.code} · ${subj.coverageLabel}` : '';
    knownGaps.push(...breakdown.knownGaps);
  } else if (options.sourceKind === 'framework' && options.frameworkId) {
    const fw = CURRICULUM_FRAMEWORKS.find((f) => f.id === options.frameworkId);
    baseTopics = getRegistryTopicsForFramework(options.frameworkId);
    title = fw ? fw.title : options.frameworkId;
    subtitle = fw ? `${fw.country} · ${fw.authority} · ${fw.applicableGradesOrYears}` : '';
    knownGaps.push(
      'Curriculum framework mapping shows topic alignment only, not institutional endorsement.',
      'All topics remain pending formal academic faculty review.',
    );
  } else if (options.sourceKind === 'custom_syllabus' && options.customSyllabus) {
    const cs = options.customSyllabus;
    const seen = new Set<string>();
    for (const item of cs.items) {
      if (item.ignored) continue;
      if (item.mappings.length === 0) {
        knownGaps.push(`Unmatched syllabus topic (pending content): ${item.title}`);
        continue;
      }
      for (const m of item.mappings) {
        if (seen.has(m.registryTopicId)) continue;
        const tp = getRegistryTopicById(m.registryTopicId);
        if (tp) {
          seen.add(tp.id);
          baseTopics.push(tp);
        }
      }
    }
    title = `${cs.metadata.courseName} (${cs.metadata.institution})`;
    subtitle = `${cs.metadata.country} · ${cs.metadata.programme} · ${cs.metadata.degree} · ${cs.metadata.yearOrSemester}`;
    knownGaps.push(
      'Custom syllabus match generated locally from student/instructor syllabus text.',
    );
  }

  if (options.orderedTopicIds && options.orderedTopicIds.length > 0) {
    const byId = new Map(baseTopics.map((t) => [t.id, t]));
    const reordered: RegistryTopicNode[] = [];
    for (const tid of options.orderedTopicIds) {
      const found = byId.get(tid);
      if (found) reordered.push(found);
    }
    if (reordered.length > 0) baseTopics = reordered;
  }

  return { title, subtitle, topics: baseTopics, knownGaps };
}

export function buildUniversalEducatorMarkdown(options: UniversalEducatorExportOptions): string {
  const tierMeta = ACADEMIC_DEPTH_LABELS[options.tier];
  const { title, subtitle, topics, knownGaps } = resolveEducatorTopicSelection(options);
  const isOutline = options.exportKind === 'lecture_outline';
  const includeAnswerKey = options.includeAnswerKey ?? !isOutline;
  const questions = getEducatorQuestionsForTopics(topics, options.tier);
  const optionLetters = ['A', 'B', 'C', 'D'];

  const lines: string[] = [];
  lines.push(
    isOutline
      ? `# Anatomy 360 — Instructor Lecture & Seminar Outline`
      : `# Anatomy 360 — Student Activity & Assessment Worksheet`,
  );
  lines.push(`**Scope:** ${title}  `);
  if (subtitle) lines.push(`**Context:** ${subtitle}  `);
  lines.push(`**Academic Tier:** ${tierMeta.full}  `);
  lines.push(`**Selected Sequence Topics:** ${topics.length}`);
  lines.push('');

  lines.push('## 1. Learning Outcomes Across Sequence');
  const seenOutcomes = new Set<string>();
  for (const tp of topics) {
    for (const lo of tp.learningOutcomes) {
      if (!seenOutcomes.has(lo.statement)) {
        seenOutcomes.add(lo.statement);
        lines.push(`- ${lo.statement}`);
      }
    }
  }
  lines.push('');

  lines.push('## 2. Teaching Sequence & Topic Coverage');
  topics.forEach((tp, idx) => {
    const cov = REGISTRY_COVERAGE_LABELS[tp.coverageStatus];
    const rev = REGISTRY_REVIEW_LABELS[tp.reviewStatus];
    lines.push(`### ${idx + 1}. ${tp.title}`);
    lines.push(`*Chapter:* ${tp.chapterTitle} · *Coverage:* ${cov} · *Status:* ${rev}`);
    lines.push('');

    if (tp.sourceKind === 'anatomy_lesson_topic') {
      const sup = TOPIC_DEPTH_SUPPLEMENTS[tp.id];
      lines.push(sup ? sup[options.tier] : tp.summary);
      if (sup && options.tier !== 'school_9_12') {
        lines.push('');
        lines.push(`> **Quantitative / Mechanistic Lens:** ${sup.quantitativeOrExperimentalNote}`);
      }
    } else if (tp.sourceKind === 'education_topic') {
      const et = EDUCATION_TOPICS.find((e) => e.id === tp.id);
      const trackForTier: EducationTrackId =
        options.tier === 'school_9_12'
          ? 'secondary_premed'
          : options.tier === 'bs_mbbs'
            ? 'medical_foundations'
            : 'graduate_research';
      const tierText = et ? resolveExplanationForTrack(et, trackForTier).text : tp.summary;
      lines.push(tierText);
      if (et?.keyConcepts?.length && isOutline) {
        lines.push('');
        lines.push('**Key Terminology:**');
        for (const kc of et.keyConcepts.slice(0, 4)) {
          lines.push(`- **${kc.term}:** ${kc.definition}`);
        }
      }
    } else {
      lines.push(tp.summary);
    }

    if (isOutline && tp.resources.length > 0) {
      lines.push('');
      lines.push(
        `**Connected Platform Resources:** ${tp.resources
          .slice(0, 5)
          .map((r) => `${r.title} (${r.assetStatus === 'asset_missing' ? 'Asset missing' : r.kind.replace(/_/g, ' ')})`)
          .join('; ')}`,
      );
    }
    lines.push('');
  });

  if (isOutline && topics.some((t) => t.systemId)) {
    const firstSys = topics.find((t) => t.systemId)?.systemId;
    if (firstSys) {
      const guide = SYSTEM_TEACHING_METADATA[firstSys];
      lines.push('## 3. Common Misconceptions & Practical Spotter Focus');
      for (const m of guide.commonMisconceptions) lines.push(`- Misconception: ${m}`);
      for (const sp of guide.labSpotterFocus) lines.push(`- Practical Focus: ${sp}`);
      if (options.tier === 'phd_research') {
        lines.push('');
        lines.push(`**Graduate / PhD Seminar Prompt:** ${guide.graduateSeminarPrompt}`);
      }
      lines.push('');
    }
  }

  if (knownGaps.length > 0) {
    lines.push('## Honest Coverage & Asset Limitations');
    for (const gap of Array.from(new Set(knownGaps)).slice(0, 8)) {
      lines.push(`- ${gap}`);
    }
    lines.push('');
  }

  if (questions.length > 0) {
    lines.push('## Concept Check Assessment Items');
    questions.forEach((q, idx) => {
      lines.push(`${idx + 1}. **[${q.sourceLabel}]** ${q.prompt}`);
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
  }

  // Also cite physiology / histology / clinical links count if helpful
  const linkedPhys = PHYSIOLOGY_MODULES.filter((p) => topics.some((t) => t.systemId === p.systemId));
  const linkedHist = HISTOLOGY_ENTRIES.filter((h) => topics.some((t) => t.systemId === h.canonicalSystem));
  const linkedClin = CLINICAL_CASES.filter((c) => topics.some((t) => t.systemId === c.systemId));
  if (linkedPhys.length + linkedHist.length + linkedClin.length > 0) {
    lines.push(
      `_Cross-linked modules: ${linkedPhys.length} physiology model(s), ${linkedHist.length} histology guide(s), ${linkedClin.length} clinical scenario(s)._`,
    );
  }
  lines.push(
    '_Generated from Anatomy 360 educational reference modules. Structured reference only — not institutional certification or medical advice._',
  );

  return lines.join('\n');
}

