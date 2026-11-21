import type {
  CurriculumFrameworkSpec,
  EducationTrackSpec,
} from './education-types';

export const EDUCATION_TRACKS: EducationTrackSpec[] = [
  {
    id: 'school_foundations',
    label: 'School Foundations (Grades 6–8)',
    shortLabel: 'School (6–8)',
    stageSummary: 'Middle school & early secondary human biology foundations',
    description:
      'Plain-language explanations of cells, body organs, major organ systems, nutrition, hygiene, microbes, and healthy living aligned with middle-school science frameworks.',
    recommendedDomains: [
      'cell_biology',
      'human_anatomy',
      'human_physiology',
      'nutrition_health',
      'microbiology_parasitology',
      'immunology',
    ],
    typicalCurricula: ['pk_ncp_gs_4_8', 'en_nc_science', 'cn_moe_bio_2022'],
  },
  {
    id: 'secondary_premed',
    label: 'Secondary / Pre-Medical (Matric · FSc · MDCAT · CBSE · A-Level)',
    shortLabel: 'Pre-Med / High School',
    stageSummary: 'Grades IX–XII, FSc Pre-Medical, MDCAT, CBSE XI–XII, WA Human Biology & AP Biology',
    description:
      'Curriculum-aligned organ-system anatomy, cell ultrastructure, human physiology, biomolecules, genetics, immunity, reproduction, and exam-oriented concept checks.',
    recommendedDomains: [
      'cell_biology',
      'human_anatomy',
      'human_physiology',
      'biochemistry',
      'molecular_genetics',
      'histology',
      'embryology',
      'immunology',
      'microbiology_parasitology',
      'nutrition_health',
    ],
    typicalCurricula: [
      'pk_ncp_bio_9_12',
      'in_cbse_bio_11_12',
      'en_nc_science',
      'us_ap_bio',
      'au_wa_human_bio',
    ],
  },
  {
    id: 'medical_foundations',
    label: 'Medical Foundations (Pre-Clinical MBBS / MD)',
    shortLabel: 'Medical Foundations',
    stageSummary: 'Early MBBS / MD Years 1–3 basic medical sciences',
    description:
      'Integrated gross anatomy, histology, embryology, organ physiology, medical biochemistry, molecular genetics, microbiology, immunology, general pathology, and pharmacology.',
    recommendedDomains: [
      'human_anatomy',
      'histology',
      'embryology',
      'human_physiology',
      'biochemistry',
      'molecular_genetics',
      'microbiology_parasitology',
      'immunology',
      'pathology',
      'pharmacology',
      'haematology_lab',
    ],
    typicalCurricula: ['pk_pmdc_mbbs', 'pk_uhs_mbbs', 'hms_pathways', 'ox_preclinical'],
  },
  {
    id: 'clinical_applied',
    label: 'Clinical / Applied Medicine (Clerkship & System-Based)',
    shortLabel: 'Clinical / Applied',
    stageSummary: 'Later MBBS / MD system-based clinical reasoning and specialty introductions',
    description:
      'Systemic pathology, clinical pharmacology principles, laboratory medicine interpretation concepts, radiological orientation, specialty introductions, clinical reasoning, ethics, and epidemiology.',
    recommendedDomains: [
      'pathology',
      'pharmacology',
      'haematology_lab',
      'radiology_imaging',
      'clinical_specialties',
      'clinical_skills_public_health',
      'human_anatomy',
      'human_physiology',
    ],
    typicalCurricula: ['pk_pmdc_mbbs', 'pk_uhs_mbbs', 'hms_pathways'],
  },
  {
    id: 'allied_health',
    label: 'Allied Health & Nursing Foundations',
    shortLabel: 'Allied Health',
    stageSummary: 'Nursing, DPT, pharmacy, and biomedical allied-health curricula',
    description:
      'Applied human anatomy, vital-sign physiology, infection control, nutrition, pharmacology safety principles, basic laboratory indices, and patient-safety foundations.',
    recommendedDomains: [
      'human_anatomy',
      'human_physiology',
      'nutrition_health',
      'microbiology_parasitology',
      'pharmacology',
      'haematology_lab',
      'clinical_skills_public_health',
    ],
    typicalCurricula: ['pk_pmdc_mbbs', 'au_wa_human_bio'],
  },
  {
    id: 'graduate_research',
    label: 'Graduate & Doctoral Research (BS Hons · MPhil · PhD)',
    shortLabel: 'MPhil / PhD Research',
    stageSummary: 'BS Hons, MPhil, and PhD mechanistic biomedicine, biomechanics & quantitative modeling',
    description:
      'Mechanistic cell signaling, trabecular/vascular biomechanics, quantitative hemodynamic/acid-base modeling, structural ontologies (FMA/TA2), and experimental study design aligned with higher-education bioscience benchmarks.',
    recommendedDomains: [
      'human_anatomy',
      'cell_biology',
      'histology',
      'embryology',
      'human_physiology',
      'biochemistry',
      'molecular_genetics',
      'microbiology_parasitology',
      'immunology',
      'pathology',
      'pharmacology',
      'haematology_lab',
      'radiology_imaging',
      'clinical_skills_public_health',
    ],
    typicalCurricula: ['qaa_biosciences', 'anat_soc_core', 'ox_preclinical'],
  },
];

