import type { CanonicalSystemId } from './anatomy-systems';
import { QUIZ_QUESTIONS, type QuizQuestion } from './quiz-data';
import type { AppRoute } from './components/SiteHeader';

export type AcademicDepthTier = 'school_9_12' | 'bs_mbbs' | 'phd_research';

export interface TopicDepthSupplement {
  school_9_12: string;
  bs_mbbs: string;
  phd_research: string;
  quantitativeOrExperimentalNote: string;
}

export interface SystemTeachingGuide {
  systemId: CanonicalSystemId;
  bloomObjectives: Record<AcademicDepthTier, string[]>;
  commonMisconceptions: string[];
  labSpotterFocus: string[];
  graduateSeminarPrompt: string;
  connectedLabs: { label: string; route: AppRoute; note: string }[];
}

export const ACADEMIC_DEPTH_LABELS: Record<
  AcademicDepthTier,
  { short: string; full: string; badge: string }
> = {
  school_9_12: {
    short: 'Grades 9–12',
    full: 'Grades 9–12 (Matric · FSc · O/A-Level · AP · CBSE)',
    badge: 'Board Foundations',
  },
  bs_mbbs: {
    short: 'BS / MBBS',
    full: 'Undergraduate (BS Biosciences · MBBS · Allied Health · Nursing)',
    badge: 'Clinical & Applied',
  },
  phd_research: {
    short: 'MPhil / PhD',
    full: 'Graduate & Doctoral Research (Biomechanics · Ontology · Histology · Modeling)',
    badge: 'Research & Quantitative',
  },
};

/**
 * Multi-tier pedagogical depth supplements across all 28 topics in ANATOMY_LESSONS.
 * Preserves existing LessonTopic structure while empowering 9th-12th, BS/MBBS,
 * and MPhil/PhD depth switching inside SystemLearnWorkspace.
 */
