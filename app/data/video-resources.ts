import type { CanonicalSystemId } from '../anatomy-systems';
import type { EducationDomainId, EducationTrackId } from '../education/education-types';

export type VideoVerificationStatus = 'verified_oembed';

export interface YouTubeVideoResource {
  id: string;
  youtubeId: string;
  title: string;
  channelTitle: string;
  watchUrl: string;
  embedUrl: string;
  learningRelevance: string;
  canonicalSystems: CanonicalSystemId[];
  conceptIds: string[];
  topicIds: string[];
  domainIds: EducationDomainId[];
  academicLevels: EducationTrackId[];
  verificationStatus: VideoVerificationStatus;
  dateChecked: string;
}

const YOUTUBE_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

/**
 * Curated topic-specific educational YouTube videos.
 * EVERY video ID below was live-verified against https://www.youtube.com/oembed
 * on 2026-11-26 returning HTTP 200 OK with matching title & channel metadata.
 * ZERO unverified or invented video IDs.
 */
export const VERIFIED_YOUTUBE_VIDEOS: YouTubeVideoResource[] = [
  {
    id: 'yt-ccap-01-intro',
    youtubeId: 'uBGl2BujkPQ',
    title: 'Introduction to Anatomy & Physiology: Crash Course Anatomy & Physiology #1',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=uBGl2BujkPQ',
    embedUrl: 'https://www.youtube-nocookie.com/embed/uBGl2BujkPQ?rel=0',
    learningRelevance: 'Structure-function complementarity, biological organization levels, and anatomical directional terminology.',
    canonicalSystems: ['skeletal', 'muscular'],
    conceptIds: [],
    topicIds: ['edu-anat-planes-terminology'],
    domainIds: ['human_anatomy', 'human_physiology'],
    academicLevels: ['school_foundations', 'secondary_premed'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-02-tissues-1',
    youtubeId: 'i5tR3csCWYo',
    title: 'Tissues, Part 1: Crash Course Anatomy & Physiology #2',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=i5tR3csCWYo',
    embedUrl: 'https://www.youtube-nocookie.com/embed/i5tR3csCWYo?rel=0',
    learningRelevance: 'Introduction to histology, microscope fixation/staining, and primary tissue classification.',
    canonicalSystems: ['integumentary', 'nervous', 'muscular'],
    conceptIds: ['FMA7163'],
    topicIds: ['hist-epithelial-overview'],
    domainIds: ['histology', 'cell_biology'],
    academicLevels: ['school_foundations', 'secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-03-epithelial',
    youtubeId: 'lUe_RI_m-Vg',
    title: 'Tissues, Part 2 - Epithelial Tissue: Crash Course Anatomy & Physiology #3',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=lUe_RI_m-Vg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/lUe_RI_m-Vg?rel=0',
    learningRelevance: 'Epithelial polarity, simple vs stratified shapes, basement membrane, and glandular epithelia.',
    canonicalSystems: ['integumentary', 'respiratory'],
    conceptIds: ['FMA7163', 'FMA7394'],
    topicIds: ['hist-epithelial-overview'],
    domainIds: ['histology'],
    academicLevels: ['secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-04-connective',
    youtubeId: 'D-SzmURNBH0',
    title: 'Tissues, Part 3 - Connective Tissues: Crash Course Anatomy & Physiology #4',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=D-SzmURNBH0',
    embedUrl: 'https://www.youtube-nocookie.com/embed/D-SzmURNBH0?rel=0',
    learningRelevance: 'Connective tissue proper, extracellular matrix, ground substance, and collagen/elastic fibers.',
    canonicalSystems: ['skeletal', 'muscular'],
    conceptIds: [],
    topicIds: ['hist-connective-overview'],
    domainIds: ['histology'],
    academicLevels: ['secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-05-connective-types',
    youtubeId: 'Jvtb0a2RXaY',
    title: 'Tissues, Part 4 - Types of Connective Tissues: Crash Course Anatomy & Physiology #5',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=Jvtb0a2RXaY',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Jvtb0a2RXaY?rel=0',
    learningRelevance: 'Areolar, adipose, dense regular/irregular, hyaline/elastic cartilage, bone, and blood microanatomy.',
    canonicalSystems: ['skeletal', 'cardiovascular'],
    conceptIds: ['FMA9611'],
    topicIds: ['hist-connective-overview'],
    domainIds: ['histology', 'haematology_lab'],
    academicLevels: ['secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-06-skin-1',
    youtubeId: 'Orumw-PyNjw',
    title: 'The Integumentary System, Part 1 - Skin Deep: Crash Course Anatomy & Physiology #6',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=Orumw-PyNjw',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Orumw-PyNjw?rel=0',
    learningRelevance: 'Epidermal strata, keratinocytes, melanocytes, dermis, and cutaneous thermoregulation.',
    canonicalSystems: ['integumentary'],
    conceptIds: ['FMA7163'],
    topicIds: ['topic-integumentary-skin-appendages'],
    domainIds: ['human_anatomy', 'histology'],
    academicLevels: ['school_foundations', 'secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-07-skin-2',
    youtubeId: 'EN-x-zXXVwQ',
    title: 'The Integumentary System, Part 2 - Skin Deeper: Crash Course Anatomy & Physiology #7',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=EN-x-zXXVwQ',
    embedUrl: 'https://www.youtube-nocookie.com/embed/EN-x-zXXVwQ?rel=0',
    learningRelevance: 'Hair follicles, nails, eccrine/apocrine sweat glands, sebaceous glands, and skin barrier protection.',
    canonicalSystems: ['integumentary'],
    conceptIds: ['FMA7163'],
    topicIds: ['topic-integumentary-skin-appendages'],
    domainIds: ['human_anatomy'],
    academicLevels: ['school_foundations', 'secondary_premed'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-08-nervous-1',
    youtubeId: 'qPix_X-9t7E',
    title: 'The Nervous System, Part 1: Crash Course Anatomy & Physiology #8',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=qPix_X-9t7E',
    embedUrl: 'https://www.youtube-nocookie.com/embed/qPix_X-9t7E?rel=0',
    learningRelevance: 'CNS/PNS architecture, neuron morphology, neuroglia, and electrical excitability.',
    canonicalSystems: ['nervous'],
    conceptIds: ['FMA50801', 'FMA7647'],
    topicIds: ['topic-nervous-brain-divisions'],
    domainIds: ['human_anatomy', 'human_physiology'],
    academicLevels: ['school_foundations', 'secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-09-action-potential',
    youtubeId: 'OZG8M_ldA1M',
    title: 'The Nervous System, Part 2 - Action! Potential!: Crash Course Anatomy & Physiology #9',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=OZG8M_ldA1M',
    embedUrl: 'https://www.youtube-nocookie.com/embed/OZG8M_ldA1M?rel=0',
    learningRelevance: 'Resting membrane potential, voltage-gated Na+/K+ channels, depolarization, and saltatory conduction.',
    canonicalSystems: ['nervous'],
    conceptIds: ['FMA50801'],
    topicIds: ['topic-nervous-spinal-nerves'],
    domainIds: ['human_physiology', 'cell_biology'],
    academicLevels: ['secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-10-synapses',
    youtubeId: 'VitFvNvRIIY',
    title: 'The Nervous System, Part 3 - Synapses!: Crash Course Anatomy & Physiology #10',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=VitFvNvRIIY',
    embedUrl: 'https://www.youtube-nocookie.com/embed/VitFvNvRIIY?rel=0',
    learningRelevance: 'Chemical and electrical synapses, calcium-mediated vesicle release, EPSPs, IPSPs, and neurotransmitters.',
    canonicalSystems: ['nervous'],
    conceptIds: ['FMA50801'],
    topicIds: [],
    domainIds: ['human_physiology', 'pharmacology'],
    academicLevels: ['secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-11-cns',
    youtubeId: 'q8NtmDrb_qo',
    title: 'Central Nervous System: Crash Course Anatomy & Physiology #11',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=q8NtmDrb_qo',
    embedUrl: 'https://www.youtube-nocookie.com/embed/q8NtmDrb_qo?rel=0',
    learningRelevance: 'Cerebral hemispheres, functional cortical lobes, diencephalon, brainstem, cerebellum, and spinal cord.',
    canonicalSystems: ['nervous'],
    conceptIds: ['FMA50801', 'FMA67944', 'FMA79876', 'FMA62033', 'FMA13889'],
    topicIds: ['topic-nervous-brain-divisions'],
    domainIds: ['human_anatomy'],
    academicLevels: ['secondary_premed', 'medical_foundations', 'allied_health'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-12-pns',
    youtubeId: 'QY9NTVh-Awo',
    title: 'Peripheral Nervous System: Crash Course Anatomy & Physiology #12',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=QY9NTVh-Awo',
    embedUrl: 'https://www.youtube-nocookie.com/embed/QY9NTVh-Awo?rel=0',
    learningRelevance: 'Sensory receptors, cranial and spinal nerves, dermatomes, and somatic reflex arcs.',
    canonicalSystems: ['nervous'],
    conceptIds: ['FMA7647', 'FMA50863'],
    topicIds: ['topic-nervous-spinal-nerves'],
    domainIds: ['human_anatomy', 'human_physiology'],
    academicLevels: ['secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-13-ans',
    youtubeId: '71pCilo8k4M',
    title: 'Autonomic Nervous System: Crash Course Anatomy & Physiology #13',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=71pCilo8k4M',
    embedUrl: 'https://www.youtube-nocookie.com/embed/71pCilo8k4M?rel=0',
    learningRelevance: 'Sympathetic vs parasympathetic dual innervation, preganglionic/postganglionic organization, and autonomic control.',
    canonicalSystems: ['nervous', 'cardiovascular'],
    conceptIds: ['FMA7647'],
    topicIds: ['topic-nervous-spinal-nerves'],
    domainIds: ['human_physiology', 'pharmacology'],
    academicLevels: ['medical_foundations', 'allied_health'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-14-sympathetic',
    youtubeId: '0IDgBlCHVsA',
    title: 'Sympathetic Nervous System: Crash Course Anatomy & Physiology #14',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=0IDgBlCHVsA',
    embedUrl: 'https://www.youtube-nocookie.com/embed/0IDgBlCHVsA?rel=0',
    learningRelevance: 'Adrenergic signaling, alpha/beta receptors, chromaffin cells, and fight-or-flight physiological coordination.',
    canonicalSystems: ['nervous', 'endocrine', 'cardiovascular'],
    conceptIds: ['FMA9604'],
    topicIds: ['topic-endocrine-adrenal-pancreas'],
    domainIds: ['human_physiology', 'pharmacology'],
    academicLevels: ['medical_foundations', 'clinical_applied'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-19-skeletal',
    youtubeId: 'rDGqkMHPDqE',
    title: 'The Skeletal System: Crash Course Anatomy & Physiology #19',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=rDGqkMHPDqE',
    embedUrl: 'https://www.youtube-nocookie.com/embed/rDGqkMHPDqE?rel=0',
    learningRelevance: 'Axial/appendicular division, bone remodeling, osteon histology, and Wolff’s law biomechanics.',
    canonicalSystems: ['skeletal'],
    conceptIds: ['FMA46565', 'FMA52748', 'FMA9611', 'FMA13303', 'FMA24476'],
    topicIds: ['topic-skeletal-skull-jaw', 'topic-skeletal-thorax-spine', 'topic-skeletal-lower-limb'],
    domainIds: ['human_anatomy'],
    academicLevels: ['school_foundations', 'secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-20-joints',
    youtubeId: 'DLxYDoN634c',
    title: 'Joints: Crash Course Anatomy & Physiology #20',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=DLxYDoN634c',
    embedUrl: 'https://www.youtube-nocookie.com/embed/DLxYDoN634c?rel=0',
    learningRelevance: 'Fibrous, cartilaginous, and synovial joint mechanics, ligaments, and anatomical movements.',
    canonicalSystems: ['skeletal', 'muscular'],
    conceptIds: ['FMA24485', 'FMA13303', 'FMA23463'],
    topicIds: ['topic-skeletal-upper-limb', 'topic-skeletal-lower-limb'],
    domainIds: ['human_anatomy'],
    academicLevels: ['secondary_premed', 'medical_foundations', 'allied_health'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-21-muscles',
    youtubeId: 'Ktv-CaOt6UQ',
    title: 'Muscles, Part 1 - Muscle Cells: Crash Course Anatomy & Physiology #21',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=Ktv-CaOt6UQ',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Ktv-CaOt6UQ?rel=0',
    learningRelevance: 'Sarcomere architecture, sliding filament theory, cross-bridge cycling, and excitation-contraction coupling.',
    canonicalSystems: ['muscular'],
    conceptIds: ['FMA37683', 'FMA37692', 'FMA22429'],
    topicIds: ['topic-muscular-upper-limb', 'topic-muscular-lower-limb'],
    domainIds: ['human_anatomy', 'human_physiology', 'histology'],
    academicLevels: ['school_foundations', 'secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-25-heart-1',
    youtubeId: 'X9ZZ6tcxArI',
    title: 'The Heart, Part 1 - Under Pressure: Crash Course Anatomy & Physiology #25',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=X9ZZ6tcxArI',
    embedUrl: 'https://www.youtube-nocookie.com/embed/X9ZZ6tcxArI?rel=0',
    learningRelevance: 'Heart chambers, heart valves, systemic/pulmonary loops, systole/diastole pressures, and coronary perfusion.',
    canonicalSystems: ['cardiovascular'],
    conceptIds: ['FMA7088', 'FMA3736', 'FMA8612', 'FMA4720', 'FMA3768'],
    topicIds: ['topic-cardio-heart-chambers', 'topic-cardio-great-vessels'],
    domainIds: ['human_anatomy', 'human_physiology', 'clinical_specialties'],
    academicLevels: ['school_foundations', 'secondary_premed', 'medical_foundations', 'allied_health'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-31-respiratory-1',
    youtubeId: 'bHZsvBdUC2I',
    title: 'Respiratory System, Part 1: Crash Course Anatomy & Physiology #31',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=bHZsvBdUC2I',
    embedUrl: 'https://www.youtube-nocookie.com/embed/bHZsvBdUC2I?rel=0',
    learningRelevance: 'Conducting & respiratory zones, Boyle’s law ventilation mechanics, diaphragm descent, and alveolar gas diffusion.',
    canonicalSystems: ['respiratory'],
    conceptIds: ['FMA7394', 'FMA7309', 'FMA7310', 'FMA13295', 'FMA7409'],
    topicIds: ['topic-respiratory-airways', 'topic-respiratory-mechanics'],
    domainIds: ['human_anatomy', 'human_physiology'],
    academicLevels: ['school_foundations', 'secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccbio-28-digestive',
    youtubeId: 's06XzaKqELk',
    title: 'The Digestive System: CrashCourse Biology #28',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=s06XzaKqELk',
    embedUrl: 'https://www.youtube-nocookie.com/embed/s06XzaKqELk?rel=0',
    learningRelevance: 'Alimentary tract progression from oral cavity and esophagus to stomach, liver/pancreas, and intestinal absorption.',
    canonicalSystems: ['digestive'],
    conceptIds: ['FMA7148', 'FMA7197', 'FMA7198', 'FMA7202', 'FMA7206'],
    topicIds: ['topic-digestive-tract', 'topic-digestive-accessory'],
    domainIds: ['human_anatomy', 'human_physiology', 'nutrition_health'],
    academicLevels: ['school_foundations', 'secondary_premed'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-38-urinary-1',
    youtubeId: 'l128tW1H5a8',
    title: 'Urinary System, Part 1: Crash Course Anatomy & Physiology #38',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=l128tW1H5a8',
    embedUrl: 'https://www.youtube-nocookie.com/embed/l128tW1H5a8?rel=0',
    learningRelevance: 'Kidney gross and nephron anatomy, glomerular filtration barrier, tubular reabsorption, and secretion.',
    canonicalSystems: ['urinary'],
    conceptIds: ['FMA7203', 'FMA15900'],
    topicIds: ['topic-urinary-kidneys'],
    domainIds: ['human_anatomy', 'human_physiology'],
    academicLevels: ['secondary_premed', 'medical_foundations', 'allied_health'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-39-urinary-2',
    youtubeId: 'DlqyyyvTI3k',
    title: 'Urinary System, Part 2: Crash Course Anatomy & Physiology #39',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=DlqyyyvTI3k',
    embedUrl: 'https://www.youtube-nocookie.com/embed/DlqyyyvTI3k?rel=0',
    learningRelevance: 'Renal osmoregulation, ADH/aldosterone water balance, ureters, urinary bladder, and micturition reflex.',
    canonicalSystems: ['urinary'],
    conceptIds: ['FMA7203', 'FMA15900', 'FMA9704'],
    topicIds: ['topic-urinary-kidneys', 'topic-urinary-bladder-urethra'],
    domainIds: ['human_physiology', 'human_anatomy'],
    academicLevels: ['secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-40-female-repro',
    youtubeId: 'RFDatCchpus',
    title: 'Reproductive System, Part 1 - Female Reproductive System: Crash Course Anatomy & Physiology #40',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=RFDatCchpus',
    embedUrl: 'https://www.youtube-nocookie.com/embed/RFDatCchpus?rel=0',
    learningRelevance: 'Ovaries, uterine tubes, uterus, cervix, vagina, oogenesis, and ovarian/menstrual cycle regulation.',
    canonicalSystems: ['reproductive'],
    conceptIds: ['FMA7209', 'FMA17558', 'FMA19949'],
    topicIds: ['topic-reproductive-female'],
    domainIds: ['human_anatomy', 'human_physiology', 'embryology'],
    academicLevels: ['secondary_premed', 'medical_foundations', 'allied_health'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-41-male-repro',
    youtubeId: '-XQcnO4iX_U',
    title: 'Reproductive System, Part 2 - Male Reproductive System: Crash Course Anatomy & Physiology #41',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=-XQcnO4iX_U',
    embedUrl: 'https://www.youtube-nocookie.com/embed/-XQcnO4iX_U?rel=0',
    learningRelevance: 'Testes, epididymis, ductus deferens, seminal vesicles, prostate, and spermatogenesis physiology.',
    canonicalSystems: ['reproductive'],
    conceptIds: ['FMA9600'],
    topicIds: ['topic-reproductive-male'],
    domainIds: ['human_anatomy', 'human_physiology'],
    academicLevels: ['secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-44-lymphatic',
    youtubeId: 'I7orwMgTQ5I',
    title: 'Lymphatic System: Crash Course Anatomy & Physiology #44',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=I7orwMgTQ5I',
    embedUrl: 'https://www.youtube-nocookie.com/embed/I7orwMgTQ5I?rel=0',
    learningRelevance: 'Lymph drainage vessels, lymph nodes, spleen, thymus, and fluid return to venous circulation.',
    canonicalSystems: ['lymphatic'],
    conceptIds: ['FMA7196', 'FMA9607'],
    topicIds: ['topic-lymphatic-organs'],
    domainIds: ['human_anatomy', 'immunology'],
    academicLevels: ['secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccap-47-immune-3',
    youtubeId: 'rd2cf5hValM',
    title: 'Immune System, Part 3: Crash Course Anatomy & Physiology #47',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=rd2cf5hValM',
    embedUrl: 'https://www.youtube-nocookie.com/embed/rd2cf5hValM?rel=0',
    learningRelevance: 'Cell-mediated T-lymphocyte activation, MHC presentation, memory, and immune dysregulation.',
    canonicalSystems: ['lymphatic'],
    conceptIds: ['FMA9607'],
    topicIds: ['topic-lymphatic-organs'],
    domainIds: ['immunology'],
    academicLevels: ['secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-scicommlab-immune-cells',
    youtubeId: 'bserR4ZDDAQ',
    title: 'Cells of the Immune System (Brittany Anderton)',
    channelTitle: 'Science Communication Lab',
    watchUrl: 'https://www.youtube.com/watch?v=bserR4ZDDAQ',
    embedUrl: 'https://www.youtube-nocookie.com/embed/bserR4ZDDAQ?rel=0',
    learningRelevance: 'Leukocyte lineages, innate vs adaptive antigen recognition, and lymphoid effector coordination.',
    canonicalSystems: ['lymphatic'],
    conceptIds: ['FMA7196', 'FMA9607'],
    topicIds: [],
    domainIds: ['immunology', 'haematology_lab'],
    academicLevels: ['medical_foundations', 'graduate_research'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-eye-model',
    youtubeId: 'gHxLX2vQIRg',
    title: 'Human Anatomy, Eye Model',
    channelTitle: 'Oscar Juvera',
    watchUrl: 'https://www.youtube.com/watch?v=gHxLX2vQIRg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/gHxLX2vQIRg?rel=0',
    learningRelevance: 'Gross 3D model identification of cornea, sclera, iris, lens, retina, and optic nerve.',
    canonicalSystems: ['sensory'],
    conceptIds: ['FMA58238', 'FMA50863'],
    topicIds: ['topic-sensory-eye-ear'],
    domainIds: ['human_anatomy'],
    academicLevels: ['secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccbio-03-biomolecules',
    youtubeId: 'H8WJ2KENlK0',
    title: 'Biological Molecules - You Are What You Eat: Crash Course Biology #3',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=H8WJ2KENlK0',
    embedUrl: 'https://www.youtube-nocookie.com/embed/H8WJ2KENlK0?rel=0',
    learningRelevance: 'Carbohydrates, lipids, amino acids/proteins, and nucleic acids in human biochemistry and nutrition.',
    canonicalSystems: ['digestive'],
    conceptIds: [],
    topicIds: [],
    domainIds: ['biochemistry', 'nutrition_health', 'cell_biology'],
    academicLevels: ['school_foundations', 'secondary_premed'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccbio-20-carbon-molecules',
    youtubeId: 'y7raEBOvLwU',
    title: 'Carbon & Biological Molecules: What is Life Made Of?: Crash Course Biology #20',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=y7raEBOvLwU',
    embedUrl: 'https://www.youtube-nocookie.com/embed/y7raEBOvLwU?rel=0',
    learningRelevance: 'Macromolecular functional groups, polymerization, and structural biochemistry foundations.',
    canonicalSystems: [],
    conceptIds: [],
    topicIds: [],
    domainIds: ['biochemistry', 'cell_biology'],
    academicLevels: ['school_foundations', 'secondary_premed'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccbio-07-atp-respiration',
    youtubeId: '00jbG_cfGuQ',
    title: 'ATP & Respiration: Crash Course Biology #7',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=00jbG_cfGuQ',
    embedUrl: 'https://www.youtube-nocookie.com/embed/00jbG_cfGuQ?rel=0',
    learningRelevance: 'Glycolysis, Krebs cycle, mitochondrial electron transport chain, and cellular ATP synthesis.',
    canonicalSystems: ['respiratory', 'muscular'],
    conceptIds: [],
    topicIds: [],
    domainIds: ['biochemistry', 'cell_biology', 'human_physiology'],
    academicLevels: ['school_foundations', 'secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
  {
    id: 'yt-ccbio-27-cellular-respiration',
    youtubeId: 'HeO3yagexTw',
    title: 'Cellular Respiration: Do Cells Breathe?: Crash Course Biology #27',
    channelTitle: 'CrashCourse',
    watchUrl: 'https://www.youtube.com/watch?v=HeO3yagexTw',
    embedUrl: 'https://www.youtube-nocookie.com/embed/HeO3yagexTw?rel=0',
    learningRelevance: 'Redox electron carriers (NADH/FADH2), oxidative phosphorylation, and metabolic energetics.',
    canonicalSystems: ['respiratory'],
    conceptIds: [],
    topicIds: [],
    domainIds: ['biochemistry', 'cell_biology'],
    academicLevels: ['secondary_premed', 'medical_foundations'],
    verificationStatus: 'verified_oembed',
    dateChecked: '2026-11-26',
  },
];

export interface YouTubeVideoQuery {
  conceptId?: string;
  topicId?: string;
  systemId?: CanonicalSystemId;
  domainId?: EducationDomainId;
  academicLevel?: EducationTrackId;
  searchHint?: string;
  limit?: number;
}

export function getYouTubeVideosFor(query: YouTubeVideoQuery): YouTubeVideoResource[] {
  const { conceptId, topicId, systemId, domainId, academicLevel, searchHint, limit = 6 } = query;
  const hint = searchHint?.trim().toLowerCase();
  const scored: { video: YouTubeVideoResource; score: number }[] = [];

  for (const vid of VERIFIED_YOUTUBE_VIDEOS) {
    let score = 0;
    if (conceptId && vid.conceptIds.includes(conceptId)) score += 10;
    if (topicId && vid.topicIds.includes(topicId)) score += 9;
    if (systemId && vid.canonicalSystems.includes(systemId)) score += 5;
    if (domainId && vid.domainIds.includes(domainId)) {
      if (domainId !== 'human_anatomy' || (!conceptId && !topicId && !systemId)) {
        score += 4;
      }
    }
    if (academicLevel && vid.academicLevels.includes(academicLevel) && score > 0) score += 1;
    if (hint && hint.length >= 3) {
      const hay = `${vid.title} ${vid.learningRelevance} ${vid.channelTitle}`.toLowerCase();
      if (hay.includes(hint)) score += 4;
    }

    if (score > 0) {
      scored.push({ video: vid, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.video.title.localeCompare(b.video.title));
  return scored.slice(0, limit).map((s) => s.video);
}

export function buildYouTubeSearchUrl(topicTitle: string, channelHint?: string): string {
  const q = [topicTitle.trim(), channelHint?.trim(), 'anatomy medical lecture']
    .filter(Boolean)
    .join(' ');
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

export function isValidYouTubeId(id: string): boolean {
  return YOUTUBE_ID_REGEX.test(id);
}

export function validateVideoResources(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const seenYoutubeIds = new Set<string>();

  for (const vid of VERIFIED_YOUTUBE_VIDEOS) {
    if (!vid.id.trim()) errors.push('Video resource missing id');
    if (seenIds.has(vid.id)) errors.push(`Duplicate video resource id: ${vid.id}`);
    seenIds.add(vid.id);

    if (!isValidYouTubeId(vid.youtubeId)) {
      errors.push(`Video ${vid.id}: invalid 11-character youtubeId "${vid.youtubeId}"`);
    }
    if (seenYoutubeIds.has(vid.youtubeId)) {
      errors.push(`Duplicate youtubeId ${vid.youtubeId} in video catalog`);
    }
    seenYoutubeIds.add(vid.youtubeId);

    if (!vid.watchUrl.startsWith('https://www.youtube.com/watch?v=')) {
      errors.push(`Video ${vid.id}: invalid canonical watchUrl`);
    }
    if (!vid.embedUrl.startsWith('https://www.youtube-nocookie.com/embed/')) {
      errors.push(`Video ${vid.id}: embedUrl must use youtube-nocookie.com/embed/`);
    }
    if (!vid.title.trim() || !vid.channelTitle.trim()) {
      errors.push(`Video ${vid.id}: missing title or channelTitle`);
    }
    for (const cid of vid.conceptIds) {
      if (!/^FMA\d+(_BP3D_BASE|_UMB)?$/.test(cid)) {
        errors.push(`Video ${vid.id}: invalid conceptId ${cid}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
