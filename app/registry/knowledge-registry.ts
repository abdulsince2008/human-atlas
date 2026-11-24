import type { Atlas } from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import { CLINICAL_CASES } from '../data/clinical-data';
import { HISTOLOGY_ENTRIES } from '../data/histology-data';
import { PHYSIOLOGY_MODULES } from '../data/physiology-data';
import { STUDY_RESOURCES } from '../data/study-resources';
import { EDUCATION_TOPICS } from '../education/education-content';
import { CURRICULUM_FRAMEWORKS, EDUCATION_TRACKS } from '../education/education-curricula';
import { EDUCATION_DOMAINS } from '../education/education-domains';
import type {
  CoverageStatus as DomainCoverageStatus,
  CurriculumAuthorityId,
  EducationDomainId,
  EducationTrackId,
} from '../education/education-types';
import { KNOWLEDGE_GRAPH_V2 } from '../knowledge-graph';
import { ANATOMY_LESSONS, TERMINOLOGY_ENTRIES } from '../learning-data';
import { SYSTEM_TEACHING_METADATA, TOPIC_DEPTH_SUPPLEMENTS } from '../learning-supplements';
import { BUILTIN_PRESENTATIONS } from '../presentation/builtin-presentations';
import { QUIZ_QUESTIONS } from '../quiz-data';
import type {
  RegistryAssetStatus,
  RegistryChapterNode,
  RegistryCoverageBreakdown,
  RegistryCoverageStatus,
  RegistryDatasetMetrics,
  RegistryResourceLink,
  RegistryReviewStatus,
  RegistrySubjectNode,
  RegistryTopicNode,
} from './registry-types';

export const REGISTRY_COVERAGE_LABELS: Record<RegistryCoverageStatus, string> = {
  not_started: 'Not started',
  planned: 'Planned specification',
  introductory: 'Introductory overview',
  partial: 'Partial coverage',
  substantially_covered: 'Substantially covered',
  complete: 'Complete coverage',
};

export const REGISTRY_REVIEW_LABELS: Record<RegistryReviewStatus, string> = {
  structured_reference: 'Structured reference · Unreviewed by faculty',
  curriculum_draft: 'Curriculum draft · Unreviewed',
  needs_academic_review: 'Needs academic review',
  pending_faculty_review: 'Pending faculty review',
  faculty_reviewed: 'Faculty reviewed',
};

const SYSTEM_TO_TRACKS: Record<string, EducationTrackId[]> = {
  Foundational: ['school_foundations', 'secondary_premed', 'allied_health'],
  'FSc / MDCAT': ['secondary_premed', 'medical_foundations', 'allied_health'],
  'MBBS / Nursing': ['medical_foundations', 'clinical_applied', 'allied_health', 'graduate_research'],
};

const SYSTEM_CURRICULUM_FRAMEWORKS: CurriculumAuthorityId[] = [
  'pk_ncp_gs_4_8',
  'pk_ncp_bio_9_12',
  'pk_pmdc_mbbs',
  'pk_uhs_mbbs',
  'in_cbse_bio_11_12',
  'en_nc_science',
  'au_wa_human_bio',
  'ox_preclinical',
  'anat_soc_core',
];

function mapDomainCoverageToRegistry(
  domainId: EducationDomainId,
  domainCoverage: DomainCoverageStatus,
  topicCount: number,
): RegistryCoverageStatus {
  if (domainId === 'human_anatomy') return 'substantially_covered';
  if (domainCoverage === 'asset_missing') return 'partial';
  if (domainId === 'human_physiology') return 'partial';
  if (domainCoverage === 'implemented_validated') return 'substantially_covered';
  if (domainCoverage === 'implemented_partial') {
    return topicCount >= 2 ? 'partial' : 'introductory';
  }
  if (domainCoverage === 'planned_scaffold_only') return 'planned';
  return 'not_started';
}

function mapAssetDisclosureStatus(
  status: 'available' | 'partial' | 'asset_required' | 'conceptual_diagram_only',
): RegistryAssetStatus {
  if (status === 'available') return 'available';
  if (status === 'partial') return 'partial';
  if (status === 'asset_required') return 'asset_missing';
  return 'conceptual_only';
}

