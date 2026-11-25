# Firestore Security Specification (Phase 0: Payload-First Security TDD)

## 1. Data Invariants
1. **Default Deny & Verified Auth**: All paths are denied by default (`match /{document=**}`). Every read and write requires `request.auth != null && request.auth.token.email_verified == true`.
2. **PII Isolation**: User email addresses exist ONLY inside `/users/{userId}/private/account`, strictly readable/writable by `request.auth.uid == userId`. `/users/{userId}`, `/classrooms/{classroomId}/members/{memberUid}`, and `/classrooms/{classroomId}/submissions/{submissionId}` never contain PII fields.
3. **Classroom Relational Sync (Master Gate)**:
   - A student membership `/classrooms/{classroomId}/members/{memberUid}` cannot be created unless `/classrooms/{classroomId}` exists with `status == 'active'`, `incoming().teacherUid == parentClassroom.teacherUid`, `memberUid == request.auth.uid`, and `/users/{memberUid}/enrollments/{classroomId}` is atomically created in the same batch (`existsAfter`).
   - An assignment `/classrooms/{classroomId}/assignments/{assignmentId}` cannot be created unless the caller owns `/classrooms/{classroomId}` (`teacherUid == request.auth.uid`), and the assignment manifest `/classrooms/{classroomId}/manifest/assignments` is written in the same batch (`existsAfter`).
   - A submission `/classrooms/{classroomId}/submissions/{submissionId}` cannot be created unless the caller is an enrolled member (`exists(/members/$(request.auth.uid))`), the referenced `assignmentId` exists in `/assignments/`, and `incoming().teacherUid == parentClassroom.teacherUid`.
4. **Immutable Ownership & Temporal Integrity**: `uid`, `teacherUid`, `studentUid`, `classroomId`, `joinCode`, `createdAt`, `joinedAt`, and `submittedAt` are immutable after creation. All `createdAt`, `joinedAt`, `submittedAt`, and `updatedAt` timestamps must equal `request.time`.
5. **Terminal State Locking**: Once a classroom reaches `status == 'archived'` or an assignment submission reaches `status == 'reviewed'`, subsequent updates to those terminal records are denied.
6. **Zero Unfiltered List Queries**: No `allow list` rule permits blanket `isSignedIn()` listing, and no `allow list` rule invokes `get()` or `exists()`. `classroomCodes` strictly forbids `list` (`allow list: if false;`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Ghost Field on Profile**: Creating `/users/u1` with an extra `{ isAdmin: true }` field -> DENIED by `keys().hasOnly(...)`.
2. **Identity Spoofing on Classroom Create**: User `u2` creating `/classrooms/c1` with `teacherUid: "u1"` -> DENIED by `incoming().teacherUid == request.auth.uid`.
3. **Unverified Email Bypass**: Authenticated caller with `email_verified: false` attempting any write -> DENIED by `isVerifiedSignedIn()`.
4. **Path ID Poisoning**: Creating `/classrooms/bad$id/assignments/a1` or >128 char doc ID -> DENIED by `isValidId()`.
5. **Client Timestamp Forgery**: Creating `/users/u1/studyProgress/primary` with `updatedAt` set to a client past/future timestamp instead of `request.time` -> DENIED by `incoming().updatedAt == request.time`.
6. **PII Cross-User Read**: Teacher `t1` reading `/users/s1/private/account` -> DENIED by `isVerifiedOwner(userId)`.
7. **Orphaned Membership Without Batch Enrollment**: Student creating `/classrooms/c1/members/s1` without atomically writing `/users/s1/enrollments/c1` -> DENIED by `existsAfter(...)`.
8. **Fake Teacher Assignment Injection**: Enrolled student `s1` creating `/classrooms/c1/assignments/a99` -> DENIED because `get(/classrooms/c1).data.teacherUid != request.auth.uid`.
9. **Submission Teacher-Feedback Forgery**: Student creating `/classrooms/c1/submissions/sub1` with `status: "reviewed"` and `teacherFeedback: "100% A+"` -> DENIED by `status == 'submitted' && teacherFeedback == ''`.
10. **Terminal State Tampering**: Student or teacher updating a submission whose existing `status == 'reviewed'` -> DENIED by terminal state gate.
11. **Value Poisoning / Resource Exhaustion**: Writing a 5,000-character string into `notes` or a 600-element `completedTopicIds` array -> DENIED by `.size()` bounds.
12. **Blanket Collection Scraping**: Listing `/classroomCodes` or listing `/classrooms` without `teacherUid == request.auth.uid` -> DENIED by `allow list: if false` / `resource.data.teacherUid == request.auth.uid`.
