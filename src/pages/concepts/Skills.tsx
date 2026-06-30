import { Link } from 'react-router-dom';
import {
  FolderTree, ScanSearch, Layers, FileCode2, Boxes, Target,
  Hammer, Landmark, Code2, AlertTriangle, ShieldCheck,
  GitBranch, GitPullRequest, PackageCheck, FlaskConical, Rocket, Activity,
  ListChecks, Library, Wrench, Building2, CircleAlert, ExternalLink,
  BookOpen, Sparkles,
} from 'lucide-react';

const CORE_IDEAS = [
  {
    icon: <FolderTree size={18} />,
    title: 'A folder with a SKILL.md',
    text: 'The simplest skill is a directory containing one SKILL.md file — YAML front matter for discovery, Markdown body for execution.',
  },
  {
    icon: <ScanSearch size={18} />,
    title: 'Progressive disclosure',
    text: 'The agent discovers lightweight metadata, activates the full body when the task matches, and loads resources only when needed.',
  },
  {
    icon: <Layers size={18} />,
    title: 'Skill is not a tool',
    text: 'A tool gives the agent an action it can perform. A skill gives the agent a repeatable way to perform a task well.',
  },
  {
    icon: <FileCode2 size={18} />,
    title: 'YAML to find, Markdown to run',
    text: 'Front matter (name, description) drives routing and discovery; the Markdown instructions drive how the work is actually done.',
  },
  {
    icon: <Boxes size={18} />,
    title: 'Scripts, references, assets',
    text: 'Advanced skills add scripts/ helpers, references/ for deeper detail, and assets/ templates — pulled in on demand, not up front.',
  },
  {
    icon: <Target size={18} />,
    title: 'The description carries the weight',
    text: 'A vague "Helps with PDFs" is like a recipe titled "Food". Good descriptions name concrete trigger terms and tasks.',
  },
];

const BUILD_USES = [
  'Azure, Microsoft Foundry, GitHub Copilot SDK, MCP, SDK, IaC, or framework guidance.',
  'Repeatable coding, migration, deployment, troubleshooting, and testing patterns.',
  'Developer onboarding into a stack with many product-specific best practices.',
];

const RUN_USES = [
  'Business procedures: block a credit card, handle a return, open a ticket, triage a claim.',
  'Domain policies, escalation rules, customer-verification steps, tone, and compliance.',
  'Knowledge routing: where FAQs live, which system owns a record, when to hand off.',
];

const FRONT_MATTER: [string, 'Yes' | 'No', string][] = [
  ['name', 'Yes', 'Lowercase letters, numbers, and hyphens; max 64 chars; must match the parent folder name.'],
  ['description', 'Yes', 'Max 1,024 chars; should say both what the skill does and when to use it.'],
  ['license', 'No', 'License name or bundled license file reference.'],
  ['compatibility', 'No', 'Runtime requirements such as intended agent, packages, or network access.'],
  ['metadata', 'No', 'Extra key-value metadata for owners, versions, classifications, or registry fields.'],
  ['allowed-tools', 'No', 'Experimental tool allow-list; support varies by agent implementation.'],
];

const DISCLOSURE: [string, string, string][] = [
  ['01', 'Discover', 'The agent sees only lightweight metadata such as name and description — cheap to keep in context.'],
  ['02', 'Activate', 'When the user task matches the description, the agent reads the full SKILL.md body.'],
  ['03', 'Load resources', 'Scripts, reference files, and assets are pulled in only when the step actually needs them.'],
];

const CONSUMPTION: [string, string, string][] = [
  ['Attach to a toolbox', 'Skills are attached to a Foundry Toolbox and exposed as MCP resources. Clients discover with resources/list and load with resources/read.', 'Agents that support MCP-style dynamic discovery.'],
  ['Direct download', 'Download a skill version into a hosted or local agent project so the exact bundle ships with the deployment.', 'Deterministic deployments that need the exact skill bundled.'],
];

