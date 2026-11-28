import type { EducationTrackId } from './education/education-types';
import type { StudyTrack } from './study-store';

export type AppRoute =
  | 'home'
  | 'explorer'
  | 'present'
  | 'systems'
  | 'relationships'
  | 'learn'
  | 'study'
  | 'practical-lab'
  | 'dashboard'
  | 'revision'
  | 'bookmarks'
  | 'physiology'
  | 'histology'
  | 'clinical'
  | 'quiz'
  | 'atlases'
  | 'syllabus'
  | 'educator'
  | 'search'
  | 'tools'
  | 'about'
  | 'features'
  | 'pricing'
  | 'terms'
  | 'privacy'
  | 'refunds'
  | 'contact';

export type ToolCategoryId =
  | 'learn'
  | 'practice'
  | 'teach'
  | 'explore_reference'
  | 'system_info'
  | 'commercial_legal';

export type ToolIconKey =
  | 'home'
  | 'box'
  | 'book'
  | 'compass'
  | 'layers'
  | 'git-branch'
  | 'activity'
  | 'microscope'
  | 'stethoscope'
  | 'help-circle'
  | 'clipboard-check'
  | 'flame'
  | 'bookmark'
  | 'bar-chart'
  | 'graduation-cap'
  | 'film'
  | 'database'
  | 'search'
  | 'grid'
  | 'info'
  | 'credit-card'
  | 'file-text'
  | 'shield'
  | 'mail'
  | 'sparkles';

export interface PlatformToolEntry {
  id: string;
  route: AppRoute;
  hash: string;
  category: ToolCategoryId;
  title: string;
  technicalTitle: string;
  summary: string;
  bestFor: string;
  icon: ToolIconKey;
  actionLabel: string;
}

export interface IntentMenuSection {
  id: 'learn' | 'practice' | 'teach';
  label: string;
  summary: string;
  items: PlatformToolEntry[];
}

export const ALL_APP_ROUTES: readonly AppRoute[] = [
  'home',
  'explorer',
  'present',
  'systems',
  'relationships',
  'learn',
  'study',
  'practical-lab',
  'dashboard',
  'revision',
  'bookmarks',
  'physiology',
  'histology',
  'clinical',
  'quiz',
  'atlases',
  'syllabus',
  'educator',
  'search',
  'tools',
  'about',
  'features',
  'pricing',
  'terms',
  'privacy',
  'refunds',
  'contact',
] as const;

