const demoRoot = document.getElementById("demoRoot");

const state = {
  session: null,
  examples: [],
  summary: { total: 0, ccrtCount: 0, rtCount: 0, observeCount: 0 },
  keyword: "",
  filter: "all",
  selectedId: "",
  summaryText: "",
  analysis: null,
  busy: false,
  progress: { active: false, percent: 0, label: "" },
  notice: { message: "", type: "" },
  loginError: "",
};

let progressTimer = null;

if (new URLSearchParams(window.location.search).get("embedded") === "1") {
  document.body.classList.add("embedded");
}

function s(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanReportText(text) {
  return String(text || "").replace(/\*/g, "").trim();
}

function noticeHtml(message, type = "") {
  if (!message) {
    return "";
  }
  return `<div class="notice${type === "error" ? " error" : ""}">${s(message)}</div>`;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || "\u8bf7\u6c42\u5931\u8d25");
  }
  return payload;
}

function setBusy(flag, renderNow = true) {
  state.busy = flag;
  if (renderNow) {
    render();
  }
}

function getClass(type) {
  if (type === "ccrt") return "danger";
  if (type === "rt") return "success";
  return "neutral";
}

function getProgressLabel(percent) {
  if (percent < 24) return "\u6b63\u5728\u68c0\u67e5\u8f93\u5165\u5185\u5bb9";
  if (percent < 54) return "\u6b63\u5728\u62bd\u53d6\u5173\u952e\u5b57\u6bb5";
  if (percent < 82) return "\u6b63\u5728\u5339\u914d\u653e\u7597\u89c4\u5219";
  return "\u6b63\u5728\u6574\u7406\u5206\u6790\u62a5\u544a";
}

function resetProgress() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  state.progress = { active: false, percent: 0, label: "" };
}

function startProgress() {
  resetProgress();
  state.progress = { active: true, percent: 8, label: getProgressLabel(8) };
  render();
  progressTimer = setInterval(() => {
    const current = state.progress.percent;
    if (current >= 92) {
      return;
    }
    const step = current < 30 ? 7 : current < 60 ? 5 : current < 84 ? 3 : 1;
    const next = Math.min(92, current + step);
    state.progress = {
      active: true,
      percent: next,
      label: getProgressLabel(next),
    };
    updateProgressView();
  }, 180);
}

async function finishProgress(success) {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  state.progress = {
    active: true,
    percent: 100,
    label: success ? "\u5206\u6790\u5b8c\u6210" : "\u5206\u6790\u5931\u8d25",
  };
  updateProgressView();
  await new Promise((resolve) => setTimeout(resolve, 320));
  state.progress = { active: false, percent: 0, label: "" };
}

function updateProgressView() {
  const progress = document.querySelector(".analysis-progress");
  if (!progress) {
    render();
    return;
  }

  const percent = String(state.progress.percent);
  const percentText = progress.querySelector("[data-progress-percent]");
  const bar = progress.querySelector("[data-progress-bar]");
  const label = progress.querySelector("[data-progress-label]");
  if (percentText) {
    percentText.textContent = `${percent}%`;
  }
  if (bar) {
    bar.style.width = `${percent}%`;
  }
  if (label) {
    label.textContent = state.progress.label;
  }
}

function renderFilters() {
  return [
    ["all", "\u5168\u90e8"],
    ["ccrt", "\u540c\u6b65\u653e\u5316\u7597"],
    ["rt", "\u672f\u540e\u653e\u7597"],
    ["observe", "\u89c2\u5bdf\u968f\u8bbf"],
  ].map(([value, label]) => `<button type="button" data-filter="${value}" class="${state.filter === value ? "primary" : ""}"${state.busy ? " disabled" : ""}>${label}</button>`).join("");
}

function filteredExamples() {
  const keyword = state.keyword.trim().toLowerCase();
  return state.examples.filter((item) => {
    if (state.filter !== "all" && item.recommendationType !== state.filter) return false;
    if (!keyword) return true;
    return `${item.id}${item.title}${item.site}${item.pathology}${(item.tags || []).join("")}`.toLowerCase().includes(keyword);
  });
}