const FLOW = [
  { icon: <GitBranch size={18} />, step: '01', lane: 'Source', label: 'Author in Git', text: 'Change SKILL.md with owner, description, resources, and policy.' },
  { icon: <GitPullRequest size={18} />, step: '02', lane: 'Gate', label: 'Review + validate', text: 'PR review, front matter checks, allowed tools, and eval evidence.' },
  { icon: <PackageCheck size={18} />, step: '03', lane: 'Registry', label: 'Publish SkillVersion', text: 'Create an immutable Foundry version for the approved candidate.' },
  { icon: <FlaskConical size={18} />, step: '04', lane: 'Stage', label: 'Pin and test', text: 'Run a staging agent against the exact candidate version.' },
  { icon: <Rocket size={18} />, step: '05', lane: 'Promote', label: 'Promote intentionally', text: 'Move default_version or update the production pin after approval.' },
  { icon: <Activity size={18} />, step: '06', lane: 'Operate', label: 'Observe runtime use', text: 'Track skill.loaded, skill.activated, version, agent, and outcome.' },
];

const GOOD_SKILLS = [
  { icon: <Target size={18} />, title: 'Precise description', text: 'Names concrete trigger words so the agent reliably knows when to activate it.' },
  { icon: <ListChecks size={18} />, title: 'Step-by-step common path', text: 'Clear instructions for the everyday case, not just abstract principles.' },
  { icon: <Code2 size={18} />, title: 'Examples of I/O', text: 'Sample inputs and expected outputs that anchor correct behavior.' },
  { icon: <CircleAlert size={18} />, title: 'Edge cases & do-nots', text: 'Explicit "do not do this" guidance for the failure modes that matter.' },
  { icon: <Library size={18} />, title: 'References split into files', text: 'Deeper detail in references/ rather than one giant SKILL.md.' },
  { icon: <Wrench size={18} />, title: 'Scripts with clear errors', text: 'Executable helpers that fail loudly and document their dependencies.' },
  { icon: <Building2 size={18} />, title: 'Ownership & provenance', text: 'Source repo/path/commit, support contact, allowed tools, and data classification.' },
  { icon: <FlaskConical size={18} />, title: 'Evals or smoke tests', text: 'Evidence the skill actually improves behavior before it reaches production.' },
];

const REPOS: [string, string, string][] = [
  ['github/awesome-copilot', 'https://github.com/github/awesome-copilot', 'Community collection of GitHub Copilot agents, instructions, skills, hooks, workflows, and plugins.'],
  ['microsoft/skills', 'https://github.com/microsoft/skills', 'Microsoft skills, custom agents, AGENTS.md templates, and MCP configs for Azure SDKs and Microsoft Foundry.'],
  ['anthropics/skills', 'https://github.com/anthropics/skills', "Anthropic's Claude-oriented skill examples, templates, and document skills."],
];

const SOURCES: [string, string, boolean][] = [
  ['Agent Skills overview', 'https://agentskills.io/home', true],
  ['Agent Skills specification', 'https://agentskills.io/specification', true],
  ['Agent Skills documentation index', 'https://agentskills.io/llms.txt', true],
  ['Use skills in Microsoft Foundry', 'https://learn.microsoft.com/azure/foundry/agents/how-to/tools/skills', true],
  ['Local lifecycle guidance', 'https://github.com/aiappsgbb/agentic-loop/blob/main/docs/concepts/SKILL-LIFECYCLE.md', true],
];

