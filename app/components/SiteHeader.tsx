import { ChevronDown, Menu, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type AppRoute =
  | 'home'
  | 'explorer'
  | 'present'
  | 'systems'
  | 'relationships'
  | 'learn'
  | 'practical-lab'
  | 'dashboard'
  | 'revision'
  | 'bookmarks'
  | 'physiology'
  | 'histology'
  | 'clinical'
  | 'quiz'
  | 'atlases'
  | 'search'
  | 'about';

interface Props {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenSearch: () => void;
}

const CORE_LINKS: { id: AppRoute; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'explorer', label: '3D Anatomy' },
  { id: 'present', label: 'Present' },
  { id: 'systems', label: 'Reference' },
  { id: 'learn', label: 'Learn' },
  { id: 'practical-lab', label: 'Practical Lab' },
];

const STUDY_MENU: { id: AppRoute; label: string; desc: string }[] = [
  { id: 'dashboard', label: 'Study Dashboard', desc: 'Progress analytics, profile & JSON backup' },
  { id: 'revision', label: 'Flashcards & Revision', desc: 'SM-2 spaced repetition & weak queue' },
  { id: 'bookmarks', label: 'Saved Bookmarks', desc: 'Bookmarked organs, lessons & questions' },
];

const LABS_MENU: { id: AppRoute; label: string; desc: string }[] = [
  { id: 'relationships', label: 'Relationship Explorer', desc: 'Visual vascular, nerve & muscle connections' },
  { id: 'physiology', label: 'Physiology Simulations', desc: 'Cardiac, respiratory, renal & elbow mechanics' },
  { id: 'histology', label: 'Histology Library', desc: 'Tissues, organ microanatomy & slide slots' },
  { id: 'clinical', label: 'Clinical Correlations', desc: 'Regional anatomy learning scenarios' },
  { id: 'quiz', label: 'Anatomy Quizzes', desc: 'Topic-tagged MCQ active recall' },
  { id: 'atlases', label: 'Atlas & Pack Manager', desc: 'Multi-atlas registry & JSON validator' },
];

export default function SiteHeader({ route, onNavigate, onOpenSearch }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'study' | 'labs' | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const studyActive = STUDY_MENU.some((m) => m.id === route);
  const labsActive = LABS_MENU.some((m) => m.id === route);

  const go = (next: AppRoute) => {
    setMobileOpen(false);
    setOpenMenu(null);
    onNavigate(next);
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <header className="a360-header" ref={navRef}>
      <div className="a360-header-inner">
        <a
          href="#/"
          className="a360-brand"
          onClick={(e) => {
            e.preventDefault();
            go('home');
          }}
        >
          Anatomy 360
        </a>

        <nav className="a360-nav" aria-label="Main navigation">
          {CORE_LINKS.map((item) => (
            <a
              key={item.id}
              href={`#/${item.id === 'home' ? '' : item.id}`}
              className={`a360-nav-link ${route === item.id ? 'active' : ''}`}
              aria-current={route === item.id ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                go(item.id);
              }}
            >
              {item.label}
            </a>
          ))}

          {/* Grouped Study Menu */}
          <div className="a360-nav-group">
            <button
              type="button"
              className={`a360-nav-link a360-nav-drop-btn ${studyActive ? 'active' : ''}`}
              aria-expanded={openMenu === 'study'}
              aria-haspopup="menu"
              onClick={() => setOpenMenu((m) => (m === 'study' ? null : 'study'))}
            >
              Study <ChevronDown size={14} />
            </button>
            {openMenu === 'study' && (
              <div className="a360-nav-dropdown" role="menu" aria-label="Study tools">
                {STUDY_MENU.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className={`a360-drop-item ${route === item.id ? 'active' : ''}`}
                    onClick={() => go(item.id)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grouped Labs Menu */}
          <div className="a360-nav-group">
            <button
              type="button"
              className={`a360-nav-link a360-nav-drop-btn ${labsActive ? 'active' : ''}`}
              aria-expanded={openMenu === 'labs'}
              aria-haspopup="menu"
              onClick={() => setOpenMenu((m) => (m === 'labs' ? null : 'labs'))}
            >
              Labs <ChevronDown size={14} />
            </button>
            {openMenu === 'labs' && (
              <div className="a360-nav-dropdown" role="menu" aria-label="Education labs">
                {LABS_MENU.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className={`a360-drop-item ${route === item.id ? 'active' : ''}`}
                    onClick={() => go(item.id)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <a
            href="#/about"
            className={`a360-nav-link ${route === 'about' ? 'active' : ''}`}
            aria-current={route === 'about' ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              go('about');
            }}
          >
            About
          </a>
        </nav>

        <div className="a360-header-actions">
          <button
            type="button"
            className="a360-search-trigger"
            onClick={() => {
              setMobileOpen(false);
              setOpenMenu(null);
              onOpenSearch();
            }}
            aria-label="Search anatomical structures"
          >
            <Search size={16} />
            <span className="a360-search-label">Search</span>
            <kbd className="a360-kbd">/</kbd>
          </button>

          <button
            type="button"
            className="a360-mobile-menu-btn"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="a360-mobile-drawer" aria-label="Mobile navigation">
          <p className="a360-mobile-group-label">Core</p>
          {CORE_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`a360-mobile-nav-item ${route === item.id ? 'active' : ''}`}
              onClick={() => go(item.id)}
            >
              {item.label}
            </button>
          ))}
          <p className="a360-mobile-group-label">Study</p>
          {STUDY_MENU.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`a360-mobile-nav-item ${route === item.id ? 'active' : ''}`}
              onClick={() => go(item.id)}
            >
              {item.label}
            </button>
          ))}
          <p className="a360-mobile-group-label">Labs & Reference</p>
          {LABS_MENU.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`a360-mobile-nav-item ${route === item.id ? 'active' : ''}`}
              onClick={() => go(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className={`a360-mobile-nav-item ${route === 'search' ? 'active' : ''}`}
            onClick={() => go('search')}
          >
            Search Directory
          </button>
          <button
            type="button"
            className={`a360-mobile-nav-item ${route === 'about' ? 'active' : ''}`}
            onClick={() => go('about')}
          >
            About & Licenses
          </button>
        </nav>
      )}
    </header>
  );
}
