import type { Atlas, Part } from '../anatomy';
import { CURATED_KNOWLEDGE, lookupStructureKnowledge, type StructureKnowledge } from '../anatomy-knowledge';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import { ANATOMY_LESSONS } from '../learning-data';
import { QUIZ_QUESTIONS } from '../quiz-data';
import { buildSpotterCatalog } from './catalog';
import type {
  ConcreteDifficulty,
  ConcreteStationMode,
  ExamConfig,
  ExamDifficulty,
  ExamMode,
  ExamSystemScope,
  KnowledgeAspect,
  PoolAvailability,
  PracticalQuestion,
  SpotterCandidate,
  VerifiedExplanation,
} from './types';

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeToken(s: string): string {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function areLikelySynonyms(a: SpotterCandidate, b: SpotterCandidate): boolean {
  const aNames = [a.anatomicalName, a.commonName, ...a.synonyms].map(normalizeToken);
  const bNames = [b.anatomicalName, b.commonName, ...b.synonyms].map(normalizeToken);
  for (const na of aNames) {
    if (!na) continue;
    for (const nb of bNames) {
      if (!nb) continue;
      if (na === nb) return true;
    }
  }
  return false;
}

function stripSidePrefix(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(left|right)\s+/i, '')
    .trim();
}

function buildExplanation(
  candidate: SpotterCandidate,
  knowledge?: StructureKnowledge,
): VerifiedExplanation {
  const sys = CANONICAL_SYSTEMS.find((s) => s.id === candidate.canonicalSystem);
  const resolved =
    knowledge ??
    lookupStructureKnowledge(candidate.conceptId, candidate.anatomicalName, candidate.meshSystem);

  return {
    verifiedName: candidate.anatomicalName,
    commonName:
      candidate.commonName !== candidate.anatomicalName ? candidate.commonName : undefined,
    systemName: sys?.name.en ?? 'Anatomical System',
    systemId: candidate.canonicalSystem,
    location: resolved.location.en,
    mainFunction: resolved.mainFunction.en,
    characteristics: resolved.characteristics,
    terminology: resolved.terminology,
    coverageNote:
      sys && sys.coverage !== 'full' ? sys.coverageNote : undefined,
  };
}

interface KnowledgeSeed {
  id: string;
  conceptId: string;
  systemId: CanonicalSystemId;
  difficulty: ConcreteDifficulty;
  aspect: KnowledgeAspect;
  prompt: string;
  options: string[];
  correctIndex: number;
  clueText: string;
  explanationText?: string;
}