export const TOPIC_DEPTH_SUPPLEMENTS: Record<string, TopicDepthSupplement> = {
  'topic-skeletal-skull-jaw': {
    school_9_12:
      'Think of the skull as two parts: a fused protective helmet (cranium) around your brain, and facial bones including one hinged jawbone (mandible) so you can talk and chew.',
    bs_mbbs:
      'Distinguish neurocranium (calvaria + skull base cranial fossae housing cranial nerve foramina) from viscerocranium. The mandible articulates bilaterally at the synovial temporomandibular joint (TMJ) divided by a fibrocartilaginous articular disc.',
    phd_research:
      'Craniofacial sutures act as viscoelastic compliance zones dissipating masticatory and impact strain; finite-element analysis demonstrates stress trajectories channeling along supraorbital, zygomatic, and nasomaxillary buttresses while patent sutures transmit mechanobiological cues for intramembranous remodeling.',
    quantitativeOrExperimentalNote:
      'Biomechanics focus: occlusal bite force transmission across TMJ condylar fibrocartilage (~200–700 N molar peak ranges) and sutural strain attenuation.',
  },
  'topic-skeletal-thorax-spine': {
    school_9_12:
      'Your backbone stacks 24 movable vertebrae (7 neck, 12 chest, 5 lower back) above the sacrum, while 12 pairs of ribs curve around the heart and lungs like a protective springy cage.',
    bs_mbbs:
      'Differentiate cervical (transverse foramina), thoracic (costal facets), and lumbar vertebrae alongside bucket-handle and pump-handle rib kinematics driven by costovertebral and sternocostal joints.',
    phd_research:
      'Thoracic cage compliance balances visceral protection with minimal ventilatory work of breathing; intervertebral nucleus pulposus proteoglycan aggrecan generates osmotic swelling pressure (~0.1–0.3 MPa resting intradiscal load) balanced by anisotropic collagen-I annulus fibrosus lamellae.',
    quantitativeOrExperimentalNote:
      'Structural mechanics: intervertebral load-sharing shift (~80% vertebral body anterior vs. ~20% facet joints, shifting with extension).',
  },
  'topic-skeletal-upper-limb': {
    school_9_12:
      'Your collarbone (clavicle) props the shoulder outward so your arm can swing freely. In the forearm, the radius sits on the thumb side and turns over the ulna when you turn a doorknob.',
    bs_mbbs:
      'The pectoral girdle anchors to the axial skeleton solely at the sternoclavicular joint, prioritizing scapulothoracic mobility. Radioulnar pronation/supination pivots the radial head inside the annular ligament around a stationary distal ulna.',
    phd_research:
      'Upper-limb kinematic redundancy couples sternoclavicular, acromioclavicular, glenohumeral, and scapulothoracic degrees of freedom (scapulohumeral rhythm ~2:1 elevation ratio), modeled using helical axes and multibody musculoskeletal optimization.',
    quantitativeOrExperimentalNote:
      'Kinematic ratio: ~120° glenohumeral abduction + ~60° scapulothoracic upward rotation yields full 180° overhead elevation.',
  },
  'topic-skeletal-lower-limb': {
    school_9_12:
      'Unlike the loose shoulder, your hip pelvis forms a locked weight-bearing ring. Below the femur and kneecap (patella), the thick shinbone (tibia) carries your body weight down to the ankle.',
    bs_mbbs:
      'Pelvic sacroiliac and pubic symphysis stability transfers axial trunk mass into the acetabulum. Patella serves as an anatomical pulley boosting quadriceps moment arm; tibia carries virtually all compressive axial load to the talocrural mortise.',
    phd_research:
      'Wolff’s law trabecular anisotropy in the proximal femur aligns orthogonal compressive and tensile arcades along principal stress vectors; cortical osteon remodeling rate responds to cyclic microstrain thresholds (~1,000–3,000 με mechanostat window).',
    quantitativeOrExperimentalNote:
      'Gait mechanics: peak hip joint reaction forces reach ~2.5–4× body weight during single-leg stance phase due to abductor moment equilibrium.',
  },
  'topic-muscular-neck-diaphragm': {
    school_9_12:
      'Neck muscles turn and hold up your head, while underneath your lungs sits the muscular dome called the diaphragm—when it pulls flat downward, air rushes into your chest.',
    bs_mbbs:
      'Sternocleidomastoid bisects the neck into anterior and posterior cervical triangles overlying the carotid sheath. Embryologically, cervical myotomes (C3–C5) migrate caudally with their phrenic motor fibers to form the diaphragm.',
    phd_research:
      'Diaphragmatic zone-of-apposition piston mechanics couple appositional ribcage elevation with abdominal fulcrum resistance; fatigue resistance reflects mixed Type I/IIa oxidative myosin heavy-chain isoforms and dense capillary networks.',
    quantitativeOrExperimentalNote:
      'Diaphragmatic descent: ~1.5 cm in quiet tidal breathing up to ~6–10 cm during maximal voluntary inspiratory effort.',
  },
  'topic-muscular-upper-limb': {
    school_9_12:
      'Muscles only pull, so they work in opposing teams: biceps brachii on the front bends your elbow, and triceps brachii on the back straightens it.',
    bs_mbbs:
      'Musculocutaneous nerve supplies anterior arm flexors (coracobrachialis, biceps brachii, brachialis), whereas radial nerve innervates posterior extensors (triceps). Biceps brachii reaches maximal supination efficacy with the elbow flexed ~90°.',
    phd_research:
      'Force–length and Hill force–velocity relationships govern upper-limb torque profiles: sarcomere actin–myosin plateau overlap combines with moment arm geometry r(θ) = dL/dθ along the bicipital tuberosity insertion.',
    quantitativeOrExperimentalNote:
      'Lever geometry: third-class forearm lever (~5 cm insertion vs. ~32 cm distal hand load) trades force disadvantage for high angular velocity.',
  },
  'topic-muscular-lower-limb': {
    school_9_12:
      'Walking upright depends on strong hip muscles (gluteus group), front thigh muscles (quadriceps) straightening your knee, and calf muscles pushing your heel off the ground.',
    bs_mbbs:
      'Clinical correlation: superior gluteal nerve injury weakens gluteus medius, causing contralateral pelvic drop (positive Trendelenburg sign) during single-leg stance. Gastrocnemius crosses both knee and ankle (biarticular), whereas soleus is a single-joint postural plantarflexor.',
    phd_research:
      'Human bipedal efficiency exploits elastic strain energy storage and recoil inside the Achilles tendon aponeurosis during stance-to-push-off transitions alongside pennation-angle gearing in triceps surae.',
    quantitativeOrExperimentalNote:
      'Fiber architecture: soleus contains ~70–85% fatigue-resistant slow-oxidative Type I fibers optimized for sustained antigravity posture.',
  },
  'topic-nervous-brain-divisions': {
    school_9_12:
      'The large folded cerebrum handles thinking and senses, the cerebellum at the back keeps balance smooth, and the brainstem connects to the spinal cord to run breathing and heartbeat.',
    bs_mbbs:
      'Differentiate telencephalon (cerebral cortex, basal ganglia), diencephalon (thalamus, hypothalamus), cerebellum (deep nuclei and vermis/hemispheres), and brainstem nuclei/tracts (corticospinal decussation at the medullary pyramids).',
    phd_research:
      'Multimodal brain parcellation integrates cytoarchitectonics, structural diffusion tractography, resting-state functional connectivity, and spatial transcriptomics (e.g., Allen Human Brain Atlas) to map cortical laminar microcircuits.',
    quantitativeOrExperimentalNote:
      'Metabolic constraint: ~2% of adult body mass (~1.3–1.4 kg) consuming ~20% of resting oxygen and glucose via neurovascular coupling.',
  },
  'topic-nervous-spinal-cranial': {
    school_9_12:
      'The spinal cord runs inside the spine bones like a highway carrying messages and instant reflexes, while cranial nerves connect your eyes and face straight to the brain.',
    bs_mbbs:
      'Because vertebral growth outpaces neural tube elongation, adult spinal cord ends as conus medullaris (L1–L2), creating the lumbar cistern for safe CSF sampling below L3. CN II carries oligodendrocyte-myelinated CNS fibers encased in subarachnoid CSF.',
    phd_research:
      'Central axonal regeneration fails primarily due to CNS myelin inhibitors (Nogo-A, MAG, OMgp) and chondroitin-sulfate proteoglycan glial scarring, contrasting starkly with Schwann-cell Wallerian clearance and basal lamina scaffolding in peripheral nerves.',
    quantitativeOrExperimentalNote:
      'Conduction velocity scales linearly with myelinated fiber diameter (Hursh factor ~6 m/s per μm) in saltatory Ranvier-node propagation.',
  },
  'topic-cardio-heart-chambers': {
    school_9_12:
      'The heart is a four-room double pump: the right side pushes oxygen-poor blood gently to nearby lungs, while the thick left ventricle pushes oxygen-rich blood around the entire body.',
    bs_mbbs:
      'Trace Wiggers cycle landmarks across isometric contraction (mitral/tricuspid closure = S1), rapid/reduced ejection, isovolumetric relaxation (aortic/pulmonic closure = S2), and ventricular filling coupled to atrial systole.',
    phd_research:
      'Laplace’s wall-stress law (σ = Pr / 2h) explains concentric hypertrophy adaptation to pressure overload vs. eccentric dilation in volume overload alongside helical myocardial band torsion dynamics.',
    quantitativeOrExperimentalNote:
      'Hemodynamic pressures: LV ~120/8 mmHg systemic vs. RV ~25/4 mmHg low-resistance pulmonary circuit (~5× pressure ratio).',
  },
  'topic-cardio-pulmonary-coronary': {
    school_9_12:
      'Lungs refresh blood with oxygen, while tiny coronary arteries branching straight off the aorta feed the hardworking heart muscle itself.',
    bs_mbbs:
      'Right- vs. left-dominant coronary circulation defines origin of the posterior descending artery. Because systole compresses intramural subendocardial vessels, left ventricular myocardium perfuses mainly during diastole.',
    phd_research:
      'Coronary flow reserve depends on metabolic adenosine/NO-mediated arteriolar autoregulation matched to myocardial oxygen demand (MVO2); subendocardial layers exhibit heightened vulnerability when diastolic perfusion pressure falls or LV end-diastolic pressure rises.',
    quantitativeOrExperimentalNote:
      'Myocardial O2 extraction is near maximal at rest (~70–75% arterial-venous ΔO2), forcing exercise demand to be met almost solely by coronary vasodilation.',
  },
  'topic-cardio-great-vessels': {
    school_9_12:
      'The great aorta carries fresh blood outward from the heart, while the superior and inferior venae cavae return used blood back into the right atrium.',
    bs_mbbs:
      'Distinguish systemic arterial/venous trees from the specialized hepatic portal venous system (SMV + splenic vein → liver sinusoids → hepatic veins → IVC), crucial for nutrient processing and first-pass drug clearance.',
    phd_research:
      'Two- and three-element Windkessel models formalize elastic aortic arch buffering of pulsatile stroke volume into steady distal microvascular flow; elastin fragmentation elevates pulse-wave velocity and systolic load.',
    quantitativeOrExperimentalNote:
      'Flow partition: hepatic portal vein supplies ~75% of hepatic blood volume (~50% O2), complemented by ~25% hepatic artery inflow.',
  },
  'topic-respiratory-airways': {
    school_9_12:
      'Air travels down your cartilage-ringed windpipe (trachea) into two branching bronchial trees inside your right and left lungs.',
    bs_mbbs:
      'C-shaped tracheal rings allow posterior trachealis flexibility against the esophagus. Right main bronchus is wider, shorter, and more vertical (~25°), predisposing it to aspirated foreign objects and right-lower-lobe collapse.',
    phd_research:
      'Weibel’s dichotomous airway branching model (generations 0–23) shows airway resistance peaking in medium bronchi (generations 4–8) rather than terminal bronchioles due to massive parallel cross-sectional area expansion distally.',
    quantitativeOrExperimentalNote:
      'Total cross-sectional area surges from ~2.5 cm² at trachea to >10,000 cm² across respiratory bronchioles and alveolar ducts.',
  },
  'topic-respiratory-mechanics': {
    school_9_12:
      'By Boyle’s law, flattening the diaphragm enlarges chest volume, dropping air pressure inside the lungs so fresh air rushes in naturally.',
    bs_mbbs:
      'Understand transmural pressure gradients (intrapleural negative vacuum ~ −5 cmH2O at FRC), alveolar surfactant reduction of LaPlace surface tension (P = 2T/r), and alveolar dead space vs. minute ventilation.',
    phd_research:
      'Pulmonary V/Q matching across West zones (hydrostatic gravity vs. alveolar pressure P_A, P_a, P_v) interacts with hypoxic pulmonary vasoconstriction and Bohr-shifted haemoglobin O2 transport.',
    quantitativeOrExperimentalNote:
      'Ventilation partition: VE = 14 × 500 = 7.0 L/min vs. alveolar VA = 14 × (500 − 150) = 4.9 L/min.',
  },
  'topic-digestive-upper-gi': {
    school_9_12:
      'Food moves down the muscular esophagus into the acidic stomach, then enters the C-shaped duodenum where digestive juices break down proteins, carbs, and fats.',
    bs_mbbs:
      'Stomach parietal cells secrete HCl and intrinsic factor (for B12 absorption), chief cells secrete pepsinogen, and duodenal S/I cells release secretin (pancreatic HCO3−) and CCK (enzymes + gallbladder contraction).',
    phd_research:
      'Gastric mucosal barrier integrity relies on unstirred HCO3−–mucin gel pH gradients (~7.0 at apical membrane vs. ~2.0 lumen), tight junctions, and rapid restitution powered by prostaglandin-maintained submucosal blood flow.',
    quantitativeOrExperimentalNote:
      'Luminal pH transitions sharply from ~1.5–2.5 in gastric corpus to ~6.0–7.0 across the duodenal Brunner/pancreatic bicarbonate buffer zone.',
  },
  'topic-digestive-accessory-glands': {
    school_9_12:
      'The liver makes fat-emulsifying bile, the gallbladder stores it, and the pancreas pumps enzymes into the small intestine while balancing blood sugar.',
    bs_mbbs:
      'Portal triad architecture (hepatic artery branch, portal vein branch, bile ductule) drives Zone 1–3 metabolic zonation along hepatic sinusoids; endocrine pancreatic islets receive rich microvascular perfusion inside exocrine acini.',
    phd_research:
      'Enterohepatic bile acid recirculation (~95% active ASBT ileal uptake via FXR/FGF19 nuclear signaling) coordinates lipid micelle solubilization with hepatic cholesterol 7α-hydroxylase feedback repression.',
    quantitativeOrExperimentalNote:
      'Human bile salt pool (~2–4 g) recycles ~6–10 times daily across portal–biliary enterohepatic circuits.',
  },
  'topic-digestive-intestines': {
    school_9_12:
      'Long folds inside the small intestine absorb digested nutrients into blood, while the large intestine (colon) absorbs water back before waste reaches the rectum.',
    bs_mbbs:
      'Surface amplification cascades (~600× via plicae circulares, villi, and microvilli brush border). Distinguish arterial territories: celiac (foregut), SMA (midgut to proximal 2/3 transverse colon), and IMA (hindgut to rectum).',
    phd_research:
      'Apical secondary active Na+-coupled transport (SGLT1, PEPT1, amino acid cotransporters) creates osmotic paracellular/aquaporin water flux, while colonic butyrate fermentation fuels colonocytes via MCT1/SMCT1.',
    quantitativeOrExperimentalNote:
      'Fluid balance: ~9 L daily GI input + secretions; small intestine absorbs ~7.5 L and colon reabsorbs ~1.4 L, leaving ~100–150 mL fecal water.',
  },
  'topic-urinary-kidneys-vessels': {
    school_9_12:
      'Two bean-shaped kidneys behind your abdominal cavity clean waste from blood and adjust water balance, receiving huge blood flow through renal arteries.',
    bs_mbbs:
      'Trace renal vascular cascade: aorta → renal artery → segmental → interlobar → arcuate → cortical radiate → afferent arteriole → glomerulus → efferent arteriole → peritubular capillaries/vasa recta.',
    phd_research:
      'Tubuloglomerular feedback at the macula densa (NKCC2 Cl− sensing → adenosine/ATP afferent constriction) plus myogenic Bayliss autoregulation stabilize GFR (~125 mL/min) across 80–160 mmHg mean arterial pressure.',
    quantitativeOrExperimentalNote:
      'Renal blood flow (~1.1 L/min, ~22% cardiac output) yields ~180 L/day glomerular filtrate with >99% tubular reclamation.',
  },
  'topic-urinary-ureters-bladder': {
    school_9_12:
      'Muscular ureters squeeze urine down to the stretchable urinary bladder, which holds it safely until you relax muscles to empty through the urethra.',
    bs_mbbs:
      'Distinguish autonomic storage (sympathetic T11–L2 β3 detrusor relaxation + α1 internal sphincter tone) from voiding (parasympathetic S2–S4 M3 detrusor contraction + somatic pudendal external sphincter relaxation).',
    phd_research:
      'Urothelial umbrella-cell plaques (uroplakins) maintain the tightest transepithelial resistance barrier in mammals, accommodating volumetric expansion while releasing mechanosensory ATP to suburothelial afferents.',
    quantitativeOrExperimentalNote:
      'Cystometry: bladder accommodates ~300–450 mL at low intravesical pressure (<10–15 cmH2O) prior to micturition reflex threshold.',
  },
  'topic-repro-gonads-ducts': {
    school_9_12:
      'Testes outside the warm abdomen make sperm and testosterone, storing mature sperm in the coiled epididymis ready to travel up the vas deferens.',
    bs_mbbs:
      'Understand hypothalamic GnRH pulsatility driving LH (Leydig testosterone) and FSH (Sertoli androgen-binding protein & inhibin B). Trace spermatic cord path across the inguinal canal.',
    phd_research:
      'Claudin-11/occludin tight junctions of the blood–testis barrier remodel dynamically during preleptotene spermatocyte translocation while maintaining immune privilege for haploid germ-cell neoantigens.',
    quantitativeOrExperimentalNote:
      'Spermatogenic cycle duration in humans spans ~64–74 days from Type A spermatogonium to mature luminal spermatozoon.',
  },
  'topic-repro-accessory-external': {
    school_9_12:
      'Seminal vesicles and the prostate add nourishing alkaline fluid to sperm before the shared urethra exits through the external organ. (Female ovaries and uterus are described in notes.)',
    bs_mbbs:
      'Contrast homologous male/female pelvic anatomy honestly noting this atlas contains male meshes only: prostate surrounds prostatic urethra (common site of BPH transition-zone enlargement) while seminal vesicles provide fructose.',
    phd_research:
      'NO–cGMP–PDE5 smooth-muscle relaxation in helicine arterioles and trabecular corpora cavernosa drops intracavernosal resistance, passively compressing subtunical venules against the dense tunica albuginea (veno-occlusive mechanism).',
    quantitativeOrExperimentalNote:
      'Seminal composition fraction: seminal vesicles ~65%, prostate ~25–30%, bulbourethral & testicular fractions ~5–10%.',
  },
  'topic-endocrine-central': {
    school_9_12:
      'The tiny pituitary gland under your brain acts as the master controller of growth and other glands, while the pineal gland releases melatonin at night for sleep timing.',
    bs_mbbs:
      'Differentiate anterior adenohypophysis (hypothalamic portal capillary releasing-hormone control) from posterior neurohypophysis (direct magnocellular supraoptic/paraventricular axons releasing ADH & oxytocin).',
    phd_research:
      'Ultradian pulsatile hormone secretion governs receptor sensitivity vs. desensitization (e.g., intermittent GnRH upregulates gonadotropes while continuous agonist exposure induces receptor downregulation).',
    quantitativeOrExperimentalNote:
      'Critical spatial relation: <2–5 mm suprasellar upward displacement compresses decussating nasal hemiretinal optic chiasm fibers.',
  },
  'topic-endocrine-peripheral': {
    school_9_12:
      'Adrenal glands sitting atop each kidney release stress hormones like adrenaline and cortisol, while pancreatic islets keep blood sugar balanced with insulin and glucagon.',
    bs_mbbs:
      'Adrenal cortex zonation mnemonic (GFR — Zona Glomerulosa: aldosterone, Fasciculata: cortisol, Reticularis: androgens) surrounds neural-crest chromaffin medulla. Insulin promotes GLUT4 translocation in muscle/adipose.',
    phd_research:
      'Glucocorticoid (HPA) ultradian feedback exhibits dual nuclear receptor kinetics (high-affinity mineralocorticoid vs. lower-affinity glucocorticoid receptors driving circadian + stress gene transcription).',
    quantitativeOrExperimentalNote:
      'Pancreatic endocrine islets represent only ~1–2% of pancreatic mass yet receive ~10–15% of pancreatic arterial perfusion.',
  },
  'topic-lymphatic-thymus': {
    school_9_12:
      'Behind the breastbone sits the thymus—an immune training school where T white blood cells learn how to recognize germs without attacking your own body.',
    bs_mbbs:
      'Thymus reaches maximal relative weight in infancy and undergoes progressive post-pubertal fatty involution while maintaining residual T-cell repertoire export. T-cells undergo cortical positive selection and medullary negative selection.',
    phd_research:
      'AIRE-mediated promiscuous tissue-restricted antigen presentation by mTECs eliminates high-affinity autoreactive thymocytes or diverts borderline clones into thymic FOXP3+ regulatory T-cells.',
    quantitativeOrExperimentalNote:
      '>95% of developing cortical thymocytes undergo apoptosis during strict positive and negative repertoire selection.',
  },
  'topic-lymphatic-spleen': {
    school_9_12:
      'On your upper left side beneath ribs 9–11, the spleen filters circulating blood, recycles iron from old red blood cells, and fights blood infections.',
    bs_mbbs:
      'White pulp mounts adaptive responses against encapsulated bacteria (e.g., S. pneumoniae), explaining overwhelming post-splenectomy infection prophylaxis; splenic cords of Billroth clear rigid/aged erythrocytes.',
    phd_research:
      'Open vs. closed splenic microcirculation models examine how erythrocytes squeeze through ~1–3 μm interendothelial slits inside venous sinuses, culling stiffened spherocytes or parasitized RBCs biomechanically.',
    quantitativeOrExperimentalNote:
      'Splenic platelet pooling holds ~30% of total circulating body platelets at steady-state equilibrium.',
  },
  'topic-integumentary-skin-appendages': {
    school_9_12:
      'Skin is your largest protective organ: waterproof keratin guards out bacteria, sweat cools you down, and sunlight helps skin initiate Vitamin D production.',
    bs_mbbs:
      'Contrast epidermal layers (stratum basale stem proliferation upward to stratum corneum), dermal vascular plexuses regulating core-to-shell heat conductance, and cutaneous mechanoreceptor modalities (Meissner, Pacinian, Merkel, Ruffini).',
    phd_research:
      'Skin displays nonlinear viscoelastic J-shaped stress–strain behavior governed by dermal collagen uncrimping along Langer tension lines and elastin recoil, alongside transepidermal water loss (TEWL) lipid-lamellar barrier physics.',
    quantitativeOrExperimentalNote:
      'Epidermal turnover cycle from stratum basale basal division to desquamation takes ~28–45 days.',
  },
  'topic-sensory-anterior-optics': {
    school_9_12:
      'Light bends first at the clear cornea, enters the dark pupil resized by the colored iris, and focuses sharply through the flexible lens onto the back retina.',
    bs_mbbs:
      'Trace accommodation (CN III parasympathetic ciliary muscle contraction slackens zonular fibers → lens becomes more convex) and pupillary light reflex pathway (CN II → pretectal nucleus → bilateral Edinger–Westphal → CN III).',
    phd_research:
      'Corneal transparency satisfies Maurice’s destructive-interference lattice criteria (~25–35 nm collagen spacing maintained by proteoglycan GAG hydration and endothelial Na+/K+-ATPase corneal deturgescence).',
    quantitativeOrExperimentalNote:
      'Refractive partition: air–cornea interface ~+43 D fixed power; ciliary-driven lens ~+15–20 D dynamic range.',
  },
  'topic-sensory-tunics-lacrimal': {
    school_9_12:
      'Three eyeball wall layers work together: tough white sclera, dark nourishing choroid, and light-sensing retina. Above the outer corner, tear glands wash and protect the eye.',
    bs_mbbs:
      'Distinguish vascular supply: central retinal artery nourishes inner retina while choriocapillaris diffuses O2/nutrients across Bruch’s membrane to high-metabolism photoreceptors. Aqueous humor drains via trabecular meshwork → Schlemm canal.',
    phd_research:
      'Retinal phototransduction achieves single-photon sensitivity in rods via transducin-PDE6 cGMP hydrolysis closing CNG channels (hyperpolarization), with high foveal M/L-cone packing (~150,000–200,000 cones/mm²) bypassing inner retinal scatter.',
    quantitativeOrExperimentalNote:
      'Tear-film stability (~10–15 s breakup time) depends on outer Meibomian lipid monolayer curbing aqueous evaporation.',
  },
};

