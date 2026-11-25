/**
 * Four-Layer Scientific Provenance & Verification Registry
 *
 * Strictly separates:
 *  1. Geometry provenance (BodyParts3D 4.0 mesh attribution)
 *  2. Anatomical ontology & terminology provenance (FMA CUSTOM license; IFAA/FIPAT TA2 CC BY-ND 4.0)
 *  3. Educational evidence provenance (per-structure / per-relationship claims)
 *  4. External study resource provenance (curated open links in study-resources.ts)
 *
 * Governance rule:
 *  - `automated_check_passed`, `source_reviewed`, and `expert_verified` are strictly distinct.
 *  - No record may carry `expert_verified` unless an actual qualified human reviewer
 *    (`reviewerName` and `reviewerRole`) has personally reviewed it.
 */

export const PROVENANCE_SCHEMA_VERSION = 2;

export type ProvenanceReviewStatus =
  | 'draft'
  | 'needs_evidence'
  | 'automated_check_passed'
  | 'source_reviewed'
  | 'under_expert_review'
  | 'expert_verified'
  | 'needs_revision'
  | 'deprecated';

export type ProvenanceLayer =
  | 'geometry'
  | 'ontology'
  | 'terminology'
  | 'educational_evidence'
  | 'external_resource';

export type EvidenceConfidence = 'high_textbook_consensus' | 'moderate_regional_variation' | 'conceptual_only';

export interface ProvenanceLayerRecord {
  layer: ProvenanceLayer;
  id: string;
  name: string;
  version: string;
  authority: string;
  license: string;
  licenseUrl: string;
  url: string;
  scope: string;
  limitations: string;
  reviewStatus: ProvenanceReviewStatus;
  lastAudited: string;
}

export interface EducationalEvidenceRecord {
  id: string;
  targetType:
    | 'structure'
    | 'relationship'
    | 'brain_region'
    | 'muscle_pilot'
    | 'radiology_plane'
    | 'surgical_region'
    | 'variation';
  targetId: string;
  claimSummary: string;
  sourceReference: string;
  sourceUrl?: string;
  dateAccessed: string;
  evidenceConfidence: EvidenceConfidence;
  limitations?: string;
  reviewStatus: ProvenanceReviewStatus;
  reviewerName?: string;
  reviewerRole?: string;
  lastReviewed: string;
}

export const GEOMETRY_PROVENANCE: ProvenanceLayerRecord = {
  layer: 'geometry',
  id: 'bp3d-4.0',
  name: 'BodyParts3D / Anatomography',
  version: '4.0 (2013 release; DBCLS Archive)',
  authority: 'Database Center for Life Science (DBCLS), Japan',
  license: 'CC BY 4.0 (DBCLS Archive; historically CC BY-SA 2.1 Japan)',
  licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  url: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html',
  scope: '2,234 adult male BodyParts3D 4.0 base meshes + 159 HuBMAP HRA CC BY 4.0 meshes + 8 co-registered female reconstructions (2,401 distinct bundled meshes total): 2,301 active Male parts (+47 shared, +20 male) and 2,328 active Female parts (-45 male parts replaced by 92 female v3.0 parts + 47 shared; +8 optional full-term placenta OFF by default).',
  limitations:
    'Base BodyParts3D 4.0 is an adult male donor; Female mode still inherits 2,189 unadapted BP3D torso/cranium/limb meshes (94.0%) and 8 co-registered vulvar/urethral/endometrial approximations. Critical gaps across both sexes include the thyroid gland, parathyroid glands, middle/inner ear ossicles & cochlea, thoracic duct & systemic lymph nodes, cranial meninges, female pelvic floor muscles, ovarian/vaginal/clitoral vessels, and male bulbourethral glands & pampiniform plexus.',
  reviewStatus: 'source_reviewed',
  lastAudited: '2026-11-25',
};

export const ONTOLOGY_PROVENANCE: ProvenanceLayerRecord = {
  layer: 'ontology',
  id: 'fma-ontology',
  name: 'Foundational Model of Anatomy (FMA)',
  version: 'FMA 4.x / BodyParts3D Concept Alignment',
  authority: 'Structural Informatics Group, University of Washington',
  license: 'CUSTOM (OBO Foundry records FMA license as CUSTOM — verify official University of Washington terms before derivative ontology redistribution)',
  licenseUrl: 'https://obofoundry.org/ontology/fma.html',
  url: 'https://obofoundry.org/ontology/fma.html',
  scope: 'Canonical FMA concept identifiers (e.g., FMA7088 Heart, FMA50801 Brain) carried in BodyParts3D metadata to link meshes to curriculum.',
  limitations:
    'FMA is NOT declared CC BY 4.0; only canonical concept IDs and standard anatomical names aligned with BodyParts3D are referenced here. Concept-only structures without meshes are explicitly flagged.',
  reviewStatus: 'source_reviewed',
  lastAudited: '2026-11-18',
};