export const CURRICULUM_FRAMEWORKS: CurriculumFrameworkSpec[] = [
  {
    id: 'pk_ncp_gs_4_8',
    title: 'National Curriculum of Pakistan — General Science (Grades 4–8)',
    authority: 'National Curriculum Council (NCC), Ministry of Federal Education & Professional Training',
    country: 'Pakistan',
    geographicScope: 'Federal / ICT baseline; provincial textbook board adoption varies by province',
    url: 'https://www.ncc.gov.pk/Detail/MjM3NGE4Y2ItNjIyNC00ZTY5LTg0OTQtOWZhZWMzODRlYTQ2',
    academicYearOrVersion: 'NCP 2022–2023 notified framework (Grades 4–8)',
    dateAccessed: '2026-11-19',
    applicableGradesOrYears: 'Grades 4–8 (focus Grades 6–8 for human body systems)',
    requirementType: 'compulsory',
    adoptionNote:
      'Implemented in Federal/ICT schools; provincial adoption across Punjab, Sindh, KP, and Balochistan boards is board-dependent.',
    supports: 'School Foundations: cells, human organ systems, nutrition, microbes, immunity basics, and health.',
    tracks: ['school_foundations'],
  },
  {
    id: 'pk_ncp_bio_9_12',
    title: 'National Curriculum of Pakistan — Biology (Grades IX–XII)',
    authority: 'National Curriculum Council (NCC), Pakistan',
    country: 'Pakistan',
    geographicScope: 'Federal / FBISE baseline; provincial BISE adoption is board-dependent / unverified uniformly',
    url: 'https://www.ncc.gov.pk/SiteImage/Misc/files/Biology.pdf',
    academicYearOrVersion: 'NCP 2023/2026 rationalized SLO framework (Grades IX–XII)',
    dateAccessed: '2026-11-19',
    applicableGradesOrYears: 'Grades IX–X (Matric) & Grades XI–XII (FSc Pre-Medical / HSSC)',
    requirementType: 'elective_stream',
    adoptionNote:
      'Not universally implemented across every Pakistani school; federal/ICT boards adopt earlier while provincial boards transition on separate schedules (board-dependent).',
    supports:
      'Cell biology, biomolecules, enzymes, bioenergetics, human digestion/circulation/respiration/excretion/coordination/support/reproduction, genetics, immunity, and biotechnology.',
    tracks: ['secondary_premed'],
  },
  {
    id: 'pk_pmdc_mbbs',
    title: 'PM&DC Guidelines for Undergraduate Medical Education (MBBS)',
    authority: 'Pakistan Medical and Dental Council (PM&DC)',
    country: 'Pakistan',
    geographicScope: 'National regulatory baseline for accredited Pakistani MBBS programmes',
    url: 'https://www.pmdc.pk/Documents/Others/PM%26DC%20GUIDELINES%20FOR%20UG%20M.EDUCATION-06242024035407.pdf',
    academicYearOrVersion: '2024 Guidelines (minimum 6,200 contact hours over 5-year MBBS)',
    dateAccessed: '2026-11-19',
    applicableGradesOrYears: 'MBBS Years 1–5 (Pre-clinical, Paraclinical, and Clinical)',
    requirementType: 'professional_guideline',
    adoptionNote:
      'Pakistan-specific national medical regulatory guideline (minimum 6,200 total contact hours: ~2,950h pre-clinical/paraclinical, 1,700h Medicine & Allied, 1,625h Surgery & Allied, plus longitudinal/elective balance). Individual subject minimums (e.g., Anatomy 500–600h, Physiology 450–600h, Biochemistry 250–300h, Pathology 500h, Pharmacology 300h, Community Medicine ~170h, Forensic Medicine 100h) are Pakistan-specific references, not global percentages.',
    supports: 'Medical Foundations, Clinical / Applied Medicine, ethics, research, and community health.',
    tracks: ['medical_foundations', 'clinical_applied', 'allied_health'],
  },
  {
    id: 'pk_uhs_mbbs',
    title: 'UHS Lahore — MBBS Modular Integrated Curriculum (2K23)',
    authority: 'University of Health Sciences (UHS), Lahore',
    country: 'Pakistan',
    geographicScope: 'UHS-affiliated medical colleges in Punjab, Pakistan (institution/university-specific)',
    url: 'https://www.uhs.edu.pk/downloads/2k23mbbscurriculumv20.pdf',
    academicYearOrVersion: 'Modular Curriculum 2K23 v2.0',
    dateAccessed: '2026-11-19',
    applicableGradesOrYears: 'MBBS Years 1–5 (System-based integrated modules)',
    requirementType: 'institutional_example',
    adoptionNote:
      'Representative Pakistani modular MBBS curriculum integrating Anatomy, Physiology, Biochemistry, Pathology, Pharmacology, and clinical skills by organ system.',
    supports: 'Horizontal and vertical integration of basic sciences with clinical case reasoning and OSCE/OSPE concepts.',
    tracks: ['medical_foundations', 'clinical_applied'],
  },
  {
    id: 'in_cbse_bio_11_12',
    title: 'CBSE Senior Secondary Biology Curriculum (Classes XI–XII)',
    authority: 'Central Board of Secondary Education (CBSE), India',
    country: 'India',
    geographicScope: 'CBSE-affiliated schools in India and abroad (not all Indian state boards)',
    url: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Biology_SecP2_2026-27.pdf',
    academicYearOrVersion: 'Academic Year 2026–27',
    dateAccessed: '2026-11-19',
    applicableGradesOrYears: 'Classes XI–XII (Senior Secondary)',
    requirementType: 'elective_stream',
    adoptionNote:
      'Covers Class XI (Cell Structure & Function, Human Physiology) and Class XII (Human Reproduction, Genetics, Human Health & Disease, Biotechnology).',
    supports: 'Secondary / Pre-Medical human physiology, cell biology, genetics, immunology, and health.',
    tracks: ['secondary_premed'],
  },
  {
    id: 'en_nc_science',
    title: 'National Curriculum in England — Science Programmes of Study',
    authority: 'Department for Education (DfE), England',
    country: 'England (UK)',
    geographicScope: 'England only (Scotland, Wales, and Northern Ireland maintain separate curricula)',
    url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study',
    academicYearOrVersion: 'Statutory Key Stages 3 & 4 programmes of study',
    dateAccessed: '2026-11-19',
    applicableGradesOrYears: 'Key Stage 3 (Ages 11–14) & Key Stage 4 (Ages 14–16)',
    requirementType: 'compulsory',
    adoptionNote:
      'Applies specifically to maintained schools in England; does not represent all four UK nations.',
    supports: 'Cells, organisation, bioenergetics, homeostasis, infection & response, inheritance, and human health.',
    tracks: ['school_foundations', 'secondary_premed'],
  },
  {
    id: 'us_ap_bio',
    title: 'AP Biology Course Framework',
    authority: 'College Board',
    country: 'United States',
    geographicScope: 'Advanced elective course across US & international schools (not a universal US high-school syllabus)',
    url: 'https://apcentral.collegeboard.org/courses/ap-biology',
    academicYearOrVersion: 'Current 8-Unit AP Biology Framework',
    dateAccessed: '2026-11-19',
    applicableGradesOrYears: 'High School (Grades 11–12, college-level introductory equivalent)',
    requirementType: 'advanced_optional',
    adoptionNote:
      'An optional advanced course equivalent to two semesters of introductory college biology; not a mandatory national US high-school standard.',
    supports: 'Chemistry of life, cell structure/energetics/signalling, heredity, gene expression, and regulation.',
    tracks: ['secondary_premed'],
  },
  {
    id: 'cn_moe_bio_2022',
    title: 'Compulsory Education Biology Curriculum Standards (2022)',
    authority: 'Ministry of Education (MOE), People’s Republic of China',
    country: 'China',
    geographicScope: 'National compulsory education standard (Grades 7–9)',
    url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582359998122.pdf',
    academicYearOrVersion: '2022 Edition (issued April 2022)',
    dateAccessed: '2026-11-19',
    applicableGradesOrYears: 'Compulsory Junior Secondary (Grades 7–9)',
    requirementType: 'compulsory',
    adoptionNote:
      'Focuses on scientific literacy, cell structure, human physiology basics, genetics, and health/disease prevention at compulsory school level.',
    supports: 'School Foundations human biology, cells, heredity basics, and infectious disease prevention.',
    tracks: ['school_foundations'],
  },
  {
    id: 'au_wa_human_bio',
    title: 'Western Australia Senior Secondary — Human Biology (ATAR)',
    authority: 'School Curriculum and Standards Authority (SCSA), Western Australia',
    country: 'Australia',
    geographicScope: 'Western Australia state syllabus (does not automatically represent other Australian states/territories)',
    url: 'https://senior-secondary.scsa.wa.edu.au/syllabus-and-support-materials/science/human-biology',
    academicYearOrVersion: 'ATAR Units 1–4',
    dateAccessed: '2026-11-19',
    applicableGradesOrYears: 'Years 11–12',
    requirementType: 'elective_stream',
    adoptionNote:
      'State-specific dedicated Human Biology course covering cells, human organ systems, reproduction/inheritance (Year 11) and homeostasis, nervous/endocrine control, and immunity (Year 12).',
    supports: 'Secondary / Pre-Medical and Allied Health human-specific anatomy, physiology, homeostasis, and immunity.',
    tracks: ['secondary_premed', 'allied_health'],
  },
  {
    id: 'hms_pathways',
    title: 'Harvard Medical School — Pathways MD Curriculum',
    authority: 'Harvard Medical School',
    country: 'United States',
    geographicScope: 'Institution-specific MD programme example (not a universal global standard)',
    url: 'https://hms.harvard.edu/education-admissions/md-program/curriculum/pathways',
    academicYearOrVersion: 'Pathways Curriculum (Pre-Clerkship → PCE → Post-PCE)',
    dateAccessed: '2026-11-19',
    applicableGradesOrYears: 'MD Years 1–4',
    requirementType: 'institutional_example',
    adoptionNote:
      'Representative integrated US MD curriculum: Foundations, Homeostasis, Immunity in Defense & Disease, Mind/Brain/Behavior, Practice of Medicine, and early Principal Clinical Experience.',
    supports: 'Integrated basic-to-clinical medical science blocks and early clinical reasoning.',
    tracks: ['medical_foundations', 'clinical_applied'],
  },
  {
    id: 'ox_preclinical',
    title: 'University of Oxford — Pre-Clinical Medical Course Structure (A100)',
    authority: 'Medical Sciences Division, University of Oxford',
    country: 'United Kingdom (England)',
    geographicScope: 'Institution-specific UK medical course example (not a universal global standard)',
    url: 'https://www.medsci.ox.ac.uk/study/medicine/pre-clinical/structure/pre-clinical-course-structure-description',
    academicYearOrVersion: 'A100 Pre-Clinical Years 1–3 (BA Medical Sciences)',
    dateAccessed: '2026-11-19',
    applicableGradesOrYears: 'Pre-Clinical Medical Years 1–3',
    requirementType: 'institutional_example',
    adoptionNote:
      'Representative traditional split pre-clinical/clinical medical degree covering Organization of the Body, Physiology & Pharmacology, Biochemistry & Medical Genetics, Applied Physiology, Principles of Pathology, and Medical Sociology.',
    supports: 'Deep basic medical science foundations prior to clinical hospital training.',
    tracks: ['medical_foundations'],
  },
  {
    id: 'qaa_biosciences',
    title: 'UK Quality Assurance Agency (QAA) — Subject Benchmark Statement: Biosciences',
    authority: 'Quality Assurance Agency for Higher Education (QAA)',
    country: 'United Kingdom',
    geographicScope: 'Higher-education quality reference for BSc (Hons), Master’s/MPhil, and doctoral bioscience attributes',
    url: 'https://www.qaa.ac.uk/the-quality-code/subject-benchmark-statements/biosciences',
    academicYearOrVersion: '2023 Subject Benchmark Statement (BSc Hons · Master’s / MPhil / Research)',
    dateAccessed: '2026-11-21',
    applicableGradesOrYears: 'BS (Hons) Years 1–4, MPhil & PhD Bioscience Research Foundations',
    requirementType: 'professional_guideline',
    adoptionNote:
      'Establishes graduate and postgraduate threshold expectations in experimental design, quantitative biological modeling, critical evaluation of primary literature, and molecular/systems mechanisms.',
    supports: 'BS Honours, MPhil, and PhD research-level depth across cell biology, physiology, biochemistry, genetics, immunology, and quantitative biosciences.',
    tracks: ['graduate_research', 'medical_foundations'],
  },
  {
    id: 'anat_soc_core',
    title: 'Anatomical Society Core Regional & Systemic Anatomy Syllabi',
    authority: 'The Anatomical Society (UK & Ireland)',
    country: 'United Kingdom & Ireland',
    geographicScope: 'Published academic core syllabi for medical, allied-health, and anatomical-science undergraduates/postgraduates',
    url: 'https://www.anatsoc.org.uk',
    academicYearOrVersion: 'Published Core Syllabi Reference (Medicine, Allied Health & Science)',
    dateAccessed: '2026-11-21',
    applicableGradesOrYears: 'BS Anatomical Sciences, Pre-Clinical Medicine & Graduate Anatomy Demonstrators',
    requirementType: 'professional_guideline',
    adoptionNote:
      'Defines learning outcomes for regional human anatomy, embryology, and structural relationships used by anatomy faculty and postgraduate teaching fellows.',
    supports: 'Structured anatomical nomenclature (FMA/TA2), embryological derivatives, neuroanatomy, and imaging orientation.',
    tracks: ['graduate_research', 'medical_foundations', 'allied_health'],
  },
];

