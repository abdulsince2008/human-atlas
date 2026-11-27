import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import {
  PLATFORM_TOOLS,
  TOOL_DIRECTORY_CATEGORIES,
  type AppRoute,
  type ToolCategoryId,
} from '../navigation-registry';
import PageOrientationBar from '../components/PageOrientationBar';
import ToolIcon from '../components/ToolIcon';

interface Props {
  onNavigate: (route: AppRoute) => void;
}

export default function AllToolsPage({ onNavigate }: Props) {
  const [filterCat, setFilterCat] = useState<ToolCategoryId | 'all'>('all');
  const [query, setQuery] = useState('');

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLATFORM_TOOLS.filter((tool) => {
      if (filterCat !== 'all' && tool.category !== filterCat) return false;
      if (!q) return true;
      return (
        tool.title.toLowerCase().includes(q) ||
        tool.technicalTitle.toLowerCase().includes(q) ||
        tool.summary.toLowerCase().includes(q) ||
        tool.bestFor.toLowerCase().includes(q)
      );
    });
  }, [filterCat, query]);

  const visibleCategories = useMemo(
    () =>
      TOOL_DIRECTORY_CATEGORIES.filter(
        (c) =>
          (filterCat === 'all' || c.id === filterCat) &&
          filteredTools.some((t) => t.category === c.id),
      ),
    [filterCat, filteredTools],
  );

  return (
    <div className="a360-page" data-testid="all-tools-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Complete Platform Directory</p>
        <h1>All Anatomy 360 Tools &amp; Workspaces</h1>
        <p className="a360-lead">
          Every learning workspace, 3D explorer, practice quiz, teacher planner, reference guide, and dataset tool in one plain-language directory.
        </p>
      </header>

      <PageOrientationBar
        whatThisIs={`This page lists all ${PLATFORM_TOOLS.length} tools in Anatomy 360 so you never have to guess where a feature is.`}
        primaryHint="Pick a category below or search what you want to do, then click any card to open it."
        spokenSummary="This is the All Tools directory for Anatomy 360. You can browse learning workspaces, practice quizzes and 3D practical exams, teacher planning tools, body reference guides, and dataset disclosures in one place."
        howToSteps={[
          'Use the category buttons to focus on Learn, Practice, Teach, Reference, or Dataset tools.',
          'Or type a word like quiz, microscope, 3D, syllabus, or handout in the box below.',
          'Click any tool button to jump straight into that workspace.',
        ]}
      />

      <div className="a360-tools-controls">
        <div className="a360-big-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter tools by goal (e.g., 3D, quiz, teacher, syllabus, microscope)…"
            aria-label="Filter tools directory"
          />
        </div>

        <div className="a360-filter-row" role="tablist" aria-label="Filter tools by goal">
          <button
            type="button"
            role="tab"
            aria-selected={filterCat === 'all'}
            className={`a360-filter-btn ${filterCat === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCat('all')}
          >
            All ({PLATFORM_TOOLS.length})
          </button>
          {TOOL_DIRECTORY_CATEGORIES.map((cat) => {
            const count = PLATFORM_TOOLS.filter((t) => t.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={filterCat === cat.id}
                className={`a360-filter-btn ${filterCat === cat.id ? 'active' : ''}`}
                onClick={() => setFilterCat(cat.id)}
              >
                {cat.title.split(' & ')[0]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {visibleCategories.length === 0 ? (
        <div className="a360-empty-box">
          <p>
            No tools matched &ldquo;{query}&rdquo;. Clear the search box or switch back to{' '}
            <strong>All</strong> to view every workspace.
          </p>
          <button
            type="button"
            className="a360-btn-secondary"
            onClick={() => {
              setQuery('');
              setFilterCat('all');
            }}
          >
            Show All Tools
          </button>
        </div>
      ) : (
        <div className="a360-tools-sections">
          {visibleCategories.map((cat) => {
            const items = filteredTools.filter((t) => t.category === cat.id);
            return (
              <section key={cat.id} className="a360-section" aria-labelledby={`tools-cat-${cat.id}`}>
                <div className="a360-section-head">
                  <div>
                    <h2 id={`tools-cat-${cat.id}`}>{cat.title}</h2>
                    <p>{cat.description}</p>
                  </div>
                </div>
                <div className="a360-tools-grid">
                  {items.map((tool) => (
                    <article key={tool.id} className="a360-tool-card">
                      <div className="a360-tool-card-top">
                        <span className="a360-tool-icon-box">
                          <ToolIcon name={tool.icon} size={18} />
                        </span>
                        <div>
                          <h3>{tool.title}</h3>
                          <p className="a360-tool-tech">{tool.technicalTitle}</p>
                        </div>
                      </div>
                      <p className="a360-tool-summary">{tool.summary}</p>
                      <p className="a360-tool-bestfor">{tool.bestFor}</p>
                      <div className="a360-tool-card-footer">
                        <button
                          type="button"
                          className="a360-card-btn"
                          onClick={() => onNavigate(tool.route)}
                        >
                          <span>{tool.actionLabel}</span>
                          <ArrowRight size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
