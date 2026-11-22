import type { EducationDomainId } from '../education/education-types';
import { getRegistryTopicById, REGISTRY_TOPICS } from '../registry/knowledge-registry';
import type { RegistryTopicNode } from '../registry/registry-types';
import type {
  CustomSyllabusItem,
  MappingConfidence,
  ParsedSyllabusDraftItem,
  SyllabusCoverageCategory,
  SyllabusCoverageReport,
  SyllabusItemMapping,
  SyllabusItemReportRow,
} from './syllabus-types';

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'into',
  'that',
  'this',
  'overview',
  'introduction',
  'principles',
  'fundamentals',
  'basic',
  'general',
  'system',
  'systems',
  'human',
  'anatomy',
  'physiology',
  'structure',
  'function',
  'study',
  'module',
  'unit',
  'chapter',
  'week',
]);

const MEDICAL_SYNONYMS: Record<string, string[]> = {
  cvs: ['cardiovascular', 'heart', 'coronary', 'aorta'],
  heart: ['cardiovascular', 'cardiac'],
  cardiac: ['heart', 'cardiovascular', 'ventricle', 'atrium'],
  coronary: ['heart', 'cardiovascular', 'coronary'],
  ecg: ['cardiac', 'heart', 'conduction'],
  brain: ['nervous', 'cerebrum', 'neuro'],
  cns: ['nervous', 'brain', 'cerebrum', 'cerebellum', 'brainstem', 'spinal'],
  pns: ['nervous', 'spinal', 'cranial'],
  neuro: ['nervous', 'brain', 'spinal', 'neuroanatomy'],
  liver: ['hepatic', 'digestive', 'portal'],
  stomach: ['digestive', 'gastric'],
  gi: ['digestive', 'stomach', 'duodenum', 'intestine', 'liver', 'hepatic'],
  gastrointestinal: ['digestive', 'stomach', 'intestine', 'colon'],
  hepatic: ['liver', 'portal', 'digestive', 'gallbladder'],
  kidney: ['renal', 'urinary', 'nephron'],
  renal: ['urinary', 'kidney', 'nephron', 'glomerular', 'ureter'],
  nephron: ['urinary', 'kidney', 'renal'],
  lung: ['pulmonary', 'respiratory', 'ventilation'],
  lungs: ['pulmonary', 'respiratory', 'ventilation'],
  pulmonary: ['respiratory', 'lung', 'trachea', 'ventilation'],
  breathing: ['respiratory', 'diaphragm', 'ventilation', 'boyle'],
  abg: ['acid', 'base', 'respiratory', 'haemoglobin', 'oxygen'],
  pk: ['pharmacology', 'pharmacokinetics', 'adme', 'absorption'],
  pd: ['pharmacology', 'pharmacodynamics', 'receptor', 'agonist'],
  adme: ['pharmacology', 'pharmacokinetics'],
  pharmacokinetics: ['pharmacology', 'adme'],
  pharmacodynamics: ['pharmacology', 'receptor'],
  firstpass: ['pharmacology', 'portal', 'liver'],
  micro: ['microbiology', 'bacteria', 'virus', 'fungi', 'parasite'],
  amr: ['microbiology', 'antimicrobial', 'resistance'],
  immuno: ['immunology', 'antibody', 'lymphocyte', 'thymus', 'spleen'],
  patho: ['pathology', 'inflammation', 'necrosis', 'apoptosis', 'ischemia'],
  histol: ['histology', 'epithelial', 'connective', 'tissue'],
  embryo: ['embryology', 'gastrulation', 'neurulation', 'germ'],
  biochem: ['biochemistry', 'glycolysis', 'enzyme', 'atp', 'metabolism'],
  genetics: ['molecular_genetics', 'dna', 'rna', 'mendelian', 'transcription'],
  haem: ['haematology_lab', 'blood', 'coagulation', 'cbc'],
  hematology: ['haematology_lab', 'blood', 'coagulation', 'cbc'],
  radiol: ['radiology_imaging', 'xray', 'ct', 'mri', 'ultrasound'],
  xray: ['radiology_imaging', 'x-ray', 'imaging'],
  ct: ['radiology_imaging', 'axial', 'cross-sectional'],
  mri: ['radiology_imaging', 'imaging', 'planes'],
  bone: ['skeletal', 'femur', 'skull', 'clavicle', 'tibia', 'vertebra'],
  muscle: ['muscular', 'biceps', 'triceps', 'deltoid', 'diaphragm'],
  eye: ['sensory', 'cornea', 'retina', 'lens', 'iris'],
  skin: ['integumentary', 'epidermis', 'dermis'],
  hormone: ['endocrine', 'pituitary', 'adrenal', 'pancreas', 'insulin'],
  nutrition: ['nutrition_health', 'vitamin', 'macronutrient', 'mineral'],
  ethics: ['clinical_skills_public_health', 'epidemiology', 'osce'],
  epidemiology: ['clinical_skills_public_health', 'biostatistics'],
};

