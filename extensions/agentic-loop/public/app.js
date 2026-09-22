const $ = id => document.getElementById(id);
const token = document.querySelector('meta[name="canvas-token"]').content;
const number = value => new Intl.NumberFormat().format(value ?? 0);
const money = (value, currency = "USD") => new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
let snapshot;
let projects = [];
let selected = null;
let activeTab = "setup";
let selectionRevision = 0;
let discovering = false;
let usageLoading = false;
let scenarioReturn = null;
let frontendsLoading = false;
let frontendsSignature;
let inventory = null;
const collapsedInventory = new Set(["resources"]);
const inventoryGroups = {
    agents: { title: "Agents", scope: "Project", empty: "No agents in this project yet.", hint: "Deploy an agent to see it here.", icon: '<rect x="4" y="7" width="16" height="13" rx="3"/><path d="M12 3v4M8 12h.01M16 12h.01M9 16h6"/>' },
    models: { title: "Model deployments", scope: "Foundry account", empty: "No model deployments in this account.", hint: "Deploy a model or select an account with an existing deployment.", icon: '<path d="m12 3 9 5v8l-9 5-9-5V8l9-5Zm0 9 9-4M12 12 3 8m9 4v9"/>' },
    tools: { title: "Toolboxes", scope: "Project", empty: "No toolboxes connected yet.", hint: "Publish tools and skills in a Foundry toolbox to make them available to agents.", icon: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12h18m-12-2v4m6-4v4"/>' },
    resources: { title: "Azure resources", scope: "Resource group", empty: "No resources returned for this resource group.", hint: "Check the selected project and refresh the inventory.", icon: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>' },
};
const loaded = new Set();

async function api(action, input = {}) {
    const response = await fetch("/api/action", {
        method: "POST", headers: { "Content-Type": "application/json", "X-Canvas-Token": token },
        body: JSON.stringify({ action, input }),
    });
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || `Request failed (${response.status}).`);
    return value;
}

function notice(message, error = false) {
    $("notice").hidden = false;
    $("notice").className = error ? "error" : "";
    $("notice").textContent = message;
}

async function busy(button, work) {
    if (button.disabled) return;
    button.disabled = true;
    try { await work(); }
    catch (error) { notice(error.message, true); }
    finally { button.disabled = false; }
}

function failure(container, error) {
    container.innerHTML = `<p class="error">${escape(error.message)} Refresh to retry.</p>`;
}

async function frontends() {
    if (frontendsLoading) return;
    frontendsLoading = true;
    try {
        const result = await api("frontends");
        const signature = JSON.stringify(result);
        if (signature === frontendsSignature) return;
        frontendsSignature = signature;
        $("build-mark").textContent = result.configured ? "✓" : "";
        $("build-mark").ariaLabel = result.configured ? "Frontend configured" : "No frontend configured";
        $("build-mark").title = "Based on LOCAL_FRONTEND or DEPLOYED_FRONTEND in workspace .env; not a health check.";
        const configured = result.frontends.filter(row => row.configured);
        $("frontend-links").innerHTML = configured.map(row => `<div class="inventory-row"><strong>${escape(row.label)}</strong>${row.error
            ? `<p class="error">${escape(row.error)}</p>`
            : `<span class="frontend-url">${escape(row.url)}</span><div class="actions"><button data-frontend="${escape(row.key)}" aria-label="Open ${escape(row.label)} in integrated browser">Open in integrated browser</button><a href="${escape(row.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escape(row.label)} in external browser">Open in external browser ↗</a></div>`}</div>`).join("") ||
            '<p class="muted">No frontend configured. Set LOCAL_FRONTEND or DEPLOYED_FRONTEND in the workspace root .env to open your app here.</p>';
    } catch (error) {
        frontendsSignature = undefined;
        $("build-mark").textContent = "";
        $("build-mark").ariaLabel = "Frontend configuration unavailable";
        $("build-mark").title = error.message;
        failure($("frontend-links"), error);
    } finally { frontendsLoading = false; }
}

async function setup() {
    $("checks").innerHTML = '<p class="loading">Checking skills, tools and Azure sign-in…</p>';
    $("setup-mark").textContent = "";
    try {
        const result = await api("setup");
        $("setup-mark").textContent = result.ready ? "✓" : "";
        $("setup-mark").ariaLabel = result.ready ? "Ready" : "Incomplete";
        $("checks").innerHTML = result.checks.map(check => `<div class="check"><span class="${check.status === "ready" ? "status-ok" : "status-warn"}" aria-label="${check.status === "ready" ? "Ready" : "Needs attention"}">${check.status === "ready" ? "✓" : "!"}</span><div><strong>${escape(check.label)}</strong><p class="muted">${escape(check.status === "ready" ? check.data : check.error)}</p></div></div>`).join("") +
            (result.discoveryError ? `<p class="error">${escape(result.discoveryError)}</p>` : "") +
            `<p class="muted">Checked ${escape(new Date(result.checkedAt).toLocaleTimeString())}</p>`;
    } catch (error) { failure($("checks"), error); }
}

function updateProject(project) {
    if (selected?.id !== project?.id) {
        inventory = null;
        $("inventory-toolbar").hidden = true;
        $("inventory").replaceChildren();
        $("inventory-updated").textContent = "";
        $("inventory-search").value = "";
        $("inventory-kind").value = "";
        collapsedInventory.clear();
        collapsedInventory.add("resources");
    }
    selected = project;
    selectionRevision++;
    $("project-name").textContent = project?.name ?? "Choose a project";
    $("resources-mark").textContent = project ? "✓" : "";
    $("resources-mark").ariaLabel = project ? "Project selected" : "No project selected";
    loaded.delete("explore");
    loaded.delete("cost");
    $("resource-context").innerHTML = project ? `<div class="context"><span class="muted">Resource group · ${escape(project.location)}</span><strong>${escape(project.resourceGroup)}</strong><p class="muted">This resource group will also host additional resources such as Application Insights and Container Apps.</p></div>` : "";
    renderProjects();
}

function renderProjects() {
    const query = $("project-search").value.toLowerCase();
    const filtered = projects.filter(project => `${project.name} ${project.account} ${project.resourceGroup}`.toLowerCase().includes(query));
    $("projects").innerHTML = filtered.map(project => `<button class="project-option" data-project="${escape(project.id)}" aria-pressed="${project.id === selected?.id}"><strong>${project.id === selected?.id ? "✓ " : ""}${escape(project.name)}</strong><small>${escape(project.account)} · ${escape(project.resourceGroup)}</small></button>`).join("") ||
        `<p class="muted">${projects.length ? "No matching projects. Try a different search." : "No Foundry projects found in this subscription. Create one below or choose another subscription."}</p>`;
}

async function monitoring() {
    const revision = selectionRevision;
    if (!selected) { $("monitoring").innerHTML = ""; return; }
    $("monitoring").innerHTML = '<p class="loading">Checking Application Insights connection…</p>';
    try {
        const result = await api("monitoring");
        if (revision !== selectionRevision) return;
        $("monitoring").innerHTML = result.connected
            ? `<p class="status-ok">✓ Application Insights connected: ${escape(result.names.join(", "))}</p><p class="muted">Connection detected; end-to-end telemetry still needs verification in your application.</p>`
            : '<div class="warning"><strong>Application Insights is not connected</strong><p>Add a project connection so traces and diagnostics have a home.</p><button data-prompt="insights">Connect in Chat</button></div>';
    } catch (error) {
        if (revision === selectionRevision) $("monitoring").innerHTML = `<div class="warning"><strong>Monitoring connection could not be verified</strong><p>${escape(error.message)}</p><button data-prompt="insights">Investigate in Chat</button></div>`;
    }
}

async function discover(subscriptionId) {
    if (discovering) return;
    discovering = true;
    $("subscription").disabled = true;
    $("projects").innerHTML = '<p class="loading">Discovering Foundry projects…</p>';
    try {
        const result = await api("discover", subscriptionId ? { subscriptionId } : {});
        projects = result.projects;
        $("subscription").innerHTML = result.subscriptions.map(row => `<option value="${escape(row.id)}">${escape(row.name)}</option>`).join("");
        $("subscription").value = result.selected?.subscriptionId ?? subscriptionId ?? snapshot.state.subscriptionId ?? result.subscriptions[0]?.id;
        updateProject(result.selected);
        if (result.warnings.length) notice(`Some resources could not be listed: ${result.warnings.join("; ")}`, true);
        await monitoring();
    } catch (error) {
        // Never keep a green check for a project whose current discovery failed.
        projects = [];
        updateProject(null);
        failure($("projects"), error);
        $("monitoring").innerHTML = "";
    } finally { discovering = false; $("subscription").disabled = false; }
}

function renderScenarios() {
    const query = $("scenario-search").value.toLowerCase();
    const industry = $("industry").value;
    const capability = $("capability").value;
    const rows = snapshot.scenarios.filter(row => (!industry || row.industry === industry) &&
        (!capability || row.tags.includes(capability) || row.capabilities?.includes(capability)) &&
        `${row.name} ${row.description} ${row.industry} ${row.tags.join(" ")}`.toLowerCase().includes(query));
    const sort = $("sort").value;
    rows.sort((a, b) => sort === "industry" ? a.industry.localeCompare(b.industry) || a.name.localeCompare(b.name) : (sort === "reverse" ? -1 : 1) * a.name.localeCompare(b.name));
    $("result-count").textContent = `${rows.length} ${rows.length === 1 ? "scenario" : "scenarios"}`;
    $("scenarios").innerHTML = rows.map(row => `<button class="scenario" data-scenario="${escape(row.id)}"><img src="/${escape(row.image)}" alt="" loading="lazy" width="480" height="270"><h3>${escape(row.name)}</h3><p>${escape(row.description)}</p><span class="industry">${escape(row.industry)} · Review prompt →</span></button>`).join("") ||
        '<p class="muted">No scenarios match these filters. Clear filters to see all scenarios.</p>';
}

function reviewScenario(id) {
    const scenario = snapshot.scenarios.find(row => row.id === id);
    scenarioReturn = { button: document.querySelector(`[data-scenario="${CSS.escape(id)}"]`), scrollY: window.scrollY };
    $("prompt-title").textContent = scenario.name;
    $("prompt-text").value = `Use the Agentic Loop skill to build this complete solution.\n\n${scenario.prompt}`;
    setScenarioReview(true);
    api("preferences", { draft: $("prompt-text").value }).catch(error => notice(error.message, true));
    window.scrollTo({ top: 0, behavior: "instant" });
    $("prompt-title").focus({ preventScroll: true });
}

function setScenarioReview(visible) {
    $("scenario-browser").hidden = visible;
    $("prompt-review").hidden = !visible;
}

function returnToScenarios() {
    setScenarioReview(false);
    if (activeTab === "build") {
        const target = scenarioReturn?.button?.isConnected ? scenarioReturn.button : $("scenario-search");
        target.focus({ preventScroll: true });
        window.scrollTo({ top: scenarioReturn?.scrollY ?? 0, behavior: "instant" });
    }
}

function table(headers, rows) {
    return `<div class="table-scroll" tabindex="0" aria-label="Scrollable data table"><table><thead><tr>${headers.map(header => `<th scope="col">${escape(header)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${escape(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function renderInventory() {
    if (!inventory) return;
    const query = $("inventory-search").value.trim().toLowerCase();
    const kind = $("inventory-kind").value;
    let count = 0;
    let errors = 0;
    const groups = Object.entries(inventoryGroups).filter(([key]) => !kind || key === kind).map(([key, group]) => {
        const list = inventory[key];
        const failed = list.status === "error";
        const rows = failed ? [] : list.data.filter(row =>
            `${row.name} ${row.detail ?? ""} ${(row.metadata ?? []).map(item => `${item.label} ${item.value}`).join(" ")}`.toLowerCase().includes(query))
            .sort((a, b) => a.name.localeCompare(b.name));
        count += rows.length;
        if (failed) errors++;
        if (query && !rows.length && !failed) return "";
        const expanded = failed || query || !collapsedInventory.has(key);
        const content = failed
            ? `<div class="inventory-empty"><p class="error">${escape(list.error)}</p><button data-inventory-retry>Retry resource discovery</button></div>`
            : rows.length ? `<ul class="resource-list">${rows.map(row => `<li class="resource-item"><div class="resource-content"><strong class="resource-name">${escape(row.name)}</strong>${row.metadata?.length
                ? `<dl class="resource-metadata">${row.metadata.map(item => `<div><dt>${escape(item.label)}</dt><dd>${escape(item.value)}</dd></div>`).join("")}</dl>`
                : `<p class="resource-description">${escape(row.detail)}</p>`}</div><div class="resource-actions">${row.playgroundUrl
                    ? `<a class="resource-test" href="${escape(row.playgroundUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Test ${escape(row.name)} in Foundry (opens in a new tab)">Test in Foundry <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/></svg></a>`
                    : ""}${key === "agents" ? `<button class="resource-test" data-inspect-agent="${escape(row.name)}" data-inspect-project="${escape(selected.id)}" title="Ask Copilot in Chat to launch Agent Inspector for this agent" aria-label="Inspect ${escape(row.name)} locally via Chat">Inspect locally</button>` : ""}</div></li>`).join("")}</ul>`
            : `<div class="inventory-empty"><strong>${escape(group.empty)}</strong><p>${escape(group.hint)}</p></div>`;
        return `<details class="inventory-section" data-inventory-group="${key}" ${expanded ? "open" : ""}>
            <summary><svg class="resource-icon" viewBox="0 0 24 24" aria-hidden="true">${group.icon}</svg><span class="inventory-heading"><span class="inventory-title">${group.title}</span><span class="inventory-scope">${group.scope}</span></span><span class="${failed ? "inventory-unavailable" : "inventory-badge"}">${failed ? "Unavailable" : query ? `${rows.length} / ${list.data.length}` : list.data.length}</span><svg class="inventory-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></summary>
            ${content}</details>`;
    }).join("");
    $("inventory-count").textContent = `${count} ${query ? "matching " : ""}${count === 1 ? "entry" : "entries"}${errors ? ` · ${errors} unavailable ${errors === 1 ? "section" : "sections"}` : ""}`;
    $("inventory").innerHTML = groups || '<div class="inventory-empty"><strong>No matching resources</strong><p>Try another name or clear the filters to see all resources.</p></div>';
}

async function explore() {
    const revision = selectionRevision;
    $("inventory-toolbar").hidden = true;
    $("inventory-updated").textContent = "";
    inventory = null;
    if (!selected) { $("inventory").innerHTML = '<p class="muted">Select a project on Resources to explore its resources.</p>'; return; }
    $("inventory").innerHTML = '<p class="loading">Reading your Foundry project…</p>';
    try {
        const result = await api("explore");
        if (revision !== selectionRevision) return;
        inventory = result;
        $("inventory-toolbar").hidden = false;
        renderInventory();
        $("inventory-updated").textContent = `Retrieved ${new Date(result.checkedAt).toLocaleTimeString()}. Private endpoints require network access. Testing in Foundry requires sign-in and can incur model or agent usage charges.`;
    } catch (error) { if (revision === selectionRevision) failure($("inventory"), error); }
}

async function usage() {
    if (usageLoading) return;
    usageLoading = true;
    try {
        const metrics = await api("usage");
        const rows = Object.entries(metrics.modelMetrics).filter(([, value]) => value).map(([name, value]) => [
            name, number(value.usage.inputTokens), number(value.usage.outputTokens), number(value.usage.cacheReadTokens),
            number(value.usage.cacheWriteTokens), value.usage.reasoningTokens == null ? "—" : number(value.usage.reasoningTokens), number(value.requests.count),
        ]);
        $("usage").innerHTML = rows.length ? table(["Model", "Input", "Output", "Cache read", "Cache write", "Reasoning", "Calls"], rows) : '<p class="muted">No usage recorded in this session yet.</p>';
        $("usage").innerHTML += `<p class="muted">${number(metrics.totalUserRequests)} user requests · ${(metrics.totalApiDurationMs / 1000).toFixed(1)}s model API time${metrics.totalNanoAiu == null ? "" : ` · ${number(metrics.totalNanoAiu / 1e9)} AI credits`}</p><p class="muted">Live Copilot session metrics; not Azure model usage or a USD charge. Cache and reasoning counters are separate API fields and are not added to a potentially overlapping total. Refreshes every 15 seconds while this tab is open.</p>`;
    } catch (error) { failure($("usage"), error); }
    finally { usageLoading = false; }
}

async function costs() {
    const revision = selectionRevision;
    const usagePromise = usage();
    if (!selected) { $("azure-cost").innerHTML = '<p class="muted">Select a project on Resources to query Azure spend.</p>'; await usagePromise; return; }
    $("azure-cost").innerHTML = '<p class="loading">Querying Azure Cost Management…</p>';
    try {
        const result = await api("cost");
        if (revision !== selectionRevision) return;
        $("azure-cost").innerHTML = result.rows.length ? table(["Service", "Actual cost"], result.rows.map(row => [row.service, money(row.amount, row.currency)])) : '<p class="muted">Azure returned no charges for this period. This does not guarantee zero cost.</p>';
        $("azure-cost").innerHTML += `<p class="muted">Retrieved ${escape(new Date(result.checkedAt).toLocaleTimeString())}</p>`;
    } catch (error) { if (revision === selectionRevision) failure($("azure-cost"), error); }
    await usagePromise;
}

async function loadTab(tab, force = false) {
    if (tab === "build" || tab === "explore" || force) await frontends();
    if (loaded.has(tab) && !force) return;
    loaded.add(tab);
    if (tab === "setup") await setup();
    if (tab === "resources" && (force || !projects.length)) await discover();
    if (tab === "explore") await explore();
    if (tab === "cost") await costs();
}

async function selectTab(tab) {
    activeTab = tab;
    for (const button of document.querySelectorAll("[data-tab]")) {
        const current = button.dataset.tab === tab;
        button.ariaSelected = String(current);
        button.tabIndex = current ? 0 : -1;
        $(button.dataset.tab).hidden = !current;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await api("preferences", { tab });
    await loadTab(tab);
}

document.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.tab) { selectTab(button.dataset.tab).catch(error => notice(error.message, true)); return; }
    if (button.dataset.scenario) { reviewScenario(button.dataset.scenario); return; }
    if (button.hasAttribute("data-inventory-retry")) { busy(button, explore); return; }
    if (button.hasAttribute("data-inspect-agent")) {
        busy(button, async () => {
            await api("inspect_agent", { agentName: button.dataset.inspectAgent, projectId: button.dataset.inspectProject });
            notice("Inspection request sent to Chat. Copilot will check prerequisites and launch Agent Inspector for this agent.");
        });
        return;
    }
    if (button.dataset.frontend) {
        busy(button, async () => {
            await api("open_frontend", { frontend: button.dataset.frontend });
            notice("App opened in the integrated browser.");
        });
        return;
    }
    if (button.dataset.project) {
        busy(button, async () => { updateProject(await api("select", { projectId: button.dataset.project })); await monitoring(); });
    }
    if (button.dataset.prompt) busy(button, async () => {
        await api("prompt", { kind: button.dataset.prompt, scope: $("scope").value });
        notice("Sent to Chat. Continue the guided workflow there.");
    });
});

document.querySelector("nav").addEventListener("keydown", event => {
    const buttons = [...document.querySelectorAll("[data-tab]")];
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
    if (event.key === "ArrowLeft") next = (index + buttons.length - 1) % buttons.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = buttons.length - 1;
    if (next !== undefined) { event.preventDefault(); buttons[next].focus(); selectTab(buttons[next].dataset.tab).catch(error => notice(error.message, true)); }
});
$("project-bar").onclick = () => selectTab("resources").catch(error => notice(error.message, true));
$("refresh").onclick = () => busy($("refresh"), () => loadTab(activeTab, true));
$("refresh-foundry").onclick = () => busy($("refresh-foundry"), async () => {
    await api("refresh_foundry");
    notice("Microsoft Foundry Canvas workspace state refreshed.");
});
$("subscription").onchange = () => discover($("subscription").value);
$("project-search").oninput = renderProjects;
$("inventory-search").oninput = renderInventory;
$("inventory-kind").onchange = renderInventory;
$("inventory-reset").onclick = () => {
    $("inventory-search").value = "";
    $("inventory-kind").value = "";
    renderInventory();
    $("inventory-search").focus();
};
$("inventory").addEventListener("toggle", event => {
    const key = event.target.dataset.inventoryGroup;
    if (!key || $("inventory-search").value.trim()) return;
    if (event.target.open) collapsedInventory.delete(key);
    else collapsedInventory.add(key);
}, true);
$("scope").onchange = () => api("preferences", { scope: $("scope").value }).catch(error => notice(error.message, true));
for (const id of ["scenario-search", "industry", "capability", "sort"]) $(id).addEventListener(id === "scenario-search" ? "input" : "change", renderScenarios);
$("clear-filters").onclick = () => {
    for (const id of ["scenario-search", "industry", "capability"]) $(id).value = "";
    $("sort").value = "name";
    renderScenarios();
};
let draftSave;
$("prompt-text").oninput = () => {
    clearTimeout(draftSave);
    draftSave = setTimeout(() => api("preferences", { draft: $("prompt-text").value }).catch(error => notice(error.message, true)), 300);
};
$("cancel-prompt").onclick = () => {
    clearTimeout(draftSave);
    returnToScenarios();
    api("preferences", { draft: "" }).catch(error => notice(error.message, true));
};
$("send-prompt").onclick = () => busy($("send-prompt"), async () => {
    clearTimeout(draftSave);
    await api("prompt", { kind: "custom", text: $("prompt-text").value });
    await api("preferences", { draft: "" });
    returnToScenarios();
    notice("Starting prompt sent to Chat. Your selected project is included.");
});
$("estimate-form").onsubmit = event => {
    event.preventDefault();
    busy(event.submitter, async () => {
        const values = Object.fromEntries([...new FormData(event.target)].map(([key, value]) => [key, Number(value)]));
        await api("estimate", values);
        $("estimate-result").textContent = "Estimate request sent to Chat with your workload. Copilot will use the Azure Retail Prices API to look up rates and calculate the breakdown.";
    });
};

async function start() {
    const response = await fetch("/api/state", { headers: { "X-Canvas-Token": token } });
    snapshot = await response.json();
    if (!response.ok) throw new Error(snapshot.error);
    $("scope").value = snapshot.state.scope;
    if (snapshot.state.draft) {
        $("prompt-text").value = snapshot.state.draft;
        setScenarioReview(true);
    }
    for (const [id, values] of [
        ["industry", snapshot.scenarios.map(row => row.industry)],
        ["capability", snapshot.scenarios.flatMap(row => [...row.tags, ...(row.capabilities ?? [])])],
    ]) for (const value of [...new Set(values)].sort()) $(id).add(new Option(value, value));
    if (snapshot.state.estimate) for (const key of ["inputMillions", "outputMillions", "agentHours"]) {
        if (snapshot.state.estimate[key] != null) $("estimate-form").elements[key].value = snapshot.state.estimate[key];
    }
    renderScenarios();
    const initialTab = snapshot.state.tab ?? "setup";
    // Always run readiness and resource discovery on open, including restored tabs.
    loaded.add("setup");
    loaded.add("resources");
    const initial = Promise.all([setup(), discover(), frontends()]);
    await selectTab(["explore", "cost"].includes(initialTab) ? "setup" : initialTab);
    await initial;
    if (["explore", "cost"].includes(initialTab)) await selectTab(initialTab);
    setInterval(() => { if (activeTab === "cost" && !document.hidden) usage(); }, 15_000);
    setInterval(() => { if (!document.hidden) frontends(); }, 5_000);
    window.addEventListener("focus", () => frontends());
}
start().catch(error => notice(`Canvas initialization failed: ${error.message}`, true));