function buildKnowledgeQuestionBank(catalog: SpotterCandidate[]): KnowledgeSeed[] {
  const candidateMap = new Map(catalog.map((c) => [c.conceptId, c]));
  const curatedInModel = CURATED_KNOWLEDGE.filter(
    (k) => k.inModel && candidateMap.has(k.conceptId),
  );
  const seeds: KnowledgeSeed[] = [];

  const pickDistractors = (
    target: StructureKnowledge,
    extractor: (item: StructureKnowledge) => string | undefined,
  ): string[] => {
    const targetVal = extractor(target)?.trim();
    if (!targetVal) return [];

    // Prefer same system first, then other curated structures with non-overlapping text
    const sameSystem = shuffleArray(
      curatedInModel.filter(
        (other) =>
          other.conceptId !== target.conceptId && other.canonicalSystem === target.canonicalSystem,
      ),
    );
    const otherSystems = shuffleArray(
      curatedInModel.filter(
        (other) =>
          other.conceptId !== target.conceptId && other.canonicalSystem !== target.canonicalSystem,
      ),
    );

    const chosen: string[] = [];
    const seen = new Set<string>([targetVal.toLowerCase()]);
    for (const candidate of [...sameSystem, ...otherSystems]) {
      const val = extractor(candidate)?.trim();
      if (!val || val.length < 10) continue;
      const key = val.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      chosen.push(val);
      if (chosen.length === 3) break;
    }
    return chosen;
  };

  for (const item of curatedInModel) {
    const cand = candidateMap.get(item.conceptId);
    if (!cand) continue;
    const escapedName = item.anatomicalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hideName = (text: string) =>
      text.replace(new RegExp(escapedName, 'gi'), 'this structure');

    // 1. Primary Function question
    const funcDistractors = pickDistractors(item, (k) => k.mainFunction.en);
    if (funcDistractors.length === 3) {
      const mixed = shuffleArray([item.mainFunction.en, ...funcDistractors]);
      seeds.push({
        id: `know-func-${item.conceptId}`,
        conceptId: item.conceptId,
        systemId: cand.canonicalSystem,
        difficulty: cand.difficulty,
        aspect: 'function',
        prompt: `What is the primary anatomical function of the ${item.anatomicalName}?`,
        options: mixed,
        correctIndex: mixed.indexOf(item.mainFunction.en),
        clueText: `${CANONICAL_SYSTEMS.find((s) => s.id === cand.canonicalSystem)?.name.en ?? ''} · Focus on its primary physiological role.`,
      });
    }

    // 2. Anatomical Location question
    const locDistractors = pickDistractors(item, (k) => hideName(k.location.en));
    const cleanLocation = hideName(item.location.en);
    if (locDistractors.length === 3 && !cleanLocation.toLowerCase().includes('not yet authored')) {
      const mixed = shuffleArray([cleanLocation, ...locDistractors]);
      seeds.push({
        id: `know-loc-${item.conceptId}`,
        conceptId: item.conceptId,
        systemId: cand.canonicalSystem,
        difficulty: cand.difficulty,
        aspect: 'location',
        prompt: `Which anatomical description accurately locates the ${item.anatomicalName}?`,
        options: mixed,
        correctIndex: mixed.indexOf(cleanLocation),
        clueText: `${CANONICAL_SYSTEMS.find((s) => s.id === cand.canonicalSystem)?.name.en ?? ''} · Consider its body cavity or skeletal compartment.`,
      });
    }

    // 3. Anatomical Classification question
    if (item.classification) {
      const classDistractors = pickDistractors(item, (k) => k.classification);
      if (classDistractors.length === 3) {
        const mixed = shuffleArray([item.classification, ...classDistractors]);
        seeds.push({
          id: `know-class-${item.conceptId}`,
          conceptId: item.conceptId,
          systemId: cand.canonicalSystem,
          difficulty: cand.difficulty === 'foundational' ? 'intermediate' : cand.difficulty,
          aspect: 'classification',
          prompt: `How is the ${item.anatomicalName} anatomically classified?`,
          options: mixed,
          correctIndex: mixed.indexOf(item.classification),
          clueText: `Think about tissue organization and structural category within ${CANONICAL_SYSTEMS.find((s) => s.id === cand.canonicalSystem)?.name.en ?? 'its system'}.`,
        });
      }
    }

    // 4. Terminology question
    if (item.terminology.length > 0) {
      const termEntry = item.terminology[0];
      const allTermMeanings = curatedInModel
        .flatMap((k) =>
          k.conceptId !== item.conceptId ? k.terminology.map((t) => t.meaning) : [],
        )
        .filter((m) => m.toLowerCase() !== termEntry.meaning.toLowerCase());
      const distinctDistractors = shuffleArray(Array.from(new Set(allTermMeanings))).slice(0, 3);
      if (distinctDistractors.length === 3) {
        const mixed = shuffleArray([termEntry.meaning, ...distinctDistractors]);
        seeds.push({
          id: `know-term-${item.conceptId}`,
          conceptId: item.conceptId,
          systemId: cand.canonicalSystem,
          difficulty: 'advanced',
          aspect: 'terminology',
          prompt: `In relation to the ${item.anatomicalName}, what does the anatomical term "${termEntry.term}" denote?`,
          options: mixed,
          correctIndex: mixed.indexOf(termEntry.meaning),
          clueText: `Related to ${item.anatomicalName} (${CANONICAL_SYSTEMS.find((s) => s.id === cand.canonicalSystem)?.name.en ?? ''}).`,
        });
      }
    }
  }

  // 5. Relationship & Quiz Bank verified questions mapped to modeled concepts
  for (const lesson of ANATOMY_LESSONS) {
    for (const topic of lesson.topics) {
      const primaryCid = topic.conceptIds.find((cid) => candidateMap.has(cid));
      const cand = primaryCid ? candidateMap.get(primaryCid) : undefined;
      if (!cand || topic.relationships.length === 0) continue;
      const targetRel = topic.relationships[0];
      const otherRels = ANATOMY_LESSONS.flatMap((l) =>
        l.systemId !== lesson.systemId ? l.topics.flatMap((t) => t.relationships) : [],
      ).filter((r) => r.toLowerCase() !== targetRel.toLowerCase());
      const distractors = shuffleArray(Array.from(new Set(otherRels))).slice(0, 3);
      if (distractors.length === 3) {
        const mixed = shuffleArray([targetRel, ...distractors]);
        seeds.push({
          id: `know-rel-${topic.id}`,
          conceptId: cand.conceptId,
          systemId: lesson.systemId,
          difficulty: cand.difficulty,
          aspect: 'relationship',
          prompt: `Which statement accurately describes an anatomical relationship of ${topic.title.en} (${cand.anatomicalName})?`,
          options: mixed,
          correctIndex: mixed.indexOf(targetRel),
          clueText: `Recall neighboring organs or compartments studied in ${lesson.chapter}.`,
        });
      }
    }
  }

  for (const q of QUIZ_QUESTIONS) {
    const cand = candidateMap.get(q.relatedConceptId);
    if (!cand) continue;
    const mappedDifficulty =
      q.difficulty === 'Grades 9–10 (Matric / O-Level)' || q.difficulty === 'FSc / MDCAT (11–12)'
        ? 'foundational'
        : q.difficulty === 'BS / MPhil / PhD Research'
          ? 'advanced'
          : 'intermediate';
    seeds.push({
      id: `know-quiz-${q.id}`,
      conceptId: cand.conceptId,
      systemId: q.systemId,
      difficulty: mappedDifficulty,
      aspect: 'function',
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      clueText: cand.regionClue,
      explanationText: q.explanation,
    });
  }

  return seeds;
}

