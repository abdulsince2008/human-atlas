import type { CanonicalSystemId } from '../anatomy-systems';
import type { ProvenanceReviewStatus } from './provenance-registry';

export const STUDY_RESOURCE_SCHEMA_VERSION = 1;

export type StudyResourceAccessType =
  | 'open_access'
  | 'open_textbook'
  | 'open_atlas'
  | 'open_microscopy'
  | 'clinical_reference';

export type StudyResourceModule =
  | 'explorer'
  | 'brain'
  | 'relationships'
  | 'learn'
  | 'histology'
  | 'physiology'
  | 'clinical'
  | 'radiology'
  | 'musculoskeletal';

export interface CuratedStudyResource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  accessType: StudyResourceAccessType;
  licenseNote: string;
  reviewStatus: ProvenanceReviewStatus;
  summary: string;
  canonicalSystems: CanonicalSystemId[];
  conceptIds: string[];
  modules: StudyResourceModule[];
}

export const ACCESS_TYPE_LABELS: Record<StudyResourceAccessType, string> = {
  open_access: 'Open Access',
  open_textbook: 'Open Textbook',
  open_atlas: 'Open Atlas',
  open_microscopy: 'Open Microscopy',
  clinical_reference: 'Open Reference',
};

/**
 * Curated direct open educational resources.
 * Every URL points to an established, publicly accessible academic or open-license resource.
 */
