/**
 * Four-Layer Scientific Provenance & Verification Registry
 *
 * Strictly separates:
 *  1. Geometry provenance (BodyParts3D 4.0 mesh attribution)
 *  2. Anatomical ontology provenance (FMA concept IDs)
 *  3. Educational evidence provenance (per-structure / per-relationship claims)
 *  4. External study resource provenance (curated open links in study-resources.ts)
 */

export const PROVENANCE_SCHEMA_VERSION = 1;

export type ProvenanceReviewStatus =
  | 'draft'
  | 'needs_evidence'
  | 'under_review'
  | 'verified'
  | 'needs_revision'
  | 'deprecated';

export type ProvenanceLayer =
  | 'geometry'
  | 'ontology'
  | 'educational_evidence'
  | 'external_resource';

export interface ProvenanceLayerRecord {
  layer: ProvenanceLayer;
  id: string;
  name: string;
  version: string;
  authority: string;
  license: string;
  url: string;
  scope: string;
  limitations: string;
  reviewStatus: ProvenanceReviewStatus;
  lastAudited: string;
}

export interface EducationalEvidenceRecord {
  id: string;
  targetType: 'structure' | 'relationship' | 'brain_region' | 'muscle_pilot' | 'radiology_plane';
  targetId: string;
  claimSummary: string;
  sourceReference: string;
  sourceUrl?: string;
  reviewStatus: ProvenanceReviewStatus;
  lastReviewed: string;
}

export const GEOMETRY_PROVENANCE: ProvenanceLayerRecord = {
  layer: 'geometry',
  id: 'bp3d-4.0',
  name: 'BodyParts3D / Anatomography',
  version: '4.0 (2013 release)',
  authority: 'Database Center for Life Science (DBCLS), Japan',
  license: 'CC BY-SA 2.1 Japan',
  url: 'https://lifesciencedb.jp/bp3d/',
  scope: '2,234 adult male 3D anatomical surface meshes across 15 mesh system groups.',
  limitations:
    'Adult male reference model only; does not contain female reproductive anatomy, microscopic histology geometry, arachnoid/pia mater sheets, or deformable soft-tissue muscle rigs.',
  reviewStatus: 'verified',
  lastAudited: '2026-11-17',
};

export const ONTOLOGY_PROVENANCE: ProvenanceLayerRecord = {
  layer: 'ontology',
  id: 'fma-ontology',
  name: 'Foundational Model of Anatomy (FMA)',
  version: 'FMA 4.x / BodyParts3D Concept Alignment',
  authority: 'Structural Informatics Group, University of Washington',
  license: 'CC BY 4.0',
  url: 'https://si.washington.edu/projects/fma',
  scope: 'Canonical FMA concept identifiers (e.g., FMA7088 Heart, FMA50801 Brain) linking meshes to educational curriculum.',
  limitations:
    'Concept-only structures without matching BodyParts3D meshes are explicitly flagged as ontology-only rather than fabricated in 3D.',
  reviewStatus: 'verified',
  lastAudited: '2026-11-17',
};

export const EDUCATIONAL_CURRICULUM_PROVENANCE: ProvenanceLayerRecord = {
  layer: 'educational_evidence',
  id: 'anatomy360-curriculum-v2',
  name: 'Anatomy 360 Curated Educational Corpus',
  version: '2.1',
  authority: 'OpenStax Anatomy & Physiology 2e / NCBI StatPearls / Terminologia Anatomica alignment',
  license: 'CC BY 4.0',
  url: 'https://openstax.org/details/books/anatomy-and-physiology-2e',
  scope: 'Foundational, Intermediate, and Advanced anatomical summaries, relationships, regional brain mappings, and rigid-body functional pilots.',
  limitations:
    'Educational reference only; not intended for clinical diagnosis, surgical planning, or patient management.',
  reviewStatus: 'verified',
  lastAudited: '2026-11-17',
};

export const PROVENANCE_LAYERS: ProvenanceLayerRecord[] = [
  GEOMETRY_PROVENANCE,
  ONTOLOGY_PROVENANCE,
  EDUCATIONAL_CURRICULUM_PROVENANCE,
];

export const EDUCATIONAL_EVIDENCE_RECORDS: EducationalEvidenceRecord[] = [
  {
    id: 'ev-brain-regions',
    targetType: 'brain_region',
    targetId: 'brain-regional-palette',
    claimSummary:
      'Cortical lobes (frontal, parietal, temporal, occipital), limbic/insular structures, diencephalon/basal nuclei, cerebellum, brainstem, and ventricular system mapped to verified BodyParts3D FJ-series meshes.',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 13 Central Nervous System) & BodyParts3D 4.0 FMA mapping',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system',
    reviewStatus: 'verified',
    lastReviewed: '2026-11-17',
  },
  {
    id: 'ev-muscle-elbow',
    targetType: 'muscle_pilot',
    targetId: 'elbow-flexion',
    claimSummary:
      'Elbow flexion prime movers (brachialis, biceps brachii) oppose triceps brachii (antagonist) across the humeroulnar hinge axis.',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 11.5 Muscles of the Pectoral Girdle and Upper Limbs)',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs',
    reviewStatus: 'verified',
    lastReviewed: '2026-11-17',
  },
  {
    id: 'ev-muscle-shoulder',
    targetType: 'muscle_pilot',
    targetId: 'shoulder-abduction',
    claimSummary:
      'Glenohumeral abduction initiated by supraspinatus and driven by acromial deltoid, balanced by pectoralis major/teres major adductors and rotator cuff stabilizers.',
    sourceReference: 'NCBI StatPearls — Anatomy, Shoulder and Upper Limb, Deltoid Muscle',
    sourceUrl: 'https://www.ncbi.nlm.nih.gov/books/NBK537056/',
    reviewStatus: 'verified',
    lastReviewed: '2026-11-17',
  },
  {
    id: 'ev-radiology-planes',
    targetType: 'radiology_plane',
    targetId: 'standard-anatomical-planes',
    claimSummary:
      'Sagittal (X), Axial/Transverse (Y), and Coronal/Frontal (Z) clipping planes correspond to standard anatomical sectioning orientations.',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 1.6 Anatomical Terminology)',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-6-anatomical-terminology',
    reviewStatus: 'verified',
    lastReviewed: '2026-11-17',
  },
];

export const REVIEW_STATUS_LABELS: Record<ProvenanceReviewStatus, string> = {
  draft: 'Draft',
  needs_evidence: 'Needs Evidence',
  under_review: 'Under Review',
  verified: 'Verified',
  needs_revision: 'Needs Revision',
  deprecated: 'Deprecated',
};

export function normalizeReviewStatus(status: string | undefined): ProvenanceReviewStatus {
  if (
    status === 'draft' ||
    status === 'needs_evidence' ||
    status === 'under_review' ||
    status === 'verified' ||
    status === 'needs_revision' ||
    status === 'deprecated'
  ) {
    return status;
  }
  if (status === 'unverified') return 'needs_evidence';
  return 'under_review';
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
  }
  for (const rec of EDUCATIONAL_EVIDENCE_RECORDS) {
    if (rec.reviewStatus === 'verified' && !rec.sourceReference.trim()) {
      errors.push(`Evidence ${rec.id}: verified record missing sourceReference`);
    }
    if (rec.sourceUrl && !/^https:\/\//i.test(rec.sourceUrl)) {
      errors.push(`Evidence ${rec.id}: sourceUrl must use HTTPS`);
    }
  }
  return { valid: errors.length === 0, errors };
}