function matchesDifficulty(
  itemDiff: ConcreteDifficulty,
  filter: ExamDifficulty,
): boolean {
  return filter === 'all' || itemDiff === filter;
}

function filterCandidates(
  catalog: SpotterCandidate[],
  scope: ExamSystemScope,
  difficulty: ExamDifficulty,
  customConceptIds?: string[],
): SpotterCandidate[] {
  if (customConceptIds && customConceptIds.length > 0) {
    const idSet = new Set(customConceptIds);
    return catalog.filter((c) => idSet.has(c.conceptId));
  }
  return catalog.filter(
    (c) =>
      (scope === 'all' || c.canonicalSystem === scope) &&
      matchesDifficulty(c.difficulty, difficulty),
  );
}

export function calculatePoolAvailability(
  atlas: Atlas,
  scope: ExamSystemScope,
  mode: ExamMode,
  difficulty: ExamDifficulty,
  customConceptIds?: string[],
): PoolAvailability {
  const catalog = buildSpotterCatalog(atlas);
  const matchingCandidates = filterCandidates(catalog, scope, difficulty, customConceptIds);
  const sysInfo = scope === 'all' ? undefined : CANONICAL_SYSTEMS.find((s) => s.id === scope);

  let totalAvailable = 0;

  if (mode === 'identify' || mode === 'locate') {
    totalAvailable = matchingCandidates.length;
  } else if (mode === 'knowledge') {
    const bank = buildKnowledgeQuestionBank(catalog).filter(
      (s) =>
        (customConceptIds && customConceptIds.length > 0
          ? customConceptIds.includes(s.conceptId)
          : (scope === 'all' || s.systemId === scope) &&
            matchesDifficulty(s.difficulty, difficulty)),
    );
    // Count distinct (conceptId, aspect) or total unique knowledge prompts
    totalAvailable = bank.length;
  } else {
    // Mixed: unique target concepts across identify / locate / knowledge
    totalAvailable = matchingCandidates.length;
  }

  return {
    totalAvailable,
    supports10: totalAvailable >= 10,
    supports20: totalAvailable >= 20,
    supports30: totalAvailable >= 30,
    systemCoverageNote:
      sysInfo && sysInfo.coverage !== 'full' ? sysInfo.coverageNote : undefined,
  };
}

