import type { CanonicalSystemId } from '../anatomy-systems';

export interface SimulationParameterSpec {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  scientificBasis: string;
}

export interface SimulationPreset {
  id: string;
  label: string;
  description: string;
  values: Record<string, number>;
}

export interface SimulationReadout {
  label: string;
  value: string;
  unit: string;
  status: 'nominal' | 'elevated' | 'low';
  statusLabel: string;
}

export interface PhysiologyModuleSpec {
  id: 'cardiac-cycle' | 'respiratory-ventilation' | 'renal-filtration' | 'antagonistic-elbow' | 'endocrine-feedback-planned';
  systemId: CanonicalSystemId;
  title: string;
  subtitle: string;
  status: 'interactive' | 'specification_ready';
  explanation: string;
  formulaNote: string;
  assumptions: string[];
  disclaimer: string;
  linkedConcepts: { conceptId: string; label: string }[];
  parameters: SimulationParameterSpec[];
  presets: SimulationPreset[];
  missingRequirements?: string[];
}

export const PHYSIOLOGY_MODULES: PhysiologyModuleSpec[] = [
  {
    id: 'cardiac-cycle',
    systemId: 'cardiovascular',
    title: 'Cardiac Cycle, Conduction & Output',
    subtitle: 'Heart rate, stroke volume, systole/diastole phase balance & four-chamber blood flow',
    status: 'interactive',
    explanation:
      'Blood flows down pressure gradients governed by coordinated SA node pacemaker firing, AV nodal delay, His-Purkinje ventricular depolarization, and one-way cardiac valves.',
    formulaNote: 'CO (L/min) = (HR × SV) / 1000 · Beat duration T = 60,000 ms / HR',
    assumptions: [
      'Uses steady-state resting/exercise textbook averages (systolic fraction narrows modestly at higher heart rates).',
      'Does not simulate valvular regurgitation, preload/afterload baroreflex loops, or individual clinical ECG interpretation.',
    ],
    disclaimer: 'Educational physiological model for conceptual study only; not a clinical hemodynamic simulator.',
    linkedConcepts: [
      { conceptId: 'FMA7088', label: 'Heart' },
      { conceptId: 'FMA3736', label: 'Ascending aorta' },
      { conceptId: 'FMA8612', label: 'Pulmonary trunk' },
      { conceptId: 'FMA4720', label: 'Superior vena cava' },
    ],
    parameters: [
      {
        id: 'heartRate',
        label: 'Heart Rate',
        unit: 'bpm',
        min: 45,
        max: 175,
        step: 1,
        defaultValue: 72,
        scientificBasis: 'Normal adult resting sinus range 60–100 bpm; exercise increases SA node firing.',
      },
      {
        id: 'strokeVolume',
        label: 'Stroke Volume',
        unit: 'mL/beat',
        min: 45,
        max: 120,
        step: 1,
        defaultValue: 70,
        scientificBasis: 'Typical adult resting stroke volume ~70 mL (EDV ~120 mL − ESV ~50 mL).',
      },
      {
        id: 'phasePct',
        label: 'Cycle Phase Position',
        unit: '%',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 25,
        scientificBasis: '0–38% approximates ventricular systole (AV valves closed, semilunar open); 38–100% ventricular diastole.',
      },
    ],
    presets: [
      { id: 'rest', label: 'Resting Adult', description: '72 bpm · 70 mL · ~5.0 L/min', values: { heartRate: 72, strokeVolume: 70 } },
      { id: 'exercise', label: 'Moderate Exercise', description: '135 bpm · 100 mL · ~13.5 L/min', values: { heartRate: 135, strokeVolume: 100 } },
      { id: 'athletic', label: 'Endurance Rest', description: '52 bpm · 95 mL · ~4.9 L/min', values: { heartRate: 52, strokeVolume: 95 } },
    ],
  },
  {
    id: 'respiratory-ventilation',
    systemId: 'respiratory',
    title: 'Diaphragm Excursion & Pulmonary Ventilation',
    subtitle: 'Boyle’s law pressure-volume coupling during inspiration and passive expiration',
    status: 'interactive',
    explanation:
      'Phrenic nerve stimulation flattens the diaphragm downward while external intercostals elevate the ribs, expanding thoracic volume so alveolar pressure drops below atmospheric pressure and air flows inward.',
    formulaNote: 'Minute Ventilation VE (L/min) = (RR × VT) / 1000 · Anatomical dead space ≈ 150 mL',
    assumptions: [
      'Assumes uniform lung compliance and unobstructed tracheobronchial airways (150 mL standard adult dead space).',
      'Models quiet resting and increased-depth tidal breathing rather than obstructive pathology.',
    ],
    disclaimer: 'Simplified mechanics visualization illustrating Boyle’s law (P ∝ 1/V) at constant body temperature.',
    linkedConcepts: [
      { conceptId: 'FMA13295', label: 'Diaphragm' },
      { conceptId: 'FMA7394', label: 'Trachea' },
      { conceptId: 'FMA7309', label: 'Right lung' },
      { conceptId: 'FMA7310', label: 'Left lung' },
    ],
    parameters: [
      {
        id: 'respRate',
        label: 'Respiratory Rate',
        unit: 'breaths/min',
        min: 8,
        max: 32,
        step: 1,
        defaultValue: 14,
        scientificBasis: 'Normal quiet adult breathing rate 12–18 breaths/min.',
      },
      {
        id: 'tidalVolume',
        label: 'Tidal Volume (VT)',
        unit: 'mL',
        min: 300,
        max: 1100,
        step: 25,
        defaultValue: 500,
        scientificBasis: 'Average adult resting tidal volume ≈ 500 mL (~7 mL/kg).',
      },
      {
        id: 'breathPhase',
        label: 'Breath Cycle Position',
        unit: '%',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 35,
        scientificBasis: '0–45% Inspiration (diaphragm descends); 45–100% Expiration (elastic recoil).',
      },
    ],
    presets: [
      { id: 'quiet', label: 'Quiet Resting', description: '14/min · 500 mL VT', values: { respRate: 14, tidalVolume: 500 } },
      { id: 'deep', label: 'Slow Deep Breathing', description: '10/min · 850 mL VT', values: { respRate: 10, tidalVolume: 850 } },
      { id: 'exertion', label: 'Aerobic Exertion', description: '26/min · 950 mL VT', values: { respRate: 26, tidalVolume: 950 } },
    ],
  },
  {
    id: 'renal-filtration',
    systemId: 'urinary',
    title: 'Nephron Filtration & Urine-Formation Pathway',
    subtitle: 'Glomerular hydrostatic pressure, Bowman’s capsule filtration & tubular handling',
    status: 'interactive',
    explanation:
      'Afferent and efferent arteriolar tone regulates net filtration pressure across the glomerular capillary bed (~125 mL/min GFR), followed by ~99% water and solute reclamation along renal tubules.',
    formulaNote: 'Net Filtration Pressure NFP ≈ PGC − (PBS + πGC) · Educational normal: 60 − (18 + 32) = 10 mmHg',
    assumptions: [
      'Demonstrates Starling hydrostatic/oncotic balance across idealized glomerular capillaries.',
      'Textbook educational parameters; does not model acute kidney injury or hormonal ADH/aldosterone kinetics in detail.',
    ],
    disclaimer: 'Simplified educational Starling balance demonstration; not for clinical GFR calculation.',
    linkedConcepts: [
      { conceptId: 'FMA7203', label: 'Kidney' },
      { conceptId: 'FMA14751', label: 'Renal artery' },
      { conceptId: 'FMA14334', label: 'Renal vein' },
      { conceptId: 'FMA9704', label: 'Ureter' },
    ],
    parameters: [
      {
        id: 'glomerularPressure',
        label: 'Glomerular Capillary Pressure (PGC)',
        unit: 'mmHg',
        min: 48,
        max: 72,
        step: 1,
        defaultValue: 60,
        scientificBasis: 'Normal glomerular hydrostatic pressure ≈ 55–60 mmHg maintained by renal autoregulation.',
      },
      {
        id: 'oncoticPressure',
        label: 'Plasma Colloid Osmotic (πGC)',
        unit: 'mmHg',
        min: 24,
        max: 38,
        step: 1,
        defaultValue: 32,
        scientificBasis: 'Opposes filtration; averages ~32 mmHg along glomerular capillary bed.',
      },
    ],
    presets: [
      { id: 'normal', label: 'Normal Autoregulated', description: 'PGC 60 · πGC 32 · NFP 10 mmHg', values: { glomerularPressure: 60, oncoticPressure: 32 } },
      { id: 'efferent', label: 'Moderate Efferent Constriction', description: 'Raises PGC to 65 mmHg', values: { glomerularPressure: 65, oncoticPressure: 32 } },
      { id: 'afferent', label: 'Afferent Vasoconstriction', description: 'Lowers PGC to 52 mmHg', values: { glomerularPressure: 52, oncoticPressure: 32 } },
    ],
  },
  {
    id: 'antagonistic-elbow',
    systemId: 'muscular',
    title: 'Antagonistic Muscle & Elbow Lever Mechanics',
    subtitle: 'Biceps brachii vs. triceps brachii reciprocal inhibition & forearm lever angle',
    status: 'interactive',
    explanation:
      'Skeletal muscles only pull—never push. Elbow flexion requires concentric shortening of the biceps brachii (anterior compartment) paired with relaxation of the antagonistic triceps brachii (posterior compartment).',
    formulaNote: 'Third-class lever: Effort (biceps @ radial tuberosity ~5 cm) between Fulcrum (elbow joint) and Load (forearm/hand ~32 cm)',
    assumptions: [
      'Uses simplified 2D planar hinge kinematics across 15° (near full extension) to 140° (deep flexion).',
      'Ignores pronation/supination coupling and brachialis/brachioradialis synergist share.',
    ],
    disclaimer: 'Conceptual biomechanical model illustrating third-class lever geometry and antagonistic pairs.',
    linkedConcepts: [
      { conceptId: 'FMA37683', label: 'Long head of biceps brachii' },
      { conceptId: 'FMA37692', label: 'Long head of triceps brachii' },
      { conceptId: 'FMA13303', label: 'Humerus' },
      { conceptId: 'FMA23463', label: 'Radius' },
      { conceptId: 'FMA23466', label: 'Ulna' },
    ],
    parameters: [
      {
        id: 'elbowAngle',
        label: 'Elbow Flexion Angle',
        unit: '°',
        min: 15,
        max: 140,
        step: 1,
        defaultValue: 75,
        scientificBasis: '90° elbow flexion optimizes the perpendicular moment arm of the biceps tendon at the radial tuberosity.',
      },
      {
        id: 'bicepsDrive',
        label: 'Flexor vs Extensor Bias',
        unit: '% flex',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 65,
        scientificBasis: 'Reciprocal innervation reduces antagonist tone as agonist motor units are recruited.',
      },
    ],
    presets: [
      { id: 'extended', label: 'Extended (Triceps Active)', description: 'Angle 20° · Triceps dominant', values: { elbowAngle: 20, bicepsDrive: 15 } },
      { id: 'mid', label: '90° Peak Torque Lever', description: 'Angle 90° · Optimal biceps angle', values: { elbowAngle: 90, bicepsDrive: 80 } },
      { id: 'flexed', label: 'Full Flexion', description: 'Angle 135° · Biceps shortened', values: { elbowAngle: 135, bicepsDrive: 95 } },
    ],
  },
  {
    id: 'endocrine-feedback-planned',
    systemId: 'endocrine',
    title: 'Endocrine Negative-Feedback Loops (Specification Slot)',
    subtitle: 'Hypothalamic-Pituitary-Adrenal (HPA) & Insulin-Glucagon Glucose Homeostasis',
    status: 'specification_ready',
    explanation:
      'Architecture slot prepared for interactive endocrine feedback curve visualization once peer-reviewed differential kinetic constants and hormone half-life tables are verified.',
    formulaNote: 'Requires coupled ODE feedback constants (pending textbook citation pack)',
    assumptions: [
      'Intentionally locked from producing numeric outputs until validated kinetic parameters are bundled.',
    ],
    disclaimer: 'Module registered as specification-only to avoid publishing unverified hormone dose-response curves.',
    linkedConcepts: [
      { conceptId: 'FMA13889', label: 'Pituitary gland' },
      { conceptId: 'FMA9604', label: 'Adrenal gland' },
      { conceptId: 'FMA7198', label: 'Pancreas' },
    ],
    parameters: [],
    presets: [],
    missingRequirements: [
      'Peer-reviewed coupled kinetic parameters for fasting/postprandial insulin-glucagon loops',
      'Validated cortisol diurnal curve reference tables',
    ],
  },
];

