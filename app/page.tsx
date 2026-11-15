import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { Atlas, SystemId } from './anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from './anatomy-systems';
import SiteHeader, { type AppRoute } from './components/SiteHeader';
import AboutPage from './pages/AboutPage';
import HomePage from './pages/HomePage';
import LearnPage from './pages/LearnPage';
import QuizPage from './pages/QuizPage';
import SearchPage from './pages/SearchPage';
import SystemsPage from './pages/SystemsPage';

const ExplorerView = lazy(() => import('./components/ExplorerView'));

function parseRouteFromHash(): AppRoute {
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
  if (hash === 'explorer' || hash === '3d') return 'explorer';
  if (hash === 'systems') return 'systems';
  if (hash === 'learn') return 'learn';
  if (hash === 'search') return 'search';
  if (hash === 'quiz' || hash === 'quizzes') return 'quiz';
  if (hash === 'about') return 'about';
  return 'home';
}

export default function Home() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? parseRouteFromHash() : 'home',
  );
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [atlasError, setAtlasError] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<CanonicalSystemId>('cardiovascular');

  const [focusConceptId, setFocusConceptId] = useState<string | null>(null);
  const [focusPartId, setFocusPartId] = useState<string | null>(null);
  const [visibleMeshSystems, setVisibleMeshSystems] = useState<SystemId[] | null>(null);

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
    const onHash = () => setRoute(parseRouteFromHash());
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

  return (
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
            onSelectSystem={setSelectedSystem}
            onExploreSystem={exploreSystemIn3D}
            onInspectPart={inspectPartIn3D}
            onInspectConcept={inspectConceptIn3D}
          />
        )}

        {route === 'learn' && (
          <LearnPage
            atlas={atlas}
            atlasError={atlasError}
            onInspectConcept={inspectConceptIn3D}
          />
        )}

        {route === 'search' && (
          <SearchPage
            atlas={atlas}
            onInspectConcept={inspectConceptIn3D}
            onInspectPart={inspectPartIn3D}
          />
        )}

        {route === 'quiz' && <QuizPage onInspectConcept={inspectConceptIn3D} />}

        {route === 'about' && <AboutPage onExplore={() => navigate('explorer')} />}

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
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}