function renderExamples() {
  const items = filteredExamples();
  if (!items.length) {
    return `<div class="muted">\u6ca1\u6709\u5339\u914d\u7684\u6837\u672c\uff0c\u53ef\u4ee5\u66f4\u6362\u7b5b\u9009\u6761\u4ef6\u6216\u6e05\u7a7a\u641c\u7d22\u8bcd\u3002</div>`;
  }

  return items.map((item) => `
    <article class="card${state.selectedId === item.id ? " active" : ""}">
      <div class="actions">
        <span class="badge">${s(item.id)}</span>
        <span class="badge">${s(item.recommendationTitle)}</span>
      </div>
      <strong>${s(item.title)}</strong>
      <p>${s(`${item.site} / ${item.pathology}`)}</p>
      <div class="badges">${(item.tags || []).slice(0, 4).map((tag) => `<span class="chip">${s(tag)}</span>`).join("")}</div>
      <div class="actions">
        <button type="button" data-load="${item.id}"${state.busy ? " disabled" : ""}>\u8f7d\u5165\u6837\u672c</button>
        <button type="button" class="primary" data-analyze="${item.id}"${state.busy ? " disabled" : ""}>\u8f7d\u5165\u5e76\u5206\u6790</button>
      </div>
    </article>
  `).join("");
}

function renderProgress() {
  if (!state.progress.active) {
    return "";
  }

  return `
    <div class="analysis-progress" aria-live="polite">
      <div class="analysis-progress-head">
        <strong>\u5206\u6790\u8fdb\u5ea6</strong>
        <span data-progress-percent>${s(String(state.progress.percent))}%</span>
      </div>
      <div class="analysis-progress-track">
        <span data-progress-bar style="width:${s(String(state.progress.percent))}%"></span>
      </div>
      <div class="analysis-progress-text" data-progress-label>${s(state.progress.label)}</div>
    </div>
  `;
}

function renderResult() {
  const analysis = state.analysis;
  if (!analysis) {
    return `<div class="muted">\u7c98\u8d34\u51fa\u9662\u5c0f\u7ed3\u540e\u70b9\u201c\u5f00\u59cb\u5206\u6790\u201d\uff0c\u6216\u5728\u53f3\u4fa7\u70b9\u201c\u8f7d\u5165\u5e76\u5206\u6790\u201d\u3002</div>`;
  }

  const warnings = Array.isArray(analysis.warnings) ? analysis.warnings : [];
  return `
    <div class="result-hero ${getClass(analysis.recommendationType)}">
      <div class="result-title">
        <div class="muted">\u7ed3\u8bba</div>
        <h2 class="result-heading">${s(analysis.recommendationTitle || "")}</h2>
      </div>
      <p class="result-summary">${s(analysis.recommendationSummary || "")}</p>
    </div>

    ${warnings.length ? `
      <div class="result-section">
        <div class="section-head">
          <h3>\u94fe\u8def\u63d0\u9192</h3>
          <p>AI \u67d0\u4e00\u6b65\u5931\u8d25\u65f6\uff0c\u7cfb\u7edf\u4f1a\u81ea\u52a8\u5207\u56de\u53ef\u7528\u7684\u5162\u5e95\u65b9\u5f0f\u3002</p>
        </div>
        <div class="stack">${warnings.map((item) => `<div class="item">${s(item)}</div>`).join("")}</div>
      </div>
    ` : ""}

    <div class="result-section">
      <div class="section-head">
        <h3>\u6d4b\u8bc4\u7ed3\u679c</h3>
      </div>
      <pre>${s(cleanReportText(analysis.reportText || ""))}</pre>
    </div>

    <div class="result-section">
      <div class="section-head">
        <h3>\u7ed3\u6784\u5316\u63d0\u53d6\u7ed3\u679c</h3>
      </div>
      <table>
        <thead><tr><th>\u9879\u76ee</th><th>\u63d0\u53d6\u503c</th><th>\u8bc1\u636e\u7247\u6bb5</th></tr></thead>
        <tbody>${(analysis.extractedElements || []).map((item) => `<tr><td>${s(item.label)}</td><td>${s(item.value)}</td><td>${s(item.evidence || "-")}</td></tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}

