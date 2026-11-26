import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import {
  evaluateAcidBaseOxygenSimulation,
  evaluateCardiacSimulation,
  evaluateMusculoskeletalSimulation,
  evaluateRenalSimulation,
  evaluateRespiratorySimulation,
  PHYSIOLOGY_MODULES,
  type PhysiologyModuleSpec,
} from '../data/physiology-data';
import { resolvePhysiologyTarget } from '../utils/deep-link-resolver';
import type { StudyContextInput } from '../study-context-engine';

interface Props {
  initialModuleId?: string | null;
  initialSystemId?: CanonicalSystemId | null;
  onInspectConcept: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId) => void;
  onOpenStudyContext?: (input: StudyContextInput) => void;
}

function getDefaults(mod: PhysiologyModuleSpec): Record<string, number> {
  return Object.fromEntries(mod.parameters.map((p) => [p.id, p.defaultValue]));
}

export default function PhysiologyPage({
  initialModuleId,
  initialSystemId,
  onInspectConcept,
  onOpenLearnSystem,
  onOpenStudyContext,
}: Props) {
  const [selectedId, setSelectedId] = useState<PhysiologyModuleSpec['id']>(() =>
    resolvePhysiologyTarget(initialModuleId, initialSystemId),
  );
  const [valuesByMod, setValuesByMod] = useState<Record<string, Record<string, number>>>(() =>
    Object.fromEntries(PHYSIOLOGY_MODULES.map((m) => [m.id, getDefaults(m)])),
  );
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (initialModuleId || initialSystemId) {
      setSelectedId(resolvePhysiologyTarget(initialModuleId, initialSystemId));
      setPlaying(false);
    }
  }, [initialModuleId, initialSystemId]);

  const activeMod = useMemo(
    () => PHYSIOLOGY_MODULES.find((m) => m.id === selectedId) ?? PHYSIOLOGY_MODULES[0],
    [selectedId],
  );
  const vals = valuesByMod[activeMod.id] ?? getDefaults(activeMod);

  // Clean bounded rAF/interval cycle advance for Cardiac & Respiratory cycle phase when Playing
  useEffect(() => {
    if (!playing) return;
    const phaseKey =
      activeMod.id === 'cardiac-cycle'
        ? 'phasePct'
        : activeMod.id === 'respiratory-ventilation'
          ? 'breathPhase'
          : null;
    if (!phaseKey) {
      setPlaying(false);
      return;
    }

    const id = window.setInterval(() => {
      setValuesByMod((prev) => {
        const cur = prev[activeMod.id] ?? getDefaults(activeMod);
        const nextPhase = ((cur[phaseKey] ?? 0) + 2) % 100;
        return {
          ...prev,
          [activeMod.id]: { ...cur, [phaseKey]: nextPhase },
        };
      });
    }, 65);
    return () => window.clearInterval(id);
  }, [playing, activeMod.id]);

  const updateParam = (paramId: string, nextVal: number) => {
    setValuesByMod((prev) => ({
      ...prev,
      [activeMod.id]: {
        ...(prev[activeMod.id] ?? getDefaults(activeMod)),
        [paramId]: nextVal,
      },
    }));
  };

  const resetCurrent = () => {
    setPlaying(false);
    setValuesByMod((prev) => ({
      ...prev,
      [activeMod.id]: getDefaults(activeMod),
    }));
  };

  const cardiacEval = activeMod.id === 'cardiac-cycle' ? evaluateCardiacSimulation(vals) : null;
  const respEval = activeMod.id === 'respiratory-ventilation' ? evaluateRespiratorySimulation(vals) : null;
  const renalEval = activeMod.id === 'renal-filtration' ? evaluateRenalSimulation(vals) : null;
  const mskEval = activeMod.id === 'antagonistic-elbow' ? evaluateMusculoskeletalSimulation(vals) : null;
  const acidBaseEval = activeMod.id === 'acid-base-oxygen' ? evaluateAcidBaseOxygenSimulation(vals) : null;

  const activeReadouts =
    cardiacEval?.readouts ??
    respEval?.readouts ??
    renalEval?.readouts ??
    mskEval?.readouts ??
    acidBaseEval?.readouts ??
    [];

  const activeSys = CANONICAL_SYSTEMS.find((s) => s.id === activeMod.systemId);

  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Structure-to-Function Educational Models</p>
        <h1>Educational Physiology Simulations</h1>
        <p className="a360-lead">
          Connect 3D anatomical structures with foundational physiological mechanics using interactive
          parameter controls, explicit mathematical assumptions, and direct 3D organ links.
        </p>
      </header>

      <div className="a360-category-tabs" role="tablist" aria-label="Physiology simulations">
        {PHYSIOLOGY_MODULES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={activeMod.id === m.id}
            className={`a360-category-tab ${activeMod.id === m.id ? 'active' : ''}`}
            onClick={() => {
              setPlaying(false);
              setSelectedId(m.id);
            }}
          >
            <Activity size={15} />
            <span>
              {m.id === 'acid-base-oxygen'
                ? 'Acid–Base & O₂ Curve'
                : m.systemId === 'cardiovascular'
                  ? 'Cardiovascular'
                  : m.systemId === 'respiratory'
                    ? 'Respiratory'
                    : m.systemId === 'urinary'
                      ? 'Renal'
                      : m.systemId === 'muscular'
                        ? 'Musculoskeletal'
                        : 'Endocrine (Spec)'}
            </span>
          </button>
        ))}
      </div>

      <section className="a360-sim-sandbox">
        {/* Left / Top Stage (60-65%) */}
        <div className="a360-sim-stage">
          <div className="a360-detail-top">
            <div>
              <p className="a360-kicker">
                {activeSys?.name.en} ·{' '}
                {activeMod.status === 'interactive'
                  ? 'Interactive Educational Model'
                  : 'Specification Ready (Unavailable Kinetic Pack)'}
              </p>
              <h2>{activeMod.title}</h2>
              <p className="a360-muted">{activeMod.subtitle}</p>
            </div>
          </div>

          {activeMod.status === 'specification_ready' ? (
            <div className="a360-coverage-box">
              <strong>Interactive Module Locked Pending Verified Parameters:</strong>{' '}
              {activeMod.explanation}
              <ul className="a360-fact-list">
                {activeMod.missingRequirements?.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <div className="a360-sim-canvas-box">
                {/* 1. Cardiovascular SVG Stage */}
                {cardiacEval && (
                  <svg
                    viewBox="0 0 640 310"
                    className="a360-sim-svg"
                    role="img"
                    aria-label="Schematic four-chamber cardiac blood flow and valve state diagram"
                  >
                    <rect x="20" y="20" width="600" height="270" rx="12" fill="#f8fafc" stroke="#dce4ec" />
                    {/* Right Atrium & Right Ventricle (Deoxygenated - Slate Blue) */}
                    <rect x="90" y="55" width="160" height="80" rx="10" fill="#dbeafe" stroke="#1d4ed8" strokeWidth="1.5" />
                    <text x="170" y="88" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">Right Atrium</text>
                    <text x="170" y="108" textAnchor="middle" fontSize="11" fill="#334155">SVC & IVC return</text>

                    <rect
                      x="90"
                      y="165"
                      width="160"
                      height="95"
                      rx="10"
                      fill="#bfdbfe"
                      stroke="#1d4ed8"
                      strokeWidth={(vals.phasePct ?? 25) <= 38 ? 3 : 1.5}
                    />
                    <text x="170" y="205" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">Right Ventricle</text>
                    <text x="170" y="224" textAnchor="middle" fontSize="11" fill="#1e3a8a">Pulmonary circuit</text>

                    {/* Left Atrium & Left Ventricle (Oxygenated - Clinical Coral/Crimson) */}
                    <rect x="390" y="55" width="160" height="80" rx="10" fill="#fee2e2" stroke="#b91c1c" strokeWidth="1.5" />
                    <text x="470" y="88" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">Left Atrium</text>
                    <text x="470" y="108" textAnchor="middle" fontSize="11" fill="#7f1d1d">4 Pulmonary veins</text>

                    <rect
                      x="390"
                      y="165"
                      width="160"
                      height="95"
                      rx="10"
                      fill="#fecaca"
                      stroke="#b91c1c"
                      strokeWidth={(vals.phasePct ?? 25) <= 38 ? 3 : 1.5}
                    />
                    <text x="470" y="205" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">Left Ventricle</text>
                    <text x="470" y="224" textAnchor="middle" fontSize="11" fill="#7f1d1d">Systemic Aorta</text>

                    {/* Lungs Bridge */}
                    <rect x="275" y="65" width="90" height="58" rx="8" fill="#e6f1f4" stroke="#0f5c6e" />
                    <text x="320" y="92" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f5c6e">Lungs</text>
                    <text x="320" y="108" textAnchor="middle" fontSize="10" fill="#334155">O2 / CO2</text>

                    {/* Flow labels */}
                    <text x="320" y="185" textAnchor="middle" fontSize="12" fontWeight="600" fill="#0f172a">
                      {cardiacEval.phaseName}
                    </text>
                    <text x="320" y="207" textAnchor="middle" fontSize="10.5" fill="#475569">
                      {cardiacEval.valveState}
                    </text>
                    <text x="320" y="228" textAnchor="middle" fontSize="10.5" fill="#0f5c6e">
                      {cardiacEval.conductionStep}
                    </text>
                  </svg>
                )}

                {/* 2. Respiratory SVG Stage */}
                {respEval && (
                  <svg
                    viewBox="0 0 640 310"
                    className="a360-sim-svg"
                    role="img"
                    aria-label="Diaphragm descent and bilateral lung volume diagram"
                  >
                    <rect x="20" y="20" width="600" height="270" rx="12" fill="#f8fafc" stroke="#dce4ec" />
                    {/* Trachea */}
                    <rect x="304" y="34" width="32" height="62" rx="6" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
                    <text x="320" y="54" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0f172a">Trachea</text>

                    {/* Right & Left Lungs expanding dynamically */}
                    {(() => {
                      const expand = respEval.diaphragmDropRatio * 22;
                      return (
                        <>
                          <path
                            d={`M 295 92 C 210 92 165 135 160 ${205 + expand} L 295 ${205 + expand} Z`}
                            fill="#e6f1f4"
                            stroke="#0f5c6e"
                            strokeWidth="2"
                          />
                          <path
                            d={`M 345 92 C 430 92 475 135 480 ${205 + expand} L 345 ${205 + expand} Z`}
                            fill="#e6f1f4"
                            stroke="#0f5c6e"
                            strokeWidth="2"
                          />
                          <text x="236" y="160" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">Right Lung</text>
                          <text x="404" y="160" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">Left Lung</text>
                          {/* Diaphragm Dome */}
                          <path
                            d={`M 135 ${232 + expand * 0.85} Q 320 ${192 + expand * 1.45} 505 ${232 + expand * 0.85}`}
                            fill="none"
                            stroke="#a85b50"
                            strokeWidth="7"
                            strokeLinecap="round"
                          />
                          <text x="320" y={258 + expand * 0.5} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#7f1d1d">
                            Diaphragm Dome ({respEval.diaphragmDropRatio > 0.45 ? 'Contracted / Flattened' : 'Elevated / Relaxed'})
                          </text>
                        </>
                      );
                    })()}
                  </svg>
                )}

                {/* 3. Renal Nephron Filtration Stage */}
                {renalEval && (
                  <svg
                    viewBox="0 0 640 310"
                    className="a360-sim-svg"
                    role="img"
                    aria-label="Schematic nephron filtration and tubular reabsorption pathway"
                  >
                    <rect x="20" y="20" width="600" height="270" rx="12" fill="#f8fafc" stroke="#dce4ec" />
                    <rect x="44" y="70" width="145" height="90" rx="10" fill="#fee2e2" stroke="#b91c1c" strokeWidth="1.5" />
                    <text x="116" y="102" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0f172a">Glomerulus</text>
                    <text x="116" y="122" textAnchor="middle" fontSize="11" fill="#7f1d1d">PGC = {vals.glomerularPressure ?? 60} mmHg</text>
                    <text x="116" y="140" textAnchor="middle" fontSize="11" fill="#475569">πGC = {vals.oncoticPressure ?? 32} mmHg</text>

                    <line x1="189" y1="115" x2="232" y2="115" stroke="#0f5c6e" strokeWidth="3" />

                    <rect x="232" y="70" width="160" height="90" rx="10" fill="#e6f1f4" stroke="#0f5c6e" strokeWidth="1.5" />
                    <text x="312" y="102" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0f172a">Bowman & PCT</text>
                    <text x="312" y="122" textAnchor="middle" fontSize="11" fill="#0f5c6e">NFP = {renalEval.nfp} mmHg</text>
                    <text x="312" y="140" textAnchor="middle" fontSize="11" fill="#334155">~65% Reabsorbed</text>

                    <line x1="392" y1="115" x2="435" y2="115" stroke="#0f5c6e" strokeWidth="3" />

                    <rect x="435" y="70" width="160" height="90" rx="10" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" />
                    <text x="515" y="102" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0f172a">Loop, DCT & Duct</text>
                    <text x="515" y="122" textAnchor="middle" fontSize="11" fill="#78350f">Fine Na+/H2O</text>
                    <text x="515" y="140" textAnchor="middle" fontSize="11" fill="#78350f">→ Renal Pelvis/Ureter</text>

                    <text x="320" y="218" textAnchor="middle" fontSize="12" fontWeight="600" fill="#0f172a">
                      Est. GFR Scale: {renalEval.gfrApprox} mL/min
                    </text>
                    <text x="320" y="242" textAnchor="middle" fontSize="11" fill="#475569">
                      {renalEval.stageSummary}
                    </text>
                  </svg>
                )}

                {/* 4. Musculoskeletal Elbow Lever Stage */}
                {mskEval && (
                  <svg
                    viewBox="0 0 640 310"
                    className="a360-sim-svg"
                    role="img"
                    aria-label="Antagonistic biceps brachii and triceps brachii elbow joint lever diagram"
                  >
                    <rect x="20" y="20" width="600" height="270" rx="12" fill="#f8fafc" stroke="#dce4ec" />
                    {/* Humerus fixed vertical shaft */}
                    <line x1="250" y1="55" x2="250" y2="210" stroke="#cbd5e1" strokeWidth="16" strokeLinecap="round" />
                    <text x="195" y="130" textAnchor="end" fontSize="12" fontWeight="700" fill="#0f172a">Humerus</text>
                    {/* Forearm (Radius/Ulna) rotating by elbowAngle from downward extension */}
                    {(() => {
                      const deg = vals.elbowAngle ?? 75;
                      const rad = (deg * Math.PI) / 180;
                      // Angle measured from downward full extension (0=down, 90=horizontal forward, 140=flexed up)
                      const fx2 = 250 + Math.sin(rad) * 145;
                      const fy2 = 210 + Math.cos(rad) * 145;
                      // Biceps tension width proportional to bicepsDrive
                      const bicepsW = 3 + ((vals.bicepsDrive ?? 65) / 100) * 8;
                      const tricepsW = 3 + ((100 - (vals.bicepsDrive ?? 65)) / 100) * 8;
                      const radiusX = 250 + Math.sin(rad) * 42;
                      const radiusY = 210 + Math.cos(rad) * 42;
                      return (
                        <>
                          {/* Biceps line (anterior) */}
                          <line
                            x1="264"
                            y1="68"
                            x2={radiusX}
                            y2={radiusY}
                            stroke="#a85b50"
                            strokeWidth={bicepsW}
                            strokeLinecap="round"
                          />
                          {/* Triceps line (posterior) */}
                          <line
                            x1="234"
                            y1="68"
                            x2="232"
                            y2="218"
                            stroke="#0f5c6e"
                            strokeWidth={tricepsW}
                            strokeLinecap="round"
                          />
                          <line x1="250" y1="210" x2={fx2} y2={fy2} stroke="#94a3b8" strokeWidth="13" strokeLinecap="round" />
                          <circle cx="250" cy="210" r="10" fill="#0f172a" />
                          <text x={fx2 + 16} y={fy2} fontSize="12" fontWeight="700" fill="#0f172a">
                            Radius & Ulna ({deg}°)
                          </text>
                          <text x="335" y="102" fontSize="11.5" fontWeight="600" fill="#a85b50">
                            Biceps Brachii (Flexor)
                          </text>
                          <text x="195" y="185" textAnchor="end" fontSize="11.5" fontWeight="600" fill="#0f5c6e">
                            Triceps Brachii (Extensor)
                          </text>
                        </>
                      );
                    })()}
                  </svg>
                )}

                {/* 5. Acid-Base & O2-Haemoglobin Hill/Bohr Stage */}
                {acidBaseEval && (
                  <svg
                    viewBox="0 0 640 310"
                    className="a360-sim-svg"
                    role="img"
                    aria-label="Oxygen-haemoglobin dissociation curve with live Bohr pH shift"
                  >
                    <rect x="20" y="20" width="600" height="270" rx="12" fill="#f8fafc" stroke="#dce4ec" />
                    {/* Plot grid axes: X (0..120 mmHg) -> 90..560, Y (0..100%) -> 240..58 */}
                    <line x1="90" y1="240" x2="560" y2="240" stroke="#64748b" strokeWidth="1.5" />
                    <line x1="90" y1="58" x2="90" y2="240" stroke="#64748b" strokeWidth="1.5" />
                    <line x1="90" y1="149" x2="560" y2="149" stroke="#cbd5e1" strokeDasharray="4 4" />
                    <text x="50" y="65" fontSize="10.5" fill="#475569">100%</text>
                    <text x="50" y="153" fontSize="10.5" fill="#475569">50%</text>
                    <text x="50" y="242" fontSize="10.5" fill="#475569">0%</text>
                    <text x="325" y="272" textAnchor="middle" fontSize="11" fontWeight="600" fill="#334155">
                      Partial Pressure of O₂ (PaO₂ mmHg) · {acidBaseEval.acidBaseStatus}
                    </text>

                    {/* Standard pH 7.40 reference dashed curve */}
                    <polyline
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="5 4"
                      points={acidBaseEval.curvePoints
                        .map((pt) => `${90 + (pt.po2 / 120) * 470},${240 - (pt.stdSao2 / 100) * 182}`)
                        .join(' ')}
                    />
                    {/* Active Bohr-shifted curve */}
                    <polyline
                      fill="none"
                      stroke="#0f5c6e"
                      strokeWidth="3.5"
                      points={acidBaseEval.curvePoints
                        .map((pt) => `${90 + (pt.po2 / 120) * 470},${240 - (pt.sao2 / 100) * 182}`)
                        .join(' ')}
                    />
                    {/* Operating point marker */}
                    {(() => {
                      const cx = 90 + ((vals.pao2 ?? 95) / 120) * 470;
                      const cy = 240 - (acidBaseEval.sao2Pct / 100) * 182;
                      return (
                        <>
                          <line x1={cx} y1="240" x2={cx} y2={cy} stroke="#b91c1c" strokeDasharray="3 3" strokeWidth="1.5" />
                          <circle cx={cx} cy={cy} r="6.5" fill="#b91c1c" stroke="#ffffff" strokeWidth="2" />
                          <text x="330" y="42" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#0f5c6e">
                            {acidBaseEval.bohrShiftDirection}
                          </text>
                        </>
                      );
                    })()}
                  </svg>
                )}
              </div>

              {/* Live Readout Strip */}
              <div className="a360-sim-readouts">
                {activeReadouts.map((r) => (
                  <div key={r.label} className={`a360-sim-readout is-${r.status}`}>
                    <span className="a360-stat-label">{r.label}</span>
                    <strong className="a360-tabular-count">
                      {r.value} <small>{r.unit}</small>
                    </strong>
                    <span className="a360-readout-tag">{r.statusLabel}</span>
                  </div>
                ))}
              </div>

              <div className="a360-sim-explain">
                <p>{activeMod.explanation}</p>
                <p className="a360-mono-formula">{activeMod.formulaNote}</p>
              </div>
            </>
          )}
        </div>

        {/* Right / Bottom Control & Concept Deck */}
        <aside className="a360-sim-deck" aria-label="Simulation controls and anatomical links">
          {activeMod.status === 'interactive' && (
            <>
              {(activeMod.id === 'cardiac-cycle' || activeMod.id === 'respiratory-ventilation') && (
                <div className="a360-sim-transport">
                  <button
                    type="button"
                    className="a360-btn-primary"
                    onClick={() => setPlaying((p) => !p)}
                  >
                    {playing ? <Pause size={15} /> : <Play size={15} />}
                    {playing ? 'Pause Cycle' : 'Animate Cycle'}
                  </button>
                  <button type="button" className="a360-btn-secondary" onClick={resetCurrent}>
                    <RotateCcw size={14} /> Reset
                  </button>
                </div>
              )}

              {activeMod.presets.length > 0 && (
                <div className="a360-subblock">
                  <h3>Physiological Presets</h3>
                  <div className="a360-preset-stack">
                    {activeMod.presets.map((pr) => (
                      <button
                        key={pr.id}
                        type="button"
                        className="a360-preset-btn"
                        onClick={() =>
                          setValuesByMod((prev) => ({
                            ...prev,
                            [activeMod.id]: {
                              ...(prev[activeMod.id] ?? getDefaults(activeMod)),
                              ...pr.values,
                            },
                          }))
                        }
                      >
                        <strong>{pr.label}</strong>
                        <span>{pr.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="a360-subblock">
                <div className="a360-list-header">
                  <h3>Adjustable Parameters</h3>
                  <button type="button" className="a360-text-link" onClick={resetCurrent}>
                    <RotateCcw size={13} /> Reset Defaults
                  </button>
                </div>
                <div className="a360-sliders-list">
                  {activeMod.parameters.map((param) => {
                    const cur = vals[param.id] ?? param.defaultValue;
                    return (
                      <label key={param.id} className="a360-param-row">
                        <div className="a360-param-head">
                          <span>{param.label}</span>
                          <strong className="a360-tabular-count">
                            {cur} {param.unit}
                          </strong>
                        </div>
                        <input
                          type="range"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={cur}
                          onChange={(e) => updateParam(param.id, Number(e.target.value))}
                        />
                        <span className="a360-muted">{param.scientificBasis}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="a360-subblock">
            <h3>Linked 3D Structures</h3>
            <div className="a360-chip-grid">
              {activeMod.linkedConcepts.map((c) => (
                <button
                  key={c.conceptId}
                  type="button"
                  className="a360-structure-btn"
                  onClick={() => onInspectConcept(c.conceptId)}
                >
                  <span>{c.label}</span>
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
            <button
              type="button"
              className="a360-btn-secondary"
              style={{ marginTop: '10px', width: '100%' }}
              onClick={() => onOpenLearnSystem(activeMod.systemId)}
            >
              <BookOpen size={14} /> Study {activeSys?.name.en} Lessons
            </button>
            {onOpenStudyContext && (
              <button
                type="button"
                className="a360-btn-primary"
                style={{ marginTop: '8px', width: '100%' }}
                onClick={() =>
                  onOpenStudyContext({
                    physiologyId: activeMod.id,
                    conceptId: activeMod.linkedConcepts[0]?.conceptId,
                    systemId: activeMod.systemId,
                    sourceModule: 'physiology',
                  })
                }
              >
                Open in Connected Study Workspace <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div className="a360-coverage-box">
            <strong>Simplified Assumptions & Disclaimer:</strong>
            <ul className="a360-fact-list">
              {activeMod.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="a360-muted" style={{ marginTop: '8px' }}>{activeMod.disclaimer}</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