export const PLATFORM_TOOLS: PlatformToolEntry[] = [
  {
    id: 'home',
    route: 'home',
    hash: '#/',
    category: 'explore_reference',
    title: 'Home & Quick Start',
    technicalTitle: 'Platform Overview & Pathway Chooser',
    summary: 'Choose whether you are learning, teaching, or exploring, and jump straight into any topic.',
    bestFor: 'Everyone — great place to start or switch goals',
    icon: 'home',
    actionLabel: 'Go to Home',
  },
  {
    id: 'explorer',
    route: 'explorer',
    hash: '#/explorer',
    category: 'learn',
    title: 'Explore 3D Human Body',
    technicalTitle: 'Interactive 3D Anatomy Engine (Male & Female)',
    summary: 'Rotate, zoom, fade outer layers, isolate organs, and tap any body part to learn what it does.',
    bestFor: 'Visual learners, beginners (Grades 6+), and 3D lab demonstrations',
    icon: 'box',
    actionLabel: 'Open 3D Explorer',
  },
  {
    id: 'study',
    route: 'study',
    hash: '#/study',
    category: 'learn',
    title: 'Guided Study Workspace',
    technicalTitle: 'Connected Study Workspace + Synchronized 3D',
    summary: 'Read plain-language or advanced explanations side-by-side with live 3D anatomy, videos, and practice.',
    bestFor: 'Step-by-step studying from Grade 6 through MBBS and PhD',
    icon: 'book',
    actionLabel: 'Open Study Workspace',
  },
  {
    id: 'learn',
    route: 'learn',
    hash: '#/learn',
    category: 'learn',
    title: 'Learn by System & Subject',
    technicalTitle: '16 Biomedical Subjects & 12 Body System Lessons',
    summary: 'Follow structured chapters across all 12 body systems and 16 health science subjects.',
    bestFor: 'Guided chapter learning, terminology, and exam preparation',
    icon: 'layers',
    actionLabel: 'Browse Lessons & Subjects',
  },
  {
    id: 'syllabus',
    route: 'syllabus',
    hash: '#/syllabus',
    category: 'learn',
    title: 'Find Your Syllabus',
    technicalTitle: 'Worldwide Syllabus Navigator & Custom Matcher',
    summary: 'Pick a school or university syllabus, or paste your own course list to find matching lessons.',
    bestFor: 'Matric, FSc, MDCAT, CBSE, A-Level, MBBS, and university students',
    icon: 'compass',
    actionLabel: 'Match a Syllabus',
  },
  {
    id: 'systems',
    route: 'systems',
    hash: '#/systems',
    category: 'explore_reference',
    title: 'Body Systems & Parts Guide',
    technicalTitle: '12 Canonical Systems & FMA Structure Reference',
    summary: 'Browse every body system and look up parts, locations, and functions cleanly.',
    bestFor: 'Quick lookup of organs, bones, muscles, and reference notes',
    icon: 'layers',
    actionLabel: 'Browse Body Systems',
  },
  {
    id: 'relationships',
    route: 'relationships',
    hash: '#/relationships',
    category: 'explore_reference',
    title: 'How Parts Connect',
    technicalTitle: 'Anatomical Relationship Explorer',
    summary: 'See which arteries feed an organ, which nerves control it, and which bones and muscles attach.',
    bestFor: 'Understanding blood supply, nerve pathways, and muscle attachments',
    icon: 'git-branch',
    actionLabel: 'Explore Connections',
  },
  {
    id: 'physiology',
    route: 'physiology',
    hash: '#/physiology',
    category: 'learn',
    title: 'How the Body Works (Simulations)',
    technicalTitle: 'Interactive Physiology Simulations',
    summary: 'Adjust heart rate, breathing, kidney filtration, or arm movement sliders and see live body effects.',
    bestFor: 'Understanding heartbeat, breathing, kidneys, and acid-base balance',
    icon: 'activity',
    actionLabel: 'Try Body Simulations',
  },
  {
    id: 'histology',
    route: 'histology',
    hash: '#/histology',
    category: 'explore_reference',
    title: 'Tissues Under the Microscope',
    technicalTitle: 'Histology & Microanatomy Library',
    summary: 'Zoom into real light-microscope photos of human tissues with beginner-friendly guides.',
    bestFor: 'Biology, Pre-Med, and MBBS histology labs',
    icon: 'microscope',
    actionLabel: 'Inspect Tissues',
  },
  {
    id: 'clinical',
    route: 'clinical',
    hash: '#/clinical',
    category: 'explore_reference',
    title: 'Real-Life Medical Cases',
    technicalTitle: 'Clinical Correlations & Mechanisms',
    summary: 'See why anatomy matters in everyday health and clinical reasoning scenarios.',
    bestFor: 'Pre-Med, Nursing, and Medical students connecting facts to real cases',
    icon: 'stethoscope',
    actionLabel: 'Read Clinical Cases',
  },
  {
    id: 'quiz',
    route: 'quiz',
    hash: '#/quiz',
    category: 'practice',
    title: 'Practice Quizzes',
    technicalTitle: 'Topic-Tagged Multiple-Choice Quizzes',
    summary: 'Test what you learned with instant explanations and one-click links back to the 3D organ.',
    bestFor: 'Self-testing across Grade 9–12, MDCAT, Nursing, and MBBS levels',
    icon: 'help-circle',
    actionLabel: 'Start Practice Quiz',
  },
  {
    id: 'practical-lab',
    route: 'practical-lab',
    hash: '#/practical-lab',
    category: 'practice',
    title: '3D Spotter Practical Lab',
    technicalTitle: 'Practical Lab Spotter Exams',
    summary: 'Identify highlighted organs directly on the 3D human body or locate parts when asked.',
    bestFor: 'Practical exam prep and visual memory testing',
    icon: 'clipboard-check',
    actionLabel: 'Enter 3D Spotter Lab',
  },
  {
    id: 'revision',
    route: 'revision',
    hash: '#/revision',
    category: 'practice',
    title: 'Flashcards & Weak-Area Review',
    technicalTitle: 'Spaced Repetition (SM-2) & Revision Queue',
    summary: 'Practice with memory flashcards and review structures you missed in quizzes or the 3D lab.',
    bestFor: 'Daily memory practice and fixing weak areas',
    icon: 'flame',
    actionLabel: 'Review Flashcards',
  },
  {
    id: 'bookmarks',
    route: 'bookmarks',
    hash: '#/bookmarks',
    category: 'practice',
    title: 'Saved Bookmarks',
    technicalTitle: 'Saved Organs, Topics & Study Items',
    summary: 'Quickly reopen body parts, lessons, and questions you saved for later.',
    bestFor: 'Returning to favorite topics or exam review items',
    icon: 'bookmark',
    actionLabel: 'Open Bookmarks',
  },
  {
    id: 'dashboard',
    route: 'dashboard',
    hash: '#/dashboard',
    category: 'practice',
    title: 'Your Progress & Study Plan',
    technicalTitle: 'Study Dashboard, Adaptive Plan & Backup',
    summary: 'See completed topics, quiz scores, next recommended steps, and download/restore your progress.',
    bestFor: 'Tracking progress and managing your local or synced backup',
    icon: 'bar-chart',
    actionLabel: 'View Progress',
  },
  {
    id: 'educator',
    route: 'educator',
    hash: '#/educator',
    category: 'teach',
    title: 'Teacher & Professor Workspace',
    technicalTitle: 'Course Planning, Sequencing & Exports',
    summary: 'Select subjects or syllabi, sequence chapters, inspect outcomes, and export .pptx, .pdf, or .md handouts.',
    bestFor: 'School teachers, university lecturers, and medical professors',
    icon: 'graduation-cap',
    actionLabel: 'Open Educator Workspace',
  },
  {
    id: 'present',
    route: 'present',
    hash: '#/present',
    category: 'teach',
    title: '3D Lecture & Presentation Studio',
    technicalTitle: 'Guided 3D Walkthroughs & Video Recorder',
    summary: 'Play step-by-step animated 3D anatomy tours or build custom classroom walkthroughs.',
    bestFor: 'Classroom teaching, visual demonstrations, and guided self-tours',
    icon: 'film',
    actionLabel: 'Open 3D Presentations',
  },
  {
    id: 'search',
    route: 'search',
    hash: '#/search',
    category: 'explore_reference',
    title: 'Search Everything',
    technicalTitle: 'Universal Knowledge Catalog Search',
    summary: 'Find any body part, subject, lesson, quiz, video, reading, or syllabus in one place.',
    bestFor: 'Fast lookup across the entire platform',
    icon: 'search',
    actionLabel: 'Open Search',
  },
  {
    id: 'tools',
    route: 'tools',
    hash: '#/tools',
    category: 'system_info',
    title: 'All Tools Directory',
    technicalTitle: 'Complete Feature & Workspace Directory',
    summary: 'Browse every learning, practice, teaching, 3D, and reference tool in one organized place.',
    bestFor: 'Seeing everything Alphatomy offers without hunting through menus',
    icon: 'grid',
    actionLabel: 'View All Tools',
  },
  {
    id: 'atlases',
    route: 'atlases',
    hash: '#/atlases',
    category: 'system_info',
    title: '3D Models & Data Manager',
    technicalTitle: 'Atlas Layer Registry & JSON Pack Validator',
    summary: 'Inspect male/female 3D model coverage disclosures, optional layers, and validate custom packs.',
    bestFor: 'Educators, researchers, and dataset transparency checks',
    icon: 'database',
    actionLabel: 'Inspect Datasets',
  },
  {
    id: 'about',
    route: 'about',
    hash: '#/about',
    category: 'system_info',
    title: 'About, Sources & Licenses',
    technicalTitle: 'Dataset Scope, Limitations & Open Attribution',
    summary: 'Read how Alphatomy is built, data sources, known limitations, and open licenses.',
    bestFor: 'Checking scientific sources, open attribution, and scope',
    icon: 'info',
    actionLabel: 'Read About & Licenses',
  },
  {
    id: 'features',
    route: 'features',
    hash: '#/features',
    category: 'commercial_legal',
    title: 'Features & Platform Overview',
    technicalTitle: 'Public Capability Breakdown Across 6 Learning Areas',
    summary: 'Inspect every Alphatomy tool grouped by learning, study, assessment, and teaching.',
    bestFor: 'Prospective students, teachers, and reviewers checking live capabilities',
    icon: 'sparkles',
    actionLabel: 'Browse Features',
  },
  {
    id: 'pricing',
    route: 'pricing',
    hash: '#/pricing',
    category: 'commercial_legal',
    title: 'Plans, Pricing & Entitlements',
    technicalTitle: 'Free Explorer, Student Plus, Educator Plus & Billing Status',
    summary: 'Compare free exploration and paid memberships, billing terms, AI credits, and manage your plan.',
    bestFor: 'Students, educators, and subscribers reviewing plans or billing status',
    icon: 'credit-card',
    actionLabel: 'View Pricing',
  },
  {
    id: 'terms',
    route: 'terms',
    hash: '#/terms',
    category: 'commercial_legal',
    title: 'Terms and Conditions',
    technicalTitle: 'Buyer Terms, Dataset Licenses & Checkout Disclosures',
    summary: 'Read software access rules, renewal/cancellation disclosures, dataset licenses, and disclaimers.',
    bestFor: 'Buyers and institutions reviewing legal terms of use and sale',
    icon: 'file-text',
    actionLabel: 'Read Terms',
  },
  {
    id: 'privacy',
    route: 'privacy',
    hash: '#/privacy',
    category: 'commercial_legal',
    title: 'Privacy Policy',
    technicalTitle: 'Local Storage, Firebase Sync, AI & Children Privacy Disclosures',
    summary: 'Understand how IndexedDB, optional cloud sign-in, AI prompts, and under-13 safeguards work.',
    bestFor: 'Students, parents, schools, and reviewers checking data handling',
    icon: 'shield',
    actionLabel: 'Read Privacy Policy',
  },
  {
    id: 'refunds',
    route: 'refunds',
    hash: '#/refunds',
    category: 'commercial_legal',
    title: 'Refund Policy',
    technicalTitle: 'Buyer Terms, Cancellation & Credit Revocation Policy',
    summary: 'See how refunds are requested, subscription cancellation rules, and credit reversal handling.',
    bestFor: 'Customers checking refund eligibility or troubleshooting access',
    icon: 'file-text',
    actionLabel: 'Read Refund Policy',
  },
  {
    id: 'contact',
    route: 'contact',
    hash: '#/contact',
    category: 'commercial_legal',
    title: 'Contact & Support',
    technicalTitle: 'Product Support, Billing Lookup & Institutional Inquiries',
    summary: 'Reach support for technical help, billing receipts, data requests, or institutional quotes.',
    bestFor: 'Anyone needing technical, billing, privacy, or school contact help',
    icon: 'mail',
    actionLabel: 'Open Support',
  },
];

