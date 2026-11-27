import { useMemo, useState, type FormEvent } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Box,
  Compass,
  FileText,
  GitBranch,
  Globe2,
  GraduationCap,
  HelpCircle,
  Layers3,
  LayoutGrid,
  Microscope,
  Play,
  Search,
  SlidersHorizontal,
  Stethoscope,
} from 'lucide-react';
import type { Atlas } from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import OnboardingExperience from '../components/OnboardingExperience';
import type { AppRoute } from '../components/SiteHeader';
import SpeakGuidanceButton from '../components/SpeakGuidanceButton';
import { useStudy } from '../components/StudyContext';
import { CURRICULUM_FRAMEWORKS, EDUCATION_TRACKS } from '../education/education-curricula';
import type { CurriculumAuthorityId, EducationDomainId } from '../education/education-types';
import { computeRegistryMetrics, REGISTRY_SUBJECTS } from '../registry/knowledge-registry';
import type { RegistrySubjectNode } from '../registry/registry-types';
import { ANATOMY_FLASHCARDS, isCardDue } from '../spaced-repetition';
import type { StudyContextInput } from '../study-context-engine';

interface Props {
  atlas: Atlas | null;
  onExplore: () => void;
  onNavigate: (route: AppRoute) => void;
  onInspectConcept: (conceptId: string) => void;
  onExploreSystem: (systemId: CanonicalSystemId) => void;
  onOpenSearchWithQuery?: (query: string) => void;
  onOpenDomain?: (domainId: EducationDomainId) => void;
  onOpenSyllabusFramework?: (frameworkId: CurriculumAuthorityId) => void;
  onOpenEducatorDomain?: (domainId: EducationDomainId) => void;
  onOpenStudyContext?: (input: StudyContextInput) => void;
}

const FEATURED_STRUCTURES = [
  { conceptId: 'FMA7088', name: 'Heart', subtitle: 'Four-chambered blood pump' },
  { conceptId: 'FMA50801', name: 'Brain', subtitle: 'Control center for thought & senses' },
  { conceptId: 'FMA7309', name: 'Right lung', subtitle: 'Breathing & oxygen exchange' },
  { conceptId: 'FMA7197', name: 'Liver', subtitle: 'Digestion helper & filter organ' },
  { conceptId: 'FMA7148', name: 'Stomach', subtitle: 'Breaks down swallowed food' },
  { conceptId: 'FMA7203', name: 'Kidney', subtitle: 'Filters blood & balances water' },
  { conceptId: 'FMA46565', name: 'Skull', subtitle: 'Protective bone case for the brain' },
  { conceptId: 'FMA9611', name: 'Femur', subtitle: 'Strongest upper leg bone' },
];

type DomainGroupFilter = 'all' | RegistrySubjectNode['group'];

const DOMAIN_GROUPS: { id: DomainGroupFilter; label: string }[] = [
  { id: 'all', label: 'All 16 Subjects' },
  { id: 'foundational_biosciences', label: 'Foundational Biosciences' },
  { id: 'organ_systems_and_function', label: 'Organ Systems & Function' },
  { id: 'disease_and_therapeutics', label: 'Disease & Therapeutics' },
  { id: 'clinical_and_practice', label: 'Clinical & Practice' },
];

const TRACK_SHORT_MAP = new Map(EDUCATION_TRACKS.map((t) => [t.id, t.shortLabel]));
const TRACK_LABEL_MAP = new Map(EDUCATION_TRACKS.map((t) => [t.id, t.label]));