function pickIdentifyDistractors(
  target: SpotterCandidate,
  catalog: SpotterCandidate[],
): SpotterCandidate[] {
  const sameSystem = shuffleArray(
    catalog.filter(
      (c) =>
        c.conceptId !== target.conceptId &&
        c.canonicalSystem === target.canonicalSystem &&
        !areLikelySynonyms(target, c) &&
        stripSidePrefix(c.anatomicalName) !== stripSidePrefix(target.anatomicalName),
    ),
  );

  // If a tiny system still lacks 3 non-lateralized distractors (e.g., Urinary: Left/Right kidney),
  // allow opposite side as a genuine anatomical side-discrimination distractor
  const sameSystemWithSide = shuffleArray(
    catalog.filter(
      (c) =>
        c.conceptId !== target.conceptId &&
        c.canonicalSystem === target.canonicalSystem &&
        !areLikelySynonyms(target, c),
    ),
  );

  // Last-resort curated organs from adjacent systems (only for tiny systems like Lymphatic which has 3 parts)
  const fallbackCurated = shuffleArray(
    catalog.filter(
      (c) =>
        c.conceptId !== target.conceptId &&
        c.canonicalSystem !== target.canonicalSystem &&
        c.hasCuratedKnowledge &&
        !areLikelySynonyms(target, c),
    ),
  );

  const chosen: SpotterCandidate[] = [];
  const usedNames = new Set<string>([target.anatomicalName.toLowerCase()]);

  for (const pool of [sameSystem, sameSystemWithSide, fallbackCurated]) {
    for (const c of pool) {
      const key = c.anatomicalName.toLowerCase();
      if (usedNames.has(key)) continue;
      usedNames.add(key);
      chosen.push(c);
      if (chosen.length === 3) return chosen;
    }
  }

  return chosen;
}

