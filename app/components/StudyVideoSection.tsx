import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Film, Search, Video } from 'lucide-react';
import type { CanonicalSystemId } from '../anatomy-systems';
import {
  buildYouTubeSearchUrl,
  getYouTubeVideosFor,
  type YouTubeVideoResource,
} from '../data/video-resources';
import type { EducationDomainId, EducationTrackId, VideoLessonEntry } from '../education/education-types';

interface Props {
  topicTitle: string;
  topicId?: string;
  conceptId?: string;
  systemId?: CanonicalSystemId;
  domainId?: EducationDomainId;
  academicLevel?: EducationTrackId;
  preferredVideoId?: string | null;
  fallbackStoryboard?: VideoLessonEntry | null;
  compact?: boolean;
}

interface LiveYouTubeSearchItem {
  youtubeId: string;
  title: string;
  channelTitle: string;
  description: string;
  watchUrl: string;
  embedUrl: string;
  publishedAt?: string;
}

export default function StudyVideoSection({
  topicTitle,
  topicId,
  conceptId,
  systemId,
  domainId,
  academicLevel,
  preferredVideoId,
  fallbackStoryboard,
  compact = false,
}: Props) {
  const curatedVideos = useMemo(
    () =>
      getYouTubeVideosFor({
        topicId,
        conceptId,
        systemId,
        domainId,
        academicLevel,
        searchHint: topicTitle,
        limit: 6,
      }),
    [academicLevel, conceptId, domainId, systemId, topicId, topicTitle],
  );

  const [selectedId, setSelectedId] = useState<string>('');
  const [embedUnavailable, setEmbedUnavailable] = useState(false);
  const [storyboardOpen, setStoryboardOpen] = useState(false);

  const [liveLoading, setLiveLoading] = useState(false);
  const [liveStatusMsg, setLiveStatusMsg] = useState<string>('');
  const [liveItems, setLiveItems] = useState<LiveYouTubeSearchItem[]>([]);
  const [selectedLiveId, setSelectedLiveId] = useState<string | null>(null);

  useEffect(() => {
    setEmbedUnavailable(false);
    setSelectedLiveId(null);
    setLiveItems([]);
    setLiveStatusMsg('');
    if (preferredVideoId) {
      const match = curatedVideos.find(
        (v) => v.id === preferredVideoId || v.youtubeId === preferredVideoId,
      );
      if (match) {
        setSelectedId(match.id);
        return;
      }
    }
    setSelectedId(curatedVideos[0]?.id ?? '');
  }, [curatedVideos, preferredVideoId]);

  const activeCurated: YouTubeVideoResource | undefined =
    curatedVideos.find((v) => v.id === selectedId) ?? curatedVideos[0];

  const activeLive: LiveYouTubeSearchItem | undefined = selectedLiveId
    ? liveItems.find((item) => item.youtubeId === selectedLiveId)
    : undefined;

  const activeEmbedUrl = activeLive
    ? activeLive.embedUrl
    : activeCurated
      ? activeCurated.embedUrl
      : null;

  const activeWatchUrl = activeLive
    ? activeLive.watchUrl
    : activeCurated
      ? activeCurated.watchUrl
      : buildYouTubeSearchUrl(topicTitle);

  const activeTitle = activeLive
    ? activeLive.title
    : activeCurated
      ? activeCurated.title
      : topicTitle;

  const runLiveYouTubeSearch = async () => {
    setLiveLoading(true);
    setLiveStatusMsg('');
    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(`${topicTitle} anatomy physiology lecture`)}`,
      );
      const data = (await res.json()) as {
        ok: boolean;
        configured?: boolean;
        message?: string;
        items?: LiveYouTubeSearchItem[];
      };
      if (!data.configured) {
        setLiveStatusMsg(
          data.message ??
            'Live YouTube Data API search is not configured (YOUTUBE_API_KEY not set on server). Curated verified YouTube lectures remain playable below.',
        );
        setLiveItems([]);
      } else if (Array.isArray(data.items) && data.items.length > 0) {
        setLiveItems(data.items);
        setSelectedLiveId(data.items[0].youtubeId);
        setEmbedUnavailable(false);
      } else {
        setLiveStatusMsg(
          data.message ?? 'No embeddable YouTube search hits returned for this topic.',
        );
      }
    } catch {
      setLiveStatusMsg(
        'Could not reach /api/youtube/search. Use the curated lectures below or search directly on YouTube.',
      );
    } finally {
      setLiveLoading(false);
    }
  };

  return (
    <section className={`a360-video-section ${compact ? 'is-compact' : ''}`} aria-label="Topic-specific YouTube educational videos">
      <div className="a360-video-head">
        <div>
          <h3>Topic-Specific Video Lectures</h3>
          <p className="a360-muted">
            Verified embeddable YouTube educational lectures (privacy-enhanced youtube-nocookie.com) with direct external links.
          </p>
        </div>
        <div className="a360-video-head-actions">
          <button
            type="button"
            className="a360-mini-btn"
            onClick={runLiveYouTubeSearch}
            disabled={liveLoading}
          >
            <Search size={13} aria-hidden="true" />
            <span>{liveLoading ? 'Searching YouTube…' : 'Search YouTube Live'}</span>
          </button>
          <a
            href={buildYouTubeSearchUrl(topicTitle)}
            target="_blank"
            rel="noopener noreferrer"
            className="a360-mini-btn"
          >
            <ExternalLink size={13} aria-hidden="true" />
            <span>Search on YouTube</span>
          </a>
        </div>
      </div>

      {liveStatusMsg && (
        <div className="a360-disclosure-note" role="status">
          <Video size={15} aria-hidden="true" />
          <span>{liveStatusMsg}</span>
        </div>
      )}

      {liveItems.length > 0 && (
        <div className="a360-video-switcher" role="group" aria-label="Live YouTube search results">
          {liveItems.map((item) => (
            <button
              key={item.youtubeId}
              type="button"
              className={`a360-topic-tab ${selectedLiveId === item.youtubeId ? 'active' : ''}`}
              onClick={() => {
                setSelectedLiveId(item.youtubeId);
                setEmbedUnavailable(false);
              }}
            >
              <span>{item.title}</span>
            </button>
          ))}
        </div>
      )}

      {curatedVideos.length > 1 && (
        <div className="a360-video-switcher" role="group" aria-label="Curated verified lectures">
          {curatedVideos.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`a360-topic-tab ${!selectedLiveId && activeCurated?.id === v.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedLiveId(null);
                setSelectedId(v.id);
                setEmbedUnavailable(false);
              }}
            >
              <span>{v.title}</span>
            </button>
          ))}
        </div>
      )}

      {activeEmbedUrl ? (
        <div className="a360-video-player-card">
          {!embedUnavailable ? (
            <div className="a360-video-frame-wrap">
              <iframe
                key={activeEmbedUrl}
                src={activeEmbedUrl}
                title={activeTitle}
                className="a360-video-iframe"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                onError={() => setEmbedUnavailable(true)}
              />
            </div>
          ) : (
            <div className="a360-video-fallback-box" role="alert">
              <strong>Embedded player unavailable in this browser context</strong>
              <p>
                Strict third-party iframe blockers or creator restrictions can block embedded YouTube players. Open the verified video directly on YouTube.
              </p>
              <a
                href={activeWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="a360-btn-primary"
              >
                <ExternalLink size={14} aria-hidden="true" />
                Open directly on YouTube
              </a>
            </div>
          )}

          <div className="a360-video-meta-bar">
            <div className="a360-video-meta-text">
              <strong>{activeTitle}</strong>
              {activeLive ? (
                <span className="a360-muted">
                  {activeLive.channelTitle} · Live YouTube API result
                </span>
              ) : activeCurated ? (
                <>
                  <span className="a360-muted">
                    {activeCurated.channelTitle} · Checked {activeCurated.dateChecked} · Verified oEmbed
                  </span>
                  <p className="a360-video-relevance">{activeCurated.learningRelevance}</p>
                </>
              ) : null}
            </div>
            <div className="a360-video-meta-actions">
              <a
                href={activeWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="a360-btn-secondary"
              >
                <ExternalLink size={14} aria-hidden="true" />
                Open directly on YouTube
              </a>
              <button
                type="button"
                className="a360-mini-btn"
                onClick={() => setEmbedUnavailable((v) => !v)}
              >
                {embedUnavailable ? 'Show Embedded Player' : 'Embed Not Loading?'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="a360-video-fallback-box" role="status">
          <strong>No curated verified YouTube lecture linked yet for "{topicTitle}"</strong>
          <p>
            Search live YouTube lectures if configured, or open a curated YouTube educational search for this topic.
          </p>
          <a
            href={activeWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="a360-btn-secondary"
          >
            <ExternalLink size={14} aria-hidden="true" />
            Open topic search on YouTube
          </a>
        </div>
      )}

      {fallbackStoryboard && (
        <div className="a360-storyboard-disclosure">
          <button
            type="button"
            className="a360-storyboard-toggle"
            aria-expanded={storyboardOpen}
            onClick={() => setStoryboardOpen((open) => !open)}
          >
            {storyboardOpen ? (
              <ChevronDown size={15} aria-hidden="true" />
            ) : (
              <ChevronRight size={15} aria-hidden="true" />
            )}
            <Film size={15} aria-hidden="true" />
            <span>
              Anatomy 360 Original Narration Storyboard Script ({fallbackStoryboard.scenes?.length ?? 0} scenes · not a YouTube video)
            </span>
          </button>

          {storyboardOpen && (
            <div className="a360-storyboard-body">
              <p className="a360-muted">
                Title: {fallbackStoryboard.title} · {fallbackStoryboard.availabilityNote}
              </p>
              <ol className="a360-storyboard-list">
                {(fallbackStoryboard.scenes ?? []).map((scene) => (
                  <li key={scene.sceneNumber}>
                    <strong>
                      Scene {scene.sceneNumber} ({scene.timecode}) — {scene.visualCue}
                    </strong>
                    <p>{scene.narration}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