const DOMAIN_DIRECT_KEYWORDS: { domainId: EducationDomainId; keywords: string[] }[] = [
  { domainId: 'pharmacology', keywords: ['pharmacology', 'pharmacokinetics', 'pharmacodynamics', 'adme', 'drug', 'agonist', 'antagonist', 'therapeutic index'] },
  { domainId: 'pathology', keywords: ['pathology', 'necrosis', 'apoptosis', 'inflammation', 'thrombosis', 'embolism', 'infarction', 'neoplasia'] },
  { domainId: 'immunology', keywords: ['immunology', 'innate', 'adaptive', 'antibody', 'mhc', 'complement', 'vaccination', 'hypersensitivity'] },
  { domainId: 'microbiology_parasitology', keywords: ['microbiology', 'parasitology', 'bacteria', 'gram', 'virus', 'fungi', 'helminth', 'antimicrobial'] },
  { domainId: 'biochemistry', keywords: ['biochemistry', 'enzyme', 'glycolysis', 'citric acid', 'atp', 'oxidative phosphorylation', 'metabolism', 'biomolecule'] },
  { domainId: 'molecular_genetics', keywords: ['genetics', 'dna', 'rna', 'transcription', 'translation', 'mendelian', 'mutation', 'chromosome'] },
  { domainId: 'embryology', keywords: ['embryology', 'fertilisation', 'cleavage', 'gastrulation', 'neurulation', 'placenta', 'teratogen'] },
  { domainId: 'cell_biology', keywords: ['cell biology', 'cytology', 'organelle', 'mitosis', 'meiosis', 'plasma membrane', 'cytoskeleton'] },
  { domainId: 'histology', keywords: ['histology', 'microanatomy', 'epithelium', 'connective tissue', 'osteon', 'h&e', 'staining'] },
  { domainId: 'haematology_lab', keywords: ['haematology', 'hematology', 'cbc', 'coagulation', 'haemostasis', 'blood group', 'abo', 'electrolyte'] },
  { domainId: 'radiology_imaging', keywords: ['radiology', 'medical imaging', 'x-ray', 'xray', 'ct', 'mri', 'ultrasound', 'axial'] },
  { domainId: 'nutrition_health', keywords: ['nutrition', 'vitamin', 'mineral', 'malnutrition', 'macronutrient', 'diet'] },
  { domainId: 'clinical_skills_public_health', keywords: ['clinical skills', 'history taking', 'osce', 'medical ethics', 'consent', 'epidemiology', 'biostatistics', 'public health'] },
  { domainId: 'clinical_specialties', keywords: ['cardiology', 'pulmonology', 'nephrology', 'neurology', 'orthopaedics', 'clinical specialty', 'clerkship'] },
];