export function generatePracticalExam(
  atlas: Atlas,
  config: ExamConfig,
): PracticalQuestion[] {
  const catalog = buildSpotterCatalog(atlas);
  const knowledgeBank = buildKnowledgeQuestionBank(catalog);
  const candidateMap = new Map(catalog.map((c) => [c.conceptId, c]));
  const matching = shuffleArray(
    filterCandidates(catalog, config.scope, config.difficulty, config.weakPracticeConceptIds),
  );

  // Prioritize curated structures mixed cleanly with non-curated atlas structures
  const curatedFirst = [
    ...shuffleArray(matching.filter((c) => c.hasCuratedKnowledge)),
    ...shuffleArray(matching.filter((c) => !c.hasCuratedKnowledge)),
  ];

  const desiredCount = Math.max(1, config.questionCount);
  const questions: PracticalQuestion[] = [];

  const createIdentifyQuestion = (cand: SpotterCandidate, idx: number): PracticalQuestion | null => {
    const distractors = pickIdentifyDistractors(cand, catalog);
    if (distractors.length < 3) return null;
    const rawOptions = [cand.anatomicalName, ...distractors.map((d) => d.anatomicalName)];
    const options = shuffleArray(rawOptions);
    const sysName = CANONICAL_SYSTEMS.find((s) => s.id === cand.canonicalSystem)?.name.en ?? '';
    const hasSidePrefix = /^(left|right)\s+/i.test(cand.anatomicalName);

    return {
      id: `q-id-${cand.conceptId}-${idx}`,
      index: idx,
      mode: 'identify',
      difficulty: cand.difficulty,
      canonicalSystem: cand.canonicalSystem,
      targetConceptId: cand.conceptId,
      targetName: cand.anatomicalName,
      targetElementIds: cand.elementIds,
      preferredView: cand.preferredView,
      prompt: hasSidePrefix
        ? `Identify the highlighted 3D anatomical structure (${sysName}, pay attention to anatomical side).`
        : `Identify the highlighted 3D anatomical structure (${sysName}).`,
      clueText: cand.regionClue,
      options,
      correctIndex: options.indexOf(cand.anatomicalName),
      explanation: buildExplanation(cand),
    };
  };

  const createLocateQuestion = (cand: SpotterCandidate, idx: number): PracticalQuestion => {
    const sysName = CANONICAL_SYSTEMS.find((s) => s.id === cand.canonicalSystem)?.name.en ?? '';
    return {
      id: `q-loc-${cand.conceptId}-${idx}`,
      index: idx,
      mode: 'locate',
      difficulty: cand.difficulty,
      canonicalSystem: cand.canonicalSystem,
      targetConceptId: cand.conceptId,
      targetName: cand.anatomicalName,
      targetElementIds: cand.elementIds,
      preferredView: cand.preferredView,
      prompt: `Locate and click on the 3D model: ${cand.anatomicalName}`,
      clueText: `${sysName} · ${cand.regionClue.replace(`${sysName} · `, '')}`,
      explanation: buildExplanation(cand),
    };
  };

  if (config.mode === 'identify') {
    for (const cand of curatedFirst) {
      if (questions.length >= desiredCount) break;
      const q = createIdentifyQuestion(cand, questions.length);
      if (q) questions.push(q);
    }
  } else if (config.mode === 'locate') {
    for (const cand of curatedFirst) {
      if (questions.length >= desiredCount) break;
      questions.push(createLocateQuestion(cand, questions.length));
    }
  } else if (config.mode === 'knowledge') {
    const matchingSeeds = shuffleArray(
      knowledgeBank.filter((s) =>
        config.weakPracticeConceptIds && config.weakPracticeConceptIds.length > 0
          ? config.weakPracticeConceptIds.includes(s.conceptId)
          : (config.scope === 'all' || s.systemId === config.scope) &&
            matchesDifficulty(s.difficulty, config.difficulty),
      ),
    );

    const usedConceptIds = new Set<string>();
    const deferredSeeds: KnowledgeSeed[] = [];

    for (const seed of matchingSeeds) {
      if (questions.length >= desiredCount) break;
      if (usedConceptIds.has(seed.conceptId)) {
        deferredSeeds.push(seed);
        continue;
      }
      const cand = candidateMap.get(seed.conceptId);
      if (!cand) continue;
      usedConceptIds.add(seed.conceptId);
      const exp = buildExplanation(cand);
      if (seed.explanationText) {
        exp.mainFunction = seed.explanationText;
      }
      questions.push({
        id: `${seed.id}-${questions.length}`,
        index: questions.length,
        mode: 'knowledge',
        difficulty: seed.difficulty,
        canonicalSystem: seed.systemId,
        targetConceptId: cand.conceptId,
        targetName: cand.anatomicalName,
        targetElementIds: cand.elementIds,
        preferredView: cand.preferredView,
        prompt: seed.prompt,
        clueText: seed.clueText,
        options: seed.options,
        correctIndex: seed.correctIndex,
        knowledgeAspect: seed.aspect,
        explanation: exp,
      });
    }

    // If single system has more requested questions than distinct curated organs, use different knowledge aspects (location vs function vs terminology)
    for (const seed of deferredSeeds) {
      if (questions.length >= desiredCount) break;
      const cand = candidateMap.get(seed.conceptId);
      if (!cand) continue;
      const exp = buildExplanation(cand);
      if (seed.explanationText) {
        exp.mainFunction = seed.explanationText;
      }
      questions.push({
        id: `${seed.id}-${questions.length}`,
        index: questions.length,
        mode: 'knowledge',
        difficulty: seed.difficulty,
        canonicalSystem: seed.systemId,
        targetConceptId: cand.conceptId,
        targetName: cand.anatomicalName,
        targetElementIds: cand.elementIds,
        preferredView: cand.preferredView,
        prompt: seed.prompt,
        clueText: seed.clueText,
        options: seed.options,
        correctIndex: seed.correctIndex,
        knowledgeAspect: seed.aspect,
        explanation: exp,
      });
    }
  } else {
    // Mixed examination: alternate identify -> locate -> knowledge across unique target concepts
    const rotation: ConcreteStationMode[] = ['identify', 'locate', 'knowledge'];
    const usedIds = new Set<string>();
    const knowledgeByConcept = new Map<string, KnowledgeSeed[]>();
    for (const s of shuffleArray(knowledgeBank)) {
      const list = knowledgeByConcept.get(s.conceptId) ?? [];
      list.push(s);
      knowledgeByConcept.set(s.conceptId, list);
    }

    for (const cand of curatedFirst) {
      if (questions.length >= desiredCount) break;
      if (usedIds.has(cand.conceptId)) continue;

      const preferredMode = rotation[questions.length % rotation.length];
      const seeds = knowledgeByConcept.get(cand.conceptId);

      if (preferredMode === 'knowledge' && seeds && seeds.length > 0) {
        const seed = seeds[0];
        usedIds.add(cand.conceptId);
        const exp = buildExplanation(cand);
        if (seed.explanationText) exp.mainFunction = seed.explanationText;
        questions.push({
          id: `mix-know-${cand.conceptId}-${questions.length}`,
          index: questions.length,
          mode: 'knowledge',
          difficulty: seed.difficulty,
          canonicalSystem: cand.canonicalSystem,
          targetConceptId: cand.conceptId,
          targetName: cand.anatomicalName,
          targetElementIds: cand.elementIds,
          preferredView: cand.preferredView,
          prompt: seed.prompt,
          clueText: seed.clueText,
          options: seed.options,
          correctIndex: seed.correctIndex,
          knowledgeAspect: seed.aspect,
          explanation: exp,
        });
      } else if (preferredMode === 'identify' || (preferredMode === 'knowledge' && questions.length % 2 === 0)) {
        const q = createIdentifyQuestion(cand, questions.length);
        if (q) {
          usedIds.add(cand.conceptId);
          questions.push(q);
        }
      } else {
        usedIds.add(cand.conceptId);
        questions.push(createLocateQuestion(cand, questions.length));
      }
    }
  }

  return questions.map((q, i) => ({ ...q, index: i }));
}