export function evaluateCardiacSimulation(v: Record<string, number>): {
  readouts: SimulationReadout[];
  phaseName: string;
  valveState: string;
  conductionStep: string;
} {
  const hr = v.heartRate ?? 72;
  const sv = v.strokeVolume ?? 70;
  const phase = v.phasePct ?? 25;
  const co = (hr * sv) / 1000;
  const cycleMs = Math.round(60000 / hr);
  const isSystole = phase <= 38;

  const phaseName =
    phase < 10
      ? 'Atrial Kick & Isovolumetric Contraction'
      : phase <= 38
        ? 'Ventricular Ejection (Systole)'
        : phase <= 46
          ? 'Isovolumetric Relaxation'
          : 'Ventricular Filling (Diastole)';

  const valveState = isSystole
    ? 'AV valves (Tricuspid/Mitral) CLOSED · Semilunar valves OPEN'
    : 'AV valves OPEN · Semilunar (Pulmonary/Aortic) CLOSED';

  const conductionStep =
    phase < 12
      ? 'SA Node firing -> AV Node delay'
      : phase <= 38
        ? 'Bundle of His -> Purkinje ventricular depolarization'
        : 'Ventricular repolarization & passive filling';

  return {
    phaseName,
    valveState,
    conductionStep,
    readouts: [
      {
        label: 'Cardiac Output',
        value: co.toFixed(2),
        unit: 'L/min',
        status: co > 8 ? 'elevated' : co < 4 ? 'low' : 'nominal',
        statusLabel: co > 8 ? 'Elevated flow' : co < 4 ? 'Reduced flow' : 'Nominal resting',
      },
      {
        label: 'Cycle Duration',
        value: String(cycleMs),
        unit: 'ms/beat',
        status: 'nominal',
        statusLabel: isSystole ? 'Systole active' : 'Diastole filling',
      },
      {
        label: 'Systole / Diastole',
        value: `${Math.round(cycleMs * 0.35)} / ${Math.round(cycleMs * 0.65)}`,
        unit: 'ms',
        status: 'nominal',
        statusLabel: 'Typical ratio',
      },
    ],
  };
}