export function tokenizeSyllabusText(text: string): string[] {
  const base = text
    .toLowerCase()
    .replace(/first-pass/g, 'firstpass')
    .replace(/x-ray/g, 'xray')
    .split(/[^a-z0-9]+/)
    .filter((tok) => tok.length >= 2);

  const expanded = new Set<string>();
  for (const tok of base) {
    if (!STOP_WORDS.has(tok)) expanded.add(tok);
    const syns = MEDICAL_SYNONYMS[tok];
    if (syns) {
      for (const s of syns) expanded.add(s);
    }
  }
  return Array.from(expanded);
}

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function scoreTopicMatch(
  itemTitle: string,
  unit: string | undefined,
  tokens: string[],
  topic: RegistryTopicNode,
): { score: number; confidence: MappingConfidence; reason: string } {
  const normQuery = normalizeTitle(itemTitle);
  const normTopic = normalizeTitle(topic.title);
  const normChapter = normalizeTitle(topic.chapterTitle);

  if (normQuery === normTopic) {
    return { score: 120, confidence: 'exact', reason: 'Exact topic title match' };
  }
  if (normQuery.length >= 6 && (normTopic.includes(normQuery) || normQuery.includes(normTopic))) {
    return { score: 96, confidence: 'high', reason: 'Direct title containment' };
  }

  let score = 0;
  const reasons: string[] = [];

  // Check explicit domain keyword hits
  const combinedText = `${itemTitle} ${unit ?? ''}`.toLowerCase();
  for (const dk of DOMAIN_DIRECT_KEYWORDS) {
    if (dk.domainId === topic.domainId && dk.keywords.some((kw) => combinedText.includes(kw))) {
      score += 24;
      reasons.push(`Domain match (${dk.domainId.replace(/_/g, ' ')})`);
      break;
    }
  }

  // Token overlap with topic title, key terms, and learning outcomes
  const titleSet = new Set(normTopic.split(' ').filter((w) => w.length >= 3 && !STOP_WORDS.has(w)));
  const chapterSet = new Set(normChapter.split(' ').filter((w) => w.length >= 3 && !STOP_WORDS.has(w)));
  const keyTermText = topic.keyTerms.join(' ').toLowerCase();
  const outcomeText = topic.learningOutcomes.map((o) => o.statement).join(' ').toLowerCase();

  let titleHits = 0;
  let contentHits = 0;
  const baseQueryTokens = normQuery
    .split(' ')
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  const matchedTokensSet = new Set<string>();

  for (const tok of tokens) {
    if (titleSet.has(tok)) {
      score += 18;
      titleHits++;
      matchedTokensSet.add(tok);
    } else if (chapterSet.has(tok)) {
      score += 11;
      matchedTokensSet.add(tok);
    } else if (keyTermText.includes(tok)) {
      score += 10;
      contentHits++;
      matchedTokensSet.add(tok);
    } else if (outcomeText.includes(tok)) {
      score += 7;
      contentHits++;
      matchedTokensSet.add(tok);
    } else if (topic.searchText.includes(tok)) {
      score += 4;
      contentHits++;
      matchedTokensSet.add(tok);
    }
  }

  const allBaseCovered =
    baseQueryTokens.length >= 2 &&
    baseQueryTokens.every(
      (bt) =>
        matchedTokensSet.has(bt) ||
        (MEDICAL_SYNONYMS[bt] ?? []).some((syn) => matchedTokensSet.has(syn)),
    );

  if (titleHits >= 2) score += 6;
  if (titleHits >= 1 && allBaseCovered) {
    score += 20;
  }
  if (titleHits > 0) reasons.push(`${titleHits} title keyword${titleHits > 1 ? 's' : ''}`);
  if (contentHits > 0) reasons.push(`${contentHits} outcome/concept match${contentHits > 1 ? 'es' : ''}`);

  if (score >= 44) {
    return {
      score,
      confidence: 'high',
      reason: reasons.slice(0, 2).join(' · ') || 'High semantic overlap',
    };
  }
  if (score >= 22) {
    return {
      score,
      confidence: 'suggested',
      reason: reasons.slice(0, 2).join(' · ') || 'Keyword/outcome suggestion',
    };
  }
  return { score: 0, confidence: 'suggested', reason: '' };
}