export default function HomePage({
  atlas,
  onExplore,
  onNavigate,
  onInspectConcept,
  onExploreSystem,
  onOpenSearchWithQuery,
  onOpenDomain,
  onOpenSyllabusFramework,
  onOpenEducatorDomain,
  onOpenStudyContext,
}: Props) {
  const {
    state,
    revisionQueue,
    reopenOnboarding,
    setExperienceDepth,
  } = useStudy();
  const [heroSearch, setHeroSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<DomainGroupFilter>('all');

  const metrics = useMemo(() => computeRegistryMetrics(atlas), [atlas]);

  const partCountsByMesh = useMemo(() => {
    const map = new Map<string, number>();
    if (atlas) {
      for (const p of atlas.parts) {
        map.set(p.system, (map.get(p.system) ?? 0) + 1);
      }
    }
    return map;
  }, [atlas]);

  const visibleSubjects = useMemo(
    () =>
      groupFilter === 'all'
        ? REGISTRY_SUBJECTS
        : REGISTRY_SUBJECTS.filter((s) => s.group === groupFilter),
    [groupFilter],
  );

  const dueCardsCount = useMemo(() => {
    const now = Date.now();
    return ANATOMY_FLASHCARDS.filter((c) => isCardDue(state.flashcardReviews[c.id], now)).length;
  }, [state.flashcardReviews]);

  const weakCount = Object.keys(state.weakConcepts).length;
  const hasSavedHistory =
    Boolean(state.lastStudyContext) ||
    state.completedTopicIds.length > 0 ||
    state.quizProgress.answeredIds.length > 0 ||
    state.practicalAttempts.length > 0 ||
    Object.keys(state.flashcardReviews).length > 0 ||
    state.customSyllabi.length > 0;

  const pathwaySummaryLabel = useMemo(() => {
    if (state.audienceRole === 'teaching') {
      return 'Teaching Pathway · Educator & Lecture Tools';
    }
    if (state.audienceRole === 'learning') {
      const trackName =
        (state.educationTrackId && TRACK_LABEL_MAP.get(state.educationTrackId)) ||
        state.profile.track;
      return `Learning Pathway · ${trackName}`;
    }
    if (state.trackSelected) {
      return `Saved Study Track · ${state.profile.track}`;
    }
    return 'Open Exploration · No track chosen yet (Change anytime)';
  }, [state.audienceRole, state.educationTrackId, state.profile.track, state.trackSelected]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (onOpenSearchWithQuery) {
      onOpenSearchWithQuery(heroSearch.trim());
    } else {
      onNavigate('search');
    }
  };

  const launchStartLearning = () => {
    if (state.audienceRole === 'teaching') {
      onNavigate('educator');
      return;
    }
    if (onOpenStudyContext) {
      onOpenStudyContext(
        state.lastStudyContext ?? {
          conceptId: 'FMA7088',
          topicId: 'topic-cardio-heart-chambers',
          systemId: 'cardiovascular',
          domainId: 'human_anatomy',
          sourceModule: 'home',
        },
      );
      return;
    }
    onNavigate('learn');
  };

  const heroVoiceSummary =
    state.audienceRole === 'teaching'
      ? 'Welcome to Anatomy 360 Educator Mode. Choose any subject, match your syllabus, sequence topics, present in 3D, or export PowerPoint, PDF, and Markdown handouts.'
      : 'Welcome to Anatomy 360. Explore the human body in 3D, follow plain-language or university-level lessons, match your syllabus, and test yourself with quizzes and practical spotter exams.';

  return (
    <div className="a360-page">
      {!state.onboardingDismissed ? (
        <OnboardingExperience
          onNavigate={onNavigate}
          onStartGuidedStudy={() =>
            onOpenStudyContext
              ? onOpenStudyContext({
                  conceptId: 'FMA7088',
                  topicId: 'topic-cardio-heart-chambers',
                  systemId: 'cardiovascular',
                  domainId: 'human_anatomy',
                  sourceModule: 'home',
                })
              : onNavigate('learn')
          }
        />
      ) : (
        <section className="a360-pathway-strip" aria-label="Current pathway and explanation depth">
          <div className="a360-pathway-strip-copy">
            <strong>{pathwaySummaryLabel}</strong>
            <span>
              View mode:{' '}
              {state.experienceDepth === 'guided'
                ? 'Guided Mode (Simpler explanations & step-by-step cues)'
                : 'Full / Advanced Mode (All scientific & clinical detail)'}
            </span>
          </div>
          <div className="a360-pathway-strip-actions">
            <div className="a360-embedded-toolgroup" role="group" aria-label="Explanation mode">
              <button
                type="button"
                className={`a360-mini-btn ${state.experienceDepth === 'guided' ? 'active' : ''}`}
                onClick={() => setExperienceDepth('guided')}
              >
                Guided Mode
              </button>
              <button
                type="button"
                className={`a360-mini-btn ${state.experienceDepth === 'full' ? 'active' : ''}`}
                onClick={() => setExperienceDepth('full')}
              >
                Full / Advanced
              </button>
            </div>
            <button type="button" className="a360-mini-btn" onClick={reopenOnboarding}>
              <SlidersHorizontal size={13} aria-hidden="true" />
              <span>Change Pathway &amp; Level</span>
            </button>
          </div>
        </section>
      )}

      {/* SECTION 1 — Welcome & Start Here */}
      <section className="a360-hero">
        <div className="a360-hero-copy">
          <p className="a360-kicker">
            3D Human Body · Step-by-Step Lessons · Practice &amp; Teaching Tools
          </p>
          <h1>
            {state.audienceRole === 'teaching'
              ? 'Teach human body sciences with synchronized 3D, curricula, and class exports.'
              : 'Understand the human body—from your first curiosity to university exams.'}
          </h1>
          <p className="a360-lead">
            {state.experienceDepth === 'guided'
              ? `Start gently in plain language or switch anytime to full medical depth. Inspect ${metrics.atlasMeshesCount.toLocaleString()}+ 3D body parts, explore ${metrics.subjectsCount} subjects, match ${metrics.curriculumFrameworksCount} school & university syllabi, and practice quizzes with zero account required.`
              : `Built for Grades 6–12, FSc/MDCAT, CBSE, A-Level, MBBS/MD, allied health, and educators. Search across ${metrics.subjectsCount} biomedical domains, ${metrics.topicsCount} registry topics, ${metrics.curriculumFrameworksCount} worldwide curricula, and ${metrics.atlasMeshesCount.toLocaleString()} base 3D meshes (2,301 Male / 2,328 Female default across 2,401 bundled assets).`}
          </p>

          {/* Global Hero Search */}
          <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex flex-1 items-center">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search any organ, topic, subject, or syllabus (e.g., Heart, Lungs, Pharmacology)…"
                aria-label="Search any human science topic, anatomical structure or subject"
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-800 focus:outline-none"
              />
            </div>
            <button type="submit" className="a360-btn-primary shrink-0">
              Search Everything
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span>Popular searches:</span>
            {['Heart', 'Brain', 'Kidney', 'Pharmacology', 'Acid-Base'].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() =>
                  onOpenSearchWithQuery ? onOpenSearchWithQuery(q) : onNavigate('search')
                }
                className="font-medium text-teal-800 hover:underline"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="a360-hero-actions">
            <button type="button" className="a360-btn-primary" onClick={launchStartLearning}>
              <BookOpen size={16} aria-hidden="true" />
              {state.audienceRole === 'teaching'
                ? 'Open Educator Workspace'
                : hasSavedHistory
                  ? 'Continue Learning'
                  : 'Start Learning'}
            </button>
            <button type="button" className="a360-btn-secondary" onClick={onExplore}>
              <Box size={16} aria-hidden="true" />
              Explore 3D Body
            </button>
            <button
              type="button"
              className="a360-btn-secondary"
              onClick={() => onNavigate('syllabus')}
            >
              <Globe2 size={16} aria-hidden="true" />
              Find My Syllabus
            </button>
            <SpeakGuidanceButton text={heroVoiceSummary} label="Listen" stopLabel="Stop" />
          </div>
        </div>

        <div className="a360-hero-panel">
          <div className="a360-panel-head">
            <h2>Quick-Inspect 3D Body Parts</h2>
            <span>Tap any organ or bone to open it directly in the interactive 3D body viewer</span>
          </div>
          <div className="a360-quick-grid">
            {FEATURED_STRUCTURES.map((item) => (
              <button
                key={item.conceptId}
                type="button"
                className="a360-quick-item"
                onClick={() => onInspectConcept(item.conceptId)}
              >
                <strong>{item.name}</strong>
                <span>{item.subtitle}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 — Choose What You Want to Do */}
      <section className="a360-section" aria-labelledby="section-choose-goal">
        <div className="a360-section-head">
          <div>
            <p className="a360-kicker">Step-by-Step Paths</p>
            <h2 id="section-choose-goal">Choose What You Want to Do</h2>
            <p>
              Pick one starting goal below. Every path stays connected so you can move between 3D views, plain notes, deep chapters, and quizzes anytime.
            </p>
          </div>
          <button type="button" className="a360-text-link" onClick={() => onNavigate('tools')}>
            See All 21 Tools <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="a360-intent-grid">
          <button type="button" className="a360-intent-card" onClick={onExplore}>
            <span className="a360-tool-icon-box">
              <Box size={18} aria-hidden="true" />
            </span>
            <strong>Explore the 3D Body</strong>
            <span>Rotate Male &amp; Female models, peel back layers, and tap any part.</span>
          </button>

          <button type="button" className="a360-intent-card" onClick={() => onNavigate('learn')}>
            <span className="a360-tool-icon-box">
              <BookOpen size={18} aria-hidden="true" />
            </span>
            <strong>Learn by System or Subject</strong>
            <span>Study all 12 body systems and 16 biomedical subjects chapter by chapter.</span>
          </button>

          <button
            type="button"
            className="a360-intent-card"
            onClick={() =>
              onOpenStudyContext
                ? onOpenStudyContext({
                    conceptId: 'FMA7088',
                    topicId: 'topic-cardio-heart-chambers',
                    systemId: 'cardiovascular',
                    sourceModule: 'home',
                  })
                : onNavigate('study')
            }
          >
            <span className="a360-tool-icon-box">
              <Compass size={18} aria-hidden="true" />
            </span>
            <strong>Guided Study Workspace</strong>
            <span>Read simple or advanced explanations right beside the live 3D organ.</span>
          </button>

          <button type="button" className="a360-intent-card" onClick={() => onNavigate('quiz')}>
            <span className="a360-tool-icon-box">
              <HelpCircle size={18} aria-hidden="true" />
            </span>
            <strong>Practice a Quiz or Spotter Exam</strong>
            <span>Check your memory with multiple-choice quizzes or 3D organ spotter tests.</span>
          </button>

          <button type="button" className="a360-intent-card" onClick={() => onNavigate('syllabus')}>
            <span className="a360-tool-icon-box">
              <Globe2 size={18} aria-hidden="true" />
            </span>
            <strong>Find or Match Your Syllabus</strong>
            <span>Pick a national/exam curriculum or paste your own course outline.</span>
          </button>

          <button type="button" className="a360-intent-card" onClick={() => onNavigate('educator')}>
            <span className="a360-tool-icon-box">
              <GraduationCap size={18} aria-hidden="true" />
            </span>
            <strong>Teach &amp; Prepare Lectures</strong>
            <span>Build custom lesson sequences, run 3D tours, and download class handouts.</span>
          </button>
        </div>
      </section>

      {/* SECTION 3 — Continue Learning / Beginner Starter */}
      <section className="a360-continue-card" aria-labelledby="section-continue">
        <div className="a360-continue-copy">
          <p className="a360-kicker">
            {hasSavedHistory ? 'Pick Up Where You Left Off' : 'Recommended First Lesson'}
          </p>
          <h2 id="section-continue">
            {hasSavedHistory ? 'Continue Your Study Plan' : 'New Here? Start with the Human Heart'}
          </h2>
          {hasSavedHistory ? (
            <p className="a360-muted">
              {state.completedTopicIds.length} topics completed · {dueCardsCount} flashcards ready for
              review · {weakCount} weak spotter {weakCount === 1 ? 'area' : 'areas'} ·{' '}
              {state.customSyllabi.length} saved{' '}
              {state.customSyllabi.length === 1 ? 'syllabus' : 'syllabi'}.
            </p>
          ) : (
            <p className="a360-muted">
              Open the Guided Study Workspace for the Heart: see it beat in 3D context, read a clear
              plain-language explanation first, and answer a quick check question.
            </p>
          )}
        </div>
        <div className="a360-continue-actions">
          <button type="button" className="a360-btn-primary" onClick={launchStartLearning}>
            <Play size={15} aria-hidden="true" />
            {hasSavedHistory ? 'Resume Study Workspace' : 'Start First Lesson: Heart'}
          </button>
          {hasSavedHistory ? (
            <>
              <button
                type="button"
                className="a360-btn-secondary"
                onClick={() => onNavigate('revision')}
              >
                Review Queue ({revisionQueue.length})
              </button>
              <button
                type="button"
                className="a360-btn-secondary"
                onClick={() => onNavigate('dashboard')}
              >
                Open Progress Dashboard
              </button>
            </>
          ) : (
            <button type="button" className="a360-btn-secondary" onClick={onExplore}>
              Try 3D Explorer First
            </button>
          )}
        </div>
      </section>

      {/* Live Registry Metrics Strip */}
      <section className="a360-metrics-strip" aria-label="Verified dataset metrics">
        <div className="a360-metric">
          <strong>{metrics.atlasMeshesCount.toLocaleString()}</strong>
          <span>Selectable 3D Body Parts</span>
        </div>
        <div className="a360-metric">
          <strong>{metrics.atlasConceptsCount.toLocaleString()}</strong>
          <span>Named Anatomical Concepts</span>
        </div>
        <div className="a360-metric">
          <strong>
            {metrics.subjectsCount} · {metrics.topicsCount}
          </strong>
          <span>Subjects &amp; Guided Topics</span>
        </div>
        <div className="a360-metric">
          <strong>
            {metrics.curriculumFrameworksCount} · {metrics.totalAssessmentQuestionsCount}
          </strong>
          <span>Worldwide Syllabi &amp; Practice Questions</span>
        </div>
      </section>

      {/* SECTION A — Find My Syllabus */}
      <section className="a360-section" aria-labelledby="section-find-syllabus">
        <div className="a360-section-head">
          <div>
            <p className="a360-kicker">School &amp; University Syllabi</p>
            <h2 id="section-find-syllabus">Find or Match Your Syllabus</h2>
            <p>
              Browse {metrics.curriculumFrameworksCount} school, pre-med, and university curricula—or paste your own class outline to see which lessons already match.
            </p>
          </div>
          <button type="button" className="a360-text-link" onClick={() => onNavigate('syllabus')}>
            Open Syllabus Navigator <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Course Not Listed? Match Any Syllabus Locally
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Paste syllabus lines, upload a <code>.txt</code>/<code>.md</code>/<code>.csv</code>{' '}
                file, or type topics manually. Anatomy 360 matches each item privately in your
                browser and tells you honestly what is available, partial, or not yet covered.
              </p>
              <p className="mt-3 font-mono text-xs tabular-nums text-slate-500">
                {state.customSyllabi.length} custom{' '}
                {state.customSyllabi.length === 1 ? 'syllabus' : 'syllabi'} saved locally in your
                browser
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                className="a360-btn-primary"
                onClick={() => onNavigate('syllabus')}
              >
                <Compass size={15} aria-hidden="true" />
                Open Syllabus Navigator
              </button>
              <button
                type="button"
                className="a360-btn-secondary"
                onClick={() => onNavigate('educator')}
              >
                <FileText size={15} aria-hidden="true" />
                Export Syllabus Outline
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            {CURRICULUM_FRAMEWORKS.slice(0, 6).map((fw) => (
              <div
                key={fw.id}
                className="flex flex-col justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-mono text-xs text-slate-500">
                    {fw.country} · {fw.applicableGradesOrYears}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900">{fw.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{fw.supports}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                  <span className="text-slate-500">{fw.authority}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenSyllabusFramework
                        ? onOpenSyllabusFramework(fw.id)
                        : onNavigate('syllabus')
                    }
                    className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:underline"
                  >
                    Inspect <ArrowRight size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION B — Browse All 16 Human Science Subjects */}
      <section className="a360-section" aria-labelledby="section-browse-subjects">
        <div className="a360-section-head">
          <div>
            <p className="a360-kicker">Complete Biomedical &amp; Science Directory</p>
            <h2 id="section-browse-subjects">Explore All {metrics.subjectsCount} Subjects</h2>
            <p>
              Flow: Subject → Chapters → Topics → Connected Study Workspace with plain and deep explanations.
            </p>
          </div>
          <button
            type="button"
            className="a360-text-link"
            onClick={() => onOpenDomain?.('cell_biology') ?? onNavigate('learn')}
          >
            Open Curriculum Hub <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter subjects by group">
          {DOMAIN_GROUPS.map((g) => {
            const active = groupFilter === g.id;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setGroupFilter(g.id)}
                className={`min-h-[40px] whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'border-teal-800 bg-teal-800 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleSubjects.map((subj) => {
            const trackSummary = subj.targetTracks
              .map((t) => TRACK_SHORT_MAP.get(t) ?? t)
              .slice(0, 2)
              .join(' · ');

            return (
              <article
                key={subj.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-mono text-xs tabular-nums text-slate-500">
                    {subj.code} · {subj.chapterIds.length} ch · {subj.topicCount} topics
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">{subj.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{subj.overview}</p>
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-medium text-slate-500">
                    {subj.coverageLabel} · {trackSummary}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="a360-card-btn"
                      onClick={() =>
                        onOpenDomain ? onOpenDomain(subj.domainId) : onNavigate('learn')
                      }
                    >
                      Open Subject
                    </button>
                    <button
                      type="button"
                      className="a360-card-link"
                      onClick={() =>
                        onOpenEducatorDomain
                          ? onOpenEducatorDomain(subj.domainId)
                          : onNavigate('educator')
                      }
                    >
                      Educator Plan
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* SECTION C — Explore the Human Body (12 Canonical Systems) */}
      <section className="a360-section" aria-labelledby="section-human-body">
        <div className="a360-section-head">
          <div>
            <p className="a360-kicker">3D Human Body Atlas</p>
            <h2 id="section-human-body">Explore the 12 Body Systems</h2>
            <p>
              Click <strong>Explore in 3D</strong> to isolate any body system directly inside the 3D viewer, or open its reference guide to look up every organ.
            </p>
          </div>
          <button type="button" className="a360-text-link" onClick={() => onNavigate('systems')}>
            Open Body Systems Guide <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="a360-systems-grid">
          {CANONICAL_SYSTEMS.map((sys) => {
            const count = sys.meshSystems.reduce(
              (acc, m) => acc + (partCountsByMesh.get(m) ?? 0),
              0,
            );
            return (
              <article key={sys.id} className="a360-system-card">
                <div className="a360-system-card-top">
                  <span
                    className="a360-swatch"
                    style={{ background: sys.color }}
                    aria-hidden="true"
                  />
                  <h3>{sys.name.en}</h3>
                </div>
                <p className="a360-system-meta">
                  {sys.coverageLabel} ·{' '}
                  {atlas === null
                    ? 'Loading 3D index…'
                    : count > 0
                      ? `${count.toLocaleString()} parts in 3D`
                      : 'Planned'}
                </p>
                <p className="a360-system-summary">{sys.shortSummary.en}</p>
                <div className="a360-card-actions">
                  <button
                    type="button"
                    className="a360-card-btn"
                    onClick={() => onExploreSystem(sys.id)}
                  >
                    Explore in 3D
                  </button>
                  <button
                    type="button"
                    className="a360-card-link"
                    onClick={() => onNavigate('systems')}
                  >
                    Parts &amp; notes
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* SECTION D — Teaching Tools + Complete Tools & Resources */}
      <section className="a360-section a360-learning-band" aria-labelledby="section-educator-labs">
        <div className="a360-section-head">
          <div>
            <p className="a360-kicker">Teaching &amp; Specialist Tools</p>
            <h2 id="section-educator-labs">Teacher &amp; Professor Workspace + Practice Labs</h2>
            <p>
              Plan lessons across 16 subjects, present animated 3D tours in class, practice with quizzes or simulations, or view every tool in one place.
            </p>
          </div>
          <button type="button" className="a360-text-link" onClick={() => onNavigate('tools')}>
            <LayoutGrid size={15} aria-hidden="true" /> Open All Tools Directory
          </button>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="font-mono text-xs text-teal-800">
              Schools · Grades 9–12 · BS / MBBS · MPhil / PhD Lecturers
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Teacher &amp; Professor Planning Workspace
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Choose any subject, curriculum alignment reference, or saved custom syllabus. Inspect
              chapter outcomes, coverage notes, reorder teaching steps, and download PowerPoint
              (<code>.pptx</code>), PDF, and Markdown lecture outlines or student worksheets.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              type="button"
              className="a360-btn-primary"
              onClick={() => onNavigate('educator')}
            >
              <GraduationCap size={16} aria-hidden="true" />
              Open Educator Workspace
            </button>
            <button
              type="button"
              className="a360-btn-secondary"
              onClick={() => onNavigate('present')}
            >
              <Play size={15} aria-hidden="true" />
              3D Presentation Studio
            </button>
          </div>
        </div>

        <div className="a360-features-grid">
          <button type="button" className="a360-feature-card" onClick={() => onNavigate('learn')}>
            <BookOpen size={20} aria-hidden="true" />
            <h3>16 Subjects &amp; 12 System Lessons</h3>
            <p>
              Synchronized anatomy and biomedical chapters with guided 3D pathways and terminology.
            </p>
            <span className="a360-feature-cta">
              Open lessons <ArrowRight size={14} aria-hidden="true" />
            </span>
          </button>

          <button
            type="button"
            className="a360-feature-card"
            onClick={() => onNavigate('relationships')}
          >
            <GitBranch size={20} aria-hidden="true" />
            <h3>How Parts Connect</h3>
            <p>
              Trace verified muscle attachments, joint articulations, blood supply, and nerve networks.
            </p>
            <span className="a360-feature-cta">
              Explore connections <ArrowRight size={14} aria-hidden="true" />
            </span>
          </button>

          <button
            type="button"
            className="a360-feature-card"
            onClick={() => onNavigate('revision')}
          >
            <Layers3 size={20} aria-hidden="true" />
            <h3>Flashcards &amp; Weak-Area Review</h3>
            <p>
              Memory deck with 3D previews, smart review timing, bookmarks, and weak-area queue.
            </p>
            <span className="a360-feature-cta">
              Open flashcards <ArrowRight size={14} aria-hidden="true" />
            </span>
          </button>

          <button
            type="button"
            className="a360-feature-card"
            onClick={() => onNavigate('physiology')}
          >
            <Activity size={20} aria-hidden="true" />
            <h3>How the Body Works (Simulations)</h3>
            <p>
              Interactive heart output, breathing, kidney filtration, arm lever mechanics &amp; acid-base sliders.
            </p>
            <span className="a360-feature-cta">
              Launch simulations <ArrowRight size={14} aria-hidden="true" />
            </span>
          </button>

          <button
            type="button"
            className="a360-feature-card"
            onClick={() => onNavigate('histology')}
          >
            <Microscope size={20} aria-hidden="true" />
            <h3>Tissues Under the Microscope</h3>
            <p>
              Epithelial, connective, muscle, and nerve tissue micrographs linked to whole organs.
            </p>
            <span className="a360-feature-cta">
              Browse tissues <ArrowRight size={14} aria-hidden="true" />
            </span>
          </button>

          <button
            type="button"
            className="a360-feature-card"
            onClick={() => onNavigate('clinical')}
          >
            <Stethoscope size={20} aria-hidden="true" />
            <h3>Real-Life Medical Cases</h3>
            <p>
              Applied anatomy scenarios with clear explanations, 3D inspection, and self-checks.
            </p>
            <span className="a360-feature-cta">
              Study cases <ArrowRight size={14} aria-hidden="true" />
            </span>
          </button>

          <button type="button" className="a360-feature-card" onClick={() => onNavigate('quiz')}>
            <HelpCircle size={20} aria-hidden="true" />
            <h3>Practice Quizzes &amp; Spotter Lab</h3>
            <p>
              Multiple-choice practice questions and interactive 3D spotter tests linked to every organ.
            </p>
            <span className="a360-feature-cta">
              Practice quizzes <ArrowRight size={14} aria-hidden="true" />
            </span>
          </button>

          <button type="button" className="a360-feature-card" onClick={() => onNavigate('atlases')}>
            <Compass size={20} aria-hidden="true" />
            <h3>3D Models &amp; Dataset Manager</h3>
            <p>
              Inspect Male &amp; Female 3D coverage disclosures (2,301 Male / 2,328 Female + 8 optional layers) and validate packs.
            </p>
            <span className="a360-feature-cta">
              Open atlas manager <ArrowRight size={14} aria-hidden="true" />
            </span>
          </button>
        </div>
      </section>

      <footer className="a360-footer">
        <p>
          <strong>Anatomy 360</strong> · Universal Human Sciences &amp; 3D Anatomy Platform ·
          BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0
          International.
        </p>
        <div className="a360-footer-links">
          <button type="button" onClick={() => onNavigate('tools')}>
            All Tools
          </button>
          <button type="button" onClick={() => onNavigate('syllabus')}>
            Syllabus Navigator
          </button>
          <button type="button" onClick={() => onNavigate('educator')}>
            Educator Workspace
          </button>
          <button type="button" onClick={() => onNavigate('about')}>
            About &amp; Attribution
          </button>
          <button type="button" onClick={onExplore}>
            3D Explorer
          </button>
        </div>
      </footer>
    </div>
  );
}
