import { ArrowUpRight } from 'lucide-react';

interface Props {
  onExplore: () => void;
}

export default function AboutPage({ onExplore }: Props) {
  return (
    <div className="a360-page a360-narrow">
      <header className="a360-page-header">
        <p className="a360-kicker">About Anatomy 360</p>
        <h1>A transparent, accurate 3D anatomy platform for students.</h1>
        <p className="a360-lead">
          Designed for FSc pre-medical, MDCAT, MBBS, nursing, and biology learners in Pakistan and
          worldwide, combining real 3D anatomical geometry with verified educational reference notes.
        </p>
      </header>

      <section className="a360-prose-block">
        <h2>Dataset Scope & Accuracy Policy</h2>
        <p>
          The 3D model in this release uses <strong>BodyParts3D 4.0</strong>, an adult male
          reference anatomy built from MRI data and anatomical refinement. It provides{' '}
          <strong>2,234 individually selectable meshes</strong> organized into{' '}
          <strong>3,432 named FMA concepts</strong> across <strong>2,288,268 triangles</strong>.
        </p>
        <p>
          Anatomy 360 never invents medical facts or fabricates missing 3D geometry. Where a
          structure or system is only partially represented in the current adult male dataset — such
          as female reproductive organs, thyroid parenchyma, microscopic nephrons, or inner-ear
          ossicles — the interface explicitly marks it as partial or planned for future verified
          expansion.
        </p>
        <p>
          <strong>Educational Disclaimer:</strong> Anatomy 360 is an educational learning reference
          and is not intended for clinical diagnosis, medical advice, or surgical planning.
        </p>
      </section>

      <section className="a360-prose-block">
        <h2>Localization Architecture (English & Future Urdu Support)</h2>
        <p>
          All canonical anatomical identifiers (<code>FMA</code> concept IDs and{' '}
          <code>BodyParts3D</code> part IDs) are strictly decoupled from displayed language strings.
          Content modules store localized text objects ready for future Urdu anatomical explanations
          and bilingual study notes without altering 3D mesh bindings or medical accuracy.
        </p>
      </section>

      <section className="a360-prose-block">
        <h2>Third-Party Licenses & Required Attribution</h2>
        <div className="a360-license-list">
          <div className="a360-license-item">
            <h3>BodyParts3D 4.0 (3D Anatomical Meshes & FMA Hierarchy)</h3>
            <p>
              BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0
              International (CC BY 4.0). Commercial use and adaptation permitted with attribution.
            </p>
            <div className="a360-ext-links">
              <a
                href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html"
                target="_blank"
                rel="noreferrer"
              >
                Official Dataset License <ArrowUpRight size={14} />
              </a>
              <a
                href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html"
                target="_blank"
                rel="noreferrer"
              >
                BodyParts3D Archive <ArrowUpRight size={14} />
              </a>
              <a
                href="https://academic.oup.com/nar/article/37/suppl_1/D782/1000752"
                target="_blank"
                rel="noreferrer"
              >
                Source Publication (Mitsuhashi et al., 2009) <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          <div className="a360-license-item">
            <h3>Human Atlas (MIT License)</h3>
            <p>
              Core merged-batch Three.js WebGL shader architecture, binary chunk decoder, tap
              disambiguation, and exploded packing layout adapted from Human Atlas (MIT License).
            </p>
            <div className="a360-ext-links">
              <a href="https://github.com/ashemag/human-atlas" target="_blank" rel="noreferrer">
                Human Atlas Repository <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          <div className="a360-license-item">
            <h3>Open-Source Runtime & Visualization Dependencies</h3>
            <p>
              Anatomy 360 runs strictly offline-capable in the browser with zero paid API keys or
              proprietary subscriptions. Complete third-party notices are maintained in{' '}
              <code>THIRD_PARTY_LICENSES.md</code>.
            </p>
            <div className="a360-license-table-wrap">
              <table className="a360-license-table">
                <thead>
                  <tr>
                    <th>Asset / Package</th>
                    <th>Purpose</th>
                    <th>License</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>BodyParts3D 4.0 (DBCLS)</td>
                    <td>2,234 anatomical meshes &amp; FMA concepts</td>
                    <td>CC BY 4.0</td>
                  </tr>
                  <tr>
                    <td>Human Atlas (ashemag)</td>
                    <td>Merged-batch Three.js renderer &amp; bin loader</td>
                    <td>MIT</td>
                  </tr>
                  <tr>
                    <td>Three.js (`three`)</td>
                    <td>WebGL 3D scene engine &amp; orbit controls</td>
                    <td>MIT</td>
                  </tr>
                  <tr>
                    <td>React &amp; React DOM</td>
                    <td>Component UI framework</td>
                    <td>MIT</td>
                  </tr>
                  <tr>
                    <td>Base UI &amp; shadcn/ui primitives</td>
                    <td>Accessible sheets, switches, sliders &amp; combobox</td>
                    <td>MIT</td>
                  </tr>
                  <tr>
                    <td>Recharts</td>
                    <td>Dashboard study progress bar charts</td>
                    <td>MIT</td>
                  </tr>
                  <tr>
                    <td>Lucide React &amp; Tailwind CSS</td>
                    <td>Iconography &amp; styling system</td>
                    <td>ISC / MIT</td>
                  </tr>
                  <tr>
                    <td>meshoptimizer</td>
                    <td>Vertex/index compression decoder</td>
                    <td>MIT</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="a360-prose-block">
        <h2>Storage Privacy &amp; Offline Notes</h2>
        <p>
          All student profiles, completed lesson topics, SM-2 flashcard schedules, quiz scores,
          Practical Lab attempts, and saved bookmarks are persisted locally in your browser via{' '}
          <strong>IndexedDB</strong> (with automatic <code>localStorage</code> fallback). Export a{' '}
          <code>.json</code> backup anytime from the <strong>Study Dashboard</strong> to move data
          between devices. The 3D binary chunks (<code>/models/body-0..14.bin.gz</code>) load on
          demand over HTTP; once cached by the browser or served from static CDN storage, exploration
          works smoothly with minimal bandwidth.
        </p>
      </section>

      <div className="a360-about-cta">
        <button type="button" className="a360-btn-primary" onClick={onExplore}>
          Open 3D Anatomy Explorer
        </button>
      </div>
    </div>
  );
}