function renderLogin() {
  return `
    <div class="page">
      <section class="hero">
        <h1>\u5934\u9888\u90e8\u9cde\u764c\u672f\u540e\u653e\u7597\u9002\u5e94\u8bc1\u6f14\u793a</h1>
        <p>\u8fd9\u7248\u4e25\u683c\u6309\u201c\u51fa\u9662\u5c0f\u7ed3 -> AI \u62bd JSON -> if/else \u51b3\u7b56 -> \u6d4b\u8bc4\u7ed3\u679c\u201d\u8fd9\u6761\u94fe\u8def\u6765\u8dd1\u3002</p>
      </section>

      <section class="panel">
        <div class="section-head">
          <h2>\u533b\u751f\u767b\u5f55</h2>
          <p>\u8fd9\u4e2a\u6f14\u793a\u9875\u76f4\u63a5\u590d\u7528\u4f60\u7a0b\u5e8f\u91cc\u7684\u767b\u5f55\u63a5\u53e3\u3002</p>
        </div>
        <form class="login" id="loginForm">
          <input id="usernameInput" value="doctor001" placeholder="\u533b\u751f\u8d26\u53f7">
          <input id="passwordInput" type="password" value="med1234" placeholder="\u767b\u5f55\u5bc6\u7801">
          <div class="actions">
            <button class="primary" type="submit">${state.busy ? "\u767b\u5f55\u4e2d..." : "\u8fdb\u5165\u6f14\u793a\u9875"}</button>
          </div>
          ${noticeHtml(state.loginError, "error")}
        </form>
      </section>
    </div>
  `;
}

function renderApp() {
  return `
    <div class="page">
      ${noticeHtml(state.notice.message, state.notice.type)}
      <div class="layout">
        <section class="panel workspace-panel">
          <div class="workspace-head">
            <h3>\u51fa\u9662\u5c0f\u7ed3</h3>
            <div class="helper">\u5de6\u4fa7\u7c98\u8d34\uff0c\u53f3\u4fa7\u53ef\u76f4\u63a5\u8f7d\u5165\u6837\u672c</div>
          </div>
          <textarea id="summaryInput" placeholder="\u7c98\u8d34\u672f\u540e\u51fa\u9662\u5c0f\u7ed3\uff0c\u6216\u4ece\u53f3\u4fa7\u8f7d\u5165\u6837\u672c\u540e\u5206\u6790"${state.busy ? " disabled" : ""}>${s(state.summaryText)}</textarea>
          <div class="workspace-actions">
            <div class="action-hint">\u8f93\u5165\u5185\u5bb9\u540e\u76f4\u63a5\u70b9\u201c\u5f00\u59cb\u5206\u6790\u201d</div>
            <div class="action-buttons">
              <button class="primary" type="button" id="analyzeButton" ${state.busy ? "disabled" : ""}>${state.busy ? "\u5206\u6790\u4e2d..." : "\u5f00\u59cb\u5206\u6790"}</button>
              <button type="button" id="clearButton"${state.busy ? " disabled" : ""}>\u6e05\u7a7a</button>
            </div>
          </div>
          ${renderProgress()}
          ${renderResult()}
        </section>

        <aside class="panel">
          <div class="section-head">
            <h3>\u6837\u672c\u5e93</h3>
          </div>
          <input id="searchInput" value="${s(state.keyword)}" placeholder="\u641c\u7d22\u75c5\u4f8b\u7f16\u53f7 / \u90e8\u4f4d / \u75c5\u7406"${state.busy ? " disabled" : ""}>
          <div class="filters">${renderFilters()}</div>
          <div class="examples">${renderExamples()}</div>
        </aside>
      </div>
    </div>
  `;
}