function buildRegistryData(): {
  subjects: RegistrySubjectNode[];
  chapters: RegistryChapterNode[];
  topics: RegistryTopicNode[];
} {
  const topics: RegistryTopicNode[] = [];
  const chapters: RegistryChapterNode[] = [];
  const subjects: RegistrySubjectNode[] = [];

  const quizByTopic = new Map<string, string[]>();
  const quizBySystem = new Map<CanonicalSystemId, string[]>();
  for (const q of QUIZ_QUESTIONS) {
    if (q.topicId) {
      const list = quizByTopic.get(q.topicId) ?? [];
      list.push(q.id);
      quizByTopic.set(q.topicId, list);
    }
    const sysList = quizBySystem.get(q.systemId) ?? [];
    sysList.push(q.id);
    quizBySystem.set(q.systemId, sysList);
  }

  const physBySystem = new Map(PHYSIOLOGY_MODULES.map((m) => [m.systemId, [] as typeof PHYSIOLOGY_MODULES]));
  for (const mod of PHYSIOLOGY_MODULES) {
    const arr = physBySystem.get(mod.systemId) ?? [];
    arr.push(mod);
    physBySystem.set(mod.systemId, arr);
  }

  // 1. Register all 12 canonical anatomical lesson chapters & 28 lesson topics under Domain A (human_anatomy)
  const anatomySubjectId = 'subj-human_anatomy';
  const anatomyChapterIds: string[] = [];
  const anatomyTopicIds: string[] = [];

  for (const lesson of ANATOMY_LESSONS) {
    const sys = CANONICAL_SYSTEMS.find((s) => s.id === lesson.systemId);
    const guide = SYSTEM_TEACHING_METADATA[lesson.systemId];
    const chapterTopicIds: string[] = [];

    for (const tp of lesson.topics) {
      const sup = TOPIC_DEPTH_SUPPLEMENTS[tp.id];
      const tracks = Array.from(
        new Set<EducationTrackId>([
          ...(SYSTEM_TO_TRACKS[tp.level] ?? ['secondary_premed', 'medical_foundations']),
          ...(sup ? (['school_foundations', 'secondary_premed', 'medical_foundations', 'graduate_research'] as EducationTrackId[]) : []),
        ]),
      );

      const resources: RegistryResourceLink[] = [];
      for (const cid of tp.conceptIds) {
        const kg = KNOWLEDGE_GRAPH_V2.find((k) => k.conceptId === cid);
        resources.push({
          id: `res-3d-${tp.id}-${cid}`,
          kind: '3d_structure',
          title: kg?.canonicalName ?? cid,
          route: 'explorer',
          targetId: cid,
          systemId: lesson.systemId,
          assetStatus: kg?.visualization.inModel === false ? 'asset_missing' : 'available',
        });
      }

      for (const mod of PHYSIOLOGY_MODULES) {
        if (mod.systemId === lesson.systemId || mod.linkedConcepts.some((lc) => tp.conceptIds.includes(lc.conceptId))) {
          resources.push({
            id: `res-phys-${tp.id}-${mod.id}`,
            kind: 'physiology_sim',
            title: mod.title,
            route: 'physiology',
            targetId: mod.id,
            systemId: mod.systemId,
            assetStatus: mod.status === 'specification_ready' ? 'specification_ready' : 'available',
          });
        }
      }

      for (const h of HISTOLOGY_ENTRIES) {
        if (h.linkedTopicIds.includes(tp.id)) {
          resources.push({
            id: `res-hist-${tp.id}-${h.id}`,
            kind: 'histology_entry',
            title: h.title,
            route: 'histology',
            targetId: h.id,
            systemId: h.canonicalSystem,
            note: h.specimenSlot.imageUrl ? 'Verified CC-licensed micrograph bundled' : 'Microscopy image slot (asset required)',
            assetStatus: h.specimenSlot.mediaStatus === 'verified_bundled_micrograph' ? 'available' : 'asset_missing',
          });
        }
      }

      for (const cs of CLINICAL_CASES) {
        if (cs.associatedTopicIds.includes(tp.id)) {
          resources.push({
            id: `res-clin-${tp.id}-${cs.id}`,
            kind: 'clinical_case',
            title: cs.title,
            route: 'clinical',
            targetId: cs.id,
            systemId: cs.systemId,
            assetStatus: 'available',
          });
        }
      }

      for (const pres of BUILTIN_PRESENTATIONS) {
        if (
          pres.steps.some((st) =>
            st.scene.selectedConceptIds.some((cid) => tp.conceptIds.includes(cid)),
          )
        ) {
          resources.push({
            id: `res-pres-${tp.id}-${pres.id}`,
            kind: '3d_presentation',
            title: pres.title,
            route: 'present',
            targetId: pres.id,
            assetStatus: 'available',
          });
        }
      }

      const matchingStudyRes = STUDY_RESOURCES.filter(
        (sr) =>
          sr.canonicalSystems.includes(lesson.systemId) ||
          sr.conceptIds.some((cid) => tp.conceptIds.includes(cid)),
      ).slice(0, 3);
      for (const sr of matchingStudyRes) {
        resources.push({
          id: `res-ext-${tp.id}-${sr.id}`,
          kind: 'external_resource',
          title: `${sr.title} (${sr.publisher})`,
          route: 'learn',
          targetId: sr.url,
          note: sr.licenseNote,
          assetStatus: 'available',
        });
      }

      const assessmentIds = quizByTopic.get(tp.id) ?? (quizBySystem.get(lesson.systemId) ?? []).slice(0, 2);
      const sysPartialOrMaleOnly = sys?.coverage === 'partial' || sys?.coverage === 'male-only';
      const covStatus: RegistryCoverageStatus = sysPartialOrMaleOnly
        ? 'partial'
        : 'substantially_covered';

      const outcomes = [
        ...lesson.learningObjectives.map((stmt, idx) => ({
          id: `${tp.id}-lo-${idx + 1}`,
          statement: stmt,
          tracks,
        })),
        ...(guide?.bloomObjectives.bs_mbbs ?? []).slice(0, 2).map((stmt, idx) => ({
          id: `${tp.id}-bloom-${idx + 1}`,
          statement: stmt,
          tracks: ['medical_foundations', 'allied_health'] as EducationTrackId[],
        })),
      ];

      const knownLimitations: string[] = [
        'Adult Male BodyParts3D 4.0 (2,234 meshes) + Adult Female Overlay (79 parts: 71 HuBMAP HRA CC BY 4.0 + 8 co-registered pelvic/urethral reconstructions); broader female vascular/nervous/visceral coverage, anatomical variants, region-by-region validation, and paediatric geometries remain incomplete/planned.',
        'Content compiled as structured educational reference pending formal human medical-faculty review.',
      ];
      if (lesson.coverageDisclosure) knownLimitations.push(lesson.coverageDisclosure);
      if (tp.nonModeledConcepts?.length) {
        knownLimitations.push(
          `Non-modeled concepts taught via text: ${tp.nonModeledConcepts.map((n) => n.name).join(', ')}.`,
        );
      }

      const searchParts = [
        tp.title.en,
        lesson.title.en,
        lesson.chapter,
        sys?.name.en ?? '',
        tp.explanation.en,
        sup?.school_9_12 ?? '',
        sup?.bs_mbbs ?? '',
        sup?.phd_research ?? '',
        ...tp.keyFacts,
        ...tp.relationships,
        ...tp.terminology.map((t) => `${t.term} ${t.meaning}`),
        ...outcomes.map((o) => o.statement),
        ...resources.map((r) => r.title),
      ];

      topics.push({
        id: tp.id,
        sourceKind: 'anatomy_lesson_topic',
        domainId: 'human_anatomy',
        subjectId: anatomySubjectId,
        chapterId: lesson.id,
        chapterTitle: lesson.chapter,
        systemId: lesson.systemId,
        title: tp.title.en,
        summary: tp.explanation.en,
        searchText: searchParts.join(' ').toLowerCase(),
        academicTracks: tracks,
        difficultyTiers: [tp.level, 'Grades 9–12', 'BS / MBBS', 'MPhil / PhD'],
        learningOutcomes: outcomes,
        keyTerms: tp.terminology.map((t) => t.term),
        coverageStatus: covStatus,
        reviewStatus: 'structured_reference',
        assetStatus: sysPartialOrMaleOnly ? 'partial' : 'available',
        countsAsFullCoverage: !sysPartialOrMaleOnly,
        provenance: {
          sourceOrganization: 'Anatomy 360 Editorial Reference & BodyParts3D (DBCLS)',
          authorOrCompiler: 'OpenStax A&P 2e / TA2 / FMA Synthesis',
          publicationOrRevisionDate: '2026-11-19',
          reviewedBy: null,
          reviewDate: null,
          knownLimitations,
          missingOutcomes: sys?.plannedStructures ?? [],
          sourceUrls: [
            'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-introduction',
            'https://lifesciencedb.jp/bp3d/',
          ],
        },
        resources,
        relatedConceptIds: tp.conceptIds,
        assessmentIds,
        curriculumMappings: SYSTEM_CURRICULUM_FRAMEWORKS.map((fwId) => ({
          frameworkId: fwId,
          gradeOrYear: tp.level,
          unitOrModule: `${sys?.name.en ?? 'Anatomy'} — ${tp.title.en}`,
          status: fwId === 'pk_pmdc_mbbs' || fwId === 'pk_uhs_mbbs' ? 'compulsory' : 'recommended',
        })),
        navigationTarget: {
          route: 'learn',
          domainId: 'human_anatomy',
          systemId: lesson.systemId,
          topicId: tp.id,
          conceptId: tp.conceptIds[0],
        },
      });

      chapterTopicIds.push(tp.id);
      anatomyTopicIds.push(tp.id);
    }

    const chCoverage: RegistryCoverageStatus =
      sys?.coverage === 'partial' || sys?.coverage === 'male-only'
        ? 'partial'
        : 'substantially_covered';

    chapters.push({
      id: lesson.id,
      domainId: 'human_anatomy',
      subjectId: anatomySubjectId,
      systemId: lesson.systemId,
      title: `${lesson.chapter}: ${lesson.title.en}`,
      summary: lesson.summary.en,
      topicIds: chapterTopicIds,
      coverageStatus: chCoverage,
      reviewStatus: 'structured_reference',
    });
    anatomyChapterIds.push(lesson.id);
  }

  // 2. Register all EDUCATION_TOPICS across Domains A–P
  const domainChapterMap = new Map<EducationDomainId, Map<string, RegistryTopicNode[]>>();

  for (const et of EDUCATION_TOPICS) {
    const dom = EDUCATION_DOMAINS.find((d) => d.id === et.domainId)!;
    const isAssetMissing = dom.coverageStatus === 'asset_missing';
    const topicCoverage: RegistryCoverageStatus =
      et.domainId === 'human_anatomy'
        ? 'substantially_covered'
        : isAssetMissing
          ? 'partial'
          : 'introductory';

    const resources: RegistryResourceLink[] = [];
    if (et.diagram) {
      resources.push({
        id: `res-diag-${et.id}-${et.diagram.id}`,
        kind: 'lesson_2d_diagram',
        title: et.diagram.title,
        route: 'learn',
        targetId: et.diagram.id,
        assetStatus: 'conceptual_only',
      });
    }
    for (const cid of et.relatedFmaConceptIds) {
      const kg = KNOWLEDGE_GRAPH_V2.find((k) => k.conceptId === cid);
      resources.push({
        id: `res-3d-${et.id}-${cid}`,
        kind: '3d_structure',
        title: kg?.canonicalName ?? cid,
        route: 'explorer',
        targetId: cid,
        assetStatus: kg?.visualization.inModel === false ? 'asset_missing' : 'available',
      });
    }
    for (const pl of dom.platformLinks) {
      resources.push({
        id: `res-plat-${et.id}-${pl.route}-${pl.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        kind:
          pl.route === 'physiology'
            ? 'physiology_sim'
            : pl.route === 'histology'
              ? 'histology_entry'
              : pl.route === 'clinical'
                ? 'clinical_case'
                : pl.route === 'present'
                  ? '3d_presentation'
                  : '3d_structure',
        title: pl.label,
        route: pl.route,
        targetId: pl.presentationId,
        systemId: pl.systemId,
        note: pl.note,
        assetStatus: isAssetMissing ? 'asset_missing' : 'available',
      });
    }
    if (et.domainId === 'human_physiology') {
      for (const mod of PHYSIOLOGY_MODULES) {
        resources.push({
          id: `res-phys-${et.id}-${mod.id}`,
          kind: 'physiology_sim',
          title: mod.title,
          route: 'physiology',
          targetId: mod.id,
          systemId: mod.systemId,
          assetStatus: mod.status === 'specification_ready' ? 'specification_ready' : 'available',
        });
      }
    }
    if (et.domainId === 'histology') {
      for (const h of HISTOLOGY_ENTRIES.slice(0, 5)) {
        resources.push({
          id: `res-hist-${et.id}-${h.id}`,
          kind: 'histology_entry',
          title: h.title,
          route: 'histology',
          targetId: h.id,
          systemId: h.canonicalSystem,
          assetStatus: h.specimenSlot.mediaStatus === 'verified_bundled_micrograph' ? 'available' : 'asset_missing',
        });
      }
    }
    if (et.domainId === 'pathology' || et.domainId === 'clinical_specialties') {
      for (const cs of CLINICAL_CASES.slice(0, 4)) {
        resources.push({
          id: `res-clin-${et.id}-${cs.id}`,
          kind: 'clinical_case',
          title: cs.title,
          route: 'clinical',
          targetId: cs.id,
          systemId: cs.systemId,
          assetStatus: 'available',
        });
      }
    }

    const searchParts = [
      dom.title,
      dom.shortTitle,
      et.chapterTitle,
      et.title,
      et.summary,
      ...et.learningObjectives,
      ...Object.values(et.depthExplanations).filter(Boolean),
      ...et.keyConcepts.map((k) => `${k.term} ${k.definition}`),
      ...et.keyFacts,
      ...et.curriculumMappings.map((cm) => `${cm.unitOrModule} ${cm.gradeOrYear}`),
      ...resources.map((r) => r.title),
    ];

    const knownLimitations: string[] = [
      dom.assetDisclosure.summary,
      'Introductory educational module — not a complete textbook or accredited course.',
    ];
    if (dom.educationalDisclaimer) knownLimitations.push(dom.educationalDisclaimer);

    const chapterSlug = `${et.chapterCode ? `${et.chapterCode.toLowerCase()}-` : ''}${et.chapterTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`;

    const topicNode: RegistryTopicNode = {
      id: et.id,
      sourceKind: 'education_topic',
      domainId: et.domainId,
      subjectId: `subj-${et.domainId}`,
      chapterId: `ch-${et.domainId}-${chapterSlug.slice(0, 48)}`,
      chapterTitle: et.chapterTitle,
      systemId: et.relatedSystems[0],
      title: et.title,
      summary: et.summary,
      searchText: searchParts.join(' ').toLowerCase(),
      academicTracks: et.targetTracks,
      difficultyTiers: et.targetTracks.map(
        (tid) => EDUCATION_TRACKS.find((tr) => tr.id === tid)?.shortLabel ?? tid,
      ),
      learningOutcomes: et.learningObjectives.map((stmt, idx) => ({
        id: `${et.id}-lo-${idx + 1}`,
        statement: stmt,
        tracks: et.targetTracks,
      })),
      keyTerms: et.keyConcepts.map((k) => k.term),
      coverageStatus: topicCoverage,
      reviewStatus: et.reviewStatus,
      assetStatus: mapAssetDisclosureStatus(et.assetDisclosure.status),
      countsAsFullCoverage: false, // Never claims full certified completeness while awaiting academic faculty review
      provenance: {
        sourceOrganization: et.sources[0]?.authority ?? 'OpenStax / Curriculum Alignment References',
        authorOrCompiler: et.sources.map((s) => s.title).join(' · '),
        publicationOrRevisionDate: '2026-11-21',
        reviewedBy: null,
        reviewDate: null,
        knownLimitations,
        missingOutcomes: dom.assetDisclosure.missingAssets ?? [
          'Additional multi-chapter problem sets and faculty peer review required for complete course coverage.',
        ],
        sourceUrls: et.sources.map((s) => s.url).filter((u): u is string => Boolean(u)),
      },
      resources,
      relatedConceptIds: et.relatedFmaConceptIds,
      assessmentIds: et.selfChecks.map((sc) => sc.id),
      curriculumMappings: et.curriculumMappings,
      navigationTarget: {
        route: 'learn',
        domainId: et.domainId,
        topicId: et.id,
        systemId: et.relatedSystems[0],
        conceptId: et.relatedFmaConceptIds[0],
      },
    };

    topics.push(topicNode);

    if (!domainChapterMap.has(et.domainId)) {
      domainChapterMap.set(et.domainId, new Map());
    }
    const chMap = domainChapterMap.get(et.domainId)!;
    const chList = chMap.get(topicNode.chapterId) ?? [];
    chList.push(topicNode);
    chMap.set(topicNode.chapterId, chList);
  }

  // Add the explicit planned endocrine simulation node so planned specs are transparently tracked
  const endocrinePlanned = PHYSIOLOGY_MODULES.find((m) => m.id === 'endocrine-feedback-planned');
  if (endocrinePlanned) {
    const plannedNode: RegistryTopicNode = {
      id: endocrinePlanned.id,
      sourceKind: 'planned_module',
      domainId: 'human_physiology',
      subjectId: 'subj-human_physiology',
      chapterId: 'ch-human_physiology-planned-endocrine',
      chapterTitle: 'Endocrine & Hormonal Kinetics (Planned)',
      systemId: 'endocrine',
      title: endocrinePlanned.title,
      summary: endocrinePlanned.explanation,
      searchText: `${endocrinePlanned.title} ${endocrinePlanned.subtitle} ${endocrinePlanned.explanation} hpa cortisol insulin glucagon`.toLowerCase(),
      academicTracks: ['medical_foundations', 'graduate_research'],
      difficultyTiers: ['BS / MBBS', 'MPhil / PhD'],
      learningOutcomes: [
        {
          id: 'endocrine-planned-lo-1',
          statement: 'Trace HPA axis and insulin–glucagon feedback architecture (quantitative ODE simulation pending kinetic citations).',
          tracks: ['medical_foundations', 'graduate_research'],
        },
      ],
      keyTerms: ['HPA axis', 'Insulin-glucagon feedback', 'Negative feedback loop'],
      coverageStatus: 'planned',
      reviewStatus: 'curriculum_draft',
      assetStatus: 'specification_ready',
      countsAsFullCoverage: false,
      provenance: {
        sourceOrganization: 'Anatomy 360 Physiology Specification Slot',
        authorOrCompiler: 'Internal Architecture Slot',
        publicationOrRevisionDate: '2026-11-19',
        reviewedBy: null,
        reviewDate: null,
        knownLimitations: [
          endocrinePlanned.disclaimer,
          ...(endocrinePlanned.missingRequirements ?? []),
        ],
        missingOutcomes: endocrinePlanned.missingRequirements ?? [],
        sourceUrls: [],
      },
      resources: [
        {
          id: 'res-phys-slot-endocrine',
          kind: 'physiology_sim',
          title: 'Physiology Lab — Specification Slot',
          route: 'physiology',
          targetId: endocrinePlanned.id,
          systemId: 'endocrine',
          assetStatus: 'specification_ready',
        },
      ],
      relatedConceptIds: endocrinePlanned.linkedConcepts.map((c) => c.conceptId),
      assessmentIds: [],
      curriculumMappings: [
        { frameworkId: 'pk_pmdc_mbbs', gradeOrYear: 'MBBS Year 1–2', unitOrModule: 'Endocrine Physiology', status: 'compulsory' },
      ],
      navigationTarget: {
        route: 'physiology',
        domainId: 'human_physiology',
        systemId: 'endocrine',
        topicId: endocrinePlanned.id,
      },
    };
    topics.push(plannedNode);
    if (!domainChapterMap.has('human_physiology')) {
      domainChapterMap.set('human_physiology', new Map());
    }
    domainChapterMap.get('human_physiology')!.set(plannedNode.chapterId, [plannedNode]);
  }

  // 3. Assemble Chapters & Subjects for all 16 Domains
  for (const dom of EDUCATION_DOMAINS) {
    const chMap = domainChapterMap.get(dom.id);
    const chIds: string[] = dom.id === 'human_anatomy' ? [...anatomyChapterIds] : [];
    const tpIds: string[] = dom.id === 'human_anatomy' ? [...anatomyTopicIds] : [];

    if (chMap) {
      for (const [chId, chTopics] of chMap.entries()) {
        chapters.push({
          id: chId,
          domainId: dom.id,
          subjectId: `subj-${dom.id}`,
          systemId: chTopics[0]?.systemId,
          title: chTopics[0]?.chapterTitle ?? dom.shortTitle,
          summary: chTopics.map((t) => t.title).join(' · '),
          topicIds: chTopics.map((t) => t.id),
          coverageStatus: chTopics.every((t) => t.coverageStatus === 'planned')
            ? 'planned'
            : dom.coverageStatus === 'asset_missing'
              ? 'partial'
              : 'introductory',
          reviewStatus: dom.reviewStatus,
        });
        chIds.push(chId);
        tpIds.push(...chTopics.map((t) => t.id));
      }
    }

    const subjCoverage = mapDomainCoverageToRegistry(dom.id, dom.coverageStatus, tpIds.length);
    const subjReview: RegistryReviewStatus = dom.reviewStatus;
    const subjAsset = mapAssetDisclosureStatus(dom.assetDisclosure.status);

    subjects.push({
      id: `subj-${dom.id}`,
      domainId: dom.id,
      code: dom.code,
      title: dom.title,
      shortTitle: dom.shortTitle,
      group: dom.group,
      overview: dom.overview,
      chapterIds: chIds,
      topicIds: tpIds,
      topicCount: tpIds.length,
      coverageStatus: subjCoverage,
      coverageLabel:
        dom.coverageStatus === 'asset_missing'
          ? 'Asset required (media pending)'
          : REGISTRY_COVERAGE_LABELS[subjCoverage],
      reviewStatus: subjReview,
      assetStatus: subjAsset,
      assetDisclosure: dom.assetDisclosure,
      targetTracks: dom.targetTracks,
      curriculumFrameworks: dom.curriculumFrameworks,
      relatedSystems: dom.relatedSystems,
      provenance: {
        sourceOrganization: 'Anatomy 360 Curriculum Registry',
        authorOrCompiler: 'Mapped against 13 public national, regulatory & university curriculum alignment references (non-endorsed)',
        publicationOrRevisionDate: '2026-11-21',
        reviewedBy: null,
        reviewDate: null,
        knownLimitations: [
          dom.assetDisclosure.summary,
          'Pending human academic faculty sign-off.',
        ],
        missingOutcomes: dom.assetDisclosure.missingAssets ?? [],
        sourceUrls: CURRICULUM_FRAMEWORKS.filter((f) => dom.curriculumFrameworks.includes(f.id)).map((f) => f.url),
      },
      educationalDisclaimer: dom.educationalDisclaimer,
    });
  }

  return { subjects, chapters, topics };
}

const REGISTRY_CACHE = buildRegistryData();

export const REGISTRY_SUBJECTS: RegistrySubjectNode[] = REGISTRY_CACHE.subjects;
export const REGISTRY_CHAPTERS: RegistryChapterNode[] = REGISTRY_CACHE.chapters;
export const REGISTRY_TOPICS: RegistryTopicNode[] = REGISTRY_CACHE.topics;

export function getRegistrySubjects(): RegistrySubjectNode[] {
  return REGISTRY_SUBJECTS;
}

export function getRegistrySubjectByDomain(domainId: EducationDomainId): RegistrySubjectNode | undefined {
  return REGISTRY_SUBJECTS.find((s) => s.domainId === domainId);
}

export function getRegistryChaptersForDomain(domainId: EducationDomainId): RegistryChapterNode[] {
  return REGISTRY_CHAPTERS.filter((c) => c.domainId === domainId);
}

export function getRegistryTopicsForDomain(domainId: EducationDomainId): RegistryTopicNode[] {
  return REGISTRY_TOPICS.filter((t) => t.domainId === domainId);
}

export function getRegistryTopicById(topicId: string): RegistryTopicNode | undefined {
  return REGISTRY_TOPICS.find((t) => t.id === topicId);
}

export function getRegistryTopicsForFramework(frameworkId: CurriculumAuthorityId): RegistryTopicNode[] {
  return REGISTRY_TOPICS.filter((t) =>
    t.curriculumMappings.some((cm) => cm.frameworkId === frameworkId),
  );
}

export function getDomainCoverageBreakdown(domainId: EducationDomainId): RegistryCoverageBreakdown {
  const domTopics = getRegistryTopicsForDomain(domainId);
  const subject = getRegistrySubjectByDomain(domainId);
  const gaps = new Set<string>(subject?.assetDisclosure.missingAssets ?? []);
  for (const t of domTopics) {
    for (const m of t.provenance.missingOutcomes) {
      if (gaps.size < 6) gaps.add(m);
    }
  }
  return {
    totalTopics: domTopics.length,
    completeCount: domTopics.filter((t) => t.coverageStatus === 'complete').length,
    substantiallyCoveredCount: domTopics.filter((t) => t.coverageStatus === 'substantially_covered').length,
    partialCount: domTopics.filter((t) => t.coverageStatus === 'partial').length,
    introductoryCount: domTopics.filter((t) => t.coverageStatus === 'introductory').length,
    plannedCount: domTopics.filter((t) => t.coverageStatus === 'planned').length,
    notStartedCount: domTopics.filter((t) => t.coverageStatus === 'not_started').length,
    assetMissingTopicsCount: domTopics.filter((t) => t.assetStatus === 'asset_missing').length,
    pendingReviewTopicsCount: domTopics.filter((t) => t.reviewStatus !== 'faculty_reviewed').length,
    knownGaps: Array.from(gaps),
  };
}

export function computeRegistryMetrics(atlas?: Atlas | null): RegistryDatasetMetrics {
  const moduleSelfChecks = EDUCATION_TOPICS.reduce((acc, t) => acc + t.selfChecks.length, 0);
  const interactivePhys = PHYSIOLOGY_MODULES.filter((m) => m.status === 'interactive').length;
  const plannedPhys = PHYSIOLOGY_MODULES.filter((m) => m.status === 'specification_ready').length;

  return {
    domainsCount: EDUCATION_DOMAINS.length,
    subjectsCount: REGISTRY_SUBJECTS.length,
    chaptersCount: REGISTRY_CHAPTERS.length,
    topicsCount: REGISTRY_TOPICS.length,
    anatomyLessonTopicsCount: ANATOMY_LESSONS.reduce((s, l) => s + l.topics.length, 0),
    biomedicalModulesCount: EDUCATION_TOPICS.length,
    canonicalSystemsCount: CANONICAL_SYSTEMS.length,
    curriculumFrameworksCount: CURRICULUM_FRAMEWORKS.length,
    learningTracksCount: EDUCATION_TRACKS.length,
    quizBankCount: QUIZ_QUESTIONS.length,
    moduleSelfCheckCount: moduleSelfChecks,
    totalAssessmentQuestionsCount:
      QUIZ_QUESTIONS.length + moduleSelfChecks + CLINICAL_CASES.length + HISTOLOGY_ENTRIES.length,
    physiologyInteractiveCount: interactivePhys,
    physiologyPlannedCount: plannedPhys,
    histologyEntriesCount: HISTOLOGY_ENTRIES.length,
    clinicalCasesCount: CLINICAL_CASES.length,
    presentationsCount: BUILTIN_PRESENTATIONS.length,
    externalStudyResourcesCount: STUDY_RESOURCES.length,
    knowledgeGraphV2Count: KNOWLEDGE_GRAPH_V2.length,
    terminologyEntriesCount: TERMINOLOGY_ENTRIES.length,
    atlasMeshesCount: atlas ? atlas.parts.length : 2234,
    atlasConceptsCount: atlas ? atlas.concepts.length : 3432,
  };
}