export const SYSTEM_TEACHING_METADATA: Record<CanonicalSystemId, SystemTeachingGuide> = {
  skeletal: {
    systemId: 'skeletal',
    bloomObjectives: {
      school_9_12: [
        'Classify axial vs. appendicular bones on the 3D skeleton.',
        'Count true, false, and floating rib pairs and vertebral regions.',
      ],
      bs_mbbs: [
        'Relate joint congruency (shoulder vs. hip) to stability–mobility trade-offs.',
        'Trace anatomical forearm pronation across radial–ulnar articulations.',
      ],
      phd_research: [
        'Critique finite-element trabecular adaptation under Wolff’s law and cyclic microstrain.',
      ],
    },
    commonMisconceptions: [
      'Confusing the clavicle (mobile strut) with ribs, or thinking the fibula carries heavy body weight (tibia carries axial load).',
      'Misidentifying medial/lateral forearm sides because of pronation instead of standard anatomical position.',
    ],
    labSpotterFocus: ['FMA46565 Skull', 'FMA52748 Mandible', 'FMA13321 Clavicle', 'FMA9611 Femur', 'FMA24485 Patella'],
    graduateSeminarPrompt: 'How do osteocytic lacunocanalicular fluid shear forces translate ambulatory loading into sclerostin downregulation and directional trabecular remodeling?',
    connectedLabs: [
      { label: 'Practical Spotter (Skeletal)', route: 'practical-lab', note: 'Locate bones directly in 3D' },
      { label: 'Elbow Lever Simulation', route: 'physiology', note: 'Quantify radial insertion moment arm' },
      { label: 'Bone Fracture Correlation', route: 'clinical', note: 'Upper-limb surgical & clinical links' },
    ],
  },
  muscular: {
    systemId: 'muscular',
    bloomObjectives: {
      school_9_12: [
        'Explain why skeletal muscles pull in antagonistic pairs across joints.',
        'Describe how diaphragm flattening lowers chest pressure during breathing.',
      ],
      bs_mbbs: [
        'Predict gait or motor deficits from phrenic (C3–C5), radial, or superior gluteal nerve injury.',
        'Distinguish origin, insertion, synergist, and fixator roles in limb motion.',
      ],
      phd_research: [
        'Model joint moment generation combining sarcomere length–tension plateaus with time-varying muscle moment arms.',
      ],
    },
    commonMisconceptions: [
      'Assuming muscles "push" bones back into extension rather than an antagonist muscle pulling the opposite way.',
      'Forgetting that biceps brachii is primarily a powerful forearm supinator as well as an elbow flexor.',
    ],
    labSpotterFocus: ['FMA13295 Diaphragm', 'FMA34676 Deltoid', 'FMA37682 Biceps brachii', 'FMA37692 Triceps brachii', 'FMA22429 Quadriceps femoris'],
    graduateSeminarPrompt: 'Contrast aponeurotic elastic energy recycling in the human triceps surae–Achilles complex vs. direct muscle work during running vs. walking.',
    connectedLabs: [
      { label: 'Antagonistic Elbow Simulator', route: 'physiology', note: 'Interactive 2D angle & torque curve' },
      { label: 'Histology: Skeletal & Cardiac Muscle', route: 'histology', note: 'Sarcomere striations & T-tubules' },
      { label: 'Structure Relationships (3D)', route: 'relationships', note: 'Origins, insertions & antagonists' },
    ],
  },
  nervous: {
    systemId: 'nervous',
    bloomObjectives: {
      school_9_12: [
        'Identify the roles of cerebrum, cerebellum, brainstem, and spinal cord.',
        'Trace a simple spinal reflex arc from sensory receptor to muscle.',
      ],
      bs_mbbs: [
        'Correlate brainstem nuclei (medulla/pons) with vital cardiorespiratory autonomic reflexes.',
        'Explain why adult lumbar puncture is performed safely below the L1–L2 conus medullaris.',
      ],
      phd_research: [
        'Evaluate transcriptional vs. cytoarchitectonic brain parcellation and CNS myelin regeneration inhibitors.',
      ],
    },
    commonMisconceptions: [
      'Thinking the spinal cord fills the entire length of the adult vertebral canal down to the sacrum (it ends at L1–L2).',
      'Classifying the optic nerve (CN II) structurally with peripheral Schwann-myelinated nerves.',
    ],
    labSpotterFocus: ['FMA50801 Brain', 'FMA67944 Cerebellum', 'FMA79876 Brainstem', 'FMA7647 Spinal cord', 'FMA50863 Optic nerve'],
    graduateSeminarPrompt: 'Compare inhibitory glial scarring mechanisms (Nogo-A / CSPGs) in CNS white matter tracts vs. Schwann-cell bands of Büngner after peripheral axotomy.',
    connectedLabs: [
      { label: 'CNS & Cortex Clinical Cases', route: 'clinical', note: 'Pituitary–optic chiasm compression walkthrough' },
      { label: 'Nervous Tissue Microanatomy', route: 'histology', note: 'Neuron soma, glia & myelin protocols' },
      { label: 'Allen Human Brain Atlas (External)', route: 'search', note: 'Explore mapped brain regions' },
    ],
  },
  cardiovascular: {
    systemId: 'cardiovascular',
    bloomObjectives: {
      school_9_12: [
        'Trace blood step-by-step through all four chambers and both pulmonary/systemic loops.',
        'Explain why left ventricular muscle is much thicker than right ventricular muscle.',
      ],
      bs_mbbs: [
        'Integrate valve opening/closing pressures across Wiggers systole/diastole with CO = HR × SV.',
        'Contrast coronary diastolic perfusion vs. hepatic portal dual circulation.',
      ],
      phd_research: [
        'Analyze two/three-element Windkessel arterial stiffening and Laplace ventricular wall stress remodeling.',
      ],
    },
    commonMisconceptions: [
      'Believing all arteries carry oxygenated blood and all veins carry deoxygenated blood (pulmonary vessels reverse this).',
      'Assuming heart muscle receives oxygen straight from chamber blood rather than via coronary arteries.',
    ],
    labSpotterFocus: ['FMA7088 Heart', 'FMA3768 Arch of aorta', 'FMA4720 Superior vena cava', 'FMA10951 Inferior vena cava', 'FMA3802 Coronary artery'],
    graduateSeminarPrompt: 'Using a Windkessel model, quantify how elastin fragmentation in the thoracic aorta alters myocardial afterload and coronary diastolic perfusion gradients.',
    connectedLabs: [
      { label: 'Cardiac Cycle & CO Simulation', route: 'physiology', note: 'Animate chambers & valve phases' },
      { label: 'Coronary Ischemia Clinical Studio', route: 'clinical', note: 'Guided 3D mechanism walkthrough' },
      { label: 'Cardiac Microanatomy Guide', route: 'histology', note: 'Intercalated discs & desmosomes' },
    ],
  },
  respiratory: {
    systemId: 'respiratory',
    bloomObjectives: {
      school_9_12: [
        'Describe trachea, bronchi, right/left lungs, and diaphragm mechanics via Boyle’s law.',
        'Explain why tracheal cartilage rings are C-shaped rather than full circles.',
      ],
      bs_mbbs: [
        'Calculate minute vs. alveolar ventilation subtracting 150 mL anatomical dead space.',
        'Link arterial PaCO2 and [HCO3−] via Henderson–Hasselbalch to Bohr O2–Hb affinity shifts.',
      ],
      phd_research: [
        'Evaluate Weibel generational resistance partitioning and alveolar–capillary Fick diffusion limits.',
      ],
    },
    commonMisconceptions: [
      'Confusing diaphragm relaxation (moving upward during expiration) with contraction (pulling downward during inspiration).',
      'Ignoring anatomical dead space during shallow rapid breathing.',
    ],
    labSpotterFocus: ['FMA7394 Trachea', 'FMA7309 Right lung', 'FMA7310 Left lung', 'FMA13295 Diaphragm'],
    graduateSeminarPrompt: 'Analyze why physiological airway resistance peaks around bronchial generations 4–8 rather than at the smallest terminal bronchioles.',
    connectedLabs: [
      { label: 'Pulmonary Ventilation Sim', route: 'physiology', note: 'Animate Boyle’s law diaphragm excursion' },
      { label: 'Respiratory Histology', route: 'histology', note: 'Pseudostratified ciliated epithelium & alveoli' },
      { label: 'Thorax Clinical Cases', route: 'clinical', note: 'Applied respiratory mechanics' },
    ],
  },
  digestive: {
    systemId: 'digestive',
    bloomObjectives: {
      school_9_12: [
        'Order the organs of the alimentary canal and distinguish accessory glands.',
        'Distinguish bile production (liver) from bile storage (gallbladder).',
      ],
      bs_mbbs: [
        'Map GI organs to foregut/midgut/hindgut vascular territories and portal venous drainage.',
        'Explain secretin/CCK hormonal coordination around the duodenal C-loop.',
      ],
      phd_research: [
        'Analyze apical SGLT1 secondary-active energetics and enterohepatic FXR/FGF19 bile-acid signaling.',
      ],
    },
    commonMisconceptions: [
      'Believing the gallbladder synthesizes bile rather than merely concentrating and storing hepatic bile.',
      'Assuming bile salts contain hydrolytic enzymes (they act as amphipathic detergents emulsifying lipids).',
    ],
    labSpotterFocus: ['FMA7131 Esophagus', 'FMA7148 Stomach', 'FMA7206 Duodenum', 'FMA7197 Liver', 'FMA7198 Pancreas', 'FMA7202 Gallbladder'],
    graduateSeminarPrompt: 'Evaluate how hepatic sinusoidal zonation (periportal Zone 1 oxidative metabolism vs. pericentral Zone 3 xenobiotic CYP450 activity) shapes toxin susceptibility.',
    connectedLabs: [
      { label: 'Hepatic Portal Clinical Case', route: 'clinical', note: 'Portal circulation 3D explainer' },
      { label: 'GI Mucosa & Liver Histology', route: 'histology', note: 'Villi, portal triads & hepatocytes' },
    ],
  },
  urinary: {
    systemId: 'urinary',
    bloomObjectives: {
      school_9_12: [
        'Locate retroperitoneal kidneys, ureters, bladder, and urethra.',
        'Explain why the right kidney sits slightly lower due to the liver.',
      ],
      bs_mbbs: [
        'Compute Net Filtration Pressure (NFP = PGC − PBS − πGC) and explain three ureteric narrowing sites.',
        'Differentiate sympathetic urine storage vs. parasympathetic micturition reflexes.',
      ],
      phd_research: [
        'Compare macula densa tubuloglomerular feedback oscillations with Bayliss myogenic autoregulation.',
      ],
    },
    commonMisconceptions: [
      'Thinking kidneys "push" water out by active cellular pumping rather than Starling hydrostatic filtration followed by tubular reabsorption.',
      'Confusing ureters (kidney → bladder) with the urethra (bladder → exterior).',
    ],
    labSpotterFocus: ['FMA7203 Kidney', 'FMA14751 Renal artery', 'FMA14334 Renal vein', 'FMA9704 Ureter', 'FMA15900 Urinary bladder'],
    graduateSeminarPrompt: 'Contrast the differential GFR impact of selective afferent vs. moderate efferent arteriolar constriction on filtration fraction and peritubular Starling uptake.',
    connectedLabs: [
      { label: 'Renal Filtration Simulator', route: 'physiology', note: 'Interactive Starling NFP & GFR model' },
      { label: 'Kidney Microanatomy Guide', route: 'histology', note: 'Glomerulus, PCT brush border & urothelium' },
    ],
  },
  reproductive: {
    systemId: 'reproductive',
    bloomObjectives: {
      school_9_12: [
        'Trace spermatozoa from testis and epididymis through vas deferens and urethra.',
        'Explain why scrotal position maintains lower temperature for spermatogenesis.',
      ],
      bs_mbbs: [
        'Compare fluid roles of seminal vesicles (fructose), prostate (enzymes/buffers), and testes.',
        'Recognize atlas scope: adult male geometry only; female ovaries/uterus taught conceptually.',
      ],
      phd_research: [
        'Analyze Sertoli tight-junction remodeling (claudin-11) preserving blood–testis immune privilege during meiosis.',
      ],
    },
    commonMisconceptions: [
      'Thinking the prostate produces most semen volume (seminal vesicles contribute ~60–70%).',
      'Overlooking that female pelvic organs are intentionally omitted from this BodyParts3D pack rather than missing by bug.',
    ],
    labSpotterFocus: ['FMA7210 Testis', 'FMA18255 Epididymis', 'FMA9600 Prostate', 'FMA19386 Seminal vesicle'],
    graduateSeminarPrompt: 'How do Sertoli ectoplasmic specializations and basal tight junctions coordinate clonal spermatocyte transit across the blood–testis barrier without triggering autoimmune orchitis?',
    connectedLabs: [
      { label: 'Reference Library (Reproductive)', route: 'systems', note: 'Inspect FMA male pelvic catalog & disclosures' },
      { label: 'All-12-System Quiz', route: 'quiz', note: 'Test reproductive anatomy across tiers' },
    ],
  },
  endocrine: {
    systemId: 'endocrine',
    bloomObjectives: {
      school_9_12: [
        'Contrast ductless hormone glands with ducted exocrine glands.',
        'Identify core hormones of pituitary, adrenal glands, pineal body, and pancreas.',
      ],
      bs_mbbs: [
        'Locate pituitary inside the sphenoid sella turcica inferior to the optic chiasm.',
        'Differentiate steroid adrenal cortex zones from catecholamine adrenal medulla.',
      ],
      phd_research: [
        'Analyze how pulsatile vs. tonic GPCR stimulation governs gonadotrope receptor desensitization and circadian transcription.',
      ],
    },
    commonMisconceptions: [
      'Expecting the thyroid gland to appear as a separate 3D mesh in this BodyParts3D pack (documented honestly as planned).',
      'Conflating posterior pituitary axonal storage (ADH/oxytocin made in hypothalamus) with anterior pituitary synthesis.',
    ],
    labSpotterFocus: ['FMA13889 Pituitary gland', 'FMA62033 Pineal body', 'FMA9604 Adrenal gland', 'FMA7198 Pancreas'],
    graduateSeminarPrompt: 'Why is this platform’s quantitative endocrine simulator intentionally marked specification-only until cited differential kinetic constants are bundled?',
    connectedLabs: [
      { label: 'Pituitary–Optic Chiasm Case', route: 'clinical', note: 'Guided 3D bitemporal hemianopsia mechanism' },
      { label: 'Endocrine Spec Status', route: 'physiology', note: 'Review ODE requirements transparency' },
    ],
  },
  lymphatic: {
    systemId: 'lymphatic',
    bloomObjectives: {
      school_9_12: [
        'Distinguish the T-cell thymus behind the breastbone from blood-filtering spleen.',
        'Explain how lymphatic return restores tissue fluid to the venous blood.',
      ],
      bs_mbbs: [
        'Contrast primary lymphoid tolerance (thymus) vs. secondary blood-borne clearance (spleen red/white pulp).',
        'Relate post-splenectomy status to encapsulated bacterial susceptibility.',
      ],
      phd_research: [
        'Evaluate AIRE-driven medullary thymic selection alongside biomechanical RBC culling across splenic interendothelial slits.',
      ],
    },
    commonMisconceptions: [
      'Thinking the spleen filters tissue lymph like a lymph node (the spleen filters circulating blood exclusively).',
      'Assuming the thymus disappears completely in adults rather than undergoing progressive fatty involution.',
    ],
    labSpotterFocus: ['FMA9607 Thymus', 'FMA7196 Spleen'],
    graduateSeminarPrompt: 'Discuss how AIRE-mediated stochastic self-antigen expression balances central T-cell deletion against peripheral regulatory T-cell diversity.',
    connectedLabs: [
      { label: 'Spleen & Thymus Reference', route: 'systems', note: 'Examine lymphoid FMA records' },
      { label: 'Human Protein Atlas (External)', route: 'histology', note: 'Open lymphoid tissue expression references' },
    ],
  },
  integumentary: {
    systemId: 'integumentary',
    bloomObjectives: {
      school_9_12: [
        'Explain the barrier, thermoregulation, sensory, and Vitamin D functions of skin.',
        'Identify keratinized appendages on the outer body reference shell.',
      ],
      bs_mbbs: [
        'Correlate cutaneous vasodilation/sweating and epidermal keratin renewal with homeostasis.',
        'Recognize that epidermis/dermis/glands are histological layers below gross mesh scale.',
      ],
      phd_research: [
        'Analyze dermal collagen Langer-line anisotropy and stratum corneum lipid-mortar TEWL barrier mechanics.',
      ],
    },
    commonMisconceptions: [
      'Treating the translucent skin shell as pure ornament rather than a topological boundary referencing superficial fascia and appendages.',
    ],
    labSpotterFocus: ['FMA7163 Skin', 'FMA54237 Hair', 'FMA59816 Lip'],
    graduateSeminarPrompt: 'Model how anisotropic reticular dermal collagen fibril alignment shapes directional wound tension and nonlinear hyperelastic skin stress–strain curves.',
    connectedLabs: [
      { label: 'Skin Microanatomy Guide', route: 'histology', note: 'Stratified keratinized epithelium & dermal papillae' },
      { label: 'Integumentary Quiz', route: 'quiz', note: 'Test barrier & thermoregulation across tiers' },
    ],
  },
  sensory: {
    systemId: 'sensory',
    bloomObjectives: {
      school_9_12: [
        'Trace light sequentially across cornea, pupil/iris, lens, and retina.',
        'Compare light-sensing rods and color-sensing cones.',
      ],
      bs_mbbs: [
        'Predict autonomic pupil effects of parasympathetic (CN III) vs. sympathetic stimulation.',
        'Locate lacrimal drainage from superolateral gland through nasolacrimal duct.',
      ],
      phd_research: [
        'Examine corneal Maurice lattice transparency physics and rod single-photon transducin–PDE6 amplification.',
      ],
    },
    commonMisconceptions: [
      'Assuming the lens provides most optical bending power (the air–cornea interface contributes ~2/3 of total diopters).',
      'Searching for inner ear cochlea/ossicles inside BodyParts3D 4.0 (honestly disclosed as planned outside the ocular pack).',
    ],
    labSpotterFocus: ['FMA58238 Cornea', 'FMA58235 Iris', 'FMA58241 Lens', 'FMA58300 Retina', 'FMA59101 Lacrimal gland'],
    graduateSeminarPrompt: 'How do corneal endothelial Na+/K+-ATPase pumps and stromal lumican/keratocan proteoglycans prevent swelling-induced Mie scattering?',
    connectedLabs: [
      { label: '3D Orbital Dissection', route: 'explorer', note: 'Inspect all 45 ocular & lacrimal meshes' },
      { label: 'Sensory Quiz Questions', route: 'quiz', note: 'Optics, autonomic iris & stromal physics' },
    ],
  },
};

export function getQuestionsForTopicOrSystem(
  systemId: CanonicalSystemId,
  topicId?: string,
  limit = 2,
): QuizQuestion[] {
  const exact = topicId ? QUIZ_QUESTIONS.filter((q) => q.topicId === topicId) : [];
  if (exact.length >= limit) return exact.slice(0, limit);
  const sysFallback = QUIZ_QUESTIONS.filter(
    (q) => q.systemId === systemId && !exact.some((e) => e.id === q.id),
  );
  return [...exact, ...sysFallback].slice(0, limit);
}