export const TERMINOLOGY_PROVENANCE: ProvenanceLayerRecord = {
  layer: 'terminology',
  id: 'ifaa-fipat-ta2',
  name: 'Terminologia Anatomica (TA2) & Terminologia Neuroanatomica (TNA)',
  version: 'TA2 (2019) / TNA (2017)',
  authority: 'Federative International Programme for Anatomical Terminology (FIPAT / IFAA)',
  license: 'CC BY-ND 4.0 (NoDerivatives — attribution required; do not redistribute modified TA2 tables under incompatible licenses)',
  licenseUrl: 'https://ifaa.net/committees/anatomical-terminology-fipat/fipat-ifaa-terminologies/',
  url: 'https://ifaa.net/committees/anatomical-terminology-fipat/',
  scope: 'Authoritative international standard for English and Latin anatomical nomenclature and hierarchical naming conventions.',
  limitations:
    'Referenced as an authoritative terminology standard without redistributing modified TA2 source tables.',
  reviewStatus: 'source_reviewed',
  lastAudited: '2026-11-18',
};

export const EDUCATIONAL_CURRICULUM_PROVENANCE: ProvenanceLayerRecord = {
  layer: 'educational_evidence',
  id: 'anatomy360-curriculum-v3',
  name: 'Anatomy 360 Curated Educational Corpus',
  version: '3.0',
  authority: 'OpenStax Anatomy & Physiology 2e / NCBI StatPearls / TA2 nomenclature alignment',
  license: 'CC BY 4.0 (original Anatomy 360 educational summaries; external links remain under publisher terms)',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  url: 'https://openstax.org/details/books/anatomy-and-physiology-2e',
  scope: 'Foundational, Intermediate, and Advanced anatomical summaries, relationships, regional brain mappings, surgical-region study guides, and rigid-body functional pilots.',
  limitations:
    'Source-reviewed educational reference only; has not undergone formal clinical or surgical board expert certification and is not intended for diagnosis or operative planning.',
  reviewStatus: 'source_reviewed',
  lastAudited: '2026-11-18',
};

export const PROVENANCE_LAYERS: ProvenanceLayerRecord[] = [
  GEOMETRY_PROVENANCE,
  ONTOLOGY_PROVENANCE,
  TERMINOLOGY_PROVENANCE,
  EDUCATIONAL_CURRICULUM_PROVENANCE,
];

export const EDUCATIONAL_EVIDENCE_RECORDS: EducationalEvidenceRecord[] = [
  {
    id: 'ev-brain-regions',
    targetType: 'brain_region',
    targetId: 'brain-regional-palette',
    claimSummary:
      'Cortical lobes (frontal, parietal, temporal, occipital), limbic/insular structures, diencephalon/basal nuclei, cerebellum, brainstem, and ventricular system mapped to BodyParts3D FJ-series meshes.',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 13 Central Nervous System) & BodyParts3D 4.0 FMA mapping',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system',
    dateAccessed: '2026-11-18',
    evidenceConfidence: 'high_textbook_consensus',
    limitations: 'Falx cerebri, arachnoid/pia mater, and lower cranial nerve cisterns are not individually meshed in BodyParts3D 4.0.',
    reviewStatus: 'source_reviewed',
    lastReviewed: '2026-11-18',
  },
  {
    id: 'ev-muscle-elbow',
    targetType: 'muscle_pilot',
    targetId: 'elbow-flexion',
    claimSummary:
      'Elbow flexion prime movers (brachialis, biceps brachii) oppose triceps brachii (antagonist) across the humeroulnar hinge axis.',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 11.5 Muscles of the Pectoral Girdle and Upper Limbs)',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs',
    dateAccessed: '2026-11-18',
    evidenceConfidence: 'high_textbook_consensus',
    limitations: 'Rigid-body kinematic pilot; does not deform muscle bellies.',
    reviewStatus: 'source_reviewed',
    lastReviewed: '2026-11-18',
  },
  {
    id: 'ev-muscle-shoulder',
    targetType: 'muscle_pilot',
    targetId: 'shoulder-abduction',
    claimSummary:
      'Glenohumeral abduction initiated by supraspinatus and driven by acromial deltoid, balanced by pectoralis major/teres major adductors and rotator cuff stabilizers.',
    sourceReference: 'NCBI StatPearls — Anatomy, Shoulder and Upper Limb, Deltoid Muscle',
    sourceUrl: 'https://www.ncbi.nlm.nih.gov/books/NBK537056/',
    dateAccessed: '2026-11-18',
    evidenceConfidence: 'high_textbook_consensus',
    limitations: 'Role visualization on static BodyParts3D shoulder musculature; full scapulohumeral rhythm rigging not yet bundled.',
    reviewStatus: 'source_reviewed',
    lastReviewed: '2026-11-18',
  },
  {
    id: 'ev-radiology-planes',
    targetType: 'radiology_plane',
    targetId: 'standard-anatomical-planes',
    claimSummary:
      'Sagittal (X), Axial/Transverse (Y), and Coronal/Frontal (Z) clipping planes correspond to standard anatomical sectioning orientations.',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 1.6 Anatomical Terminology)',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-6-anatomical-terminology',
    dateAccessed: '2026-11-18',
    evidenceConfidence: 'high_textbook_consensus',
    limitations: '3D surface-mesh cross-sectioning only; not spatially registered to clinical patient DICOM CT/MRI volumes.',
    reviewStatus: 'source_reviewed',
    lastReviewed: '2026-11-18',
  },
  {
    id: 'ev-surgical-regions',
    targetType: 'surgical_region',
    targetId: 'surgical-anatomy-curriculum',
    claimSummary:
      'Regional superficial-to-deep anatomical layers, neurovascular relations, and fascial boundaries mapped to existing BodyParts3D meshes with explicit conceptual-only disclosures for unmodeled fascia.',
    sourceReference: 'OpenStax Anatomy & Physiology 2e & Terminologia Anatomica (TA2) regional taxonomy',
    sourceUrl: 'https://openstax.org/details/books/anatomy-and-physiology-2e',
    dateAccessed: '2026-11-18',
    evidenceConfidence: 'high_textbook_consensus',
    limitations: 'Educational regional anatomy study aid only; requires formal anatomist/surgeon review before any expert_verified status.',
    reviewStatus: 'source_reviewed',
    lastReviewed: '2026-11-18',
  },
];

