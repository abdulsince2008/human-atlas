import assert from 'node:assert/strict';
import test from 'node:test';
import { getStudyResourcesFor, validateStudyResources } from './data/study-resources';
import {
  VERIFIED_YOUTUBE_VIDEOS,
  getYouTubeVideosFor,
  isValidYouTubeId,
  validateVideoResources,
} from './data/video-resources';
import { searchUnifiedEducationCatalog } from './search-engine';

test('validateStudyResources and validateVideoResources pass strictly with zero errors', () => {
  const resValidation = validateStudyResources();
  assert.equal(resValidation.valid, true, resValidation.errors.join('; '));

  const vidValidation = validateVideoResources();
  assert.equal(vidValidation.valid, true, vidValidation.errors.join('; '));
});

test('every VERIFIED_YOUTUBE_VIDEOS entry uses valid 11-char ID, youtube-nocookie embed URL, and verified_oembed provenance', () => {
  assert.ok(VERIFIED_YOUTUBE_VIDEOS.length >= 25);
  for (const vid of VERIFIED_YOUTUBE_VIDEOS) {
    assert.equal(isValidYouTubeId(vid.youtubeId), true, `Invalid YouTube ID on ${vid.id}`);
    assert.equal(vid.verificationStatus, 'verified_oembed');
    assert.equal(vid.watchUrl, `https://www.youtube.com/watch?v=${vid.youtubeId}`);
    assert.equal(vid.embedUrl, `https://www.youtube-nocookie.com/embed/${vid.youtubeId}?rel=0`);
  }

  const heartVideos = getYouTubeVideosFor({ conceptId: 'FMA7088', systemId: 'cardiovascular' });
  assert.ok(heartVideos.length > 0);
  assert.equal(heartVideos[0].verificationStatus, 'verified_oembed');

  const heartReadings = getStudyResourcesFor({ conceptId: 'FMA7088', canonicalSystem: 'cardiovascular' });
  assert.ok(heartReadings.length > 0);
});

test('searchUnifiedEducationCatalog returns relationship, resource, and video entries with studyInput', () => {
  const res = searchUnifiedEducationCatalog('heart', null, { limit: 150 });

  const relationshipHits = res.results.filter((r) => r.category === 'relationship');
  const resourceHits = res.results.filter((r) => r.category === 'resource');
  const videoHits = res.results.filter((r) => r.category === 'video');

  assert.ok(relationshipHits.length > 0, 'Expected relationship hits for "heart"');
  assert.ok(resourceHits.length > 0, 'Expected external resource hits for "heart"');
  assert.ok(videoHits.length > 0, 'Expected verified video hits for "heart"');

  assert.ok(relationshipHits[0].studyInput, 'Relationship search result must include studyInput');
  assert.ok(resourceHits[0].studyInput?.resourceId, 'Resource search result must include studyInput.resourceId');
  assert.ok(videoHits[0].studyInput?.videoId, 'Video search result must include studyInput.videoId');
});