export const STUDY_RESOURCES: CuratedStudyResource[] = [
  {
    id: 'openstax-cns-brain',
    title: 'The Central Nervous System — Brain Lobes, Diencephalon & Brainstem',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system',
    accessType: 'open_textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary: 'Comprehensive chapter on cerebral cortex divisions, basal nuclei, thalamus, hypothalamus, cerebellum, brainstem, and ventricular CSF circulation.',
    canonicalSystems: ['nervous'],
    conceptIds: ['FMA50801', 'FMA67944', 'FMA79876', 'FMA7647', 'FMA13889', 'FMA62033'],
    modules: ['brain', 'explorer', 'learn', 'relationships'],
  },
  {
    id: 'ncbi-neuroanatomy-cerebral-cortex',
    title: 'Neuroanatomy, Cerebral Cortex',
    publisher: 'NCBI Bookshelf · StatPearls',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK537247/',
    accessType: 'open_access',
    licenseNote: 'CC BY-NC-ND 4.0 (NCBI Open)',
    reviewStatus: 'source_reviewed',
    summary: 'Clinical and functional overview of cortical lobes, gyri, Brodmann regions, vascular territories, and lesion localization.',
    canonicalSystems: ['nervous'],
    conceptIds: ['FMA50801', 'FMA67944', 'FMA79876'],
    modules: ['brain', 'clinical', 'relationships'],
  },
  {
    id: 'radiopaedia-brain-anatomy',
    title: 'Brain Anatomy & Cross-Sectional Imaging Reference',
    publisher: 'Radiopaedia',
    url: 'https://radiopaedia.org/articles/brain-anatomy',
    accessType: 'clinical_reference',
    licenseNote: 'CC BY-NC-SA 3.0',
    reviewStatus: 'source_reviewed',
    summary: 'Axial, coronal, and sagittal neuroimaging correlations of the cerebral hemispheres, ventricles, brainstem, and skull base.',
    canonicalSystems: ['nervous', 'skeletal'],
    conceptIds: ['FMA50801', 'FMA67944', 'FMA79876', 'FMA46565'],
    modules: ['brain', 'radiology', 'explorer'],
  },
  {
    id: 'openstax-heart-anatomy',
    title: 'Heart Anatomy — Chambers, Valves & Coronary Circulation',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy',
    accessType: 'open_textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary: 'Detailed walkthrough of atrial and ventricular geometry, valve mechanics, pericardial layers, and coronary supply.',
    canonicalSystems: ['cardiovascular'],
    conceptIds: ['FMA7088', 'FMA3736', 'FMA3768', 'FMA3802', 'FMA4720', 'FMA10951'],
    modules: ['explorer', 'learn', 'relationships', 'physiology'],
  },
  {
    id: 'ncbi-heart-anatomy',
    title: 'Anatomy, Thorax, Heart',
    publisher: 'NCBI Bookshelf · StatPearls',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK470256/',
    accessType: 'open_access',
    licenseNote: 'CC BY-NC-ND 4.0 (NCBI Open)',
    reviewStatus: 'source_reviewed',
    summary: 'Mediastinal relations, chamber borders, conducting system, coronary vasculature, and clinical exam correlations.',
    canonicalSystems: ['cardiovascular'],
    conceptIds: ['FMA7088', 'FMA3768', 'FMA8612', 'FMA8648'],
    modules: ['relationships', 'clinical', 'radiology'],
  },
  {
    id: 'openstax-upper-limb-muscles',
    title: 'Muscles of the Pectoral Girdle and Upper Limbs',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs',
    accessType: 'open_textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary: 'Origins, insertions, joint actions, and agonist–antagonist pairings for biceps brachii, brachialis, triceps brachii, and deltoid.',
    canonicalSystems: ['muscular', 'skeletal'],
    conceptIds: ['FMA37683', 'FMA37682', 'FMA37692', 'FMA34676', 'FMA13303', 'FMA13394', 'FMA13321'],
    modules: ['musculoskeletal', 'explorer', 'learn', 'relationships'],
  },
  {
    id: 'ncbi-deltoid-muscle',
    title: 'Anatomy, Shoulder and Upper Limb, Deltoid Muscle',
    publisher: 'NCBI Bookshelf · StatPearls',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK537056/',
    accessType: 'open_access',
    licenseNote: 'CC BY-NC-ND 4.0 (NCBI Open)',
    reviewStatus: 'source_reviewed',
    summary: 'Clavicular, acromial, and spinal deltoid fiber actions, axillary nerve course, and shoulder abduction biomechanics.',
    canonicalSystems: ['muscular'],
    conceptIds: ['FMA34676', 'FMA13303', 'FMA13394'],
    modules: ['musculoskeletal', 'relationships', 'clinical'],
  },
  {
    id: 'openstax-respiratory-organs',
    title: 'Organs and Structures of the Respiratory System',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/22-1-organs-and-structures-of-the-respiratory-system',
    accessType: 'open_textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary: 'Conducting and respiratory zones, bronchial branching, pleural cavities, and diaphragmatic mechanics.',
    canonicalSystems: ['respiratory'],
    conceptIds: ['FMA7309', 'FMA7310', 'FMA7394', 'FMA13295'],
    modules: ['learn', 'relationships', 'physiology', 'radiology'],
  },
  {
    id: 'openstax-digestive-overview',
    title: 'Overview of the Digestive System & Accessory Organs',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/23-1-overview-of-the-digestive-system',
    accessType: 'open_textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary: 'GI tract layering, stomach, duodenum, liver portal triad, gallbladder, and exocrine/endocrine pancreas.',
    canonicalSystems: ['digestive'],
    conceptIds: ['FMA7197', 'FMA7148', 'FMA7198', 'FMA7202', 'FMA7206'],
    modules: ['learn', 'relationships', 'clinical'],
  },
  {
    id: 'openstax-urinary-anatomy',
    title: 'Gross Anatomy of the Kidney & Urine Transport',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/25-1-internal-and-external-anatomy-of-the-kidney',
    accessType: 'open_textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary: 'Renal cortex, medulla, nephron filtration, renal vessels, ureters, and urinary bladder detrusor physiology.',
    canonicalSystems: ['urinary'],
    conceptIds: ['FMA7203', 'FMA15900', 'FMA9704'],
    modules: ['learn', 'relationships', 'physiology'],
  },
  {
    id: 'openstax-axial-skeleton',
    title: 'The Skull, Vertebral Column & Thoracic Cage',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/7-2-the-skull',
    accessType: 'open_textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary: 'Cranial vault and facial bones, sutures, cranial fossae, sternum, ribs, and vertebral joints.',
    canonicalSystems: ['skeletal'],
    conceptIds: ['FMA46565', 'FMA52748', 'FMA7485', 'FMA7574', 'FMA9611', 'FMA24476'],
    modules: ['explorer', 'learn', 'relationships', 'radiology'],
  },
  {
    id: 'histology-guide-main',
    title: 'Histology Guide — Virtual Microscopy Atlas',
    publisher: 'Histology Guide (Open Educational Resource)',
    url: 'https://histologyguide.com/',
    accessType: 'open_microscopy',
    licenseNote: 'Open Educational Resource (Non-commercial academic)',
    reviewStatus: 'source_reviewed',
    summary: 'Interactive virtual microscope slides covering epithelial, connective, muscle, nervous, cardiovascular, and organ microanatomy.',
    canonicalSystems: ['integumentary', 'muscular', 'nervous', 'cardiovascular', 'digestive', 'urinary', 'respiratory'],
    conceptIds: ['FMA7088', 'FMA7197', 'FMA7203', 'FMA50801'],
    modules: ['histology', 'learn'],
  },
  {
    id: 'openstax-tissues-histology',
    title: 'The Tissue Level of Organization',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/4-1-types-of-tissues',
    accessType: 'open_textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary: 'Foundational microanatomy of epithelial, connective, muscle, and neural tissues with staining and diagnostic features.',
    canonicalSystems: ['integumentary', 'muscular', 'nervous'],
    conceptIds: [],
    modules: ['histology', 'learn'],
  },
  {
    id: 'radiopaedia-anatomical-planes',
    title: 'Anatomical Planes & Cross-Sectional Orientation',
    publisher: 'Radiopaedia',
    url: 'https://radiopaedia.org/articles/anatomical-planes',
    accessType: 'clinical_reference',
    licenseNote: 'CC BY-NC-SA 3.0',
    reviewStatus: 'source_reviewed',
    summary: 'Reference guide to axial (transverse), coronal (frontal), and sagittal planes used in CT, MRI, and anatomical sectioning.',
    canonicalSystems: ['skeletal', 'nervous', 'cardiovascular', 'respiratory', 'digestive'],
    conceptIds: ['FMA50801', 'FMA7088', 'FMA7197', 'FMA7309'],
    modules: ['radiology', 'explorer'],
  },
  {
    id: 'bp3d-dbcls-atlas',
    title: 'BodyParts3D / Anatomography 3D Mesh Repository',
    publisher: 'DBCLS (Database Center for Life Science)',
    url: 'https://lifesciencedb.jp/bp3d/',
    accessType: 'open_atlas',
    licenseNote: 'CC BY-SA 2.1 Japan',
    reviewStatus: 'source_reviewed',
    summary: 'Primary source of the 2,234 FMA-mapped adult male 3D anatomical meshes rendered in Anatomy 360.',
    canonicalSystems: ['skeletal', 'muscular', 'cardiovascular', 'nervous', 'respiratory', 'digestive', 'urinary', 'endocrine', 'lymphatic', 'reproductive', 'integumentary'],
    conceptIds: [],
    modules: ['explorer', 'brain', 'relationships'],
  },
];

