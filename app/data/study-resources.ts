import type { CanonicalSystemId } from '../anatomy-systems';
import type { EducationDomainId, EducationTrackId } from '../education/education-types';
import { VERIFIED_SOURCES } from '../education/verified-sources';
import type { ProvenanceReviewStatus } from './provenance-registry';

export const STUDY_RESOURCE_SCHEMA_VERSION = 2;

export type StudyResourceAccessType =
  | 'open_access'
  | 'open_textbook'
  | 'open_atlas'
  | 'open_microscopy'
  | 'clinical_reference';

export type ExternalResourceKind =
  | 'textbook'
  | 'academic_article'
  | 'review_article'
  | 'medical_reference'
  | 'atlas'
  | 'histology'
  | 'radiology'
  | 'diagram'
  | 'dataset';

export type StudyResourceModule =
  | 'explorer'
  | 'brain'
  | 'relationships'
  | 'learn'
  | 'histology'
  | 'physiology'
  | 'clinical'
  | 'radiology'
  | 'musculoskeletal'
  | 'study_workspace';

export interface CuratedStudyResource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  accessType: StudyResourceAccessType;
  resourceKind?: ExternalResourceKind;
  licenseNote: string;
  reviewStatus: ProvenanceReviewStatus;
  summary: string;
  canonicalSystems: CanonicalSystemId[];
  conceptIds: string[];
  topicIds?: string[];
  domainIds?: EducationDomainId[];
  academicLevels?: EducationTrackId[];
  modules: StudyResourceModule[];
  dateChecked?: string;
}

export const ACCESS_TYPE_LABELS: Record<StudyResourceAccessType, string> = {
  open_access: 'Open Access',
  open_textbook: 'Open Textbook',
  open_atlas: 'Open Atlas',
  open_microscopy: 'Open Microscopy',
  clinical_reference: 'Open Reference',
};

export const RESOURCE_KIND_LABELS: Record<ExternalResourceKind, string> = {
  textbook: 'Textbook Chapter',
  academic_article: 'Academic Article',
  review_article: 'Review / StatPearls',
  medical_reference: 'Medical Reference',
  atlas: '3D / Reference Atlas',
  histology: 'Histology & Microscopy',
  radiology: 'Radiology & Imaging',
  diagram: 'Anatomical Diagrams',
  dataset: 'Research Dataset',
};

/**
 * Curated direct open educational resources.
 * Every URL points to an established, publicly accessible academic or open-license resource
 * verified from existing repository provenance or live academic domain verification.
 */
