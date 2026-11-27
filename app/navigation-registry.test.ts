import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_APP_ROUTES,
  INTENT_NAV_MENUS,
  PLATFORM_TOOLS,
  ROUTE_DISPLAY_NAMES,
  TOOL_DIRECTORY_CATEGORIES,
  getToolByRoute,
  resolveRoleAndTrackMapping,
  resolveWorkspaceDepthFromState,
} from './navigation-registry';
import {
  createEmptyStudyState,
  validateAndSanitizeStudyState,
} from './study-store';
import {
  resolveStudyContext,
} from './study-context-engine';
import {
  isSpeechSynthesisSupported,
  speakGuidanceText,
  stopSpeechGuidance,
} from './utils/speech-guidance';

test('beginner Heart starter resolves plain-language title and foundational explanation', () => {
  const ctx = resolveStudyContext(
    {
      conceptId: 'FMA7088',
      topicId: 'topic-cardio-heart-chambers',
      systemId: 'cardiovascular',
      domainId: 'human_anatomy',
      sourceModule: 'home',
    },
    null,
  );
  assert.equal(ctx.title, 'Four Chambers & One-Way Valves');
  assert.ok(
    ctx.depthExplanations.foundational?.includes('four-room double pump'),
    `Expected plain-language heart summary, got: ${ctx.depthExplanations.foundational}`,
  );
});

test('all AppRoute destinations are catalogued in PLATFORM_TOOLS with complete metadata', () => {
  const registeredRoutes = new Set(PLATFORM_TOOLS.map((t) => t.route));
  assert.equal(registeredRoutes.size, ALL_APP_ROUTES.length);

  for (const route of ALL_APP_ROUTES) {
    assert.ok(registeredRoutes.has(route), `Missing route in PLATFORM_TOOLS: ${route}`);
    const entry = getToolByRoute(route);
    assert.equal(entry.route, route);
    assert.ok(entry.title.trim().length > 0, `Empty title for ${route}`);
    assert.ok(entry.summary.trim().length > 10, `Missing summary for ${route}`);
    assert.ok(entry.bestFor.trim().length > 5, `Missing bestFor cue for ${route}`);
    assert.ok(entry.actionLabel.trim().length > 3, `Missing actionLabel for ${route}`);
    assert.ok(entry.hash.startsWith('#/'), `Invalid hash for ${route}: ${entry.hash}`);
    assert.ok(ROUTE_DISPLAY_NAMES[route].trim().length > 0, `Missing display name for ${route}`);
  }
});

test('INTENT_NAV_MENUS and TOOL_DIRECTORY_CATEGORIES expose Learn, Practice, and Teach cleanly', () => {
  assert.deepEqual(
    INTENT_NAV_MENUS.map((m) => m.id),
    ['learn', 'practice', 'teach'],
  );
  for (const menu of INTENT_NAV_MENUS) {
    assert.ok(menu.summary.trim().length > 10);
    assert.ok(menu.items.length >= 4, `Expected >=4 items under ${menu.id}`);
  }

  const categoryIds = new Set(TOOL_DIRECTORY_CATEGORIES.map((c) => c.id));
  for (const tool of PLATFORM_TOOLS) {
    assert.ok(categoryIds.has(tool.category), `Unknown tool category: ${tool.category}`);
  }
});

test('createEmptyStudyState assigns neutral beginner defaults instead of assuming MBBS', () => {
  const empty = createEmptyStudyState();
  assert.equal(empty.audienceRole, 'unset');
  assert.equal(empty.educationTrackId, null);
  assert.equal(empty.trackSelected, false);
  assert.equal(empty.onboardingCompleted, false);
  assert.equal(empty.onboardingDismissed, false);
  assert.equal(empty.experienceDepth, 'guided');
  assert.equal(empty.profile.displayName, 'Explorer');
  assert.equal(empty.profile.track, 'General Biology');
  assert.equal(empty.lastStudyContext, null);
  assert.equal(empty.lastRoute, null);
});