export const REVIEW_STATUS_LABELS: Record<ProvenanceReviewStatus, string> = {
  draft: 'Draft',
  needs_evidence: 'Needs Evidence',
  automated_check_passed: 'Automated Check Passed',
  source_reviewed: 'Source Reviewed',
  under_expert_review: 'Under Expert Review',
  expert_verified: 'Expert Verified',
  needs_revision: 'Needs Revision',
  deprecated: 'Deprecated',
};

export function normalizeReviewStatus(status: string | undefined): ProvenanceReviewStatus {
  if (
    status === 'draft' ||
    status === 'needs_evidence' ||
    status === 'automated_check_passed' ||
    status === 'source_reviewed' ||
    status === 'under_expert_review' ||
    status === 'expert_verified' ||
    status === 'needs_revision' ||
    status === 'deprecated'
  ) {
    return status;
  }
  // Legacy 'verified' from v1 schema maps honestly to 'source_reviewed' (never falsely promoted to 'expert_verified')
  if (status === 'verified') return 'source_reviewed';
  if (status === 'unverified') return 'needs_evidence';
  if (status === 'under_review') return 'under_expert_review';
  return 'needs_evidence';
}

export function getReviewStatusLabel(status: string | undefined): string {
  return REVIEW_STATUS_LABELS[normalizeReviewStatus(status)];
}

export function validateProvenanceIntegrity(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const layer of PROVENANCE_LAYERS) {
    if (!layer.authority.trim()) errors.push(`Layer ${layer.id}: missing authority`);
    if (!layer.license.trim()) errors.push(`Layer ${layer.id}: missing license`);
    if (!/^https:\/\//i.test(layer.url)) errors.push(`Layer ${layer.id}: url must use HTTPS`);
    if (!/^https:\/\//i.test(layer.licenseUrl)) errors.push(`Layer ${layer.id}: licenseUrl must use HTTPS`);
    if (layer.id === 'fma-ontology' && /\bCC BY 4\.0\b/i.test(layer.license) && !/CUSTOM/i.test(layer.license)) {
      errors.push('FMA ontology must not be mislabeled as CC BY 4.0 (OBO Foundry records CUSTOM license)');
    }
    if (layer.reviewStatus === 'expert_verified') {
      errors.push(`Layer ${layer.id}: cannot mark expert_verified without documented human expert sign-off`);
    }
  }
  for (const rec of EDUCATIONAL_EVIDENCE_RECORDS) {
    if ((rec.reviewStatus === 'source_reviewed' || rec.reviewStatus === 'expert_verified') && !rec.sourceReference.trim()) {
      errors.push(`Evidence ${rec.id}: reviewed record missing sourceReference`);
    }
    if (rec.reviewStatus === 'expert_verified' && (!rec.reviewerName?.trim() || !rec.reviewerRole?.trim())) {
      errors.push(`Evidence ${rec.id}: expert_verified requires actual reviewerName and reviewerRole`);
    }
    if (rec.sourceUrl && !/^https:\/\//i.test(rec.sourceUrl)) {
      errors.push(`Evidence ${rec.id}: sourceUrl must use HTTPS`);
    }
  }
  return { valid: errors.length === 0, errors };
}