export function matchDraftItemsToRegistry(
  drafts: ParsedSyllabusDraftItem[],
): CustomSyllabusItem[] {
  return drafts.map((d) => {
    const tokens = tokenizeSyllabusText(`${d.title} ${d.unit ?? ''}`);
    const scored: { topic: RegistryTopicNode; score: number; confidence: MappingConfidence; reason: string }[] = [];

    for (const topic of REGISTRY_TOPICS) {
      const hit = scoreTopicMatch(d.title, d.unit, tokens, topic);
      if (hit.score > 0) {
        scored.push({ topic, ...hit });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.slice(0, 2);

    // Avoid pairing a second weak match when the first is an exact match
    const finalMatches =
      topMatches.length === 2 && topMatches[0].confidence === 'exact'
        ? [topMatches[0]]
        : topMatches.filter((m, idx) => idx === 0 || m.score >= 30);

    const mappings: SyllabusItemMapping[] = finalMatches.map((m) => ({
      registryTopicId: m.topic.id,
      domainId: m.topic.domainId,
      title: m.topic.title,
      confidence: m.confidence,
      matchReason: m.reason,
      // Suggested matches explicitly require user confirmation; exact/high auto-confirm but remain editable
      confirmed: m.confidence === 'exact' || m.confidence === 'high',
    }));

    return {
      id: d.id,
      rawLine: d.rawLine,
      title: d.title,
      unit: d.unit,
      keywords: tokens.slice(0, 10),
      mappings,
    };
  });
}

export function computeSyllabusCoverageReport(
  items: CustomSyllabusItem[],
): SyllabusCoverageReport {
  const active = items.filter((it) => !it.ignored);
  const rows: SyllabusItemReportRow[] = [];

  let availableCount = 0;
  let partiallyAvailableCount = 0;
  let notAvailableYetCount = 0;
  let needsAcademicReviewCount = 0;
  let unconfirmedCount = 0;

  for (const item of active) {
    const resolvedMappings = item.mappings
      .map((m) => {
        const tp = getRegistryTopicById(m.registryTopicId);
        return tp ? { mapping: m, topic: tp } : null;
      })
      .filter((x): x is { mapping: SyllabusItemMapping; topic: RegistryTopicNode } => Boolean(x));

    if (resolvedMappings.length === 0) {
      notAvailableYetCount++;
      rows.push({
        itemId: item.id,
        title: item.title,
        unit: item.unit,
        category: 'not_available_yet',
        needsAcademicReview: false,
        hasUnconfirmedSuggestions: false,
        mappedTopicStatuses: [],
        explanation: 'No matching Anatomy 360 module or lesson found yet (out of scope or pending content expansion).',
      });
      continue;
    }

    const confirmedMappings = resolvedMappings.filter((x) => x.mapping.confirmed);
    const hasUnconfirmed = resolvedMappings.some((x) => !x.mapping.confirmed);
    if (hasUnconfirmed) unconfirmedCount++;

    // Truthful coverage rule:
    // - Only counts as 'available' when at least one confirmed mapping is substantially_covered or complete,
    //   AND does not have asset_missing / introductory status.
    // - Introductory topics MUST NOT count as fully covered -> classified as 'partially_available'.
    // - Unconfirmed-only suggestions default to 'partially_available' until confirmed (or remap).
    const hasSubstantialConfirmed = confirmedMappings.some(
      ({ topic }) =>
        topic.countsAsFullCoverage &&
        (topic.coverageStatus === 'complete' || topic.coverageStatus === 'substantially_covered') &&
        topic.assetStatus !== 'asset_missing',
    );

    const allPlannedOnly = resolvedMappings.every(({ topic }) => topic.coverageStatus === 'planned');

    let category: SyllabusCoverageCategory = 'partially_available';
    let explanation = '';

    if (allPlannedOnly) {
      category = 'not_available_yet';
      notAvailableYetCount++;
      explanation = 'Mapped solely to a planned specification slot not yet active.';
    } else if (hasSubstantialConfirmed) {
      category = 'available';
      availableCount++;
      explanation = 'Covered by structured lessons, verified 3D structures, and multi-tier checks.';
    } else {
      category = 'partially_available';
      partiallyAvailableCount++;
      if (confirmedMappings.length === 0) {
        explanation = 'Suggested match awaits your confirmation (confirm or remap below).';
      } else if (resolvedMappings.some(({ topic }) => topic.assetStatus === 'asset_missing')) {
        explanation = 'Text guide & outcomes available, but required microscopy/radiology media assets are missing.';
      } else {
        explanation = 'Covered by an introductory overview or partial system module (introductory modules do not count as full course coverage).';
      }
    }

    const needsReview = resolvedMappings.some(({ topic }) => topic.reviewStatus !== 'faculty_reviewed');
    if (needsReview) needsAcademicReviewCount++;

    rows.push({
      itemId: item.id,
      title: item.title,
      unit: item.unit,
      category,
      needsAcademicReview: needsReview,
      hasUnconfirmedSuggestions: hasUnconfirmed,
      mappedTopicStatuses: resolvedMappings.map(({ mapping, topic }) => ({
        topicId: topic.id,
        title: topic.title,
        domainId: topic.domainId,
        coverageStatus: topic.coverageStatus,
        reviewStatus: topic.reviewStatus,
        confidence: mapping.confidence,
        confirmed: mapping.confirmed,
      })),
      explanation,
    });
  }

  const denom = Math.max(1, active.length);
  const availablePct = active.length === 0 ? 0 : Math.round((availableCount / denom) * 100);
  const partialOrBetterPct =
    active.length === 0
      ? 0
      : Math.round(((availableCount + partiallyAvailableCount) / denom) * 100);
  const notAvailablePct =
    active.length === 0 ? 0 : Math.max(0, 100 - partialOrBetterPct);

  return {
    totalItems: items.length,
    activeItems: active.length,
    availableCount,
    partiallyAvailableCount,
    notAvailableYetCount,
    needsAcademicReviewCount,
    unconfirmedCount,
    availablePct,
    partialOrBetterPct,
    notAvailablePct,
    disclaimer:
      'Coverage metrics count only active syllabus topics against verified Anatomy 360 modules. Introductory 1–2 module biomedical overviews count as Partially Available, never Available/Complete, and all materials remain pending formal academic faculty review.',
    rows,
  };
}