export function evaluateLocateSelection(
  question: PracticalQuestion,
  clickedPartId: string,
  atlas: Atlas,
): {
  isCorrect: boolean;
  clickedConceptId: string;
  clickedName: string;
  missReason?: string;
} {
  const partMap = new Map<string, Part>(atlas.parts.map((p) => [p.id, p]));
  const conceptMap = new Map(atlas.concepts.map((c) => [c.id, c]));

  const clickedPart = partMap.get(clickedPartId);
  if (!clickedPart) {
    return {
      isCorrect: false,
      clickedConceptId: '',
      clickedName: 'Unknown mesh',
      missReason: 'Could not resolve the selected 3D mesh in the atlas.',
    };
  }

  const clickedConcept = conceptMap.get(clickedPart.conceptId);
  const clickedKnowledge = lookupStructureKnowledge(
    clickedPart.conceptId,
    clickedConcept?.name ?? clickedPart.name,
    clickedPart.system,
  );
  const clickedName = clickedKnowledge.anatomicalName;

  // Check exact mesh membership in targetConcept.elements OR direct concept ID equality
  const isCorrect =
    question.targetElementIds.includes(clickedPartId) ||
    clickedPart.conceptId === question.targetConceptId;

  if (isCorrect) {
    return {
      isCorrect: true,
      clickedConceptId: clickedPart.conceptId,
      clickedName,
    };
  }

  const clickedSys = CANONICAL_SYSTEMS.find((s) => s.id === clickedKnowledge.canonicalSystem);
  const targetLeftRight = /^(left|right)\s+/i.exec(question.targetName)?.[1]?.toLowerCase();
  const clickedLeftRight = /^(left|right)\s+/i.exec(clickedName)?.[1]?.toLowerCase();
  const sameSideRoot =
    targetLeftRight &&
    clickedLeftRight &&
    targetLeftRight !== clickedLeftRight &&
    stripSidePrefix(question.targetName) === stripSidePrefix(clickedName);

  const missReason = sameSideRoot
    ? `You selected ${clickedName} instead of ${question.targetName} — remember anatomical left/right corresponds to the model's own orientation.`
    : `You selected ${clickedName} (${clickedSys?.name.en ?? clickedPart.system}) instead of ${question.targetName}.`;

  return {
    isCorrect: false,
    clickedConceptId: clickedPart.conceptId,
    clickedName,
    missReason,
  };
}