/**
 * Official PM&DC 2024 Undergraduate Medical Education (MBBS) minimum total
 * contact hours benchmark (Pakistan-specific regulatory reference).
 * Source: https://www.pmdc.pk/Documents/Others/PM%26DC%20GUIDELINES%20FOR%20UG%20M.EDUCATION-06242024035407.pdf
 */
export const PMDC_OFFICIAL_MIN_TOTAL_HOURS = 6200;

export const PMDC_HOUR_AGGREGATION_NOTE =
  'PM&DC 2024 Guidelines specify a minimum total of 6,200 contact hours across the 5-year MBBS (approximately 2,950h pre-clinical/paraclinical, 1,700h Medicine & Allied, and 1,625h Surgery & Allied, with remaining longitudinal/elective/self-directed hours allocated by institutions). Individual subject minimums listed below are published minimum thresholds/ranges and are NOT forced to sum mechanically to 6,200.';

/**
 * Pakistan-specific PM&DC MBBS minimum subject-hour reference entries.
 * Strictly Pakistan-specific — NOT a universal global percentage model.
 */
export const PMDC_PAKISTAN_MBBS_HOUR_REFERENCE: {
  subject: string;
  minHours: number;
  rangeNote: string;
  phase: 'Pre-Clinical' | 'Paraclinical' | 'Clinical';
  mappedDomainIds: string[];
}[] = [
  { subject: 'Anatomy (Gross, Histology, Embryology)', minHours: 500, rangeNote: '500–600 h minimum range', phase: 'Pre-Clinical', mappedDomainIds: ['human_anatomy', 'histology', 'embryology'] },
  { subject: 'Physiology', minHours: 450, rangeNote: '450–600 h minimum range', phase: 'Pre-Clinical', mappedDomainIds: ['human_physiology'] },
  { subject: 'Biochemistry', minHours: 250, rangeNote: '250–300 h minimum range', phase: 'Pre-Clinical', mappedDomainIds: ['biochemistry', 'molecular_genetics'] },
  { subject: 'Pathology (General, Special, Haematology, Microbiology & Parasitology)', minHours: 500, rangeNote: '500 h minimum', phase: 'Paraclinical', mappedDomainIds: ['pathology', 'microbiology_parasitology', 'immunology', 'haematology_lab'] },
  { subject: 'Pharmacology & Therapeutics', minHours: 300, rangeNote: '300 h minimum', phase: 'Paraclinical', mappedDomainIds: ['pharmacology'] },
  { subject: 'Community Medicine & Public Health', minHours: 170, rangeNote: '~170 h reference', phase: 'Paraclinical', mappedDomainIds: ['clinical_skills_public_health', 'nutrition_health'] },
  { subject: 'Forensic Medicine & Toxicology', minHours: 100, rangeNote: '100 h minimum', phase: 'Paraclinical', mappedDomainIds: ['clinical_skills_public_health', 'pharmacology'] },
  { subject: 'Medicine & Allied Specialties', minHours: 1700, rangeNote: '1,700 h clinical allocation', phase: 'Clinical', mappedDomainIds: ['clinical_specialties', 'radiology_imaging'] },
  { subject: 'Surgery & Allied Specialties', minHours: 1625, rangeNote: '1,625 h clinical allocation', phase: 'Clinical', mappedDomainIds: ['clinical_specialties', 'human_anatomy'] },
];