export function getStudyResourcesFor(query: {
  conceptId?: string;
  canonicalSystem?: CanonicalSystemId;
  module?: StudyResourceModule;
  limit?: number;
}): CuratedStudyResource[] {
  const { conceptId, canonicalSystem, module, limit = 4 } = query;
  const scored: { resource: CuratedStudyResource; score: number }[] = [];

  for (const res of STUDY_RESOURCES) {
    let score = 0;
    if (conceptId && res.conceptIds.includes(conceptId)) score += 6;
    if (module && res.modules.includes(module)) score += 3;
    if (canonicalSystem && res.canonicalSystems.includes(canonicalSystem)) score += 2;
    if (score > 0) {
      scored.push({ resource: res, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.resource.title.localeCompare(b.resource.title));
  return scored.slice(0, limit).map((s) => s.resource);
}

export function validateStudyResources(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const res of STUDY_RESOURCES) {
    if (!res.id.trim()) errors.push('Study resource missing id');
    if (seen.has(res.id)) errors.push(`Duplicate study resource id: ${res.id}`);
    seen.add(res.id);
    if (!/^https:\/\//i.test(res.url)) {
      errors.push(`Study resource ${res.id}: URL must start with https://`);
    }
    if (!res.publisher.trim()) errors.push(`Study resource ${res.id}: missing publisher`);
    if (!res.licenseNote.trim()) errors.push(`Study resource ${res.id}: missing licenseNote`);
  }
  return { valid: errors.length === 0, errors };
}