const TOOL_BY_ROUTE = new Map<AppRoute, PlatformToolEntry>(
  PLATFORM_TOOLS.map((t) => [t.route, t]),
);

export function getToolByRoute(route: AppRoute): PlatformToolEntry {
  return TOOL_BY_ROUTE.get(route) ?? PLATFORM_TOOLS[0];
}

function pickTools(routes: AppRoute[]): PlatformToolEntry[] {
  return routes.map((r) => getToolByRoute(r));
}

export const INTENT_NAV_MENUS: IntentMenuSection[] = [
  {
    id: 'learn',
    label: 'Learn',
    summary: 'Explore 3D anatomy, follow structured subjects, or match your syllabus.',
    items: pickTools([
      'explorer',
      'study',
      'learn',
      'syllabus',
      'physiology',
      'systems',
      'relationships',
      'histology',
      'clinical',
    ]),
  },
  {
    id: 'practice',
    label: 'Practice',
    summary: 'Test your memory with quizzes, 3D spotter exams, flashcards, and progress review.',
    items: pickTools(['quiz', 'practical-lab', 'revision', 'bookmarks', 'dashboard']),
  },
  {
    id: 'teach',
    label: 'Teach',
    summary: 'Plan lectures, customize topic sequences, run 3D walkthroughs, and export handouts.',
    items: pickTools(['educator', 'present', 'syllabus', 'learn']),
  },
];

