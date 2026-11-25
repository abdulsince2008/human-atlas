import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
const blueprint = JSON.parse(fs.readFileSync(path.join(root, 'firebase-blueprint.json'), 'utf8')) as {
  entities: Record<string, unknown>;
  firestore: Record<string, { schema: { $ref: string } }>;
};

test('firestore.rules includes default deny catch-all and rules_version 2', () => {
  assert.match(rules, /rules_version\s*=\s*'2'/);
  assert.match(rules, /match\s+\/\{document=\*\*\}\s*\{\s*allow read,\s*write:\s*if false;\s*\}/);
});

test('every collection in firebase-blueprint.json is secured in firestore.rules', () => {
  const expectedSegments = [
    'match /users/{userId}',
    'match /private/{docId}',
    'match /studyProgress/{progressId}',
    'match /enrollments/{classroomId}',
    'match /classroomCodes/{joinCode}',
    'match /classrooms/{classroomId}',
    'match /members/{memberUid}',
    'match /assignments/{assignmentId}',
    'match /manifest/{manifestId}',
    'match /submissions/{submissionId}',
  ];
  for (const seg of expectedSegments) {
    assert.ok(rules.includes(seg), `Missing rule block for ${seg}`);
  }
  assert.equal(Object.keys(blueprint.firestore).length, expectedSegments.length);
});

test('Dirty Dozen security invariants are enforced in firestore.rules', () => {
  // 1 & 2: Strict hasAll + hasOnly validation helpers on every entity
  const validators = [
    'isValidUserProfile',
    'isValidUserPrivateAccount',
    'isValidCloudStudyProgress',
    'isValidClassroom',
    'isValidClassroomCode',
    'isValidEnrollment',
    'isValidClassroomMember',
    'isValidAssignment',
    'isValidAssignmentManifest',
    'isValidSubmission',
  ];
  for (const fn of validators) {
    assert.ok(rules.includes(`function ${fn}(`), `Missing validator ${fn}`);
  }

  // 3: Email verification mandated
  assert.match(rules, /request\.auth\.token\.email_verified\s*==\s*true/);

  // 4: Path ID poisoning guard
  assert.match(rules, /function isValidId\(id\)/);

  // 5: Server timestamp integrity
  assert.match(rules, /request\.time/);

  // 6: PII isolation (email only inside UserPrivateAccount)
  const emailRefs = rules.match(/\bemail\b/g) ?? [];
  assert.ok(emailRefs.length > 0 && !rules.includes("hasAll(['uid', 'displayName', 'email'"));

  // 7: Batch atomicity existsAfter checks
  assert.ok(rules.includes('existsAfter(/databases/$(database)/documents/classroomCodes/'));
  assert.ok(rules.includes('existsAfter(/databases/$(database)/documents/classrooms/'));
  assert.ok(rules.includes('existsAfter(/databases/$(database)/documents/users/'));

  // 9 & 10: Submission workflow & terminal state locks
  assert.match(rules, /incoming\(\)\.status\s*==\s*'submitted'/);
  assert.match(rules, /existing\(\)\.status\s*!=\s*'reviewed'/);
  assert.match(rules, /existing\(\)\.status\s*!=\s*'archived'/);

  // 12: No blanket allow read/list: if isSignedIn() and classroomCodes list forbidden
  assert.doesNotMatch(rules, /allow\s+(read|list)\s*:\s*if\s+isSignedIn\(\)\s*;/);
  assert.doesNotMatch(rules, /allow\s+(read|list)\s*:\s*if\s+isVerifiedSignedIn\(\)\s*;/);
  assert.match(rules, /match \/classroomCodes\/\{joinCode\}[\s\S]*?allow list:\s*if false;/);
});