export default function Skills() {
  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Concept · Skills</div>
        <h1>Skills teach an agent how to do a task well — and reuse it.</h1>
        <p className="lede">
          An agent skill is a reusable capability package: at minimum a folder with a <code>SKILL.md</code> file that
          carries YAML front matter for discovery and Markdown instructions for execution. Think of a skill as a tested
          recipe card — the agent is the cook and tools are the appliances; the skill tells it <em>when</em> to act,
          <em> which</em> steps to follow, and what good output looks like.
        </p>
      </div>

      <div className="feature-grid">
        {CORE_IDEAS.map(item => (
          <div className="feature-card" key={item.title}>
            <div className="ic">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </div>

      <div className="callout">
        <div className="ic"><Layers size={20} /></div>
        <div>
          <h3>Tool vs skill: action versus repeatable method</h3>
          <p>
            A <Link to="/concepts/tools">tool</Link> gives the agent an action it can perform — query a database, call
            an API. A skill gives the agent a repeatable way to perform a task well. A recipe can say "use the oven at
            180&nbsp;°C"; it does not replace the oven. Skills sit beside tools inside an <Link to="/concepts/agents">agent</Link>.
          </p>
        </div>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">The most important distinction</div>
        <h2>Build skills vs run skills</h2>
        <p className="lede">
          Not every skill belongs in the same place. Use <strong>build skills</strong> for engineering work, and
          <strong> run skills</strong> for the agent&apos;s production business behavior.
        </p>
        <div className="split-compare">
          <div className="split-card is-build">
            <div className="split-card-head">
              <div className="split-card-icon"><Hammer size={22} /></div>
              <div>
                <span className="skill-phase-badge build">Build skill</span>
                <h3>Help builders ship software &amp; infra</h3>
              </div>
            </div>
            <p className="split-card-teach">How to build, test, deploy, or operate a specific technology stack.</p>
            <dl className="split-meta">
              <div><dt>Primary user</dt><dd>Builder, developer, platform engineer</dd></div>
              <div><dt>Where it lives</dt><dd>Dev environments — <code>.github/skills/</code>, <code>.code/</code>, <code>.claude/</code>, <code>.opencode/</code>, or a local skill/plugin install</dd></div>
              <div><dt>Example</dt><dd><code>microsoft-foundry</code> from <a href="https://github.com/microsoft/skills" target="_blank" rel="noreferrer">microsoft/skills</a> — guides a coding agent through Foundry services, hosted agents, toolboxes, models, and deployment patterns</dd></div>
            </dl>
            <div className="split-uses">
              <span className="split-uses-label">Use build skills for</span>
              <ul>{BUILD_USES.map(u => <li key={u}>{u}</li>)}</ul>
            </div>
          </div>

          <div className="split-card is-run">
            <div className="split-card-head">
              <div className="split-card-icon"><Landmark size={22} /></div>
              <div>
                <span className="skill-phase-badge run">Run skill</span>
                <h3>Help hosted agents do business work</h3>
              </div>
            </div>
            <p className="split-card-teach">How to perform a business process, follow domain policy, find knowledge, and respond consistently.</p>
            <dl className="split-meta">
              <div><dt>Primary user</dt><dd>Hosted business agent</dd></div>
              <div><dt>Where it lives</dt><dd>Hosted agent runtime — e.g. a GitHub Copilot SDK agent deployed as a Foundry Hosted Agent loading skills via Foundry Skills or Toolbox/MCP</dd></div>
              <div><dt>Example</dt><dd>A retail-banking skill: how to block a credit card, where FAQs live, when to escalate, and which customer-verification rules apply</dd></div>
            </dl>
            <div className="split-uses">
              <span className="split-uses-label">Use run skills for</span>
              <ul>{RUN_USES.map(u => <li key={u}>{u}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Anatomy</div>
        <h2>The standard SKILL.md shape</h2>
        <p className="lede">
          The <a href="https://agentskills.io/specification" target="_blank" rel="noreferrer">Agent Skills specification</a> defines
          a skill as a directory containing at least <code>SKILL.md</code>. Front matter drives discovery; the Markdown body drives execution.
        </p>
        <div className="code-sample">
          <div className="code-sample-head"><Code2 size={13} /> pdf-processing/SKILL.md</div>
          <pre>{`pdf-processing/
  SKILL.md
  scripts/
  references/
  assets/

# --- SKILL.md ---
---
name: pdf-processing
description: Extract PDF text, fill forms, and merge PDF files.
  Use when handling PDFs, forms, or document extraction.
---

# PDF processing

Follow these steps when the user asks for PDF extraction,
form filling, or merging...`}</pre>
        </div>
        <table className="compare-table" style={{ marginTop: 18 }}>
          <thead><tr><th>Field</th><th>Required</th><th>Notes</th></tr></thead>
          <tbody>
            {FRONT_MATTER.map(([field, req, notes]) => (
              <tr key={field}>
                <td><code>{field}</code></td>
                <td>{req}</td>
                <td>{notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">How loading works</div>
        <h2>Progressive disclosure in three steps</h2>
        <p className="lede">
          Skills avoid loading an entire knowledge base into every prompt. The agent reveals only what each stage needs —
          which is exactly why the <code>description</code> matters so much.
        </p>
        <div className="phase-grid">
          {DISCLOSURE.map(([num, title, text]) => (
            <div className="phase-card" key={num}>
              <span className="phase-num">{num}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Runtime distribution</div>
        <h2>Foundry Skills API</h2>
        <p className="lede">
          <a href="https://learn.microsoft.com/azure/foundry/agents/how-to/tools/skills" target="_blank" rel="noreferrer">Microsoft Foundry Skills</a> store
          SKILL.md content centrally for Foundry-connected agents — especially useful for governed run-skill distribution.
          There are two consumption modes.
        </p>
        <table className="compare-table">
          <thead><tr><th>Mode</th><th>How it works</th><th>Best fit</th></tr></thead>
          <tbody>
            {CONSUMPTION.map(([mode, how, fit]) => (
              <tr key={mode}><td>{mode}</td><td>{how}</td><td>{fit}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="lede" style={{ marginTop: 18 }}>
          Foundry Skills are versioned: every update creates an immutable <code>SkillVersion</code>, and the parent skill
          tracks <code>latest_version</code> and <code>default_version</code>. A toolbox can follow the default or pin an exact version.
        </p>
        <div className="callout">
          <div className="ic"><AlertTriangle size={20} /></div>
          <div>
            <h3>⚠️ Foundry Skills are currently preview</h3>
            <p>
              Treat them as a strong operating model for Foundry-heavy agent architectures, but pin versions and keep a
              fallback path for strict production / SLA requirements.
            </p>
          </div>
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Lifecycle &amp; governance</div>
        <h2>From authored source to governed runtime</h2>
        <p className="lede">
          Git stays the authoring source; Foundry Skills becomes the runtime registry for run skills. The pipeline moves a
          skill from a reviewed file to a pinned, observed production version.
        </p>
        <div className="lifecycle-diagram" aria-label="Skill governance lifecycle from Git to hosted runtime">
          <div className="lifecycle-rail" aria-hidden="true" />
          {FLOW.map((step, i) => (
            <div className="lifecycle-node" key={step.label}>
              <div className="lifecycle-marker">
                <span>{step.icon}</span>
              </div>
              <div className="lifecycle-node-body">
                <span className="lifecycle-kicker">{step.step} · {step.lane}</span>
                <h3>{step.label}</h3>
                <p>{step.text}</p>
              </div>
              {i < FLOW.length - 1 && <div className="lifecycle-connector" aria-hidden="true">→</div>}
            </div>
          ))}
        </div>

        <div className="callout">
          <div className="ic"><ShieldCheck size={20} /></div>
          <div>
            <h3>The governing principle</h3>
            <p>
              Git remains the authoring source; Foundry Skills becomes the runtime registry for run skills. Build skills can
              stay in developer tooling and repo-local folders. Production agents should not clone arbitrary public repos at
              runtime — pin exact run-skill versions for production.
            </p>
          </div>
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Quality bar</div>
        <h2>What good skills contain</h2>
        <div className="feature-grid">
          {GOOD_SKILLS.map(item => (
            <div className="feature-card" key={item.title}>
              <div className="ic">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Where to find them</div>
        <h2>Well-known skill repositories</h2>
        <div className="repo-grid">
          {REPOS.map(([name, url, why]) => (
            <a className="repo-card" key={name} href={url} target="_blank" rel="noreferrer">
              <div className="repo-card-head">
                <span className="repo-name">{name}</span>
                <ExternalLink size={14} />
              </div>
              <p>{why}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Go deeper</div>
        <h2>Source links</h2>
        <div className="source-links">
          {SOURCES.map(([label, href, external]) => (
            external ? (
              <a className="source-link" key={label} href={href} target="_blank" rel="noreferrer">
                <BookOpen size={14} /> <span>{label}</span> <ExternalLink size={13} />
              </a>
            ) : (
              <Link className="source-link" key={label} to={href}>
                <BookOpen size={14} /> <span>{label}</span>
              </Link>
            )
          ))}
        </div>
      </section>

      <div className="callout">
        <div className="ic"><Sparkles size={20} /></div>
        <div>
          <h3>Skills are the reusable unit of capability</h3>
          <p>
            Build skills live in your developer tooling and repos; run skills graduate into a governed Foundry runtime
            registry — versioned, evaluated, pinned, and observed like the production behavior they are.
          </p>
        </div>
      </div>
    </>
  );
}
