import { ChevronDown, ChevronRight, Menu, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  INTENT_NAV_MENUS,
  PLATFORM_TOOLS,
  type AppRoute,
  type ToolCategoryId,
} from '../navigation-registry';
import ToolIcon from './ToolIcon';

export type { AppRoute } from '../navigation-registry';

interface Props {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenSearch: () => void;
}

const MOBILE_GROUPS: { id: ToolCategoryId; label: string; routes: AppRoute[] }[] = [
  {
    id: 'learn',
    label: 'Learn',
    routes: ['explorer', 'study', 'learn', 'syllabus', 'physiology'],
  },
  {
    id: 'practice',
    label: 'Practice & Progress',
    routes: ['quiz', 'practical-lab', 'revision', 'bookmarks', 'dashboard'],
  },
  {
    id: 'teach',
    label: 'Teach',
    routes: ['educator', 'present'],
  },
  {
    id: 'explore_reference',
    label: 'Reference & Visuals',
    routes: ['systems', 'relationships', 'histology', 'clinical', 'search'],
  },
  {
    id: 'system_info',
    label: 'All Tools & Dataset Info',
    routes: ['tools', 'atlases', 'about'],
  },
  {
    id: 'commercial_legal',
    label: 'Plans, Policies & Support',
    routes: ['features', 'pricing', 'terms', 'privacy', 'refunds', 'contact'],
  },
];

export default function SiteHeader({ route, onNavigate, onOpenSearch }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'learn' | 'practice' | 'teach' | null>(null);
  const [expandedMobileGroup, setExpandedMobileGroup] = useState<ToolCategoryId | null>('learn');
  const navRef = useRef<HTMLDivElement>(null);

  const learnMenu = INTENT_NAV_MENUS[0];
  const practiceMenu = INTENT_NAV_MENUS[1];
  const teachMenu = INTENT_NAV_MENUS[2];

  const learnActive = learnMenu.items.some((m) => m.route === route);
  const practiceActive = practiceMenu.items.some((m) => m.route === route);
  const teachActive =
    teachMenu.items.some((m) => m.route === route) && !learnActive && route !== 'learn' && route !== 'syllabus';

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

  useEffect(() => {
    const matchedGroup = MOBILE_GROUPS.find((g) => g.routes.includes(route));
    if (matchedGroup) {
      setExpandedMobileGroup(matchedGroup.id);
    }
  }, [route]);

  const toolByRoute = new Map(PLATFORM_TOOLS.map((t) => [t.route, t]));

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
          Alphatomy
        </a>

        <nav className="a360-nav" aria-label="Main navigation">
          <a
            href="#/"
            className={`a360-nav-link ${route === 'home' ? 'active' : ''}`}
            aria-current={route === 'home' ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              go('home');
            }}
          >
            Home
          </a>

          {([
            { menu: learnMenu, active: learnActive },
            { menu: practiceMenu, active: practiceActive },
            { menu: teachMenu, active: teachActive },
          ] as const).map(({ menu, active }) => {
            const isOpen = openMenu === menu.id;
            return (
              <div key={menu.id} className="a360-nav-group">
                <button
                  type="button"
                  className={`a360-nav-link a360-nav-drop-btn ${active ? 'active' : ''}`}
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                  onClick={() => setOpenMenu((m) => (m === menu.id ? null : menu.id))}
                >
                  <span>{menu.label}</span>
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
                {isOpen && (
                  <div
                    className={`a360-nav-dropdown ${menu.id === 'learn' ? 'is-wide' : ''}`}
                    role="menu"
                    aria-label={`${menu.label} menu`}
                  >
                    <p className="a360-drop-summary">{menu.summary}</p>
                    <div className={menu.id === 'learn' ? 'a360-drop-grid' : 'a360-drop-list'}>
                      {menu.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          role="menuitem"
                          className={`a360-drop-item ${route === item.route ? 'active' : ''}`}
                          onClick={() => go(item.route)}
                        >
                          <span className="a360-drop-item-head">
                            <ToolIcon name={item.icon} size={15} />
                            <strong>{item.title}</strong>
                          </span>
                          <span>{item.summary}</span>
                        </button>
                      ))}
                    </div>
                    <div className="a360-drop-footer">
                      <button
                        type="button"
                        role="menuitem"
                        className="a360-drop-all-link"
                        onClick={() => go('tools')}
                      >
                        Browse All Tools Directory →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <a
            href="#/tools"
            className={`a360-nav-link ${route === 'tools' || route === 'atlases' || route === 'about' ? 'active' : ''}`}
            aria-current={route === 'tools' ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              go('tools');
            }}
          >
            All Tools
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
            aria-label="Search human sciences and anatomical structures"
          >
            <Search size={16} aria-hidden="true" />
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
            {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="a360-mobile-drawer" aria-label="Mobile navigation">
          <button
            type="button"
            className={`a360-mobile-nav-item ${route === 'home' ? 'active' : ''}`}
            onClick={() => go('home')}
          >
            <ToolIcon name="home" size={16} />
            <span>Home &amp; Start Here</span>
          </button>

          {MOBILE_GROUPS.map((group) => {
            const expanded = expandedMobileGroup === group.id;
            return (
              <div key={group.id} className="a360-mobile-accordion">
                <button
                  type="button"
                  className="a360-mobile-group-btn"
                  aria-expanded={expanded}
                  onClick={() =>
                    setExpandedMobileGroup((prev) => (prev === group.id ? null : group.id))
                  }
                >
                  <span>{group.label}</span>
                  {expanded ? (
                    <ChevronDown size={16} aria-hidden="true" />
                  ) : (
                    <ChevronRight size={16} aria-hidden="true" />
                  )}
                </button>
                {expanded && (
                  <div className="a360-mobile-group-items">
                    {group.routes.map((r) => {
                      const entry = toolByRoute.get(r);
                      if (!entry) return null;
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          className={`a360-mobile-nav-item ${route === entry.route ? 'active' : ''}`}
                          onClick={() => go(entry.route)}
                        >
                          <ToolIcon name={entry.icon} size={16} />
                          <span className="a360-mobile-nav-copy">
                            <strong>{entry.title}</strong>
                            <small>{entry.summary}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      )}
    </header>
  );
}