export function evaluateRespiratorySimulation(v: Record<string, number>): {
  readouts: SimulationReadout[];
  phaseName: string;
  pressureState: string;
  diaphragmDropRatio: number;
} {
  const rr = v.respRate ?? 14;
  const vt = v.tidalVolume ?? 500;
  const phase = v.breathPhase ?? 35;
  const ve = (rr * vt) / 1000;
  const alveolarVent = (rr * Math.max(0, vt - 150)) / 1000;
  const isInsp = phase <= 45;
  const lungFactor = isInsp ? phase / 45 : Math.max(0, 1 - (phase - 45) / 55);

  return {
    phaseName: isInsp ? 'Active Inspiration (Diaphragm Descending)' : 'Passive Expiration (Elastic Recoil)',
    pressureState: isInsp
      ? 'Thoracic volume ↑ -> Alveolar pressure ~ −1 to −2 cmH2O (Air flows IN)'
      : 'Thoracic volume ↓ -> Alveolar pressure ~ +1 to +2 cmH2O (Air flows OUT)',
    diaphragmDropRatio: lungFactor,
    readouts: [
      {
        label: 'Minute Ventilation',
        value: ve.toFixed(2),
        unit: 'L/min',
        status: ve > 12 ? 'elevated' : 'nominal',
        statusLabel: ve > 12 ? 'Increased demand' : 'Nominal quiet',
      },
      {
        label: 'Alveolar Ventilation',
        value: alveolarVent.toFixed(2),
        unit: 'L/min',
        status: alveolarVent < 3 ? 'low' : 'nominal',
        statusLabel: 'Minus 150 mL dead space',
      },
      {
        label: 'Diaphragm Shift',
        value: (1.5 * lungFactor + (vt > 700 ? 1.5 * lungFactor : 0)).toFixed(1),
        unit: 'cm descent',
        status: 'nominal',
        statusLabel: isInsp ? 'Contracting' : 'Relaxing',
      },
    ],
  };
}