export const TOOL_DIRECTORY_CATEGORIES: {
  id: ToolCategoryId;
  title: string;
  description: string;
}[] = [
  {
    id: 'learn',
    title: 'Learn & Explore Concepts',
    description: 'Start here to inspect the 3D human body, read plain or advanced explanations, and match your syllabus.',
  },
  {
    id: 'practice',
    title: 'Practice & Check Progress',
    description: 'Build long-term memory with quizzes, 3D spotter exams, flashcards, and your personal progress plan.',
  },
  {
    id: 'teach',
    title: 'Teach & Prepare Classes',
    description: 'Structured tools for teachers, lecturers, and professors to sequence courses, present in 3D, and export handouts.',
  },
  {
    id: 'explore_reference',
    title: 'Reference, Visuals & Search',
    description: 'Look up parts, connections, microscope slides, real medical scenarios, or search the entire catalog.',
  },
  {
    id: 'system_info',
    title: 'Datasets, Sources & Platform Info',
    description: 'Inspect 3D model datasets, coverage disclosures, licenses, and validation tools.',
  },
  {
    id: 'commercial_legal',
    title: 'Plans, Policies & Support',
    description: 'Review public feature overviews, pricing plans, buyer terms, privacy, refund policy, and contact info.',
  },
];

export const ROUTE_DISPLAY_NAMES: Record<AppRoute, string> = {
  home: 'Home',
  explorer: '3D Human Body Explorer',
  present: '3D Lecture Studio',
  systems: 'Body Systems Guide',
  relationships: 'How Parts Connect',
  learn: 'Learn by System & Subject',
  study: 'Guided Study Workspace',
  'practical-lab': '3D Spotter Practical Lab',
  dashboard: 'Your Progress',
  revision: 'Flashcards & Revision',
  bookmarks: 'Saved Bookmarks',
  physiology: 'Body Simulations',
  histology: 'Microscope Tissues',
  clinical: 'Clinical Cases',
  quiz: 'Practice Quizzes',
  atlases: '3D Models & Data Manager',
  syllabus: 'Syllabus Finder',
  educator: 'Educator Workspace',
  search: 'Search Everything',
  tools: 'All Tools',
  about: 'About & Licenses',
  features: 'Features Overview',
  pricing: 'Plans & Pricing',
  terms: 'Terms and Conditions',
  privacy: 'Privacy Policy',
  refunds: 'Refund Policy',
  contact: 'Contact & Support',
};