export const STUDY_RESOURCES: CuratedStudyResource[] = [
  {
    id: 'openstax-cns-brain',
    title: 'The Central Nervous System — Brain Lobes, Diencephalon & Brainstem',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system',
    accessType: 'open_textbook',
    resourceKind: 'textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Comprehensive chapter on cerebral cortex divisions, basal nuclei, thalamus, hypothalamus, cerebellum, brainstem, and ventricular CSF circulation.',
    canonicalSystems: ['nervous'],
    conceptIds: ['FMA50801', 'FMA67944', 'FMA79876', 'FMA7647', 'FMA13889', 'FMA62033'],
    topicIds: ['topic-nervous-brain-divisions', 'topic-nervous-spinal-nerves'],
    domainIds: ['human_anatomy', 'human_physiology'],
    academicLevels: ['secondary_premed', 'medical_foundations', 'allied_health'],
    modules: ['brain', 'explorer', 'learn', 'relationships', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'ncbi-neuroanatomy-cerebral-cortex',
    title: 'Neuroanatomy, Cerebral Cortex',
    publisher: 'NCBI Bookshelf · StatPearls',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK537247/',
    accessType: 'open_access',
    resourceKind: 'review_article',
    licenseNote: 'CC BY-NC-ND 4.0 (NCBI Open)',
    reviewStatus: 'source_reviewed',
    summary:
      'Clinical and functional overview of cortical lobes, gyri, Brodmann regions, vascular territories, and lesion localization.',
    canonicalSystems: ['nervous'],
    conceptIds: ['FMA50801', 'FMA67944', 'FMA79876'],
    topicIds: ['topic-nervous-brain-divisions'],
    domainIds: ['human_anatomy', 'clinical_specialties'],
    academicLevels: ['medical_foundations', 'clinical_applied', 'graduate_research'],
    modules: ['brain', 'clinical', 'relationships', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'radiopaedia-brain-anatomy',
    title: 'Brain Anatomy & Cross-Sectional Imaging Reference',
    publisher: 'Radiopaedia',
    url: 'https://radiopaedia.org/articles/brain-anatomy',
    accessType: 'clinical_reference',
    resourceKind: 'radiology',
    licenseNote: 'CC BY-NC-SA 3.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Axial, coronal, and sagittal neuroimaging correlations of the cerebral hemispheres, ventricles, brainstem, and skull base.',
    canonicalSystems: ['nervous', 'skeletal'],
    conceptIds: ['FMA50801', 'FMA67944', 'FMA79876', 'FMA46565', 'FMA50863'],
    topicIds: ['topic-nervous-brain-divisions', 'topic-skeletal-skull-jaw'],
    domainIds: ['radiology_imaging', 'human_anatomy'],
    academicLevels: ['medical_foundations', 'clinical_applied'],
    modules: ['brain', 'radiology', 'explorer', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'openstax-heart-anatomy',
    title: 'Heart Anatomy — Chambers, Valves & Coronary Circulation',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy',
    accessType: 'open_textbook',
    resourceKind: 'textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Detailed walkthrough of atrial and ventricular geometry, valve mechanics, pericardial layers, and coronary supply.',
    canonicalSystems: ['cardiovascular'],
    conceptIds: ['FMA7088', 'FMA3736', 'FMA3768', 'FMA3802', 'FMA4720', 'FMA10951'],
    topicIds: ['topic-cardio-heart-chambers', 'topic-cardio-great-vessels'],
    domainIds: ['human_anatomy', 'human_physiology'],
    academicLevels: ['secondary_premed', 'medical_foundations', 'allied_health'],
    modules: ['explorer', 'learn', 'relationships', 'physiology', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'ncbi-heart-anatomy',
    title: 'Anatomy, Thorax, Heart',
    publisher: 'NCBI Bookshelf · StatPearls',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK470256/',
    accessType: 'open_access',
    resourceKind: 'review_article',
    licenseNote: 'CC BY-NC-ND 4.0 (NCBI Open)',
    reviewStatus: 'source_reviewed',
    summary:
      'Mediastinal relations, chamber borders, conducting system, coronary vasculature, and clinical exam correlations.',
    canonicalSystems: ['cardiovascular'],
    conceptIds: ['FMA7088', 'FMA3768', 'FMA8612', 'FMA8648'],
    topicIds: ['topic-cardio-heart-chambers', 'topic-cardio-great-vessels'],
    domainIds: ['human_anatomy', 'clinical_specialties'],
    academicLevels: ['medical_foundations', 'clinical_applied'],
    modules: ['relationships', 'clinical', 'radiology', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'openstax-upper-limb-muscles',
    title: 'Muscles of the Pectoral Girdle and Upper Limbs',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs',
    accessType: 'open_textbook',
    resourceKind: 'textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Origins, insertions, joint actions, and agonist–antagonist pairings for biceps brachii, brachialis, triceps brachii, and deltoid.',
    canonicalSystems: ['muscular', 'skeletal'],
    conceptIds: ['FMA37683', 'FMA37682', 'FMA37692', 'FMA34676', 'FMA13303', 'FMA13394', 'FMA13321'],
    topicIds: ['topic-muscular-upper-limb', 'topic-skeletal-upper-limb'],
    domainIds: ['human_anatomy'],
    academicLevels: ['secondary_premed', 'medical_foundations', 'allied_health'],
    modules: ['musculoskeletal', 'explorer', 'learn', 'relationships', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'ncbi-deltoid-muscle',
    title: 'Anatomy, Shoulder and Upper Limb, Deltoid Muscle',
    publisher: 'NCBI Bookshelf · StatPearls',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK537056/',
    accessType: 'open_access',
    resourceKind: 'review_article',
    licenseNote: 'CC BY-NC-ND 4.0 (NCBI Open)',
    reviewStatus: 'source_reviewed',
    summary:
      'Clavicular, acromial, and spinal deltoid fiber actions, axillary nerve course, and shoulder abduction biomechanics.',
    canonicalSystems: ['muscular'],
    conceptIds: ['FMA34676', 'FMA13303', 'FMA13394'],
    topicIds: ['topic-muscular-upper-limb'],
    domainIds: ['human_anatomy', 'clinical_specialties'],
    academicLevels: ['medical_foundations', 'clinical_applied'],
    modules: ['musculoskeletal', 'relationships', 'clinical', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'openstax-respiratory-organs',
    title: 'Organs and Structures of the Respiratory System',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/22-1-organs-and-structures-of-the-respiratory-system',
    accessType: 'open_textbook',
    resourceKind: 'textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Conducting and respiratory zones, bronchial branching, pleural cavities, and diaphragmatic mechanics.',
    canonicalSystems: ['respiratory'],
    conceptIds: ['FMA7309', 'FMA7310', 'FMA7394', 'FMA13295', 'FMA7195'],
    topicIds: ['topic-respiratory-airways', 'topic-respiratory-mechanics'],
    domainIds: ['human_anatomy', 'human_physiology'],
    academicLevels: ['school_foundations', 'secondary_premed', 'medical_foundations'],
    modules: ['learn', 'relationships', 'physiology', 'radiology', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'openstax-digestive-overview',
    title: 'Overview of the Digestive System & Accessory Organs',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/23-1-overview-of-the-digestive-system',
    accessType: 'open_textbook',
    resourceKind: 'textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'GI tract layering, stomach, duodenum, liver portal triad, gallbladder, and exocrine/endocrine pancreas.',
    canonicalSystems: ['digestive'],
    conceptIds: ['FMA7197', 'FMA7148', 'FMA7198', 'FMA7202', 'FMA7206'],
    topicIds: ['topic-digestive-tract', 'topic-digestive-accessory'],
    domainIds: ['human_anatomy', 'human_physiology'],
    academicLevels: ['school_foundations', 'secondary_premed', 'medical_foundations'],
    modules: ['learn', 'relationships', 'clinical', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'openstax-urinary-anatomy',
    title: 'Gross Anatomy of the Kidney & Urine Transport',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/25-1-internal-and-external-anatomy-of-the-kidney',
    accessType: 'open_textbook',
    resourceKind: 'textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Renal cortex, medulla, nephron filtration, renal vessels, ureters, and urinary bladder detrusor physiology.',
    canonicalSystems: ['urinary'],
    conceptIds: ['FMA7203', 'FMA15900', 'FMA9704'],
    topicIds: ['topic-urinary-kidneys', 'topic-urinary-bladder-urethra'],
    domainIds: ['human_anatomy', 'human_physiology'],
    academicLevels: ['secondary_premed', 'medical_foundations', 'allied_health'],
    modules: ['learn', 'relationships', 'physiology', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'openstax-axial-skeleton',
    title: 'The Skull, Vertebral Column & Thoracic Cage',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/7-2-the-skull',
    accessType: 'open_textbook',
    resourceKind: 'textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Cranial vault and facial bones, sutures, cranial fossae, sternum, ribs, and vertebral joints.',
    canonicalSystems: ['skeletal'],
    conceptIds: ['FMA46565', 'FMA52748', 'FMA7485', 'FMA7574', 'FMA9611', 'FMA24476'],
    topicIds: ['topic-skeletal-skull-jaw', 'topic-skeletal-thorax-spine', 'topic-skeletal-lower-limb'],
    domainIds: ['human_anatomy'],
    academicLevels: ['school_foundations', 'secondary_premed', 'medical_foundations'],
    modules: ['explorer', 'learn', 'relationships', 'radiology', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'histology-guide-main',
    title: 'Histology Guide — Virtual Microscopy Atlas',
    publisher: 'Histology Guide (Open Educational Resource)',
    url: 'https://histologyguide.com/',
    accessType: 'open_microscopy',
    resourceKind: 'histology',
    licenseNote: 'Open Educational Resource (Non-commercial academic)',
    reviewStatus: 'source_reviewed',
    summary:
      'Interactive virtual microscope slides covering epithelial, connective, muscle, nervous, cardiovascular, and organ microanatomy.',
    canonicalSystems: [
      'integumentary',
      'muscular',
      'nervous',
      'cardiovascular',
      'digestive',
      'urinary',
      'respiratory',
    ],
    conceptIds: ['FMA7088', 'FMA7197', 'FMA7203', 'FMA50801'],
    domainIds: ['histology', 'pathology'],
    academicLevels: ['secondary_premed', 'medical_foundations', 'graduate_research'],
    modules: ['histology', 'learn', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'openstax-tissues-histology',
    title: 'The Tissue Level of Organization',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/4-1-types-of-tissues',
    accessType: 'open_textbook',
    resourceKind: 'histology',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Foundational microanatomy of epithelial, connective, muscle, and neural tissues with staining and diagnostic features.',
    canonicalSystems: ['integumentary', 'muscular', 'nervous'],
    conceptIds: ['FMA7163', 'FMA7394'],
    domainIds: ['histology', 'human_anatomy'],
    academicLevels: ['school_foundations', 'secondary_premed', 'medical_foundations'],
    modules: ['histology', 'learn', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'radiopaedia-anatomical-planes',
    title: 'Anatomical Planes & Cross-Sectional Orientation',
    publisher: 'Radiopaedia',
    url: 'https://radiopaedia.org/articles/anatomical-planes',
    accessType: 'clinical_reference',
    resourceKind: 'radiology',
    licenseNote: 'CC BY-NC-SA 3.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Reference guide to axial (transverse), coronal (frontal), and sagittal planes used in CT, MRI, and anatomical sectioning.',
    canonicalSystems: ['skeletal', 'nervous', 'cardiovascular', 'respiratory', 'digestive'],
    conceptIds: ['FMA50801', 'FMA7088', 'FMA7197', 'FMA7309'],
    domainIds: ['radiology_imaging', 'human_anatomy'],
    academicLevels: ['medical_foundations', 'clinical_applied', 'allied_health'],
    modules: ['radiology', 'explorer', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'bp3d-dbcls-atlas',
    title: 'BodyParts3D / Anatomography 3D Mesh Repository',
    publisher: 'DBCLS (Database Center for Life Science)',
    url: 'https://lifesciencedb.jp/bp3d/',
    accessType: 'open_atlas',
    resourceKind: 'atlas',
    licenseNote: 'CC BY-SA 2.1 Japan',
    reviewStatus: 'source_reviewed',
    summary:
      'Primary source of the 2,234 FMA-mapped adult male 3D anatomical meshes rendered in Anatomy 360.',
    canonicalSystems: [
      'skeletal',
      'muscular',
      'cardiovascular',
      'nervous',
      'respiratory',
      'digestive',
      'urinary',
      'endocrine',
      'lymphatic',
      'reproductive',
      'integumentary',
    ],
    conceptIds: [],
    domainIds: ['human_anatomy'],
    academicLevels: ['medical_foundations', 'graduate_research'],
    modules: ['explorer', 'brain', 'relationships', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'hubmap-hra-female-library',
    title: 'HuBMAP Human Reference Atlas — 3D Reference Object Library',
    publisher: 'HuBMAP Consortium / Indiana University',
    url: 'https://humanatlas.io/3d-reference-library',
    accessType: 'open_atlas',
    resourceKind: 'atlas',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Primary source for 84 female pelvic viscera, mammary gland, and iliac/rectal vasculature 3D meshes in the Adult Female anatomical layer.',
    canonicalSystems: ['reproductive', 'urinary', 'cardiovascular', 'skeletal'],
    conceptIds: ['FMA17558', 'FMA7209', 'FMA19949', 'FMA15900'],
    topicIds: ['topic-reproductive-female'],
    domainIds: ['human_anatomy'],
    academicLevels: ['medical_foundations', 'graduate_research'],
    modules: ['explorer', 'learn', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'openstax-biology-2e',
    title: 'OpenStax Biology 2e — Cell Biology, Genetics & Evolution',
    publisher: 'OpenStax (Rice University)',
    url: 'https://openstax.org/books/biology-2e/pages/1-introduction',
    accessType: 'open_textbook',
    resourceKind: 'textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Complete peer-reviewed introductory biology textbook bridging High School / AP / FSc foundations into undergraduate cell signaling, biochemistry, and molecular genetics.',
    canonicalSystems: ['nervous', 'cardiovascular', 'reproductive', 'endocrine', 'lymphatic'],
    conceptIds: [],
    domainIds: ['cell_biology', 'biochemistry', 'molecular_genetics'],
    academicLevels: ['school_foundations', 'secondary_premed'],
    modules: ['learn', 'histology', 'physiology', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'allen-human-brain-atlas',
    title: 'Allen Human Brain Atlas — Multimodal Gene Expression & Cortical Map',
    publisher: 'Allen Institute for Brain Science',
    url: 'https://human.brain-map.org',
    accessType: 'open_atlas',
    resourceKind: 'dataset',
    licenseNote: 'Allen Institute Open Data Terms (Citation Required)',
    reviewStatus: 'source_reviewed',
    summary:
      'Graduate & research-grade transcriptional and anatomical parcellation atlas mapping gene expression across MRI-registered human brain structures.',
    canonicalSystems: ['nervous', 'sensory', 'endocrine'],
    conceptIds: ['FMA50801', 'FMA67944', 'FMA79876'],
    topicIds: ['topic-nervous-brain-divisions'],
    domainIds: ['human_anatomy', 'molecular_genetics'],
    academicLevels: ['graduate_research'],
    modules: ['brain', 'learn', 'relationships', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'human-protein-atlas-tissue',
    title: 'The Human Protein Atlas — Tissue & Single-Cell Expression Atlas',
    publisher: 'SciLifeLab / KTH Royal Institute of Technology',
    url: 'https://www.proteinatlas.org/humanproteome/tissue',
    accessType: 'open_microscopy',
    resourceKind: 'dataset',
    licenseNote: 'CC BY-SA 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Research-level immunohistochemistry tissue microarrays and spatial transcriptomics profiling protein localization across human organs and microanatomy.',
    canonicalSystems: [
      'cardiovascular',
      'digestive',
      'urinary',
      'respiratory',
      'nervous',
      'lymphatic',
      'reproductive',
      'integumentary',
    ],
    conceptIds: ['FMA7088', 'FMA7197', 'FMA7203', 'FMA7196'],
    domainIds: ['histology', 'biochemistry', 'pathology'],
    academicLevels: ['graduate_research', 'medical_foundations'],
    modules: ['histology', 'learn', 'clinical', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'openstax-endocrine-pituitary',
    title: 'The Pituitary Gland & Hypothalamus — Endocrine Control Axes',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/17-3-pituitary-gland-and-hypothalamus',
    accessType: 'open_textbook',
    resourceKind: 'textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Hypothalamic-pituitary portal system, anterior/posterior tropic hormones, thyroid, adrenal, and pancreatic feedback circuits.',
    canonicalSystems: ['endocrine'],
    conceptIds: ['FMA13889', 'FMA7198', 'FMA9604'],
    topicIds: ['topic-endocrine-pituitary-thyroid', 'topic-endocrine-adrenal-pancreas'],
    domainIds: ['human_anatomy', 'human_physiology'],
    academicLevels: ['secondary_premed', 'medical_foundations', 'allied_health'],
    modules: ['learn', 'physiology', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'openstax-lymphatic-immune',
    title: 'Anatomy of the Lymphatic & Immune Systems',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/21-1-anatomy-of-the-lymphatic-and-immune-systems',
    accessType: 'open_textbook',
    resourceKind: 'textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Lymphatic capillaries, thoracic duct drainage, primary (thymus, bone marrow) and secondary lymphoid organs (spleen, lymph nodes).',
    canonicalSystems: ['lymphatic'],
    conceptIds: ['FMA7196', 'FMA9270'],
    topicIds: ['topic-lymphatic-organs'],
    domainIds: ['human_anatomy', 'immunology'],
    academicLevels: ['secondary_premed', 'medical_foundations', 'allied_health'],
    modules: ['learn', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'openstax-reproductive-system',
    title: 'Anatomy & Physiology of the Male and Female Reproductive Systems',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/27-1-anatomy-and-physiology-of-the-male-reproductive-system',
    accessType: 'open_textbook',
    resourceKind: 'textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Gametogenesis, gonadal hormone axes, internal/external male and female pelvic organs, ovarian/endometrial cycles, and mammary glands.',
    canonicalSystems: ['reproductive'],
    conceptIds: ['FMA7209', 'FMA17558', 'FMA9600'],
    topicIds: ['topic-reproductive-male', 'topic-reproductive-female'],
    domainIds: ['human_anatomy', 'embryology'],
    academicLevels: ['secondary_premed', 'medical_foundations', 'allied_health'],
    modules: ['learn', 'explorer', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'openstax-special-senses',
    title: 'The Special Senses — Vision, Audition & Vestibular Pathways',
    publisher: 'OpenStax Anatomy & Physiology 2e',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/15-2-vision',
    accessType: 'open_textbook',
    resourceKind: 'textbook',
    licenseNote: 'CC BY 4.0',
    reviewStatus: 'source_reviewed',
    summary:
      'Ocular tunics, retinal phototransduction, middle/inner ear mechanotransduction, olfaction, and gustation.',
    canonicalSystems: ['sensory'],
    conceptIds: ['FMA54448', 'FMA52780'],
    topicIds: ['topic-sensory-eye-ear'],
    domainIds: ['human_anatomy', 'human_physiology'],
    academicLevels: ['secondary_premed', 'medical_foundations'],
    modules: ['learn', 'explorer', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'iuphar-pharmacology-reference',
    title: 'IUPHAR Pharmacology Education Project — Mechanisms & Drug Targets',
    publisher: 'International Union of Basic & Clinical Pharmacology',
    url: 'https://www.pharmacologyeducation.org',
    accessType: 'clinical_reference',
    resourceKind: 'medical_reference',
    licenseNote: 'CC BY-SA 4.0 (IUPHAR OER)',
    reviewStatus: 'source_reviewed',
    summary:
      'Authoritative reference on receptor pharmacodynamics, pharmacokinetics, autonomic drugs, cardiovascular and antimicrobial pharmacology.',
    canonicalSystems: ['cardiovascular', 'nervous', 'respiratory', 'urinary'],
    conceptIds: ['FMA7088', 'FMA7203'],
    domainIds: ['pharmacology', 'clinical_specialties'],
    academicLevels: ['medical_foundations', 'clinical_applied'],
    modules: ['learn', 'clinical', 'physiology', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'utah-webpath-pathology',
    title: 'WebPath — Internet Pathology Laboratory & Histopathology Atlas',
    publisher: 'University of Utah Health Sciences Library',
    url: 'https://webpath.med.utah.edu/',
    accessType: 'open_microscopy',
    resourceKind: 'histology',
    licenseNote: 'University of Utah Academic OER (Non-Commercial)',
    reviewStatus: 'source_reviewed',
    summary:
      'Organ-system gross and microscopic pathology specimens, hematology smears, and clinical case correlations.',
    canonicalSystems: ['cardiovascular', 'respiratory', 'digestive', 'urinary', 'lymphatic'],
    conceptIds: ['FMA7088', 'FMA7197', 'FMA7203'],
    domainIds: ['pathology', 'haematology_lab', 'histology'],
    academicLevels: ['medical_foundations', 'clinical_applied'],
    modules: ['histology', 'clinical', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'medpix-nlm-imaging',
    title: 'MedPix — NIH / National Library of Medicine Open Imaging Archive',
    publisher: 'U.S. National Library of Medicine (NIH)',
    url: 'https://medpix.nlm.nih.gov',
    accessType: 'open_atlas',
    resourceKind: 'radiology',
    licenseNote: 'Public Domain / U.S. Federal Open Archive',
    reviewStatus: 'source_reviewed',
    summary:
      'De-identified peer-reviewed radiology cases across plain radiography, CT, MRI, and ultrasonography.',
    canonicalSystems: ['skeletal', 'cardiovascular', 'respiratory', 'nervous', 'urinary', 'digestive'],
    conceptIds: ['FMA7088', 'FMA7309', 'FMA50801', 'FMA7203'],
    domainIds: ['radiology_imaging', 'clinical_specialties'],
    academicLevels: ['medical_foundations', 'clinical_applied'],
    modules: ['radiology', 'clinical', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
  {
    id: 'ncbi-alberts-cell-biology',
    title: 'Molecular Biology of the Cell (Open NCBI Bookshelf Edition)',
    publisher: 'Alberts et al. · NCBI Bookshelf',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK21054/',
    accessType: 'open_textbook',
    resourceKind: 'textbook',
    licenseNote: 'NCBI Bookshelf Open Viewing Terms',
    reviewStatus: 'source_reviewed',
    summary:
      'Foundational cell and molecular biology reference covering membrane dynamics, signal transduction, cell cycle, and gene expression.',
    canonicalSystems: ['nervous', 'muscular', 'lymphatic'],
    conceptIds: [],
    domainIds: ['cell_biology', 'molecular_genetics', 'biochemistry'],
    academicLevels: ['medical_foundations', 'graduate_research'],
    modules: ['learn', 'histology', 'study_workspace'],
    dateChecked: '2026-11-26',
  },
];

export interface ExternalResourceQuery {
  conceptId?: string;
  canonicalSystem?: CanonicalSystemId;
  topicId?: string;
  domainId?: EducationDomainId;
  academicLevel?: EducationTrackId;
  module?: StudyResourceModule;
  limit?: number;
}

/**
 * Combines curated STUDY_RESOURCES with VERIFIED_SOURCES fallback records
 * when domain/chapter context calls for broader biomedical coverage.
 */
export function getAllKnownExternalResources(): CuratedStudyResource[] {
  const byUrl = new Map<string, CuratedStudyResource>();
  for (const res of STUDY_RESOURCES) {
    byUrl.set(res.url.toLowerCase(), res);
  }

  for (const vs of Object.values(VERIFIED_SOURCES)) {
    const key = vs.url.toLowerCase();
    if (byUrl.has(key)) continue;

    let domainIds: EducationDomainId[] = ['human_anatomy'];
    if (vs.id.startsWith('bio_')) domainIds = ['cell_biology', 'biochemistry', 'molecular_genetics'];
    else if (vs.id.startsWith('micro_')) domainIds = ['microbiology_parasitology', 'immunology'];
    else if (vs.id.includes('histology') || vs.id.includes('protein_atlas')) domainIds = ['histology'];
    else if (vs.id.includes('radiopaedia') || vs.id.includes('medpix')) domainIds = ['radiology_imaging'];
    else if (vs.id.includes('pharmacology')) domainIds = ['pharmacology'];
    else if (vs.id.includes('pathologia') || vs.id.includes('webpath')) domainIds = ['pathology'];
    else if (vs.id.includes('cdc') || vs.id.includes('geeky')) domainIds = ['clinical_skills_public_health'];
    else if (vs.id.includes('embryo')) domainIds = ['embryology'];

    const accessType: StudyResourceAccessType =
      vs.accessType === 'open_textbook'
        ? 'open_textbook'
        : vs.accessType === 'institutional_or_reference'
          ? 'clinical_reference'
          : 'open_access';

    byUrl.set(key, {
      id: `ext-${vs.id}`,
      title: vs.title,
      publisher: vs.authorOrPublisher,
      url: vs.url,
      accessType,
      resourceKind:
        accessType === 'open_textbook'
          ? 'textbook'
          : domainIds.includes('histology')
            ? 'histology'
            : domainIds.includes('radiology_imaging')
              ? 'radiology'
              : 'medical_reference',
      licenseNote: vs.licence,
      reviewStatus: 'source_reviewed',
      summary: vs.supports,
      canonicalSystems: [],
      conceptIds: [],
      domainIds,
      academicLevels: vs.level === 'multi_level' ? ['secondary_premed', 'medical_foundations'] : [vs.level],
      modules: ['learn', 'study_workspace'],
      dateChecked: vs.dateChecked,
    });
  }

  return Array.from(byUrl.values());
}

export function getStudyResourcesFor(query: ExternalResourceQuery): CuratedStudyResource[] {
  const { conceptId, canonicalSystem, topicId, domainId, academicLevel, module, limit = 6 } = query;
  const pool = getAllKnownExternalResources();
  const scored: { resource: CuratedStudyResource; score: number }[] = [];

  for (const res of pool) {
    let score = 0;
    if (conceptId && res.conceptIds.includes(conceptId)) score += 10;
    if (topicId && res.topicIds?.includes(topicId)) score += 8;
    if (domainId && res.domainIds?.includes(domainId)) score += 5;
    if (canonicalSystem && res.canonicalSystems.includes(canonicalSystem)) score += 4;
    if (module && res.modules.includes(module)) score += 2;
    if (academicLevel && res.academicLevels?.includes(academicLevel)) score += 1;

    if (score > 0) {
      scored.push({ resource: res, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.resource.title.localeCompare(b.resource.title));
  return scored.slice(0, limit).map((s) => s.resource);
}

export function validateStudyResources(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();

  for (const res of STUDY_RESOURCES) {
    if (!res.id.trim()) errors.push('Study resource missing id');
    if (seenIds.has(res.id)) errors.push(`Duplicate study resource id: ${res.id}`);
    seenIds.add(res.id);

    const normalizedUrl = res.url.trim().toLowerCase();
    if (!/^https:\/\//i.test(res.url)) {
      errors.push(`Study resource ${res.id}: URL must start with https://`);
    }
    if (seenUrls.has(normalizedUrl)) {
      errors.push(`Duplicate study resource URL: ${res.url}`);
    }
    seenUrls.add(normalizedUrl);

    if (!res.publisher.trim()) errors.push(`Study resource ${res.id}: missing publisher`);
    if (!res.licenseNote.trim()) errors.push(`Study resource ${res.id}: missing licenseNote`);
    for (const cid of res.conceptIds) {
      if (!/^FMA\d+(_BP3D_BASE|_UMB)?$/.test(cid)) {
        errors.push(`Study resource ${res.id}: invalid FMA conceptId ${cid}`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