export function evaluateRenalSimulation(v: Record<string, number>): {
  readouts: SimulationReadout[];
  nfp: number;
  gfrApprox: number;
  stageSummary: string;
} {
  const pgc = v.glomerularPressure ?? 60;
  const piGc = v.oncoticPressure ?? 32;
  const pbs = 18; // Bowman's space hydrostatic pressure (mmHg)
  const nfp = Math.max(0, pgc - (pbs + piGc));
  // Educational proportionality around standard NFP=10 mmHg -> ~125 mL/min
  const gfrApprox = Math.round(nfp * 12.5);

  return {
    nfp,
    gfrApprox,
    stageSummary:
      nfp === 0
        ? 'Net filtration drops to 0 mmHg when opposing Bowman + oncotic pressures exceed PGC.'
        : 'Filtrate enters Bowman’s capsule -> ~65% Na+/H2O & 100% glucose reabsorbed in PCT -> concentrated via Loop of Henle & Collecting Duct.',
    readouts: [
      {
        label: 'Net Filtration Pressure',
        value: String(nfp),
        unit: 'mmHg',
        status: nfp >= 14 ? 'elevated' : nfp < 7 ? 'low' : 'nominal',
        statusLabel: nfp >= 14 ? 'High gradient' : nfp < 7 ? 'Low gradient' : 'Normal (≈10 mmHg)',
      },
      {
        label: 'Estimated GFR',
        value: String(gfrApprox),
        unit: 'mL/min',
        status: gfrApprox > 150 ? 'elevated' : gfrApprox < 85 ? 'low' : 'nominal',
        statusLabel: 'Idealized Kf scaling',
      },
      {
        label: 'Bowman Opposing P',
        value: String(pbs),
        unit: 'mmHg',
        status: 'nominal',
        statusLabel: 'Fixed baseline',
      },
    ],
  };
}