export interface TrackMappingOutcome {
  studyTrack: StudyTrack;
  experienceDepth: 'guided' | 'full';
  studyWorkspaceDepth: 'foundational' | 'intermediate' | 'advanced';
}

export function resolveRoleAndTrackMapping(
  trackId: EducationTrackId | null | undefined,
): TrackMappingOutcome {
  switch (trackId) {
    case 'school_foundations':
      return {
        studyTrack: 'General Biology',
        experienceDepth: 'guided',
        studyWorkspaceDepth: 'foundational',
      };
    case 'secondary_premed':
      return {
        studyTrack: 'FSc Pre-Medical',
        experienceDepth: 'guided',
        studyWorkspaceDepth: 'intermediate',
      };
    case 'medical_foundations':
      return {
        studyTrack: 'MBBS / Medical',
        experienceDepth: 'full',
        studyWorkspaceDepth: 'intermediate',
      };
    case 'clinical_applied':
      return {
        studyTrack: 'MBBS / Medical',
        experienceDepth: 'full',
        studyWorkspaceDepth: 'advanced',
      };
    case 'allied_health':
      return {
        studyTrack: 'Nursing / Allied Health',
        experienceDepth: 'full',
        studyWorkspaceDepth: 'intermediate',
      };
    case 'graduate_research':
      return {
        studyTrack: 'MBBS / Medical',
        experienceDepth: 'full',
        studyWorkspaceDepth: 'advanced',
      };
    default:
      return {
        studyTrack: 'General Biology',
        experienceDepth: 'guided',
        studyWorkspaceDepth: 'foundational',
      };
  }
}

export function resolveWorkspaceDepthFromState(
  experienceDepth: 'guided' | 'full' | undefined,
  educationTrackId: EducationTrackId | null | undefined,
  studyTrack: StudyTrack,
): 'foundational' | 'intermediate' | 'advanced' {
  if (educationTrackId) {
    const mapped = resolveRoleAndTrackMapping(educationTrackId).studyWorkspaceDepth;
    if (experienceDepth === 'guided' && mapped === 'intermediate') {
      return educationTrackId === 'school_foundations' ? 'foundational' : 'intermediate';
    }
    return mapped;
  }
  if (experienceDepth === 'guided' && studyTrack === 'General Biology') {
    return 'foundational';
  }
  if (studyTrack === 'General Biology') return 'foundational';
  return 'intermediate';
}
