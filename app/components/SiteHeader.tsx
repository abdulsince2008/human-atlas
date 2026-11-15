import { Menu, Search, X } from 'lucide-react';
import { useState } from 'react';

export type AppRoute = 'home' | 'explorer' | 'systems' | 'learn' | 'search' | 'quiz' | 'about';

interface Props {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenSearch: () => void;
}

const NAV_ITEMS: { id: AppRoute; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'explorer', label: '3D Anatomy' },
  { id: 'systems', label: 'Systems' },
  { id: 'learn', label: 'Learn' },
  { id: 'quiz', label: 'Quizzes' },
  { id: 'about', label: 'About' },
];

export default function SiteHeader({ route, onNavigate, onOpenSearch }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (next: AppRoute) => {
    setMobileOpen(false);
    onNavigate(next);
  };

  return (
    <header className="a360-header">
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
          {NAV_ITEMS.map((item) => (
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
        </nav>

        <div className="a360-header-actions">
          <button
            type="button"
            className="a360-search-trigger"
            onClick={() => {
              setMobileOpen(false);
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
          {NAV_ITEMS.map((item) => (
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
        </nav>
      )}
    </header>
  );
}