export function evaluateMusculoskeletalSimulation(v: Record<string, number>): {
  readouts: SimulationReadout[];
  dominantAction: string;
  mechanicalAdvantagePct: number;
} {
  const angle = v.elbowAngle ?? 75;
  const drive = v.bicepsDrive ?? 65;
  // Perpendicular lever factor peaks near 90 deg: sin(angle)
  const rad = (angle * Math.PI) / 180;
  const mechanicalAdvantagePct = Math.round(Math.sin(rad) * 100);

  const dominantAction =
    drive >= 55
      ? 'Biceps brachii contracting (flexor) · Triceps brachii relaxed (antagonist)'
      : drive <= 45
        ? 'Triceps brachii contracting (extensor) · Biceps brachii relaxed'
        : 'Balanced isometric co-contraction stabilizing the humeroulnar joint';

  return {
    dominantAction,
    mechanicalAdvantagePct,
    readouts: [
      {
        label: 'Elbow Joint Angle',
        value: `${angle}°`,
        unit: 'flexion',
        status: 'nominal',
        statusLabel: angle > 105 ? 'Deep flexion' : angle < 40 ? 'Near extension' : 'Mid-range',
      },
      {
        label: 'Perpendicular Pull',
        value: `${mechanicalAdvantagePct}%`,
        unit: 'of peak',
        status: mechanicalAdvantagePct >= 85 ? 'elevated' : 'nominal',
        statusLabel: mechanicalAdvantagePct >= 85 ? 'Peak torque zone' : 'Oblique angle',
      },
      {
        label: 'Biceps / Triceps',
        value: `${drive} / ${100 - drive}`,
        unit: '% bias',
        status: 'nominal',
        statusLabel: 'Reciprocal pair',
      },
    ],
  };
}
