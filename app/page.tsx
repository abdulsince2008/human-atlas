import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { Atlas, SystemId } from './anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from './anatomy-systems';
import SiteHeader, { type AppRoute } from './components/SiteHeader';
import { FirebaseProvider } from './components/FirebaseContext';
import FirebaseErrorBoundary from './components/FirebaseErrorBoundary';
import { StudyProvider } from './components/StudyContext';
import type { CurriculumAuthorityId, EducationDomainId } from './education/education-types';
import type { LearningCategoryId } from './learning-data';
import AboutPage from './pages/AboutPage';
import AtlasManagerPage from './pages/AtlasManagerPage';
import ClinicalPage from './pages/ClinicalPage';
import DashboardPage from './pages/DashboardPage';
import EducatorPage from './pages/EducatorPage';
import HistologyPage from './pages/HistologyPage';
import HomePage from './pages/HomePage';
import LearnPage from './pages/LearnPage';
import PhysiologyPage from './pages/PhysiologyPage';
import PracticalLabPage from './pages/PracticalLabPage';
import QuizPage from './pages/QuizPage';
import RelationshipsPage from './pages/RelationshipsPage';
import RevisionPage from './pages/RevisionPage';
import SearchPage from './pages/SearchPage';
import SyllabusNavigatorPage from './pages/SyllabusNavigatorPage';
import SystemsPage from './pages/SystemsPage';
import UniversalStudyWorkspace from './components/UniversalStudyWorkspace';
import {
  encodeStudyContextHash,
  parseStudyContextFromHash,
  type StudyContextInput,
} from './study-context-engine';

const ExplorerView = lazy(() => import('./components/ExplorerView'));
const PresentationStudioPage = lazy(() => import('./pages/PresentationStudioPage'));

function parseRouteFromHash(): AppRoute {
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
  if (hash === 'study') return 'study';
  if (hash === 'explorer' || hash === '3d') return 'explorer';
  if (hash === 'present' || hash === 'presentation' || hash === 'studio') return 'present';
  if (hash === 'systems' || hash === 'reference') return 'systems';
  if (hash === 'relationships') return 'relationships';
  if (hash === 'learn') return 'learn';
  if (hash === 'practical-lab' || hash === 'lab') return 'practical-lab';
  if (hash === 'dashboard') return 'dashboard';
  if (hash === 'revision' || hash === 'flashcards') return 'revision';
  if (hash === 'bookmarks') return 'bookmarks';
  if (hash === 'physiology') return 'physiology';
  if (hash === 'histology') return 'histology';
  if (hash === 'clinical') return 'clinical';
  if (hash === 'quiz' || hash === 'quizzes') return 'quiz';
  if (hash === 'atlases') return 'atlases';
  if (hash === 'syllabus' || hash === 'syllabi' || hash === 'curricula') return 'syllabus';
  if (hash === 'educator' || hash === 'teacher' || hash === 'professor') return 'educator';
  if (hash === 'search') return 'search';
  if (hash === 'about') return 'about';
  return 'home';
}

function parseHashParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  const query = window.location.hash.split('?')[1] ?? '';
  return new URLSearchParams(query);
}

function parsePresentationIdFromHash(): string | null {
  return parseHashParams().get('id');
}

interface EducatorIntentState {
  sourceKind?: 'domain' | 'framework' | 'custom_syllabus';
  domainId?: EducationDomainId;
  frameworkId?: CurriculumAuthorityId;
  customSyllabusId?: string;
}

