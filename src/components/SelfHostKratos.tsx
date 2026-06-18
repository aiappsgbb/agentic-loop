import { useState } from 'react';
import {
  ServerCog, ShieldCheck, Sparkles, Copy, Check, Terminal, ExternalLink,
  GitBranch, KeyRound,
} from 'lucide-react';

const KRATOS_REPO = 'https://github.com/kmavrodis/kratos-agent';

// A single, self-contained prompt the user pastes into GitHub Copilot CLI so it
// clones + deploys a private Kratos into their own Azure subscription end to end —
// no manual steps required from the user beyond answering Copilot's questions.
const COPILOT_PROMPT = `You are helping me self-host **Kratos** — an open-source reference AI agent — as a private internal tool in my own Azure subscription. Do the work end to end and only stop to ask me when you genuinely need a decision or a secret.

Repository: ${KRATOS_REPO}
Goal: a working, PRIVATE deployment of Kratos in a SEPARATE Azure subscription from any shared/demo environment, for internal use by my team.

Please:
1. Verify prerequisites are installed and working: Azure Developer CLI (azd >= 1.12), Azure CLI (az), Docker (running), Node.js 20+, Python 3.11+. If any are missing, give me the install command for my OS and wait.
2. Clone and enter the repo in the current directory:
   git clone ${KRATOS_REPO} && cd kratos-agent
3. Ask me which Azure tenant and subscription to deploy into — this must be my internal/team subscription, NOT a shared demo one. Then sign in and target it:
   - azd auth login  (and az login) against that tenant
   - confirm with \`az account show\`, then \`az account set --subscription <id>\` and \`azd env set AZURE_SUBSCRIPTION_ID <id>\`
4. Create a fresh azd environment for this deployment, e.g. \`azd env new kratos-internal\`, and choose an Azure region with capacity for Azure OpenAI and the models the repo requires.
5. Avoid the known interactive-hang gotcha by running \`azd env set KRATOS_AUTO_UPLOAD_USE_CASES 1\` before deploying (uploads all use-cases non-interactively).
6. Deploy everything with \`azd up\`. This provisions ~15 Azure services, builds the containers, deploys the hosted agent to Microsoft Foundry, and serves the frontend. If a step fails, read the error, check the repo's README "Troubleshooting" section, fix it, and retry — don't hand the raw error back to me unless you are truly blocked.
7. After \`azd up\` succeeds, walk me through the ONE step that can't be automated: registering the agent in Foundry (ai.azure.com -> project -> Operate -> Agents -> + Register agent -> Custom Agent; Name = kratos-agent, select the provisioned APIM gateway, Container App URL as backend, kratos-agent as API path). Run \`azd env get-values | grep -E 'AGENT_SERVICE|GATEWAY'\` and give me the exact values to paste.
8. Because this is an INTERNAL tool, recommend and where possible apply access controls: restrict the frontend/Static Web App to my Entra tenant, keep the APIM gateway private, and confirm there is no anonymous public access. Summarize exactly what is exposed and how to lock it down further.
9. Finally, print the deployed URL, the resource group name, and a short cheat-sheet for redeploying (\`azd deploy\`) and tearing down (\`azd down\`).

Keep me posted with short status updates, but prefer to keep going rather than asking for confirmation at every step.`;

const MANUAL_STEPS = `git clone ${KRATOS_REPO} && cd kratos-agent
azd auth login                       # sign in to your internal tenant
azd env new kratos-internal          # a fresh, isolated environment
azd env set AZURE_SUBSCRIPTION_ID <your-internal-sub-id>
azd env set KRATOS_AUTO_UPLOAD_USE_CASES 1   # avoids interactive postdeploy hang
azd up                               # provisions ~15 services + deploys`;

export default function SelfHostKratos() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(c => (c === key ? null : c)), 1600);
    } catch (err) {
      console.warn('Clipboard copy failed', err);
    }
  }

  return (
    <div className="selfhost">
      <div className="kratos-launcher-head">
        <div className="kratos-launcher-mark"><ServerCog size={18} /></div>
        <div>
          <h3>Self-host Kratos <span className="wtuw-badge">Internal tool</span></h3>
          <p>
            Run your own private Kratos in a <strong>separate Azure subscription</strong> for your team.
            The fastest path: hand it to GitHub Copilot and let it clone and deploy for you — no manual steps.
          </p>
        </div>
      </div>

      <div className="selfhost-primary">
        <div className="selfhost-step-tag"><Sparkles size={13} /> Recommended · let Copilot do it</div>
        <p className="selfhost-lede">
          Open an empty folder, start GitHub Copilot CLI, and paste the prompt. Copilot checks prerequisites,
          clones the repo, targets your subscription, and runs <code>azd up</code> — pausing only when it needs a decision.
        </p>

        <div className="code-block">
          <div className="code-block-head">
            <span><Terminal size={13} /> Start GitHub Copilot</span>
            <button className="ghost-btn" onClick={() => copy('copilot', 'cli')}>
              {copied === 'cli' ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>
          <pre>copilot</pre>
        </div>

        <div className="prompt-preview">
          <div className="prompt-preview-head">
            <Sparkles size={14} /> Copilot prompt — clone &amp; deploy Kratos
            <button className="ghost-btn" onClick={() => copy(COPILOT_PROMPT, 'prompt')}>
              {copied === 'prompt' ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy prompt</>}
            </button>
          </div>
          <pre>{COPILOT_PROMPT}</pre>
        </div>
      </div>

      <details className="selfhost-manual">
        <summary><GitBranch size={14} /> Prefer to run it yourself? Manual steps</summary>
        <div className="selfhost-manual-body">
          <p className="selfhost-lede">
            One-command deploy with the <a href="https://learn.microsoft.com/azure/developer/azure-developer-cli/" target="_blank" rel="noreferrer">Azure Developer CLI</a>.
            Requires azd ≥ 1.12, Azure CLI, Docker, Node 20+, and Python 3.11+.
          </p>
          <div className="code-block">
            <div className="code-block-head">
              <span>Clone &amp; deploy to your subscription</span>
              <button className="ghost-btn" onClick={() => copy(MANUAL_STEPS, 'manual')}>
                {copied === 'manual' ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
            <pre>{MANUAL_STEPS}</pre>
          </div>
          <p className="selfhost-note">
            <KeyRound size={13} /> After <code>azd up</code>, there is one manual step — register the agent in the
            Foundry portal (Operate → Agents → Register agent) so traces appear. Run
            <code>azd env get-values | grep AGENT_SERVICE</code> for the URL and gateway values.
          </p>
        </div>
      </details>

      <div className="selfhost-foot">
        <p className="selfhost-note">
          <ShieldCheck size={13} /> <strong>Keep it internal.</strong> Deploy into a dedicated subscription, restrict the
          frontend to your Entra tenant, and keep the APIM gateway private — Copilot will recommend and apply these for you.
        </p>
        <a className="kratos-cta" href={KRATOS_REPO} target="_blank" rel="noreferrer">
          View the repo <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}
