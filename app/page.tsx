import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { Atlas, SystemId } from './anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from './anatomy-systems';
import SiteHeader, { type AppRoute } from './components/SiteHeader';
import { StudyProvider } from './components/StudyContext';
import AboutPage from './pages/AboutPage';
import AtlasManagerPage from './pages/AtlasManagerPage';
import ClinicalPage from './pages/ClinicalPage';
import DashboardPage from './pages/DashboardPage';
import HistologyPage from './pages/HistologyPage';
import HomePage from './pages/HomePage';
import LearnPage from './pages/LearnPage';
import PhysiologyPage from './pages/PhysiologyPage';
import PracticalLabPage from './pages/PracticalLabPage';
import QuizPage from './pages/QuizPage';
import RelationshipsPage from './pages/RelationshipsPage';
import RevisionPage from './pages/RevisionPage';
import SearchPage from './pages/SearchPage';
import SystemsPage from './pages/SystemsPage';

const ExplorerView = lazy(() => import('./components/ExplorerView'));
const PresentationStudioPage = lazy(() => import('./pages/PresentationStudioPage'));

function parseRouteFromHash(): AppRoute {
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
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
  if (hash === 'search') return 'search';
  if (hash === 'about') return 'about';
  return 'home';
}

function parsePresentationIdFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const query = window.location.hash.split('?')[1];
  if (!query) return null;
  const params = new URLSearchParams(query);
  return params.get('id');
}

export default function Home() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? parseRouteFromHash() : 'home',
  );
  const [presentationIdIntent, setPresentationIdIntent] = useState<string | null>(() =>
    parsePresentationIdFromHash(),
  );
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [atlasError, setAtlasError] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<CanonicalSystemId>('cardiovascular');

  const [focusConceptId, setFocusConceptId] = useState<string | null>(null);
  const [focusPartId, setFocusPartId] = useState<string | null>(null);
  const [visibleMeshSystems, setVisibleMeshSystems] = useState<SystemId[] | null>(null);
  const [learnSystemIntent, setLearnSystemIntent] = useState<CanonicalSystemId | null>(null);
  const [learnTopicIntent, setLearnTopicIntent] = useState<string | null>(null);
  const [relationshipConceptId, setRelationshipConceptId] = useState<string | null>(null);
  const [referenceConceptId, setReferenceConceptId] = useState<string | null>(null);
  const [flashcardSystemIntent, setFlashcardSystemIntent] = useState<CanonicalSystemId | 'all'>('all');

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
    const onHash = () => {
      setRoute(parseRouteFromHash());
      const pid = parsePresentationIdFromHash();
      if (pid) setPresentationIdIntent(pid);
    };
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

  const openSystemInLearn = useCallback(
    (systemId: CanonicalSystemId, topicId?: string) => {
      setLearnSystemIntent(systemId);
      setLearnTopicIntent(topicId ?? null);
      navigate('learn');
    },
    [navigate],
  );

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
    setPresentationIdIntent(presentationId);
    const targetHash = `#/present?id=${encodeURIComponent(presentationId)}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setRoute('present');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  return (
    <StudyProvider>
      <div className={`a360-shell ${route === 'explorer' ? 'is-explorer' : ''}`}>
        <SiteHeader
          route={route}
          onNavigate={navigate}
          onOpenSearch={() => navigate('search')}
        />

        <main className="a360-main">
          {route === 'home' && (
            <HomePage
              atlas={atlas}
              onExplore={() => navigate('explorer')}
              onNavigate={navigate}
              onInspectConcept={inspectConceptIn3D}
              onExploreSystem={exploreSystemIn3D}
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
            />
          )}

          {route === 'relationships' && (
            <RelationshipsPage
              atlas={atlas}
              initialConceptId={relationshipConceptId}
              onInspectConcept={inspectConceptIn3D}
              onOpenLearnSystem={openSystemInLearn}
              onOpenReference={openReference}
            />
          )}

          {route === 'learn' && (
            <LearnPage
              atlas={atlas}
              atlasError={atlasError}
              initialSystemId={learnSystemIntent}
              initialTopicId={learnTopicIntent}
              onInspectConcept={inspectConceptIn3D}
            />
          )}

          {route === 'search' && (
            <SearchPage
              atlas={atlas}
              onInspectConcept={inspectConceptIn3D}
              onInspectPart={inspectPartIn3D}
              onOpenRelationships={openRelationships}
              onOpenLearnSystem={openSystemInLearn}
              onOpenFlashcards={openFlashcards}
              onOpenPracticalLab={() => navigate('practical-lab')}
            />
          )}

          {route === 'quiz' && <QuizPage onInspectConcept={inspectConceptIn3D} />}

          {route === 'practical-lab' && (
            <PracticalLabPage
              atlas={atlas}
              atlasError={atlasError}
              onInspectConcept={inspectConceptIn3D}
              onOpenLearnSystem={openSystemInLearn}
            />
          )}

          {route === 'dashboard' && (
            <DashboardPage
              onNavigate={navigate}
              onInspectConcept={inspectConceptIn3D}
              onOpenLearnSystem={openSystemInLearn}
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
            />
          )}

          {route === 'physiology' && (
            <PhysiologyPage
              onInspectConcept={inspectConceptIn3D}
              onOpenLearnSystem={openSystemInLearn}
            />
          )}

          {route === 'histology' && (
            <HistologyPage
              onInspectConcept={inspectConceptIn3D}
              onOpenLearnSystem={openSystemInLearn}
            />
          )}

          {route === 'clinical' && (
            <ClinicalPage
              onInspectConcept={inspectConceptIn3D}
              onOpenLearnSystem={openSystemInLearn}
              onOpenPresentation={openPresentation}
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
                initialPresentationId={presentationIdIntent}
                onInspectConcept={inspectConceptIn3D}
                onOpenClinical={() => navigate('clinical')}
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
              />
            </Suspense>
          )}
        </main>
      </div>
    </StudyProvider>
  );
}