export default function Home() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? parseRouteFromHash() : 'home',
  );
  const [presentationIntent, setPresentationIntent] = useState<{ id: string; seq: number } | null>(
    () => {
      const r = typeof window !== 'undefined' ? parseRouteFromHash() : 'home';
      const pid = parsePresentationIdFromHash();
      return r === 'present' && pid ? { id: pid, seq: 1 } : null;
    },
  );
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [atlasError, setAtlasError] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<CanonicalSystemId>('cardiovascular');

  const [focusConceptId, setFocusConceptId] = useState<string | null>(null);
  const [focusPartId, setFocusPartId] = useState<string | null>(null);
  const [visibleMeshSystems, setVisibleMeshSystems] = useState<SystemId[] | null>(null);

  const [learnCategoryIntent, setLearnCategoryIntent] = useState<LearningCategoryId | null>(null);
  const [learnDomainIntent, setLearnDomainIntent] = useState<EducationDomainId | null>(null);
  const [learnSystemIntent, setLearnSystemIntent] = useState<CanonicalSystemId | null>(null);
  const [learnTopicIntent, setLearnTopicIntent] = useState<string | null>(null);
  const [learnFrameworkIntent, setLearnFrameworkIntent] = useState<CurriculumAuthorityId | null>(
    null,
  );

  const [searchQueryIntent, setSearchQueryIntent] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    if (parseRouteFromHash() === 'search') return parseHashParams().get('q');
    return null;
  });
  const [syllabusFrameworkIntent, setSyllabusFrameworkIntent] =
    useState<CurriculumAuthorityId | null>(() => {
      if (typeof window === 'undefined') return null;
      if (parseRouteFromHash() === 'syllabus') {
        return (parseHashParams().get('id') as CurriculumAuthorityId | null) ?? null;
      }
      return null;
    });
  const [educatorIntent, setEducatorIntent] = useState<EducatorIntentState>({});

  const [relationshipConceptId, setRelationshipConceptId] = useState<string | null>(null);
  const [referenceConceptId, setReferenceConceptId] = useState<string | null>(null);
  const [flashcardSystemIntent, setFlashcardSystemIntent] = useState<CanonicalSystemId | 'all'>(
    'all',
  );
  const [physiologyIntent, setPhysiologyIntent] = useState<{
    moduleId?: string | null;
    systemId?: CanonicalSystemId | null;
  }>({});
  const [histologyIntent, setHistologyIntent] = useState<{
    entryId?: string | null;
    systemId?: CanonicalSystemId | null;
  }>({});
  const [clinicalIntent, setClinicalIntent] = useState<{
    caseId?: string | null;
    systemId?: CanonicalSystemId | null;
  }>({});
  const [practicalLabSystemIntent, setPracticalLabSystemIntent] =
    useState<CanonicalSystemId | null>(null);
  const [studyInputState, setStudyInputState] = useState<StudyContextInput>(() => {
    if (typeof window === 'undefined') return { conceptId: 'FMA7088', sourceModule: 'study' };
    return parseRouteFromHash() === 'study'
      ? parseStudyContextFromHash(window.location.hash)
      : { conceptId: 'FMA7088', sourceModule: 'study' };
  });
  const [studyReturnRoute, setStudyReturnRoute] = useState<AppRoute | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    fetch('/models/atlas.json', { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw new Error('The anatomy catalog could not be loaded.');
        return r.json();
      })
      .then((data) => setAtlas(data as Atlas))
      .catch((e) => {
        if (e.name !== 'AbortError') setAtlasError(e.message || 'Failed to load catalog.');
      });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    const syncFromHash = (isHashChange: boolean) => {
      const nextRoute = parseRouteFromHash();
      const params = parseHashParams();
      if (isHashChange) {
        setRoute(nextRoute);
      }

      if (nextRoute === 'present') {
        const pid = params.get('id');
        if (pid) {
          if (isHashChange) {
            setPresentationIntent((prev) => ({ id: pid, seq: (prev?.seq ?? 0) + 1 }));
          }
        } else {
          setPresentationIntent(null);
        }
      } else if (isHashChange) {
        setPresentationIntent(null);
      }

      if (nextRoute === 'search') {
        const q = params.get('q');
        if (q !== null) setSearchQueryIntent(q);
      }

      if (nextRoute === 'syllabus') {
        const fid = params.get('id') as CurriculumAuthorityId | null;
        if (fid) setSyllabusFrameworkIntent(fid);
      }

      if (nextRoute === 'learn') {
        const dom = params.get('domain') as EducationDomainId | null;
        const tp = params.get('topic');
        const sys = params.get('system') as CanonicalSystemId | null;
        const fw = params.get('framework') as CurriculumAuthorityId | null;
        if (dom) {
          setLearnDomainIntent(dom);
          setLearnCategoryIntent(dom === 'human_anatomy' ? 'by-system' : 'curriculum-hub');
        }
        if (tp) setLearnTopicIntent(tp);
        if (sys) setLearnSystemIntent(sys);
        if (fw) setLearnFrameworkIntent(fw);
      }

      if (nextRoute === 'educator') {
        const dom = params.get('domain') as EducationDomainId | null;
        const fw = params.get('framework') as CurriculumAuthorityId | null;
        const custom = params.get('custom');
        if (custom) {
          setEducatorIntent({ sourceKind: 'custom_syllabus', customSyllabusId: custom });
        } else if (fw) {
          setEducatorIntent({ sourceKind: 'framework', frameworkId: fw });
        } else if (dom) {
          setEducatorIntent({ sourceKind: 'domain', domainId: dom });
        }
      }

      if (nextRoute === 'physiology') {
        setPhysiologyIntent({
          moduleId: params.get('module'),
          systemId: params.get('system') as CanonicalSystemId | null,
        });
      }
      if (nextRoute === 'histology') {
        setHistologyIntent({
          entryId: params.get('entry'),
          systemId: params.get('system') as CanonicalSystemId | null,
        });
      }
      if (nextRoute === 'clinical') {
        setClinicalIntent({
          caseId: params.get('case'),
          systemId: params.get('system') as CanonicalSystemId | null,
        });
      }
      if (nextRoute === 'practical-lab') {
        setPracticalLabSystemIntent(params.get('system') as CanonicalSystemId | null);
      }
      if (nextRoute === 'study') {
        setStudyInputState(parseStudyContextFromHash(window.location.hash));
      }
    };

    syncFromHash(false);
    const onHash = () => syncFromHash(true);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((next: AppRoute) => {
    const targetHash = next === 'home' ? '#/' : `#/${next}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setRoute(next);
    if (next !== 'explorer') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        route !== 'explorer' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        navigate('search');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [route, navigate]);

  const inspectConceptIn3D = useCallback(
    (conceptId: string) => {
      setFocusPartId(null);
      setVisibleMeshSystems(null);
      setFocusConceptId(conceptId);
      navigate('explorer');
    },
    [navigate],
  );

  const inspectPartIn3D = useCallback(
    (partId: string) => {
      setFocusConceptId(null);
      setVisibleMeshSystems(null);
      setFocusPartId(partId);
      navigate('explorer');
    },
    [navigate],
  );

  const exploreSystemIn3D = useCallback(
    (systemId: CanonicalSystemId) => {
      const sys = CANONICAL_SYSTEMS.find((s) => s.id === systemId);
      setFocusConceptId(null);
      setFocusPartId(null);
      setVisibleMeshSystems(sys ? sys.meshSystems : null);
      setSelectedSystem(systemId);
      navigate('explorer');
    },
    [navigate],
  );

  const clearExternalIntent = useCallback(() => {
    setFocusConceptId(null);
    setFocusPartId(null);
    setVisibleMeshSystems(null);
  }, []);

  const openActivityFromExplorer = useCallback(
    (nextRoute: AppRoute, targetId?: string) => {
      if (nextRoute === 'relationships' && targetId) {
        setRelationshipConceptId(targetId);
        navigate('relationships');
        return;
      }
      if (nextRoute === 'systems' && targetId) {
        setReferenceConceptId(targetId);
        navigate('systems');
        return;
      }
      if (nextRoute === 'present' && targetId) {
        setPresentationIntent((prev) => ({ id: targetId, seq: (prev?.seq ?? 0) + 1 }));
        window.location.hash = `#/present?id=${encodeURIComponent(targetId)}`;
        setRoute('present');
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        return;
      }
      if (nextRoute === 'learn') {
        setLearnDomainIntent('human_anatomy');
        if (targetId) setLearnTopicIntent(targetId);
        navigate('learn');
        return;
      }
      navigate(nextRoute);
    },
    [navigate],
  );

  const openSystemInLearn = useCallback(
    (systemId: CanonicalSystemId, topicId?: string) => {
      setLearnCategoryIntent('by-system');
      setLearnDomainIntent('human_anatomy');
      setLearnSystemIntent(systemId);
      setLearnTopicIntent(topicId ?? null);
      navigate('learn');
    },
    [navigate],
  );

  const openDomainInLearn = useCallback(
    (domainId: EducationDomainId, topicId?: string) => {
      setLearnDomainIntent(domainId);
      setLearnTopicIntent(topicId ?? null);
      setLearnFrameworkIntent(null);
      if (domainId === 'human_anatomy') {
        setLearnCategoryIntent('by-system');
      } else {
        setLearnCategoryIntent('curriculum-hub');
      }
      navigate('learn');
    },
    [navigate],
  );

  const openSearchWithQuery = useCallback((query: string) => {
    const trimmed = query.trim();
    setSearchQueryIntent(trimmed);
    const targetHash = trimmed ? `#/search?q=${encodeURIComponent(trimmed)}` : '#/search';
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setRoute('search');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const openSyllabusNavigator = useCallback((frameworkId?: CurriculumAuthorityId) => {
    setSyllabusFrameworkIntent(frameworkId ?? null);
    const targetHash = frameworkId
      ? `#/syllabus?id=${encodeURIComponent(frameworkId)}`
      : '#/syllabus';
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setRoute('syllabus');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const openEducatorWorkspace = useCallback((intent: EducatorIntentState = {}) => {
    setEducatorIntent(intent);
    const params = new URLSearchParams();
    if (intent.customSyllabusId) params.set('custom', intent.customSyllabusId);
    else if (intent.frameworkId) params.set('framework', intent.frameworkId);
    else if (intent.domainId) params.set('domain', intent.domainId);
    const qs = params.toString();
    const targetHash = qs ? `#/educator?${qs}` : '#/educator';
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setRoute('educator');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const openRelationships = useCallback(
    (conceptId: string) => {
      setRelationshipConceptId(conceptId);
      navigate('relationships');
    },
    [navigate],
  );

  const openReference = useCallback(
    (conceptId: string) => {
      setReferenceConceptId(conceptId);
      navigate('systems');
    },
    [navigate],
  );

  const openFlashcards = useCallback(
    (systemId: CanonicalSystemId) => {
      setFlashcardSystemIntent(systemId);
      navigate('revision');
    },
    [navigate],
  );

  const openPresentation = useCallback((presentationId: string) => {
    setPresentationIntent((prev) => ({ id: presentationId, seq: (prev?.seq ?? 0) + 1 }));
    const targetHash = `#/present?id=${encodeURIComponent(presentationId)}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setRoute('present');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const openStudyContext = useCallback(
    (input: StudyContextInput, originRoute?: AppRoute) => {
      const rawOrigin = originRoute ?? route;
      const normalizedSource =
        rawOrigin === 'practical-lab' ? 'practical_lab' : rawOrigin;
      const normalized: StudyContextInput = {
        ...input,
        sourceModule: input.sourceModule ?? (normalizedSource as StudyContextInput['sourceModule']),
      };
      if (originRoute && originRoute !== 'study') {
        setStudyReturnRoute(originRoute);
      } else if (route !== 'study') {
        setStudyReturnRoute(route);
      }
      setStudyInputState(normalized);
      const targetHash = encodeStudyContextHash(normalized);
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
      setRoute('study');
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    },
    [route],
  );

  const updateStudyInput = useCallback((next: StudyContextInput) => {
    setStudyInputState(next);
    const targetHash = encodeStudyContextHash(next);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  }, []);

  const openUniversalTopic = useCallback(
    (params: {
      route: AppRoute;
      domainId?: EducationDomainId;
      topicId?: string;
      systemId?: string;
      conceptId?: string;
      presentationId?: string;
      frameworkId?: CurriculumAuthorityId;
    }) => {
      if (params.route === 'explorer' && params.conceptId) {
        inspectConceptIn3D(params.conceptId);
        return;
      }
      if (params.route === 'present' && params.presentationId) {
        openPresentation(params.presentationId);
        return;
      }
      if (params.route === 'syllabus') {
        openSyllabusNavigator(params.frameworkId);
        return;
      }
      if (params.route === 'educator') {
        openEducatorWorkspace({
          sourceKind: 'domain',
          domainId: params.domainId ?? 'human_anatomy',
        });
        return;
      }
      if (params.route === 'learn') {
        if (params.domainId && params.domainId !== 'human_anatomy') {
          setLearnCategoryIntent('curriculum-hub');
          setLearnDomainIntent(params.domainId);
          setLearnTopicIntent(params.topicId ?? null);
          setLearnSystemIntent(null);
        } else if (params.systemId) {
          setLearnCategoryIntent('by-system');
          setLearnDomainIntent('human_anatomy');
          setLearnSystemIntent(params.systemId as CanonicalSystemId);
          setLearnTopicIntent(params.topicId ?? null);
        } else {
          setLearnCategoryIntent('curriculum-hub');
          setLearnDomainIntent(params.domainId ?? null);
          setLearnTopicIntent(params.topicId ?? null);
        }
        navigate('learn');
        return;
      }
      if (params.route === 'physiology') {
        setPhysiologyIntent({
          moduleId: params.topicId ?? null,
          systemId: (params.systemId as CanonicalSystemId | undefined) ?? null,
        });
        navigate('physiology');
        return;
      }
      if (params.route === 'histology') {
        setHistologyIntent({
          entryId: params.topicId ?? null,
          systemId: (params.systemId as CanonicalSystemId | undefined) ?? null,
        });
        navigate('histology');
        return;
      }
      if (params.route === 'clinical') {
        setClinicalIntent({
          caseId: params.topicId ?? null,
          systemId: (params.systemId as CanonicalSystemId | undefined) ?? null,
        });
        navigate('clinical');
        return;
      }
      if (params.route === 'practical-lab') {
        setPracticalLabSystemIntent((params.systemId as CanonicalSystemId | undefined) ?? null);
        navigate('practical-lab');
        return;
      }
      navigate(params.route);
    },
    [inspectConceptIn3D, navigate, openEducatorWorkspace, openPresentation, openSyllabusNavigator],
  );

  return (
    <FirebaseErrorBoundary>
      <StudyProvider>
        <FirebaseProvider>
          <div className={`a360-shell ${route === 'explorer' ? 'is-explorer' : ''}`}>
            <SiteHeader
              route={route}
              onNavigate={navigate}
              onOpenSearch={() => openSearchWithQuery('')}
            />

            <main className="a360-main">
              {route === 'home' && (
                <HomePage
                  atlas={atlas}
                  onExplore={() => navigate('explorer')}
                  onNavigate={navigate}
                  onInspectConcept={inspectConceptIn3D}
                  onExploreSystem={exploreSystemIn3D}
                  onOpenSearchWithQuery={openSearchWithQuery}
                  onOpenDomain={(domainId) => openDomainInLearn(domainId)}
                  onOpenSyllabusFramework={(fwId) => openSyllabusNavigator(fwId)}
                  onOpenEducatorDomain={(domainId) =>
                    openEducatorWorkspace({ sourceKind: 'domain', domainId })
                  }
                  onOpenStudyContext={(input) => openStudyContext(input, 'home')}
                />
              )}

              {route === 'study' && (
                <UniversalStudyWorkspace
                  atlas={atlas}
                  atlasError={atlasError}
                  studyInput={studyInputState}
                  returnLabel={
                    studyReturnRoute
                      ? studyReturnRoute.charAt(0).toUpperCase() + studyReturnRoute.slice(1)
                      : null
                  }
                  onReturnOrigin={
                    studyReturnRoute ? () => navigate(studyReturnRoute) : undefined
                  }
                  onChangeStudyInput={updateStudyInput}
                  onInspectInFullExplorer={inspectConceptIn3D}
                  onOpenRelationships={openRelationships}
                  onOpenPhysiology={(moduleId, systemId) => {
                    setPhysiologyIntent({ moduleId, systemId });
                    navigate('physiology');
                  }}
                  onOpenClinical={(caseId, systemId) => {
                    setClinicalIntent({ caseId, systemId });
                    navigate('clinical');
                  }}
                  onOpenHistology={(entryId, systemId) => {
                    setHistologyIntent({ entryId, systemId });
                    navigate('histology');
                  }}
                  onOpenPresentation={openPresentation}
                  onOpenSystemLesson={openSystemInLearn}
                />
              )}

              {route === 'syllabus' && (
                <SyllabusNavigatorPage
                  initialFrameworkId={syllabusFrameworkIntent}
                  onNavigate={navigate}
                  onOpenTopic={openUniversalTopic}
                  onOpenEducatorForFramework={(fwId) =>
                    openEducatorWorkspace({ sourceKind: 'framework', frameworkId: fwId })
                  }
                  onOpenEducatorForCustomSyllabus={(customId) =>
                    openEducatorWorkspace({ sourceKind: 'custom_syllabus', customSyllabusId: customId })
                  }
                />
              )}

              {route === 'educator' && (
                <EducatorPage
                  initialSourceKind={educatorIntent.sourceKind}
                  initialDomainId={educatorIntent.domainId}
                  initialFrameworkId={educatorIntent.frameworkId}
                  initialCustomSyllabusId={educatorIntent.customSyllabusId}
                  onNavigate={navigate}
                  onOpenTopic={openUniversalTopic}
                />
              )}

              {route === 'systems' && (
                <SystemsPage
                  atlas={atlas}
                  selectedSystem={selectedSystem}
                  initialConceptId={referenceConceptId}
                  onSelectSystem={setSelectedSystem}
                  onExploreSystem={exploreSystemIn3D}
                  onInspectPart={inspectPartIn3D}
                  onInspectConcept={inspectConceptIn3D}
                  onOpenRelationships={openRelationships}
                  onOpenLearnSystem={openSystemInLearn}
                  onOpenFlashcards={openFlashcards}
                  onOpenPracticalLab={() => navigate('practical-lab')}
                  onOpenStudyContext={(input) => openStudyContext(input, 'systems')}
                />
              )}

              {route === 'relationships' && (
                <RelationshipsPage
                  atlas={atlas}
                  initialConceptId={relationshipConceptId}
                  onInspectConcept={inspectConceptIn3D}
                  onOpenLearnSystem={openSystemInLearn}
                  onOpenReference={openReference}
                  onOpenStudyContext={(input) => openStudyContext(input, 'relationships')}
                />
              )}

              {route === 'learn' && (
                <LearnPage
                  atlas={atlas}
                  atlasError={atlasError}
                  initialCategory={learnCategoryIntent}
                  initialDomainId={learnDomainIntent}
                  initialSystemId={learnSystemIntent}
                  initialTopicId={learnTopicIntent}
                  initialFrameworkId={learnFrameworkIntent}
                  onInspectConcept={inspectConceptIn3D}
                  onNavigate={navigate}
                  onOpenPresentation={openPresentation}
                  onOpenEducatorWorkspace={(domainId) =>
                    openEducatorWorkspace({
                      sourceKind: 'domain',
                      domainId: domainId ?? 'human_anatomy',
                    })
                  }
                  onOpenStudyContext={(input) => openStudyContext(input, 'learn')}
                />
              )}

              {route === 'search' && (
                <SearchPage
                  atlas={atlas}
                  initialQuery={searchQueryIntent}
                  onInspectConcept={inspectConceptIn3D}
                  onInspectPart={inspectPartIn3D}
                  onOpenRelationships={openRelationships}
                  onOpenLearnSystem={openSystemInLearn}
                  onOpenFlashcards={openFlashcards}
                  onOpenPracticalLab={() => navigate('practical-lab')}
                  onOpenTopic={openUniversalTopic}
                  onOpenSyllabus={openSyllabusNavigator}
                  onOpenEducator={(domainId) =>
                    openEducatorWorkspace({
                      sourceKind: 'domain',
                      domainId: domainId ?? 'human_anatomy',
                    })
                  }
                  onOpenPresentation={openPresentation}
                  onOpenStudyContext={(input) => openStudyContext(input, 'search')}
                />
              )}

              {route === 'quiz' && (
                <QuizPage
                  atlas={atlas}
                  onInspectConcept={inspectConceptIn3D}
                  onOpenStudyContext={(input) => openStudyContext(input, 'quiz')}
                />
              )}

              {route === 'practical-lab' && (
                <PracticalLabPage
                  atlas={atlas}
                  atlasError={atlasError}
                  initialSystemId={practicalLabSystemIntent}
                  onInspectConcept={inspectConceptIn3D}
                  onOpenLearnSystem={openSystemInLearn}
                  onOpenStudyContext={(input) => openStudyContext(input, 'practical-lab')}
                />
              )}

              {route === 'dashboard' && (
                <DashboardPage
                  atlas={atlas}
                  onNavigate={navigate}
                  onInspectConcept={inspectConceptIn3D}
                  onOpenLearnSystem={openSystemInLearn}
                  onOpenStudyContext={(input) => openStudyContext(input, 'dashboard')}
                />
              )}

              {(route === 'revision' || route === 'bookmarks') && (
                <RevisionPage
                  key={route}
                  atlas={atlas}
                  initialTab={route === 'bookmarks' ? 'bookmarks' : 'flashcards'}
                  initialSystem={flashcardSystemIntent}
                  onInspectConcept={inspectConceptIn3D}
                  onOpenLearnSystem={openSystemInLearn}
                  onOpenPracticalLab={() => navigate('practical-lab')}
                  onOpenReference={openReference}
                  onOpenStudyContext={(input) => openStudyContext(input, route)}
                />
              )}

              {route === 'physiology' && (
                <PhysiologyPage
                  initialModuleId={physiologyIntent.moduleId}
                  initialSystemId={physiologyIntent.systemId}
                  onInspectConcept={inspectConceptIn3D}
                  onOpenLearnSystem={openSystemInLearn}
                  onOpenStudyContext={(input) => openStudyContext(input, 'physiology')}
                />
              )}

              {route === 'histology' && (
                <HistologyPage
                  initialEntryId={histologyIntent.entryId ?? undefined}
                  initialSystemId={histologyIntent.systemId ?? undefined}
                  onInspectConcept={inspectConceptIn3D}
                  onOpenLearnSystem={openSystemInLearn}
                  onOpenStudyContext={(input) => openStudyContext(input, 'histology')}
                />
              )}

              {route === 'clinical' && (
                <ClinicalPage
                  initialCaseId={clinicalIntent.caseId}
                  initialSystemId={clinicalIntent.systemId}
                  onInspectConcept={inspectConceptIn3D}
                  onOpenLearnSystem={openSystemInLearn}
                  onOpenPresentation={openPresentation}
                  onOpenStudyContext={(input) => openStudyContext(input, 'clinical')}
                />
              )}

              {route === 'atlases' && <AtlasManagerPage />}

              {route === 'about' && <AboutPage onExplore={() => navigate('explorer')} />}

              {route === 'present' && (
                <Suspense
                  fallback={
                    <div className="a360-explorer-fallback" role="status">
                      <strong>Loading Guided 3D Presentation Studio…</strong>
                      <span>Initializing shared 3D anatomy viewport</span>
                    </div>
                  }
                >
                  <PresentationStudioPage
                    atlas={atlas}
                    atlasError={atlasError}
                    initialPresentationIntent={presentationIntent}
                    onInspectConcept={inspectConceptIn3D}
                    onOpenClinical={() => navigate('clinical')}
                    onOpenStudyContext={(input) => openStudyContext(input, 'present')}
                  />
                </Suspense>
              )}

              {route === 'explorer' && (
                <Suspense
                  fallback={
                    <div className="a360-explorer-fallback" role="status">
                      <strong>Loading 3D Anatomy Engine…</strong>
                      <span>Initializing WebGL viewport</span>
                    </div>
                  }
                >
                  <ExplorerView
                    atlas={atlas}
                    atlasError={atlasError}
                    initialFocusConceptId={focusConceptId}
                    initialFocusPartId={focusPartId}
                    initialVisibleSystems={visibleMeshSystems}
                    onClearExternalIntent={clearExternalIntent}
                    onOpenFullSearch={() => navigate('search')}
                    onOpenRelationships={openRelationships}
                    onOpenActivity={openActivityFromExplorer}
                    onOpenStudyContext={(input) => openStudyContext(input, 'explorer')}
                  />
                </Suspense>
              )}
            </main>
          </div>
        </FirebaseProvider>
      </StudyProvider>
    </FirebaseErrorBoundary>
  );
}