function render() {
  demoRoot.innerHTML = state.session ? renderApp() : renderLogin();
  bindEvents();
}

function bindEvents() {
  document.getElementById("loginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.loginError = "";
    setBusy(true);
    try {
      const payload = await requestJson("/api/login", {
        method: "POST",
        body: JSON.stringify({
          role: "doctor",
          username: document.getElementById("usernameInput").value.trim(),
          password: document.getElementById("passwordInput").value.trim(),
          remember: true,
        }),
      });
      state.session = payload;
      await loadExamples();
      state.notice = { message: "\u5df2\u8fdb\u5165\u6f14\u793a\u9875\u3002", type: "" };
    } catch (error) {
      state.loginError = error.message || "\u767b\u5f55\u5931\u8d25";
    } finally {
      setBusy(false);
    }
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter || "all";
      render();
    });
  });

  document.querySelectorAll("[data-load]").forEach((button) => {
    button.addEventListener("click", () => {
      loadIntoWorkspace(button.dataset.load);
    });
  });

  document.querySelectorAll("[data-analyze]").forEach((button) => {
    button.addEventListener("click", async () => {
      loadIntoWorkspace(button.dataset.analyze, { renderNow: false });
      await analyzeCurrent();
    });
  });

  document.getElementById("searchInput")?.addEventListener("input", (event) => {
    state.keyword = event.target.value;
    render();
  });

  document.getElementById("summaryInput")?.addEventListener("input", (event) => {
    state.summaryText = event.target.value;
  });

  document.getElementById("analyzeButton")?.addEventListener("click", analyzeCurrent);
  document.getElementById("clearButton")?.addEventListener("click", () => {
    state.selectedId = "";
    state.summaryText = "";
    state.analysis = null;
    state.notice = { message: "", type: "" };
    render();
  });
}

async function loadExamples() {
  const payload = await requestJson("/api/radiotherapy-decision/examples");
  state.examples = Array.isArray(payload.examples) ? payload.examples : [];
  state.summary = payload.summary || state.summary;
}

function loadIntoWorkspace(id, options = {}) {
  const { renderNow = true } = options;
  const item = state.examples.find((example) => example.id === id);
  if (!item) return;
  state.selectedId = item.id;
  state.summaryText = item.summaryText || "";
  state.analysis = null;
  state.notice = { message: `\u5df2\u8f7d\u5165\u6837\u4f8b ${item.id}\u3002`, type: "" };
  if (renderNow) {
    render();
  }
}

async function analyzeCurrent() {
  state.summaryText = document.getElementById("summaryInput")?.value || state.summaryText || "";
  if (!state.summaryText.trim()) {
    state.notice = { message: "\u8bf7\u5148\u8f93\u5165\u6216\u751f\u6210\u51fa\u9662\u5c0f\u7ed3\u3002", type: "error" };
    render();
    return;
  }

  setBusy(true, false);
  startProgress();
  try {
    const payload = await requestJson("/api/radiotherapy-decision/analyze", {
      method: "POST",
      body: JSON.stringify({ text: state.summaryText, caseId: state.selectedId }),
    });
    state.analysis = payload.analysis || null;
    state.notice = { message: "\u5206\u6790\u5b8c\u6210\u3002", type: "" };
    await finishProgress(true);
  } catch (error) {
    state.notice = { message: error.message || "\u5206\u6790\u5931\u8d25", type: "error" };
    await finishProgress(false);
  } finally {
    setBusy(false);
  }
}

async function bootstrap() {
  render();
  try {
    const payload = await requestJson("/api/session");
    if (payload.role === "doctor") {
      state.session = payload;
      await loadExamples();
      render();
    }
  } catch (error) {
    // stay on login view
  }
}

bootstrap();