test('validateAndSanitizeStudyState preserves legacy backups and persists new onboarding/resume fields', () => {
  const legacyRes = validateAndSanitizeStudyState({
    schemaVersion: 1,
    completedTopicIds: ['cardio-intro'],
    profile: {
      displayName: 'Sara',
      track: 'MDCAT',
      dailyFlashcardGoal: 20,
    },
  });
  assert.equal(legacyRes.ok, true);
  assert.ok(legacyRes.state);
  assert.equal(legacyRes.state.profile.track, 'MDCAT');
  assert.equal(legacyRes.state.trackSelected, true);
  assert.equal(legacyRes.state.onboardingCompleted, true);
  assert.equal(legacyRes.state.experienceDepth, 'guided');

  const invalidLegacyTrackRes = validateAndSanitizeStudyState({
    schemaVersion: 1,
    profile: { displayName: 'Ali', track: 'UNKNOWN_LEGACY_TRACK' },
  });
  assert.equal(invalidLegacyTrackRes.ok, true);
  assert.equal(invalidLegacyTrackRes.state?.profile.track, 'MBBS / Medical');

  const roundTrip = validateAndSanitizeStudyState({
    schemaVersion: 1,
    audienceRole: 'learning',
    educationTrackId: 'school_foundations',
    experienceDepth: 'guided',
    onboardingDismissed: true,
    onboardingCompleted: true,
    trackSelected: true,
    lastRoute: 'study',
    lastStudyContext: {
      conceptId: 'FMA7088',
      systemId: 'cardiovascular',
      domainId: 'human_anatomy',
      sourceModule: 'home',
    },
    profile: {
      displayName: 'Zain',
      track: 'General Biology',
      dailyFlashcardGoal: 15,
    },
  });
  assert.equal(roundTrip.ok, true);
  assert.equal(roundTrip.state?.audienceRole, 'learning');
  assert.equal(roundTrip.state?.educationTrackId, 'school_foundations');
  assert.equal(roundTrip.state?.experienceDepth, 'guided');
  assert.equal(roundTrip.state?.lastRoute, 'study');
  assert.equal(roundTrip.state?.lastStudyContext?.conceptId, 'FMA7088');
  assert.equal(roundTrip.state?.lastStudyContext?.systemId, 'cardiovascular');
});

test('resolveRoleAndTrackMapping and resolveWorkspaceDepthFromState map all education levels accurately', () => {
  const school = resolveRoleAndTrackMapping('school_foundations');
  assert.equal(school.studyTrack, 'General Biology');
  assert.equal(school.experienceDepth, 'guided');
  assert.equal(school.studyWorkspaceDepth, 'foundational');

  const premed = resolveRoleAndTrackMapping('secondary_premed');
  assert.equal(premed.studyTrack, 'FSc Pre-Medical');
  assert.equal(premed.studyWorkspaceDepth, 'intermediate');

  const medical = resolveRoleAndTrackMapping('medical_foundations');
  assert.equal(medical.studyTrack, 'MBBS / Medical');
  assert.equal(medical.experienceDepth, 'full');
  assert.equal(medical.studyWorkspaceDepth, 'intermediate');

  const clinical = resolveRoleAndTrackMapping('clinical_applied');
  assert.equal(clinical.studyTrack, 'MBBS / Medical');
  assert.equal(clinical.experienceDepth, 'full');
  assert.equal(clinical.studyWorkspaceDepth, 'advanced');

  const allied = resolveRoleAndTrackMapping('allied_health');
  assert.equal(allied.studyTrack, 'Nursing / Allied Health');
  assert.equal(allied.experienceDepth, 'full');

  const grad = resolveRoleAndTrackMapping('graduate_research');
  assert.equal(grad.studyWorkspaceDepth, 'advanced');

  assert.equal(
    resolveWorkspaceDepthFromState('guided', null, 'General Biology'),
    'foundational',
  );
  assert.equal(
    resolveWorkspaceDepthFromState('full', 'clinical_applied', 'MBBS / Medical'),
    'advanced',
  );
});

test('speech guidance helpers degrade safely in non-browser environments', () => {
  assert.equal(isSpeechSynthesisSupported(), false);
  assert.doesNotThrow(() => stopSpeechGuidance());
  const handle = speakGuidanceText('Read aloud test');
  assert.equal(handle.supported, false);
  assert.equal(handle.started, false);
  assert.doesNotThrow(() => handle.stop());
});
