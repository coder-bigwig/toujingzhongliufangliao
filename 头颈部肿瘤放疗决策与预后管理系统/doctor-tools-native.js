(() => {
  function buildToolConfig(proxyKey) {
    const proxyBaseUrl = `/doctor-tool-proxy/${proxyKey}`;
    // Route result images through the main service as well. This keeps the
    // workbench usable behind one origin and lets the server report a clear
    // unavailable-service response when the optional Python worker is absent.
    const assetBaseUrl = proxyBaseUrl;
    return {
      assetBaseUrl,
      proxyBaseUrl,
      serviceUrl: proxyBaseUrl,
      standaloneUrl: `${assetBaseUrl}/`,
      portLabel: `${window.location.host}${proxyBaseUrl}`,
    };
  }

  const toolConfig = {
    targetContouring: {
      title: "靶区勾画",
      subtitle: "",
      ...buildToolConfig("targetContouring"),
    },
    dosePrediction: {
      title: "剂量预测",
      subtitle: "医生端原生工作台，支持演练病例与同格式病例包上传。",
      ...buildToolConfig("dosePrediction"),
    },
  };

  const splitLabels = {
    train: "训练集",
    validation: "验证集",
    test: "测试集",
    upload: "导入病例",
  };

  const state = {
    targetContouring: {
      loaded: false,
      loading: false,
      meta: null,
      error: "",
      running: false,
      progress: 0,
      progressMessage: "",
      progressTimer: null,
      selectedCaseId: "",
      selectedProfileId: "",
      summary: null,
      previewSummary: null,
      visibleSlices: 0,
    },
    dosePrediction: {
      loaded: false,
      loading: false,
      meta: null,
      error: "",
      running: false,
      progress: 0,
      progressMessage: "",
      pollTimer: null,
      currentJobId: "",
      split: "validation",
      patientId: "",
      checkpointPath: "",
      uploadCheckpointPath: "",
      summary: null,
      sliceIndex: 0,
      selectedStructure: "",
      chart: null,
    },
  };

  let chartPromise = null;
  const contourEditorInstances = new Map();
  const maskRevisionEditors = new Map();
  const maskRevisionMetaCache = new Map();
  const maskRevisionSliceCache = new Map();
  let contourEditorResizeBound = false;
  let maskRevisionResizeBound = false;

  function getTool(moduleKey) {
    return toolConfig[moduleKey] || null;
  }

  function getState(moduleKey) {
    return state[moduleKey] || null;
  }

  function formatError(payload, fallback) {
    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.detail)) {
        const messages = payload.detail.map((item) => item?.msg || JSON.stringify(item)).filter(Boolean);
        if (messages.length) return messages.join("；");
      }
      if (payload.detail) return String(payload.detail);
      if (payload.message) return String(payload.message);
    }
    if (typeof payload === "string" && payload.trim()) return payload.trim();
    return fallback;
  }

  async function requestTool(moduleKey, path, options = {}) {
    const tool = getTool(moduleKey);
    if (!tool) throw new Error("未找到模块配置。");
    const response = await fetch(`${tool.proxyBaseUrl}${path}`, options);
    const type = String(response.headers.get("content-type") || "");
    const payload = type.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      throw new Error(formatError(payload, `${tool.title}请求失败。`));
    }
    return payload;
  }

  function refreshModuleView(moduleKey) {
    if (currentRole !== "doctor" || activeModuleKey !== moduleKey) {
      return;
    }
    const doseState = getState("dosePrediction");
    if (doseState?.chart) {
      doseState.chart.destroy();
      doseState.chart = null;
    }
    renderMetrics(currentRole);
    renderModuleContent();
    if (moduleKey === "targetContouring") {
      queueMicrotask(() => {
        initMaskRevisionEditors();
        initContouringEditor();
      });
    }
    if (moduleKey === "dosePrediction") {
      queueMicrotask(() => {
        updateDoseSliceViewer();
        syncDoseChart();
      });
    }
  }

  function getDosePatients(meta, split) {
    return meta?.patients_by_split?.[split] || [];
  }

  function getDoseCaseNumber(toolState, patientId) {
    const ids = getDosePatients(toolState.meta, toolState.split);
    const index = ids.indexOf(patientId);
    return index >= 0 ? index + 1 : null;
  }

  function getContouringCaseNumber(toolState, caseId) {
    const cases = toolState?.meta?.cases || [];
    const index = cases.findIndex((item) => item.case_id === caseId);
    if (index >= 0) return index + 1;
    const archivedIndex = (toolState?.meta?.archived_case_ids || []).indexOf(caseId);
    return archivedIndex >= 0 ? archivedIndex + 1 : null;
  }

  function getContouringSelectedCase(toolState, caseId) {
    const cases = toolState?.meta?.cases || [];
    return cases.find((item) => item.case_id === caseId) || cases[0] || null;
  }

  function getContouringSelectedProfile(toolState, profileId) {
    const profiles = toolState?.meta?.profiles || [];
    return profiles.find((item) => item.profile_id === profileId) || profiles[0] || null;
  }

  function getContouringSliceCount(caseItem, summary) {
    const caseSlices = Number(caseItem?.shape?.[2]);
    const summarySlices = Number(summary?.slice_count || summary?.shape?.[2]);
    if (Number.isFinite(caseSlices) && caseSlices > 0) return Math.round(caseSlices);
    if (Number.isFinite(summarySlices) && summarySlices > 0) return Math.round(summarySlices);
    return 24;
  }

  function createContouringPreviewSummary(formElement) {
    const toolState = getState("targetContouring");
    const formData = formElement ? new FormData(formElement) : null;
    const requestedCaseId = String(formData?.get("case_id") || toolState.selectedCaseId || toolState.meta?.cases?.[0]?.case_id || "").trim();
    const requestedProfileId = String(formData?.get("profile_id") || toolState.selectedProfileId || toolState.meta?.recommended_profile_id || toolState.meta?.profiles?.[0]?.profile_id || "balanced_v1").trim();
    const caseItem = getContouringSelectedCase(toolState, requestedCaseId);
    const selectedProfile = getContouringSelectedProfile(toolState, requestedProfileId);
    const sameCaseSummary = [toolState.summary, toolState.meta?.latest_result_summary]
      .find((item) => item?.case_id && item.case_id === requestedCaseId);
    const seedSummary = sameCaseSummary || {};
    const sliceCount = getContouringSliceCount(caseItem, seedSummary);
    const initialVisibleSlices = Math.max(1, Math.min(sliceCount, Math.ceil(sliceCount * 0.12)));

    return {
      ...seedSummary,
      case_id: requestedCaseId || seedSummary.case_id || caseItem?.case_id || "",
      profile_id: requestedProfileId || seedSummary.profile_id || selectedProfile?.profile_id || "balanced_v1",
      result_name: seedSummary.result_name || `${requestedCaseId || "contouring"}_${requestedProfileId || "preview"}_preview`,
      result_url: seedSummary.result_url || "",
      overlay_url: seedSummary.overlay_url || "",
      prediction_file_url: seedSummary.prediction_file_url || "",
      probability_file_url: seedSummary.probability_file_url || "",
      metrics: seedSummary.metrics || {},
      slice_count: sliceCount,
      visibleSlices: initialVisibleSlices,
      preview: true,
    };
  }

  function updateContouringPreviewProgress() {
    const toolState = getState("targetContouring");
    if (!toolState?.previewSummary) return;
    const totalSlices = Math.max(1, Number(toolState.previewSummary.slice_count || 24));
    const progressRatio = Math.max(0.1, Math.min(0.96, Number(toolState.progress || 0) / 100));
    toolState.visibleSlices = Math.max(1, Math.min(totalSlices, Math.ceil(totalSlices * progressRatio)));
    toolState.previewSummary = {
      ...toolState.previewSummary,
      visibleSlices: toolState.visibleSlices,
    };
  }

  function buildResultImageUrl(serviceUrl, imagePath, cacheKey = "") {
    const version = encodeURIComponent(String(cacheKey || imagePath || "result"));
    return `${serviceUrl}${imagePath}?v=${version}`;
  }

  function createSafeDomId(value) {
    return String(value || "current")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "current";
  }

  function formatNumber(value, digits = 4) {
    if (value === null || value === undefined || value === "") return "暂无";
    if (typeof value === "number") return Number(value).toFixed(digits);
    return String(value);
  }

  function summarizeContouringPerformance(summary) {
    const metrics = summary.metrics || {};
    const dice = Number(metrics.dice);
    const recall = Number(metrics.lesion_recall);
    const hd95 = Number(metrics.hd95_mm);

    let overall = "整体表现一般";
    if (dice >= 0.85 && recall >= 0.95 && hd95 <= 10) overall = "整体表现优秀";
    else if (dice >= 0.75 && recall >= 0.9 && hd95 <= 15) overall = "整体表现较好";
    else if (dice >= 0.65 && recall >= 0.8 && hd95 <= 20) overall = "整体表现尚可";

    let recallComment = "病灶漏检风险偏高";
    if (recall >= 0.98) recallComment = "病灶基本没有漏检";
    else if (recall >= 0.9) recallComment = "病灶召回情况较稳";
    else if (recall >= 0.8) recallComment = "病灶召回尚可";

    let boundaryComment = "边界偏差较明显，建议重点复核轮廓边缘";
    if (hd95 <= 8) boundaryComment = "边界贴合度较好";
    else if (hd95 <= 15) boundaryComment = "边界有一定偏差，但整体还算稳定";
    else if (hd95 <= 20) boundaryComment = "边界误差偏大，建议重点复核";

    return `${overall}。Dice ${formatNumber(dice, 4)}，病灶召回率 ${formatNumber(recall, 4)}，HD95 ${formatNumber(hd95, 2)} mm。${recallComment}，${boundaryComment}。`;
  }

  function summarizeDosePerformance(summary) {
    const doseScore = Number(summary.dose_score);
    const dvhScore = Number(summary.dvh_score);
    const rows = Array.isArray(summary.metric_rows) ? [...summary.metric_rows] : [];

    let overall = "整体预测一般";
    if (doseScore <= 2.5 && dvhScore <= 1.8) overall = "整体预测较好";
    else if (doseScore <= 3.2 && dvhScore <= 2.3) overall = "整体预测尚可";
    else if (doseScore <= 4.0 && dvhScore <= 3.0) overall = "整体预测可用，但仍需重点复核";

    const focusRows = rows
      .filter((row) => row && row.abs_diff !== null && row.abs_diff !== undefined)
      .sort((left, right) => Number(right.abs_diff || 0) - Number(left.abs_diff || 0))
      .slice(0, 2)
      .map((row) => `${row.structure} ${row.metric}`);

    const ptvRows = rows.filter((row) => String(row.structure || "").startsWith("PTV"));
    const ptvMaxDiff = ptvRows.length ? Math.max(...ptvRows.map((row) => Number(row.abs_diff || 0))) : null;
    let ptvComment = "靶区覆盖趋势基本稳定";
    if (ptvMaxDiff !== null && ptvMaxDiff > 3) ptvComment = "靶区覆盖有较明显偏差，建议重点复核高剂量靶区";
    else if (ptvMaxDiff !== null && ptvMaxDiff > 1.5) ptvComment = "靶区覆盖存在一定偏差";

    const organComment = focusRows.length ? `当前更建议优先关注 ${focusRows.join("、")}。` : "当前没有明显突出的高误差指标。";
    return `${overall}。Dose score ${formatNumber(doseScore, 4)}，DVH score ${formatNumber(dvhScore, 4)}。${ptvComment}，${organComment}`;
  }

  function ensureChartJs() {
    if (window.Chart) return Promise.resolve(window.Chart);
    if (chartPromise) return chartPromise;
    chartPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.onload = () => resolve(window.Chart);
      script.onerror = () => reject(new Error("DVH 图表组件加载失败。"));
      document.head.appendChild(script);
    });
    return chartPromise;
  }

  function renderNotice(moduleKey) {
    const toolState = getState(moduleKey);
    const archivedNotice = moduleKey === "targetContouring" && toolState?.meta?.status === "model_unavailable"
      ? "下方为从原站恢复的历史勾画结果图；本地没有模型和病例影像，暂不能运行新的靶区勾画。"
      : "";
    const message = toolState?.error || archivedNotice;
    if (!message) return "";
    return `<div class="doctor-workbench-alert">${escapeHtml(message)}</div>`;
  }

  function renderProgress(moduleKey) {
    const toolState = getState(moduleKey);
    if (!toolState || (!toolState.running && !toolState.progress && !toolState.progressMessage)) return "";
    const statusClass = toolState.running ? "running" : "done";
    return `
      <section class="doctor-native-card">
        <div class="doctor-progress-head">
          <strong>${toolState.running ? "任务执行中" : "任务状态"}</strong>
          <span>${Math.round(toolState.progress || 0)}%</span>
        </div>
        <div class="doctor-progress-track">
          <div class="doctor-progress-fill ${statusClass}" style="width:${Math.max(0, Math.min(100, toolState.progress || 0))}%"></div>
        </div>
        <p class="doctor-inline-hint">${escapeHtml(toolState.progressMessage || "等待开始")}</p>
      </section>`;
  }

  function renderLoading(moduleKey) {
    const tool = getTool(moduleKey);
    const toolState = getState(moduleKey);
    return `
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(tool.title)}</h2>
          ${tool.subtitle ? `<p>${escapeHtml(tool.subtitle)}</p>` : ""}
        </div>
      </div>
      <section class="doctor-native-shell">
        <section class="doctor-native-card">
          <div class="empty-state">
            <strong>${toolState.loading ? "正在加载模块数据" : "模块暂不可用"}</strong>
            <p>${escapeHtml(toolState.error || `正在连接 ${tool.portLabel}，请稍候...`)}</p>
          </div>
        </section>
      </section>`;
  }

  function clearContouringTimer() {
    const toolState = getState("targetContouring");
    if (toolState?.progressTimer) {
      window.clearInterval(toolState.progressTimer);
      toolState.progressTimer = null;
    }
  }

  function startContouringProgress(formElement) {
    const toolState = getState("targetContouring");
    clearContouringTimer();
    toolState.running = true;
    toolState.progress = 8;
    toolState.progressMessage = "正在准备勾画任务";
    toolState.summary = null;
    toolState.previewSummary = createContouringPreviewSummary(formElement);
    updateContouringPreviewProgress();
    toolState.progressTimer = window.setInterval(() => {
      if (toolState.progress >= 92) return;
      toolState.progress = Math.min(92, toolState.progress + (toolState.progress < 36 ? 8 : toolState.progress < 72 ? 5 : 2));
      toolState.progressMessage = toolState.progress < 36 ? "正在读取影像" : toolState.progress < 72 ? "正在执行模型推理" : "正在生成可视化结果";
      updateContouringPreviewProgress();
      refreshModuleView("targetContouring");
    }, 520);
    refreshModuleView("targetContouring");
  }

  function finishContouringProgress(message, success = true) {
    const toolState = getState("targetContouring");
    clearContouringTimer();
    toolState.running = false;
    toolState.progress = success ? 100 : Math.max(toolState.progress, 16);
    toolState.progressMessage = message;
    if (!success) {
      toolState.previewSummary = null;
      toolState.visibleSlices = 0;
    }
    refreshModuleView("targetContouring");
  }

  function clearDosePollTimer() {
    const toolState = getState("dosePrediction");
    if (toolState?.pollTimer) {
      window.clearTimeout(toolState.pollTimer);
      toolState.pollTimer = null;
    }
  }

  function normalizeDoseSummary(summary) {
    if (!summary) return null;
    return {
      ...summary,
      slice_count: Number(summary.slice_count || 0),
      recommended_slice_index: Number(summary.recommended_slice_index ?? 0),
    };
  }

  function ensureDoseSelection() {
    const toolState = getState("dosePrediction");
    const summary = toolState.summary;
    if (!summary) return;
    const maxSlice = Math.max(summary.slice_count - 1, 0);
    if (!Number.isFinite(toolState.sliceIndex) || toolState.sliceIndex < 0 || toolState.sliceIndex > maxSlice) {
      toolState.sliceIndex = Math.floor(maxSlice / 2);
    }
    const structures = Object.keys(summary.dvh_curves || {});
    if (!structures.includes(toolState.selectedStructure)) {
      toolState.selectedStructure = structures[0] || "";
    }
  }

  async function loadMeta(moduleKey, force = false) {
    const toolState = getState(moduleKey);
    if (!toolState || toolState.loading || (toolState.loaded && !force)) return;
    toolState.loading = true;
    toolState.error = "";
    refreshModuleView(moduleKey);

    try {
      const meta = await requestTool(moduleKey, "/api/meta");
      toolState.meta = meta;
      toolState.loaded = true;
      if (moduleKey === "targetContouring") {
        if (meta.latest_result_summary && (!toolState.summary || force)) {
          toolState.summary = meta.latest_result_summary;
          toolState.previewSummary = null;
          toolState.visibleSlices = 0;
          toolState.running = false;
          toolState.progress = 100;
          toolState.progressMessage = meta.latest_result_summary.archived ? "历史勾画结果" : "勾画完成";
        }
        if (!toolState.selectedCaseId) {
          toolState.selectedCaseId = meta.cases?.[0]?.case_id || "";
        }
        if (!toolState.selectedProfileId) {
          toolState.selectedProfileId = meta.recommended_profile_id || meta.profiles?.[0]?.profile_id || "balanced_v1";
        }
        if (toolState.summary?.case_id) {
          toolState.selectedCaseId = toolState.summary.case_id;
        }
        if (toolState.summary?.profile_id) {
          toolState.selectedProfileId = toolState.summary.profile_id;
        }
      }
      if (moduleKey === "dosePrediction") {
        const patients = getDosePatients(meta, toolState.split);
        if (!patients.includes(toolState.patientId)) {
          toolState.patientId = patients[0] || "";
        }
        const checkpointOptions = meta.checkpoint_options || [];
        if (!checkpointOptions.some((item) => item.path === toolState.checkpointPath)) {
          toolState.checkpointPath = checkpointOptions[0]?.path || "";
        }
        if (!checkpointOptions.some((item) => item.path === toolState.uploadCheckpointPath)) {
          toolState.uploadCheckpointPath = toolState.checkpointPath;
        }
        ensureChartJs().catch((error) => {
          toolState.error = error.message || "DVH 图表组件加载失败。";
        });
      }
    } catch (error) {
      toolState.error = error.message || "加载模块数据失败。";
    } finally {
      toolState.loading = false;
      refreshModuleView(moduleKey);
    }
  }

  function renderContouringResult(summary, options = {}) {
    const tool = getTool("targetContouring");
    const toolState = getState("targetContouring");
    const isPreview = Boolean(options.preview || summary.preview);
    const metrics = summary.metrics || {};
    const caseNumber = getContouringCaseNumber(toolState, summary.case_id);
    const totalSlices = Math.max(1, Number(summary.slice_count || 24));
    const visibleSlices = Math.max(1, Math.min(totalSlices, Number(options.visibleSlices || summary.visibleSlices || totalSlices)));
    const previewHidden = `${Math.max(0, Math.min(88, Math.round((1 - visibleSlices / totalSlices) * 100)))}%`;
    const metricItems = [
      { label: "Dice", value: isPreview ? "生成中" : formatNumber(metrics.dice, 4) },
      { label: "病灶召回率", value: isPreview ? "生成中" : formatNumber(metrics.lesion_recall, 4) },
      { label: "HD95 (mm)", value: isPreview ? "生成中" : formatNumber(metrics.hd95_mm, 2) },
    ];
    const imageMarkup = summary.overlay_url
      ? `<figure class="doctor-result-figure${isPreview ? " doctor-result-preview" : ""}" style="${isPreview ? `--preview-hidden:${previewHidden}` : ""}">
            <img class="doctor-result-image" src="${buildResultImageUrl(tool.serviceUrl, summary.overlay_url, summary.result_name)}" alt="靶区勾画叠加图">
            ${isPreview ? `<figcaption>正在逐层勾画：已显示 ${visibleSlices} / ${totalSlices} 层预览</figcaption>` : ""}
          </figure>`
      : `<div class="empty-state doctor-result-preview doctor-result-placeholder">
            <strong>勾画结果正在生成</strong>
            <p>正在逐层勾画：已完成 ${visibleSlices} / ${totalSlices} 层，完成后会自动显示叠加图。</p>
          </div>`;
    const actionMarkup = isPreview
      ? `<span class="doctor-progressive-badge">正在逐层勾画 ${visibleSlices} / ${totalSlices}</span>`
      : `<a class="secondary-button" href="${tool.serviceUrl}${summary.result_url}" target="_blank" rel="noopener noreferrer">结果详情</a>
            <a class="secondary-button" href="${tool.serviceUrl}${summary.prediction_file_url}" target="_blank" rel="noopener noreferrer">下载分割</a>
            <a class="primary-action" href="${tool.serviceUrl}${summary.probability_file_url}" target="_blank" rel="noopener noreferrer">下载概率图</a>`;
    const commentary = isPreview
      ? `正在逐层勾画，已生成 ${visibleSlices} / ${totalSlices} 层预览；进度完成后会自动替换为完整评估结果。`
      : summarizeContouringPerformance(summary);
    const editorMarkup = isPreview || (summary.archived && !summary.archive_slices_available)
      ? ""
      : renderMaskRevisionEditor(summary, tool, { readOnly: Boolean(summary.archived) });
    // Final contouring results append the editable mask revision editor: ${renderMaskRevisionEditor(summary, tool)}

    return `
      <section class="doctor-native-card${isPreview ? " doctor-result-preview-card" : ""}">
        <div class="doctor-section-top">
          <div>
            <h3>${isPreview ? "勾画结果正在生成" : summary.archived ? "历史勾画结果图" : "勾画结果"}</h3>
            ${isPreview ? `<p>不是等进度条结束才显示结果，系统会随着进度逐层展示勾画预览。</p>` : ""}
          </div>
          <div class="doctor-inline-actions">
            ${actionMarkup}
          </div>
        </div>
        <div class="doctor-result-layout contouring compact-preview">
          ${imageMarkup}
          <div class="doctor-result-side">
            <div class="doctor-stat-grid compact">
              ${metricItems
                .map((item) => `
                  <article class="doctor-stat-card">
                    <span>${escapeHtml(item.label)}</span>
                    <strong>${escapeHtml(item.value)}</strong>
                  </article>`)
                .join("")}
            </div>
            <div class="doctor-commentary">
              <strong>${isPreview ? "勾画进度" : "模型效果点评"}</strong>
              <p>${escapeHtml(commentary)}</p>
            </div>
            <div class="doctor-detail-list">
              <div><span>病例序号</span><strong>${caseNumber ? `病例 ${caseNumber}` : "-"}</strong></div>
              <div><span>原始编号</span><strong>${escapeHtml(summary.case_id || "-")}</strong></div>
              <div><span>勾画引擎</span><strong>${escapeHtml(summary.profile_id || "-")}</strong></div>
              <div><span>结果目录</span><strong>${escapeHtml(isPreview ? "生成中" : summary.result_name || "-")}</strong></div>
            </div>
          </div>
        </div>
      </section>
      ${editorMarkup}`;
  }

  function renderContouringCasePanel({ toolState, profiles, cases, hasSummary }) {
    return `
        <section class="doctor-native-card">
          <div class="doctor-section-top">
            <div>
              <h3>${hasSummary ? "继续勾画" : "使用演练"}</h3>
            </div>
            <div class="doctor-inline-actions">
              <button class="secondary-button" type="button" data-doctor-tool-action="refresh" data-tool-key="targetContouring">刷新数据</button>
              <button class="primary-action" type="button" data-doctor-tool-action="open" data-tool-key="targetContouring">${hasSummary ? "完整结果页" : "完整工作台"}</button>
            </div>
          </div>
          <form id="contouring-case-form" class="doctor-form-grid">
            <label>
              <span>病例序号</span>
              <select id="contouring-case-select" name="case_id" ${toolState.running ? "disabled" : ""}>
                ${cases.map((item, index) => `<option value="${escapeHtml(item.case_id)}" ${item.case_id === toolState.selectedCaseId ? "selected" : ""}>${index + 1}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>勾画引擎</span>
              <select id="contouring-profile-select" name="profile_id" ${toolState.running ? "disabled" : ""}>
                ${profiles.map((item) => `<option value="${escapeHtml(item.profile_id)}" ${item.profile_id === toolState.selectedProfileId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
              </select>
            </label>
            <button class="primary-action" type="submit" ${toolState.running ? "disabled" : ""}>${toolState.running ? "处理中..." : "开始勾画"}</button>
          </form>
          <div class="doctor-chip-grid">
            ${cases.map((item, index) => `<button class="doctor-chip${item.case_id === toolState.selectedCaseId ? " active" : ""}" type="button" data-doctor-case-id="${escapeHtml(item.case_id)}" title="${escapeHtml(item.case_id)}" ${toolState.running ? "disabled" : ""}>${index + 1}</button>`).join("")}
          </div>
        </section>`;
  }

  function renderMaskRevisionEditor(summary, tool, options = {}) {
    const resultName = summary.result_name || summary.case_id || "current";
    const editorId = `mask-revision-${createSafeDomId(resultName)}`;
    const readOnly = Boolean(options.readOnly);
    return `
      <section class="mask-revision-card" data-mask-revision-result="${escapeHtml(resultName)}" data-mask-revision-service="${escapeHtml(tool.serviceUrl)}" data-mask-revision-read-only="${readOnly}">
        <div class="doctor-section-top compact">
          <div>
            <h3>${readOnly ? "历史分层影像与勾画（只读）" : "机器分割修订"}</h3>
          </div>
          ${readOnly ? "" : `<div class="doctor-inline-actions mask-revision-toolbar">
            <button class="secondary-button mask-revision-tool active" type="button" data-mask-revision-action="add" data-editor-target="${escapeHtml(editorId)}">画笔</button>
            <button class="secondary-button mask-revision-tool" type="button" data-mask-revision-action="erase" data-editor-target="${escapeHtml(editorId)}">擦除</button>
            <button class="secondary-button" type="button" data-mask-revision-action="undo" data-editor-target="${escapeHtml(editorId)}">撤销</button>
            <button class="secondary-button" type="button" data-mask-revision-action="redo" data-editor-target="${escapeHtml(editorId)}">重做</button>
            <button class="secondary-button" type="button" data-mask-revision-action="reset-slice" data-editor-target="${escapeHtml(editorId)}">重置本层</button>
            <button class="primary-action" type="button" data-mask-revision-action="save" data-editor-target="${escapeHtml(editorId)}">保存修订</button>
          </div>`}
        </div>
        <div class="mask-revision-zoom">
          <button class="secondary-button" type="button" data-mask-revision-action="zoom-out" data-editor-target="${escapeHtml(editorId)}">缩小</button>
          <span data-mask-revision-zoom-label data-editor-target="${escapeHtml(editorId)}">适配</span>
          <button class="secondary-button" type="button" data-mask-revision-action="zoom-in" data-editor-target="${escapeHtml(editorId)}">放大</button>
          <button class="secondary-button" type="button" data-mask-revision-action="zoom-reset" data-editor-target="${escapeHtml(editorId)}">100%</button>
          <button class="secondary-button" type="button" data-mask-revision-action="zoom-fit" data-editor-target="${escapeHtml(editorId)}">适配</button>
        </div>
        <div class="mask-revision-controls">
          <label>
            <span>层面</span>
            <input type="range" min="0" max="0" value="0" disabled data-mask-revision-slice data-editor-target="${escapeHtml(editorId)}">
          </label>
          ${readOnly ? "" : `<label>
            <span>笔粗</span>
            <input type="range" min="1" max="28" value="6" data-mask-revision-brush data-editor-target="${escapeHtml(editorId)}">
          </label>`}
          <label>
            <span>透明度</span>
            <input type="range" min="20" max="95" value="72" data-mask-revision-opacity data-editor-target="${escapeHtml(editorId)}">
          </label>
          <span class="mask-revision-status" data-mask-revision-status data-editor-target="${escapeHtml(editorId)}">加载中</span>
        </div>
        <div class="mask-revision-viewport" data-mask-revision-viewport>
          <div class="mask-revision-stage" data-mask-revision-stage>
            <canvas class="mask-revision-image" data-mask-revision-image></canvas>
            <canvas id="${escapeHtml(editorId)}" class="mask-revision-mask" data-mask-revision-canvas data-result-name="${escapeHtml(resultName)}"></canvas>
          </div>
        </div>
      </section>`;
  }

  function renderContouringEditor(summary, tool) {
    const resultName = summary.result_name || summary.case_id || "current";
    const editorId = `contour-editor-${createSafeDomId(resultName)}`;
    const imageUrl = buildResultImageUrl(tool.serviceUrl, summary.overlay_url, resultName);
    return `
      <section class="contour-editor-card" data-contour-editor-result="${escapeHtml(resultName)}">
        <div class="doctor-section-top compact">
          <div>
            <h3>人工二次勾画</h3>
          </div>
          <div class="doctor-inline-actions contour-editor-toolbar">
            <button class="secondary-button contour-editor-tool active" type="button" data-contour-editor-action="draw" data-editor-target="${escapeHtml(editorId)}">画笔</button>
            <button class="secondary-button contour-editor-tool" type="button" data-contour-editor-action="erase" data-editor-target="${escapeHtml(editorId)}">擦除</button>
            <button class="secondary-button" type="button" data-contour-editor-action="undo" data-editor-target="${escapeHtml(editorId)}">撤销</button>
            <button class="secondary-button" type="button" data-contour-editor-action="redo" data-editor-target="${escapeHtml(editorId)}">重做</button>
            <button class="secondary-button" type="button" data-contour-editor-action="clear" data-editor-target="${escapeHtml(editorId)}">清空</button>
            <button class="secondary-button" type="button" data-contour-editor-action="export" data-editor-target="${escapeHtml(editorId)}">导出记录</button>
            <button class="primary-action" type="button" data-contour-editor-action="download" data-editor-target="${escapeHtml(editorId)}">下载修订图</button>
          </div>
        </div>
        <div class="contour-editor-zoom" aria-label="缩放控制">
          <button class="secondary-button" type="button" data-contour-editor-action="zoom-out" data-editor-target="${escapeHtml(editorId)}">缩小</button>
          <span data-contour-editor-zoom-label data-editor-target="${escapeHtml(editorId)}">适配</span>
          <button class="secondary-button" type="button" data-contour-editor-action="zoom-in" data-editor-target="${escapeHtml(editorId)}">放大</button>
          <button class="secondary-button" type="button" data-contour-editor-action="zoom-reset" data-editor-target="${escapeHtml(editorId)}">100%</button>
          <button class="secondary-button" type="button" data-contour-editor-action="zoom-fit" data-editor-target="${escapeHtml(editorId)}">适配</button>
        </div>
        <div class="contour-editor-controls">
          <label>
            <span>颜色</span>
            <select data-contour-editor-color data-editor-target="${escapeHtml(editorId)}">
              <option value="#ef4444">红色修正</option>
              <option value="#22c55e">绿色补画</option>
              <option value="#f59e0b">黄色标注</option>
              <option value="#3b82f6">蓝色复核</option>
            </select>
          </label>
          <label>
            <span>笔粗</span>
            <input type="range" min="2" max="32" value="8" data-contour-editor-size data-editor-target="${escapeHtml(editorId)}">
          </label>
          <label>
            <span>透明度</span>
            <input type="range" min="30" max="100" value="90" data-contour-editor-opacity data-editor-target="${escapeHtml(editorId)}">
          </label>
          <span class="contour-editor-status" data-contour-editor-status data-editor-target="${escapeHtml(editorId)}">等待人工修订</span>
        </div>
        <div class="contour-editor-viewport" data-contour-editor-viewport>
          <div class="contour-editor-stage" data-contour-editor-stage>
            <img class="contour-editor-base" src="${escapeHtml(imageUrl)}" alt="靶区勾画底图">
            <canvas id="${escapeHtml(editorId)}" class="contour-editor-canvas" data-contour-editor-canvas data-result-name="${escapeHtml(resultName)}"></canvas>
          </div>
        </div>
      </section>`;
  }

  function getContourEditor(targetId) {
    return targetId ? contourEditorInstances.get(targetId) : null;
  }

  function createSafeSelectorValue(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function getContourEditorStatus(targetId) {
    return moduleContent.querySelector(`[data-contour-editor-status][data-editor-target="${createSafeSelectorValue(targetId)}"]`);
  }

  function setContourEditorStatus(editor, message) {
    const status = getContourEditorStatus(editor.canvas.id);
    if (status) status.textContent = message;
  }

  function getContourEditorZoomLabel(targetId) {
    return moduleContent.querySelector(`[data-contour-editor-zoom-label][data-editor-target="${createSafeSelectorValue(targetId)}"]`);
  }

  function getContourEditorPoint(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.max(0, Math.min(canvas.width, (event.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height, (event.clientY - rect.top) * scaleY)),
    };
  }

  function getContourEditorInputPoint(event, canvas) {
    const input = event.touches?.[0] || event.changedTouches?.[0] || event;
    return getContourEditorPoint(input, canvas);
  }

  function beginContourEditorStroke(editor, event) {
    if (event.button !== undefined && event.button > 0) return;
    const { canvas } = editor;
    if (!canvas.width || !canvas.height) sizeContourEditorCanvas(editor);
    editor.drawing = true;
    editor.activeStroke = {
      tool: editor.tool,
      color: editor.color,
      size: editor.size,
      opacity: editor.opacity,
      points: [getContourEditorInputPoint(event, canvas)],
    };
    setContourEditorStatus(editor, editor.tool === "erase" ? "正在擦除人工修订" : "正在人工勾画");
    event.preventDefault?.();
  }

  function moveContourEditorStroke(editor, event) {
    if (!editor.drawing || !editor.activeStroke) return;
    editor.activeStroke.points.push(getContourEditorInputPoint(event, editor.canvas));
    replayContourEditor(editor, editor.activeStroke);
    event.preventDefault?.();
  }

  function finishContourEditorStroke(editor, event) {
    if (!editor.drawing || !editor.activeStroke) return;
    if (editor.activeStroke.points.length > 1) {
      editor.strokes.push(editor.activeStroke);
      editor.redo = [];
      persistContourEditor(editor);
    }
    editor.drawing = false;
    editor.activeStroke = null;
    replayContourEditor(editor);
    if (event?.pointerId !== undefined) editor.canvas.releasePointerCapture?.(event.pointerId);
  }

  function drawContourStroke(ctx, stroke) {
    if (!stroke?.points?.length) return;
    ctx.save();
    ctx.globalCompositeOperation = stroke.tool === "erase" ? "destination-out" : "source-over";
    ctx.strokeStyle = stroke.color || "#ef4444";
    ctx.globalAlpha = Number(stroke.opacity || 0.9);
    ctx.lineWidth = Number(stroke.size || 8);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    stroke.points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.restore();
  }

  function replayContourEditor(editor, activeStroke = null) {
    const { canvas, ctx } = editor;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    editor.strokes.forEach((stroke) => drawContourStroke(ctx, stroke));
    if (activeStroke) drawContourStroke(ctx, activeStroke);
    setContourEditorStatus(
      editor,
      editor.strokes.length ? `已记录 ${editor.strokes.length} 笔人工修订` : "等待人工修订",
    );
  }

  function persistContourEditor(editor) {
    try {
      localStorage.setItem(
        editor.storageKey,
        JSON.stringify({
          resultName: editor.resultName,
          updatedAt: new Date().toISOString(),
          strokes: editor.strokes,
        }),
      );
    } catch {
      setContourEditorStatus(editor, "浏览器本地空间不足，修订记录未保存");
    }
  }

  function loadContourEditorStrokes(editor) {
    try {
      const payload = JSON.parse(localStorage.getItem(editor.storageKey) || "null");
      editor.strokes = Array.isArray(payload?.strokes) ? payload.strokes : [];
    } catch {
      editor.strokes = [];
    }
  }

  function calculateContourEditorFitZoom(editor) {
    const viewportRect = editor.viewport.getBoundingClientRect();
    const viewportWidth = Math.max(320, viewportRect.width - 24);
    const viewportHeight = Math.max(360, Math.min(window.innerHeight * 0.58, 680));
    const width = editor.canvas.width || editor.image.naturalWidth || 1200;
    const height = editor.canvas.height || editor.image.naturalHeight || 800;
    return Math.max(0.28, Math.min(1, viewportWidth / width, viewportHeight / height));
  }

  function updateContourEditorZoomLabel(editor) {
    const label = getContourEditorZoomLabel(editor.canvas.id);
    if (!label) return;
    const percent = Math.round((editor.zoom || 1) * 100);
    label.textContent = editor.zoomMode === "fit" ? `适配 ${percent}%` : `${percent}%`;
  }

  function applyContourEditorZoom(editor, zoom, zoomMode = "manual") {
    const width = editor.canvas.width || editor.image.naturalWidth || 1200;
    const height = editor.canvas.height || editor.image.naturalHeight || 800;
    const nextZoom = Math.max(0.28, Math.min(2, Number(zoom) || 1));
    editor.zoom = nextZoom;
    editor.zoomMode = zoomMode;
    const stageWidth = Math.round(width * nextZoom);
    const stageHeight = Math.round(height * nextZoom);
    editor.stage.style.width = `${stageWidth}px`;
    editor.stage.style.minWidth = `${stageWidth}px`;
    editor.stage.style.height = `${stageHeight}px`;
    editor.stage.style.minHeight = `${stageHeight}px`;
    editor.stage.style.aspectRatio = `${width} / ${height}`;
    editor.stage.classList.toggle("is-fit", zoomMode === "fit");
    updateContourEditorZoomLabel(editor);
  }

  function fitContourEditor(editor) {
    applyContourEditorZoom(editor, calculateContourEditorFitZoom(editor), "fit");
  }

  function resizeContourEditors() {
    contourEditorInstances.forEach((editor) => {
      if (editor.zoomMode === "fit") {
        fitContourEditor(editor);
      }
    });
  }

  function sizeContourEditorCanvas(editor) {
    const { canvas, image } = editor;
    const width = image.naturalWidth || image.clientWidth || 1200;
    const height = image.naturalHeight || image.clientHeight || 800;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    if (editor.zoomMode === "fit") fitContourEditor(editor);
    else applyContourEditorZoom(editor, editor.zoom || calculateContourEditorFitZoom(editor), editor.zoomMode || "manual");
    replayContourEditor(editor);
  }

  function downloadBlob(blob, filename) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function exportContourEditorJson(editor) {
    const payload = {
      resultName: editor.resultName,
      exportedAt: new Date().toISOString(),
      imageSize: { width: editor.canvas.width, height: editor.canvas.height },
      strokes: editor.strokes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${editor.resultName || "contour"}-manual-revision.json`);
    setContourEditorStatus(editor, "已导出人工修订记录");
  }

  function downloadContourEditorImage(editor) {
    const output = document.createElement("canvas");
    output.width = editor.canvas.width;
    output.height = editor.canvas.height;
    const outputCtx = output.getContext("2d");
    try {
      outputCtx.drawImage(editor.image, 0, 0, output.width, output.height);
      editor.strokes.forEach((stroke) => drawContourStroke(outputCtx, stroke));
      output.toBlob((blob) => {
        if (!blob) {
          setContourEditorStatus(editor, "修订图生成失败，请重试");
          return;
        }
        downloadBlob(blob, `${editor.resultName || "contour"}-manual-revision.png`);
        setContourEditorStatus(editor, "已下载人工修订图");
      }, "image/png");
    } catch {
      editor.canvas.toBlob((blob) => {
        if (!blob) {
          setContourEditorStatus(editor, "底图跨域受限，修订图生成失败");
          return;
        }
        downloadBlob(blob, `${editor.resultName || "contour"}-revision-layer.png`);
        setContourEditorStatus(editor, "已下载人工修订图层");
      }, "image/png");
    }
  }

  function setContourEditorTool(editor, tool) {
    editor.tool = tool === "erase" ? "erase" : "draw";
    const editorTarget = createSafeSelectorValue(editor.canvas.id);
    moduleContent
      .querySelectorAll(`[data-contour-editor-action="draw"][data-editor-target="${editorTarget}"], [data-contour-editor-action="erase"][data-editor-target="${editorTarget}"]`)
      .forEach((button) => button.classList.toggle("active", button.dataset.contourEditorAction === editor.tool));
    setContourEditorStatus(editor, editor.tool === "erase" ? "擦除模式：拖动删除人工修订线条" : "画笔模式：拖动补画或修正靶区轮廓");
  }

  function initContouringEditor() {
    moduleContent.querySelectorAll("[data-contour-editor-canvas]").forEach((canvas) => {
      const existing = contourEditorInstances.get(canvas.id);
      if (existing?.canvas === canvas) return;
      const card = canvas.closest(".contour-editor-card");
      const viewport = card?.querySelector("[data-contour-editor-viewport]");
      const stage = card?.querySelector("[data-contour-editor-stage]");
      const image = card?.querySelector(".contour-editor-base");
      if (!card || !viewport || !stage || !image) return;
      const editor = {
        canvas,
        ctx: canvas.getContext("2d"),
        viewport,
        stage,
        image,
        resultName: canvas.dataset.resultName || "current",
        storageKey: `contour-editor:${canvas.dataset.resultName || "current"}`,
        tool: "draw",
        color: "#ef4444",
        size: 8,
        opacity: 0.9,
        zoom: 1,
        zoomMode: "fit",
        strokes: [],
        redo: [],
        drawing: false,
        activeStroke: null,
      };
      contourEditorInstances.set(canvas.id, editor);
      loadContourEditorStrokes(editor);
      if (image.complete) sizeContourEditorCanvas(editor);
      else image.addEventListener("load", () => sizeContourEditorCanvas(editor), { once: true });

      const startStroke = (event) => {
        if (event.pointerId !== undefined) canvas.setPointerCapture?.(event.pointerId);
        beginContourEditorStroke(editor, event);
      };
      const moveStroke = (event) => moveContourEditorStroke(editor, event);
      const finishStroke = (event) => finishContourEditorStroke(editor, event);

      if (window.PointerEvent) {
        canvas.addEventListener("pointerdown", startStroke);
        canvas.addEventListener("pointermove", moveStroke);
        canvas.addEventListener("pointerup", finishStroke);
        canvas.addEventListener("pointercancel", finishStroke);
        canvas.addEventListener("pointerleave", finishStroke);
      } else {
        canvas.addEventListener("mousedown", startStroke);
        window.addEventListener("mousemove", moveStroke);
        window.addEventListener("mouseup", finishStroke);
        canvas.addEventListener("touchstart", startStroke, { passive: false });
        window.addEventListener("touchmove", moveStroke, { passive: false });
        window.addEventListener("touchend", finishStroke);
        window.addEventListener("touchcancel", finishStroke);
      }
    });
    if (!contourEditorResizeBound) {
      contourEditorResizeBound = true;
      window.addEventListener("resize", () => window.requestAnimationFrame(resizeContourEditors));
    }
  }

  function handleContourEditorAction(action, targetId) {
    const editor = getContourEditor(targetId);
    if (!editor) return false;
    if (action === "draw" || action === "erase") {
      setContourEditorTool(editor, action);
      return true;
    }
    if (action === "undo") {
      const stroke = editor.strokes.pop();
      if (stroke) editor.redo.push(stroke);
      replayContourEditor(editor);
      persistContourEditor(editor);
      return true;
    }
    if (action === "redo") {
      const stroke = editor.redo.pop();
      if (stroke) editor.strokes.push(stroke);
      replayContourEditor(editor);
      persistContourEditor(editor);
      return true;
    }
    if (action === "clear") {
      editor.strokes = [];
      editor.redo = [];
      replayContourEditor(editor);
      persistContourEditor(editor);
      setContourEditorStatus(editor, "已清空人工修订");
      return true;
    }
    if (action === "export") {
      exportContourEditorJson(editor);
      return true;
    }
    if (action === "download") {
      downloadContourEditorImage(editor);
      return true;
    }
    if (action === "zoom-out") {
      applyContourEditorZoom(editor, (editor.zoom || calculateContourEditorFitZoom(editor)) - 0.12, "manual");
      return true;
    }
    if (action === "zoom-in") {
      applyContourEditorZoom(editor, (editor.zoom || calculateContourEditorFitZoom(editor)) + 0.12, "manual");
      return true;
    }
    if (action === "zoom-reset") {
      applyContourEditorZoom(editor, 1, "manual");
      return true;
    }
    if (action === "zoom-fit") {
      fitContourEditor(editor);
      return true;
    }
    return false;
  }

  function handleContourEditorControl(event) {
    const targetId = event.target.dataset.editorTarget;
    const editor = getContourEditor(targetId);
    if (!editor) return false;
    if (event.target.matches("[data-contour-editor-color]")) {
      editor.color = event.target.value || "#ef4444";
      return true;
    }
    if (event.target.matches("[data-contour-editor-size]")) {
      editor.size = Number(event.target.value || 8);
      return true;
    }
    if (event.target.matches("[data-contour-editor-opacity]")) {
      editor.opacity = Math.max(0.3, Math.min(1, Number(event.target.value || 90) / 100));
      return true;
    }
    return false;
  }

  function getMaskRevisionEditor(targetId) {
    return targetId ? maskRevisionEditors.get(targetId) : null;
  }

  function getMaskRevisionStatus(targetId) {
    return moduleContent.querySelector(`[data-mask-revision-status][data-editor-target="${createSafeSelectorValue(targetId)}"]`);
  }

  function setMaskRevisionStatus(editor, message) {
    const status = getMaskRevisionStatus(editor.canvas.id);
    if (status) status.textContent = message;
  }

  function getMaskRevisionZoomLabel(targetId) {
    return moduleContent.querySelector(`[data-mask-revision-zoom-label][data-editor-target="${createSafeSelectorValue(targetId)}"]`);
  }

  function getMaskRevisionSliceInput(targetId) {
    return moduleContent.querySelector(`[data-mask-revision-slice][data-editor-target="${createSafeSelectorValue(targetId)}"]`);
  }

  function requestMaskRevisionMetaPayload(resultName) {
    const key = String(resultName || "current");
    if (!maskRevisionMetaCache.has(key)) {
      const request = requestTool("targetContouring", `/api/revision/${encodeURIComponent(key)}`).catch((error) => {
        maskRevisionMetaCache.delete(key);
        throw error;
      });
      maskRevisionMetaCache.set(key, request);
    }
    return maskRevisionMetaCache.get(key);
  }

  function requestMaskRevisionSlicePayload(resultName, z) {
    const key = `${resultName || "current"}:${Number(z) || 0}`;
    if (!maskRevisionSliceCache.has(key)) {
      const request = requestTool("targetContouring", `/api/revision/${encodeURIComponent(resultName)}/slice/${Number(z) || 0}`).catch((error) => {
        maskRevisionSliceCache.delete(key);
        throw error;
      });
      maskRevisionSliceCache.set(key, request);
    }
    return maskRevisionSliceCache.get(key);
  }

  function cloneMaskRevisionMask(mask) {
    return Array.isArray(mask) ? mask.map((row) => row.slice()) : [];
  }

  function serializeMaskRevisionMask(mask) {
    return cloneMaskRevisionMask(mask).map((row) => row.map((value) => (value ? 1 : 0)));
  }

  function getMaskRevisionPoint(event, canvas) {
    const input = event.touches?.[0] || event.changedTouches?.[0] || event;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    return {
      x: Math.max(0, Math.min(canvas.width - 1, (input.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height - 1, (input.clientY - rect.top) * scaleY)),
    };
  }

  function updateMaskRevisionZoomLabel(editor) {
    const label = getMaskRevisionZoomLabel(editor.canvas.id);
    if (!label) return;
    const percent = Math.round((editor.zoom || 1) * 100);
    label.textContent = editor.zoomMode === "fit" ? `适配 ${percent}%` : `${percent}%`;
  }

  function calculateMaskRevisionFitZoom(editor) {
    const viewportRect = editor.viewport.getBoundingClientRect();
    const viewportWidth = Math.max(320, viewportRect.width - 24);
    const viewportHeight = Math.max(360, Math.min(window.innerHeight * 0.68, 760));
    const width = editor.canvas.width || 512;
    const height = editor.canvas.height || 512;
    return Math.max(0.35, Math.min(3, viewportWidth / width, viewportHeight / height));
  }

  function applyMaskRevisionZoom(editor, zoom, zoomMode = "manual") {
    const width = editor.canvas.width || 512;
    const height = editor.canvas.height || 512;
    const nextZoom = Math.max(0.35, Math.min(5, Number(zoom) || 1));
    editor.zoom = nextZoom;
    editor.zoomMode = zoomMode;
    const stageWidth = Math.round(width * nextZoom);
    const stageHeight = Math.round(height * nextZoom);
    editor.stage.style.width = `${stageWidth}px`;
    editor.stage.style.minWidth = `${stageWidth}px`;
    editor.stage.style.height = `${stageHeight}px`;
    editor.stage.style.minHeight = `${stageHeight}px`;
    editor.stage.style.aspectRatio = `${width} / ${height}`;
    editor.stage.classList.toggle("is-fit", zoomMode === "fit");
    updateMaskRevisionZoomLabel(editor);
  }

  function fitMaskRevisionEditor(editor) {
    applyMaskRevisionZoom(editor, calculateMaskRevisionFitZoom(editor), "fit");
  }

  function resizeMaskRevisionEditors() {
    maskRevisionEditors.forEach((editor) => {
      if (editor.zoomMode === "fit") {
        fitMaskRevisionEditor(editor);
      }
    });
  }

  function drawMaskRevisionImage(editor, rows) {
    if (!Array.isArray(rows) || !rows.length || !Array.isArray(rows[0])) return;
    const height = rows.length;
    const width = rows[0].length;
    if (editor.imageCanvas.width !== width || editor.imageCanvas.height !== height) {
      editor.imageCanvas.width = width;
      editor.imageCanvas.height = height;
      editor.canvas.width = width;
      editor.canvas.height = height;
      fitMaskRevisionEditor(editor);
    }
    const imageData = editor.imageCtx.createImageData(width, height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const value = Math.max(0, Math.min(255, Number(rows[y]?.[x] || 0)));
        imageData.data[offset] = value;
        imageData.data[offset + 1] = value;
        imageData.data[offset + 2] = value;
        imageData.data[offset + 3] = 255;
      }
    }
    editor.imageCtx.putImageData(imageData, 0, 0);
  }

  function drawMaskRevisionMask(editor) {
    const mask = editor.currentMask;
    const width = editor.canvas.width;
    const height = editor.canvas.height;
    editor.ctx.clearRect(0, 0, width, height);
    if (!Array.isArray(mask) || !mask.length) return;
    const imageData = editor.ctx.createImageData(width, height);
    const alpha = Math.round(255 * editor.opacity);
    for (let y = 0; y < height; y += 1) {
      const row = mask[y] || [];
      for (let x = 0; x < width; x += 1) {
        if (!row[x]) continue;
        const offset = (y * width + x) * 4;
        imageData.data[offset] = 239;
        imageData.data[offset + 1] = 68;
        imageData.data[offset + 2] = 68;
        imageData.data[offset + 3] = alpha;
      }
    }
    editor.ctx.putImageData(imageData, 0, 0);
  }

  function setMaskRevisionTool(editor, tool) {
    editor.tool = tool === "erase" ? "erase" : "add";
    const editorTarget = createSafeSelectorValue(editor.canvas.id);
    moduleContent
      .querySelectorAll(`[data-mask-revision-action="add"][data-editor-target="${editorTarget}"], [data-mask-revision-action="erase"][data-editor-target="${editorTarget}"]`)
      .forEach((button) => button.classList.toggle("active", button.dataset.maskRevisionAction === editor.tool));
    setMaskRevisionStatus(editor, editor.tool === "erase" ? "擦除模式" : "画笔模式");
  }

  function pushMaskRevisionUndo(editor) {
    if (!editor.currentMask) return;
    editor.undoStack.push({ z: editor.currentSlice, mask: cloneMaskRevisionMask(editor.currentMask) });
    if (editor.undoStack.length > 50) editor.undoStack.shift();
    editor.redoStack = [];
  }

  async function restoreMaskRevisionSnapshot(editor, snapshot) {
    if (!snapshot) return;
    if (editor.currentSlice !== snapshot.z) {
      await loadMaskRevisionSlice(editor, snapshot.z);
    }
    editor.currentMask = cloneMaskRevisionMask(snapshot.mask);
    const cache = editor.sliceCache.get(editor.currentSlice);
    if (cache) cache.mask = editor.currentMask;
    editor.changedSlices.set(String(editor.currentSlice), cloneMaskRevisionMask(editor.currentMask));
    drawMaskRevisionMask(editor);
    setMaskRevisionStatus(editor, `第 ${editor.currentSlice} 层已恢复`);
  }

  function markMaskRevisionChanged(editor) {
    if (!editor.currentMask) return;
    editor.changedSlices.set(String(editor.currentSlice), cloneMaskRevisionMask(editor.currentMask));
  }

  function paintMaskRevisionPoint(editor, point) {
    const mask = editor.currentMask;
    if (!Array.isArray(mask) || !mask.length) return;
    const radius = Math.max(1, Number(editor.brushSize || 6));
    const cx = Math.round(point.x);
    const cy = Math.round(point.y);
    const fill = editor.tool === "erase" ? 0 : 1;
    const yMin = Math.max(0, cy - radius);
    const yMax = Math.min(mask.length - 1, cy + radius);
    for (let y = yMin; y <= yMax; y += 1) {
      const row = mask[y] || [];
      const xMin = Math.max(0, cx - radius);
      const xMax = Math.min(row.length - 1, cx + radius);
      for (let x = xMin; x <= xMax; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= radius * radius) {
          row[x] = fill;
        }
      }
    }
  }

  function paintMaskRevisionSegment(editor, fromPoint, toPoint) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(toPoint.x - fromPoint.x), Math.abs(toPoint.y - fromPoint.y))));
    for (let index = 0; index <= steps; index += 1) {
      const ratio = index / steps;
      paintMaskRevisionPoint(editor, {
        x: fromPoint.x + (toPoint.x - fromPoint.x) * ratio,
        y: fromPoint.y + (toPoint.y - fromPoint.y) * ratio,
      });
    }
    drawMaskRevisionMask(editor);
  }

  function beginMaskRevisionStroke(editor, event) {
    if (event.button !== undefined && event.button > 0) return;
    if (!editor.currentMask || editor.loadingSlice) return;
    pushMaskRevisionUndo(editor);
    editor.painting = true;
    editor.lastPoint = getMaskRevisionPoint(event, editor.canvas);
    paintMaskRevisionPoint(editor, editor.lastPoint);
    drawMaskRevisionMask(editor);
    markMaskRevisionChanged(editor);
    setMaskRevisionStatus(editor, `第 ${editor.currentSlice} 层编辑中`);
    event.preventDefault?.();
  }

  function moveMaskRevisionStroke(editor, event) {
    if (!editor.painting || !editor.lastPoint) return;
    const nextPoint = getMaskRevisionPoint(event, editor.canvas);
    paintMaskRevisionSegment(editor, editor.lastPoint, nextPoint);
    editor.lastPoint = nextPoint;
    markMaskRevisionChanged(editor);
    event.preventDefault?.();
  }

  function finishMaskRevisionStroke(editor, event) {
    if (!editor.painting) return;
    editor.painting = false;
    editor.lastPoint = null;
    markMaskRevisionChanged(editor);
    setMaskRevisionStatus(editor, `第 ${editor.currentSlice} 层已修改，待保存`);
    if (event?.pointerId !== undefined) editor.canvas.releasePointerCapture?.(event.pointerId);
  }

  async function loadMaskRevisionSlice(editor, z) {
    const requested = Math.max(0, Math.min(Number(editor.sliceCount || 1) - 1, Number(z) || 0));
    editor.loadingSlice = true;
    setMaskRevisionStatus(editor, `加载第 ${requested} 层`);
    try {
      let cached = editor.sliceCache.get(requested);
      if (!cached) {
        const payload = await requestMaskRevisionSlicePayload(editor.resultName, requested);
        cached = {
          image: payload.image,
          baseMask: cloneMaskRevisionMask(payload.mask),
          mask: cloneMaskRevisionMask(payload.mask),
        };
        editor.sliceCache.set(requested, cached);
      }
      editor.currentSlice = requested;
      const changed = editor.changedSlices.get(String(requested));
      cached.mask = changed ? cloneMaskRevisionMask(changed) : cloneMaskRevisionMask(cached.mask || cached.baseMask);
      editor.currentMask = cached.mask;
      drawMaskRevisionImage(editor, cached.image);
      drawMaskRevisionMask(editor);
      const sliceInput = getMaskRevisionSliceInput(editor.canvas.id);
      if (sliceInput) sliceInput.value = String(requested);
      setMaskRevisionStatus(editor, `第 ${requested} 层`);
    } catch (error) {
      setMaskRevisionStatus(editor, error.message || "mask 加载失败");
    } finally {
      editor.loadingSlice = false;
    }
  }

  async function loadMaskRevisionMeta(editor) {
    try {
      const meta = await requestMaskRevisionMetaPayload(editor.resultName);
      editor.meta = meta;
      editor.sliceCount = Math.max(1, Number(meta.slice_count || meta.shape?.[2] || 1));
      const sliceInput = getMaskRevisionSliceInput(editor.canvas.id);
      if (sliceInput) {
        sliceInput.max = String(editor.sliceCount - 1);
        sliceInput.disabled = false;
      }
      const positive = Array.isArray(meta.positive_slices) ? meta.positive_slices : [];
      const firstSlice = positive.length ? Number(positive[0]) : Math.floor((editor.sliceCount - 1) / 2);
      await loadMaskRevisionSlice(editor, firstSlice);
    } catch (error) {
      setMaskRevisionStatus(editor, error.message || "revision API 不可用");
    }
  }

  async function saveMaskRevision(editor) {
    if (!editor.changedSlices.size) {
      setMaskRevisionStatus(editor, "没有修改");
      return;
    }
    const slices = {};
    editor.changedSlices.forEach((mask, z) => {
      slices[z] = serializeMaskRevisionMask(mask);
    });
    setMaskRevisionStatus(editor, "保存中");
    try {
      const payload = await requestTool("targetContouring", `/api/revision/${encodeURIComponent(editor.resultName)}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slices }),
      });
      const toolState = getState("targetContouring");
      if (toolState?.summary?.result_name === editor.resultName) {
        toolState.summary = { ...toolState.summary, ...payload };
      }
      editor.changedSlices.clear();
      editor.undoStack = [];
      editor.redoStack = [];
      setMaskRevisionStatus(editor, "已保存修订");
    } catch (error) {
      setMaskRevisionStatus(editor, error.message || "保存失败");
    }
  }

  function resetMaskRevisionSlice(editor) {
    const cached = editor.sliceCache.get(editor.currentSlice);
    if (!cached?.baseMask) return;
    pushMaskRevisionUndo(editor);
    editor.currentMask = cloneMaskRevisionMask(cached.baseMask);
    cached.mask = editor.currentMask;
    markMaskRevisionChanged(editor);
    drawMaskRevisionMask(editor);
    setMaskRevisionStatus(editor, `第 ${editor.currentSlice} 层已重置`);
  }

  function handleMaskRevisionAction(action, targetId) {
    const editor = getMaskRevisionEditor(targetId);
    if (!editor) return false;
    if (action === "add" || action === "erase") {
      setMaskRevisionTool(editor, action);
      return true;
    }
    if (action === "undo") {
      const previous = editor.undoStack.pop();
      if (previous) {
        editor.redoStack.push({ z: editor.currentSlice, mask: cloneMaskRevisionMask(editor.currentMask) });
        restoreMaskRevisionSnapshot(editor, previous);
      }
      return true;
    }
    if (action === "redo") {
      const next = editor.redoStack.pop();
      if (next) {
        editor.undoStack.push({ z: editor.currentSlice, mask: cloneMaskRevisionMask(editor.currentMask) });
        restoreMaskRevisionSnapshot(editor, next);
      }
      return true;
    }
    if (action === "reset-slice") {
      resetMaskRevisionSlice(editor);
      return true;
    }
    if (action === "save") {
      saveMaskRevision(editor);
      return true;
    }
    if (action === "zoom-out") {
      applyMaskRevisionZoom(editor, (editor.zoom || calculateMaskRevisionFitZoom(editor)) - 0.15, "manual");
      return true;
    }
    if (action === "zoom-in") {
      applyMaskRevisionZoom(editor, (editor.zoom || calculateMaskRevisionFitZoom(editor)) + 0.15, "manual");
      return true;
    }
    if (action === "zoom-reset") {
      applyMaskRevisionZoom(editor, 1, "manual");
      return true;
    }
    if (action === "zoom-fit") {
      fitMaskRevisionEditor(editor);
      return true;
    }
    return false;
  }

  function handleMaskRevisionControl(event) {
    const targetId = event.target.dataset.editorTarget;
    const editor = getMaskRevisionEditor(targetId);
    if (!editor) return false;
    if (event.target.matches("[data-mask-revision-slice]")) {
      loadMaskRevisionSlice(editor, event.target.value);
      return true;
    }
    if (event.target.matches("[data-mask-revision-brush]")) {
      editor.brushSize = Number(event.target.value || 6);
      return true;
    }
    if (event.target.matches("[data-mask-revision-opacity]")) {
      editor.opacity = Math.max(0.2, Math.min(0.95, Number(event.target.value || 72) / 100));
      drawMaskRevisionMask(editor);
      return true;
    }
    return false;
  }

  function initMaskRevisionEditors() {
    moduleContent.querySelectorAll("[data-mask-revision-canvas]").forEach((canvas) => {
      const existing = maskRevisionEditors.get(canvas.id);
      if (existing?.canvas === canvas) return;
      const card = canvas.closest(".mask-revision-card");
      const viewport = card?.querySelector("[data-mask-revision-viewport]");
      const stage = card?.querySelector("[data-mask-revision-stage]");
      const imageCanvas = card?.querySelector("[data-mask-revision-image]");
      if (!card || !viewport || !stage || !imageCanvas) return;
      const editor = {
        canvas,
        ctx: canvas.getContext("2d"),
        imageCanvas,
        imageCtx: imageCanvas.getContext("2d"),
        viewport,
        stage,
        resultName: canvas.dataset.resultName || card.dataset.maskRevisionResult || "current",
        readOnly: card.dataset.maskRevisionReadOnly === "true",
        tool: "add",
        brushSize: 6,
        opacity: 0.72,
        zoom: 1,
        zoomMode: "fit",
        sliceCount: 1,
        currentSlice: 0,
        currentMask: null,
        sliceCache: new Map(),
        changedSlices: new Map(),
        undoStack: [],
        redoStack: [],
        painting: false,
        lastPoint: null,
        loadingSlice: false,
      };
      maskRevisionEditors.set(canvas.id, editor);
      loadMaskRevisionMeta(editor);

      if (editor.readOnly) return;

      const startStroke = (event) => {
        if (event.pointerId !== undefined) canvas.setPointerCapture?.(event.pointerId);
        beginMaskRevisionStroke(editor, event);
      };
      const moveStroke = (event) => moveMaskRevisionStroke(editor, event);
      const finishStroke = (event) => finishMaskRevisionStroke(editor, event);

      if (window.PointerEvent) {
        canvas.addEventListener("pointerdown", startStroke);
        canvas.addEventListener("pointermove", moveStroke);
        canvas.addEventListener("pointerup", finishStroke);
        canvas.addEventListener("pointercancel", finishStroke);
        canvas.addEventListener("pointerleave", finishStroke);
      } else {
        canvas.addEventListener("mousedown", startStroke);
        window.addEventListener("mousemove", moveStroke);
        window.addEventListener("mouseup", finishStroke);
        canvas.addEventListener("touchstart", startStroke, { passive: false });
        window.addEventListener("touchmove", moveStroke, { passive: false });
        window.addEventListener("touchend", finishStroke);
        window.addEventListener("touchcancel", finishStroke);
      }
    });
    if (!maskRevisionResizeBound) {
      maskRevisionResizeBound = true;
      window.addEventListener("resize", () => window.requestAnimationFrame(resizeMaskRevisionEditors));
    }
  }

  function renderContouringModule() {
    const tool = getTool("targetContouring");
    const toolState = getState("targetContouring");
    if (!toolState.meta) return renderLoading("targetContouring");
    const profiles = toolState.meta.profiles || [];
    const cases = toolState.meta.cases || [];
    const archivedCaseIds = toolState.meta.archived_case_ids || [];
    const modelUnavailable = toolState.meta.status === "model_unavailable";
    const selectedProfile = profiles.find((item) => item.profile_id === toolState.selectedProfileId) || profiles[0] || null;
    return `
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(tool.title)}</h2>
          <p>${escapeHtml(tool.subtitle)}</p>
        </div>
      </div>
      <section class="doctor-native-shell">
        <section class="doctor-native-card doctor-native-hero">
          <div>
            <strong>医生端原生靶区勾画</strong>
            <p>界面与交互已经并入主站医生端，服务地址：${escapeHtml(tool.portLabel)}</p>
          </div>
          <div class="doctor-inline-actions">
            <button class="secondary-button" type="button" data-doctor-tool-action="refresh" data-tool-key="targetContouring">刷新数据</button>
            <button class="primary-action" type="button" data-doctor-tool-action="open" data-tool-key="targetContouring">完整工作台</button>
          </div>
        </section>

        ${renderNotice("targetContouring")}

        <section class="doctor-stat-grid">
          <article class="doctor-stat-card"><span>病例总数</span><strong>${escapeHtml(String(toolState.meta.case_count || cases.length || 0))}</strong></article>
          ${archivedCaseIds.length ? `<article class="doctor-stat-card"><span>历史病例索引</span><strong>${archivedCaseIds.length}</strong></article>` : ""}
          <article class="doctor-stat-card"><span>可用模型</span><strong>${escapeHtml(String(toolState.meta.model_count || 0))}</strong></article>
          <article class="doctor-stat-card"><span>推荐引擎</span><strong>${escapeHtml(selectedProfile?.name || "平衡型")}</strong></article>
        </section>

        <section class="doctor-native-card">
          <div class="doctor-section-top">
            <div><h3>使用演练</h3><p>在医生端直接选择病例并发起靶区勾画。</p></div>
          </div>
          <form id="contouring-case-form" class="doctor-form-grid">
            <label>
              <span>病例序号</span>
              <select id="contouring-case-select" name="case_id" ${toolState.running ? "disabled" : ""}>
                ${cases.map((item, index) => `<option value="${escapeHtml(item.case_id)}" ${item.case_id === toolState.selectedCaseId ? "selected" : ""}>${index + 1}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>勾画引擎</span>
              <select id="contouring-profile-select" name="profile_id" ${toolState.running ? "disabled" : ""}>
                ${profiles.map((item) => `<option value="${escapeHtml(item.profile_id)}" ${item.profile_id === toolState.selectedProfileId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
              </select>
            </label>
            <button class="primary-action" type="submit" ${toolState.running || modelUnavailable ? "disabled" : ""}>${toolState.running ? "处理中..." : modelUnavailable ? "模型未恢复" : "开始勾画"}</button>
          </form>
          <div class="doctor-chip-grid">
            ${cases.map((item, index) => `<button class="doctor-chip${item.case_id === toolState.selectedCaseId ? " active" : ""}" type="button" data-doctor-case-id="${escapeHtml(item.case_id)}" title="${escapeHtml(item.case_id)}" ${toolState.running ? "disabled" : ""}>${index + 1}</button>`).join("")}
          </div>
        </section>

        <section class="doctor-native-card">
          <div class="doctor-section-top">
            <div><h3>NIfTI 上传勾画</h3></div>
          </div>
          <form id="contouring-upload-form" class="doctor-form-grid" enctype="multipart/form-data">
            <label>
              <span>影像文件</span>
              <input id="contouring-upload-file" type="file" name="image_file" accept=".nii,.gz,.nii.gz" ${toolState.running ? "disabled" : ""}>
            </label>
            <label>
              <span>勾画引擎</span>
              <select name="profile_id" ${toolState.running ? "disabled" : ""}>
                ${profiles.map((item) => `<option value="${escapeHtml(item.profile_id)}" ${item.profile_id === toolState.selectedProfileId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
              </select>
            </label>
            <button class="primary-action" type="submit" ${toolState.running || modelUnavailable ? "disabled" : ""}>${toolState.running ? "处理中..." : modelUnavailable ? "模型未恢复" : "上传并勾画"}</button>
          </form>
          <p class="doctor-inline-hint" id="contouring-upload-name">未选择上传文件</p>
        </section>

        ${archivedCaseIds.length ? `<section class="doctor-native-card">
          <div class="doctor-section-top"><div><h3>原站历史病例索引</h3><p>已恢复 ${archivedCaseIds.length} 个病例编号；目前仅第 ${getContouringCaseNumber(toolState, toolState.summary?.case_id) || 19} 例保留可查看的历史勾画结果，其余病例影像和模型未恢复。</p></div></div>
          <div class="doctor-chip-grid">${archivedCaseIds.map((id, index) => `<span class="doctor-chip${id === toolState.summary?.case_id ? " active" : ""}" title="${escapeHtml(id)}">${index + 1}</span>`).join("")}</div>
        </section>` : ""}

        ${renderProgress("targetContouring")}
        ${toolState.summary ? renderContouringResult(toolState.summary) : `
          <section class="doctor-native-card">
            <div class="empty-state"><strong>等待开始勾画</strong><p>选择病例或上传影像后，结果会直接显示在下方。</p></div>
          </section>`}
      </section>`;
  }

  function renderContouringModuleLegacyDuplicate() {
    const tool = getTool("targetContouring");
    const toolState = getState("targetContouring");
    if (!toolState.meta) return renderLoading("targetContouring");
    const profiles = toolState.meta.profiles || [];
    const cases = toolState.meta.cases || [];

    return `
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(tool.title)}</h2>
          <p>${escapeHtml(tool.subtitle)}</p>
        </div>
      </div>
      <section class="doctor-native-shell">
        ${renderNotice("targetContouring")}

        <section class="doctor-native-card">
          <div class="doctor-section-top">
            <div><h3>使用演练</h3><p>在医生端直接选择病例并发起靶区勾画。</p></div>
          </div>
          <form id="contouring-case-form" class="doctor-form-grid">
            <label>
              <span>病例序号</span>
              <select id="contouring-case-select" name="case_id" ${toolState.running ? "disabled" : ""}>
                ${cases.map((item, index) => `<option value="${escapeHtml(item.case_id)}" ${item.case_id === toolState.selectedCaseId ? "selected" : ""}>${index + 1}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>勾画引擎</span>
              <select id="contouring-profile-select" name="profile_id" ${toolState.running ? "disabled" : ""}>
                ${profiles.map((item) => `<option value="${escapeHtml(item.profile_id)}" ${item.profile_id === toolState.selectedProfileId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
              </select>
            </label>
            <button class="primary-action" type="submit" ${toolState.running ? "disabled" : ""}>${toolState.running ? "处理中..." : "开始勾画"}</button>
          </form>
          <div class="doctor-chip-grid">
            ${cases.map((item, index) => `<button class="doctor-chip${item.case_id === toolState.selectedCaseId ? " active" : ""}" type="button" data-doctor-case-id="${escapeHtml(item.case_id)}" title="${escapeHtml(item.case_id)}" ${toolState.running ? "disabled" : ""}>${index + 1}</button>`).join("")}
          </div>
        </section>

        <section class="doctor-native-card">
          <div class="doctor-section-top">
            <div><h3>NIfTI 上传勾画</h3></div>
          </div>
          <form id="contouring-upload-form" class="doctor-form-grid" enctype="multipart/form-data">
            <label>
              <span>影像文件</span>
              <input id="contouring-upload-file" type="file" name="image_file" accept=".nii,.gz,.nii.gz" ${toolState.running ? "disabled" : ""}>
            </label>
            <label>
              <span>勾画引擎</span>
              <select name="profile_id" ${toolState.running ? "disabled" : ""}>
                ${profiles.map((item) => `<option value="${escapeHtml(item.profile_id)}" ${item.profile_id === toolState.selectedProfileId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
              </select>
            </label>
            <button class="primary-action" type="submit" ${toolState.running ? "disabled" : ""}>${toolState.running ? "处理中..." : "上传并勾画"}</button>
          </form>
          <p class="doctor-inline-hint" id="contouring-upload-name">未选择上传文件</p>
        </section>

        ${renderProgress("targetContouring")}
        ${toolState.summary ? renderContouringResult(toolState.summary) : `
          <section class="doctor-native-card">
            <div class="empty-state"><strong>等待开始勾画</strong><p>选择病例或上传影像后，结果会直接显示在下方。</p></div>
          </section>`}
      </section>`;
  }

  function renderContouringModule() {
    const tool = getTool("targetContouring");
    const toolState = getState("targetContouring");
    if (!toolState.meta) return renderLoading("targetContouring");
    const profiles = toolState.meta.profiles || [];
    const cases = toolState.meta.cases || [];
    const selectedProfile = profiles.find((item) => item.profile_id === toolState.selectedProfileId) || profiles[0] || null;
    const displaySummary = toolState.summary || toolState.previewSummary;
    const hasSummary = Boolean(displaySummary);

    return `
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(tool.title)}</h2>
          <p>${escapeHtml(tool.subtitle)}</p>
        </div>
      </div>
      <section class="doctor-native-shell">
        ${renderNotice("targetContouring")}

        ${hasSummary ? renderProgress("targetContouring") : `
          <section class="doctor-native-card doctor-native-hero">
            <div>
              <strong>医生端原生靶区勾画</strong>
              <p>界面与结果都直接整合在主站医生端，当前连接地址：${escapeHtml(tool.portLabel)}</p>
            </div>
            <div class="doctor-inline-actions">
              <button class="secondary-button" type="button" data-doctor-tool-action="refresh" data-tool-key="targetContouring">刷新数据</button>
              <button class="primary-action" type="button" data-doctor-tool-action="open" data-tool-key="targetContouring">完整工作台</button>
            </div>
          </section>
        `}

        ${!hasSummary ? `
          <section class="doctor-stat-grid">
            <article class="doctor-stat-card"><span>病例总数</span><strong>${escapeHtml(String(toolState.meta.case_count || cases.length || 0))}</strong></article>
            <article class="doctor-stat-card"><span>可用模型</span><strong>${escapeHtml(String(toolState.meta.model_count || 0))}</strong></article>
            <article class="doctor-stat-card"><span>推荐引擎</span><strong>${escapeHtml(selectedProfile?.name || "平衡型")}</strong></article>
          </section>
        ` : ""}

        ${renderContouringCasePanel({ toolState, profiles, cases, hasSummary })}

        ${hasSummary ? renderContouringResult(displaySummary, { preview: !toolState.summary && Boolean(toolState.previewSummary), visibleSlices: toolState.visibleSlices }) : ""}

        <section class="doctor-native-card">
          <div class="doctor-section-top">
            <div><h3>NIfTI 上传勾画</h3></div>
          </div>
          <form id="contouring-upload-form" class="doctor-form-grid" enctype="multipart/form-data">
            <label>
              <span>影像文件</span>
              <input id="contouring-upload-file" type="file" name="image_file" accept=".nii,.gz,.nii.gz" ${toolState.running ? "disabled" : ""}>
            </label>
            <label>
              <span>勾画引擎</span>
              <select name="profile_id" ${toolState.running ? "disabled" : ""}>
                ${profiles.map((item) => `<option value="${escapeHtml(item.profile_id)}" ${item.profile_id === toolState.selectedProfileId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
              </select>
            </label>
            <button class="primary-action" type="submit" ${toolState.running ? "disabled" : ""}>${toolState.running ? "处理中..." : "上传并勾画"}</button>
          </form>
          <p class="doctor-inline-hint" id="contouring-upload-name">未选择上传文件</p>
        </section>

        ${!hasSummary ? renderProgress("targetContouring") : ""}
        ${!hasSummary ? `
          <section class="doctor-native-card">
            <div class="empty-state"><strong>等待开始勾画</strong><p>选择病例或上传影像后，结果会直接显示在上方。</p></div>
          </section>` : ""}
      </section>`;
  }

  function renderDoseMetricRows(rows) {
    if (!rows?.length) {
      return `<tr><td colspan="5">当前没有可显示的 DVH 对照指标。</td></tr>`;
    }
    return rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.structure)}</td>
        <td>${escapeHtml(row.metric)}</td>
        <td>${escapeHtml(formatNumber(row.pred, 3))}</td>
        <td>${escapeHtml(formatNumber(row.ref, 3))}</td>
        <td>${escapeHtml(formatNumber(row.abs_diff, 3))}</td>
      </tr>`).join("");
  }

  function renderDoseResult(summary) {
    const tool = getTool("dosePrediction");
    const toolState = getState("dosePrediction");
    ensureDoseSelection();
    const checkpointName = summary.checkpoint_name || summary.checkpoint_path?.split(/[\\/]/).pop() || "-";
    const caseNumber = getDoseCaseNumber(toolState, summary.patient_id);
    const title = summary.source_type === "upload" || summary.split === "upload"
      ? `导入病例：${summary.display_name || summary.patient_id}`
      : caseNumber ? `病例 ${caseNumber}` : `病例 ${summary.display_name || summary.patient_id}`;
    const structures = Object.keys(summary.dvh_curves || {});

    return `
      <section class="doctor-native-card">
        <div class="doctor-section-top">
          <div>
            <h3>预测结果</h3>
            <p>${escapeHtml(title)}，模型检查点：${escapeHtml(checkpointName)}</p>
          </div>
          <div class="doctor-inline-actions">
            <a class="primary-action" href="${tool.serviceUrl}${summary.result_url || `/result/${summary.result_name}`}" target="_blank" rel="noopener noreferrer">结果详情</a>
          </div>
        </div>

        <section class="doctor-stat-grid">
          <article class="doctor-stat-card"><span>Dose score</span><strong>${escapeHtml(formatNumber(summary.dose_score, 4))}</strong></article>
          <article class="doctor-stat-card"><span>DVH score</span><strong>${escapeHtml(formatNumber(summary.dvh_score, 4))}</strong></article>
          <article class="doctor-stat-card"><span>切片数</span><strong>${escapeHtml(String(summary.slice_count || 0))}</strong></article>
          <article class="doctor-stat-card"><span>参考剂量</span><strong>${summary.has_reference_dose ? "有" : "无"}</strong></article>
        </section>

        <div class="doctor-commentary wide">
          <strong>模型效果点评</strong>
          <p>${escapeHtml(summarizeDosePerformance(summary))}</p>
        </div>

        <div class="doctor-slice-controls">
          <label class="doctor-inline-select" for="dose-slice-slider"><span>轴向剂量叠加查看</span></label>
          <input id="dose-slice-slider" type="range" min="0" max="${Math.max((summary.slice_count || 1) - 1, 0)}" value="${toolState.sliceIndex}">
          <span id="dose-slice-label">第 ${toolState.sliceIndex + 1} 张 / 共 ${summary.slice_count} 张</span>
        </div>

        <div class="doctor-result-layout${summary.has_reference_dose ? "" : " single"}">
          <figure class="doctor-result-figure">
            <img id="dose-pred-image" class="doctor-result-image" alt="预测剂量叠加图">
            <figcaption>预测剂量叠加在 CT 上</figcaption>
          </figure>
          ${summary.has_reference_dose ? `
            <figure class="doctor-result-figure">
              <img id="dose-ref-image" class="doctor-result-image" alt="参考剂量叠加图">
              <figcaption>参考剂量叠加在 CT 上</figcaption>
            </figure>` : ""}
        </div>

        <div class="doctor-dvh-shell">
          <div class="doctor-section-top compact">
            <div>
              <h3>DVH 曲线</h3>
              <p>蓝线是预测值，红线是参考值，两条线越接近说明预测越准。</p>
            </div>
            ${structures.length ? `
              <label class="doctor-inline-select">
                <span>结构名称</span>
                <select id="dose-structure-select">
                  ${structures.map((name) => `<option value="${escapeHtml(name)}" ${name === toolState.selectedStructure ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
                </select>
              </label>` : ""}
          </div>
          ${structures.length ? `<div class="doctor-chart-shell"><canvas id="dose-dvh-chart"></canvas></div>` : `<p class="doctor-inline-hint">该病例暂无可显示的 DVH 曲线。</p>`}
        </div>

        <div class="doctor-table-shell">
          <div class="doctor-section-top compact">
            <div><h3>DVH 指标</h3><p>绝对差值越小越好。</p></div>
          </div>
          <div class="doctor-table-wrap">
            <table class="doctor-table">
              <thead>
                <tr>
                  <th>结构</th>
                  <th>指标</th>
                  <th>预测值</th>
                  <th>参考值</th>
                  <th>绝对差值</th>
                </tr>
              </thead>
              <tbody>${renderDoseMetricRows(summary.metric_rows || [])}</tbody>
            </table>
          </div>
        </div>
      </section>`;
  }

  function renderDoseModule() {
    const tool = getTool("dosePrediction");
    const toolState = getState("dosePrediction");
    if (!toolState.meta) return renderLoading("dosePrediction");
    const patients = getDosePatients(toolState.meta, toolState.split);
    const checkpointOptions = toolState.meta.checkpoint_options || [];

    return `
      <section class="doctor-native-shell">
        ${renderNotice("dosePrediction")}

        <section class="doctor-native-card">
          <div class="doctor-section-top">
            <div><h3>使用演练</h3><p>直接在医生端选择数据划分、病例和模型检查点。</p></div>
          </div>
          <form id="dose-case-form" class="doctor-form-grid">
            <label>
              <span>数据划分</span>
              <select id="dose-split-select" name="split" ${toolState.running ? "disabled" : ""}>
                ${Object.entries(splitLabels).filter(([key]) => key !== "upload").map(([key, label]) => `<option value="${key}" ${key === toolState.split ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>病例编号</span>
              <select id="dose-patient-select" name="patient_id" ${toolState.running ? "disabled" : ""}>
                ${patients.map((id, index) => `<option value="${escapeHtml(id)}" ${id === toolState.patientId ? "selected" : ""}>${index + 1}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>模型检查点</span>
              <select id="dose-checkpoint-select" name="checkpoint_path" ${toolState.running ? "disabled" : ""}>
                ${checkpointOptions.map((item) => `<option value="${escapeHtml(item.path)}" ${item.path === toolState.checkpointPath ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
              </select>
            </label>
            <button class="primary-action" type="submit" ${toolState.running ? "disabled" : ""}>${toolState.running ? "处理中..." : "开始预测"}</button>
          </form>
          <div class="doctor-chip-grid">
            ${patients.map((id, index) => `<button class="doctor-chip${id === toolState.patientId ? " active" : ""}" type="button" data-dose-case-id="${escapeHtml(id)}" ${toolState.running ? "disabled" : ""}>${index + 1}</button>`).join("")}
          </div>
        </section>

        <section class="doctor-native-card">
          <div class="doctor-section-top">
            <div><h3>导入病例压缩包</h3><p>请上传按训练数据格式整理好的 .zip 病例包。</p></div>
          </div>
          <form id="dose-upload-form" class="doctor-form-grid" enctype="multipart/form-data">
            <label>
              <span>病例压缩包</span>
              <input id="dose-upload-file" type="file" name="case_zip" accept=".zip,application/zip" ${toolState.running ? "disabled" : ""}>
            </label>
            <label>
              <span>模型检查点</span>
              <select id="dose-upload-checkpoint-select" name="checkpoint_path" ${toolState.running ? "disabled" : ""}>
                ${checkpointOptions.map((item) => `<option value="${escapeHtml(item.path)}" ${item.path === toolState.uploadCheckpointPath ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
              </select>
            </label>
            <button class="primary-action" type="submit" ${toolState.running ? "disabled" : ""}>${toolState.running ? "处理中..." : "上传并预测"}</button>
          </form>
          <p class="doctor-inline-hint" id="dose-upload-name">未选择上传文件</p>
        </section>

        ${renderProgress("dosePrediction")}
        ${toolState.summary ? renderDoseResult(toolState.summary) : `
          <section class="doctor-native-card">
            <div class="empty-state"><strong>等待开始预测</strong><p>预测结果会直接显示在当前医生端模块下方。</p></div>
          </section>`}
      </section>`;
  }

  function renderNativeModule(moduleKey) {
    if (moduleKey === "targetContouring") return renderContouringModule();
    if (moduleKey === "dosePrediction") return renderDoseModule();
    return renderLoading(moduleKey);
  }

  async function runContouringCase(formElement) {
    const toolState = getState("targetContouring");
    toolState.error = "";
    startContouringProgress(formElement);
    try {
      toolState.summary = await requestTool("targetContouring", "/api/run-case", { method: "POST", body: new FormData(formElement) });
      toolState.previewSummary = null;
      toolState.visibleSlices = 0;
      finishContouringProgress("勾画完成", true);
    } catch (error) {
      toolState.error = error.message || "勾画失败。";
      finishContouringProgress("勾画失败", false);
    }
  }

  async function runContouringUpload(formElement) {
    const fileInput = document.getElementById("contouring-upload-file");
    if (!fileInput?.files?.length) {
      setAppNotice("请先选择一个 NIfTI 文件。", "error");
      return;
    }
    const toolState = getState("targetContouring");
    toolState.error = "";
    startContouringProgress(formElement);
    try {
      toolState.summary = await requestTool("targetContouring", "/api/run-upload", { method: "POST", body: new FormData(formElement) });
      toolState.previewSummary = null;
      toolState.visibleSlices = 0;
      finishContouringProgress("勾画完成", true);
    } catch (error) {
      toolState.error = error.message || "上传勾画失败。";
      finishContouringProgress("上传勾画失败", false);
    }
  }

  async function pollDoseJob() {
    const toolState = getState("dosePrediction");
    if (!toolState.currentJobId) return;
    try {
      const payload = await requestTool("dosePrediction", `/api/jobs/${toolState.currentJobId}`);
      toolState.progress = Number(payload.progress || 0);
      toolState.progressMessage = payload.message || "正在处理";
      refreshModuleView("dosePrediction");
      if (payload.status === "completed") {
        clearDosePollTimer();
        toolState.running = false;
        toolState.currentJobId = "";
        toolState.summary = normalizeDoseSummary(payload.summary);
        toolState.sliceIndex = Number.isFinite(toolState.summary?.recommended_slice_index)
          ? toolState.summary.recommended_slice_index
          : Math.floor((toolState.summary?.slice_count || 1) / 2);
        ensureDoseSelection();
        refreshModuleView("dosePrediction");
        return;
      }
      if (payload.status === "failed") {
        clearDosePollTimer();
        toolState.running = false;
        toolState.currentJobId = "";
        toolState.error = payload.error || payload.message || "预测失败。";
        refreshModuleView("dosePrediction");
        return;
      }
      toolState.pollTimer = window.setTimeout(pollDoseJob, 800);
    } catch (error) {
      clearDosePollTimer();
      toolState.running = false;
      toolState.currentJobId = "";
      toolState.error = error.message || "获取任务进度失败。";
      refreshModuleView("dosePrediction");
    }
  }

  async function runDoseCase(formElement) {
    const toolState = getState("dosePrediction");
    toolState.error = "";
    toolState.summary = null;
    toolState.running = true;
    toolState.progress = 2;
    toolState.progressMessage = "正在提交预测任务";
    refreshModuleView("dosePrediction");
    try {
      const payload = await requestTool("dosePrediction", "/api/run-inference", { method: "POST", body: new FormData(formElement) });
      toolState.currentJobId = payload.job_id;
      toolState.progressMessage = "任务已创建，正在排队执行";
      refreshModuleView("dosePrediction");
      pollDoseJob();
    } catch (error) {
      toolState.running = false;
      toolState.error = error.message || "任务提交失败。";
      refreshModuleView("dosePrediction");
    }
  }

  async function runDoseUpload(formElement) {
    const fileInput = document.getElementById("dose-upload-file");
    if (!fileInput?.files?.length) {
      setAppNotice("请先选择一个 zip 病例包。", "error");
      return;
    }
    const toolState = getState("dosePrediction");
    toolState.error = "";
    toolState.summary = null;
    toolState.running = true;
    toolState.progress = 2;
    toolState.progressMessage = "正在上传病例包";
    refreshModuleView("dosePrediction");
    try {
      const payload = await requestTool("dosePrediction", "/api/run-upload-inference", { method: "POST", body: new FormData(formElement) });
      toolState.currentJobId = payload.job_id;
      toolState.progressMessage = "病例包已上传，正在排队执行";
      refreshModuleView("dosePrediction");
      pollDoseJob();
    } catch (error) {
      toolState.running = false;
      toolState.error = error.message || "上传任务提交失败。";
      refreshModuleView("dosePrediction");
    }
  }

  function updateDoseSliceViewer() {
    const toolState = getState("dosePrediction");
    if (currentRole !== "doctor" || activeModuleKey !== "dosePrediction" || !toolState.summary) return;
    ensureDoseSelection();
    const summary = toolState.summary;
    const label = document.getElementById("dose-slice-label");
    const predImage = document.getElementById("dose-pred-image");
    const refImage = document.getElementById("dose-ref-image");
    if (!label || !predImage) return;
    const index = Math.max(0, Math.min(Number(toolState.sliceIndex || 0), Math.max(summary.slice_count - 1, 0)));
    label.textContent = `第 ${index + 1} 张 / 共 ${summary.slice_count} 张`;
    const tool = getTool("dosePrediction");
    const sliceKey = `${summary.result_name}-${index}`;
    predImage.src = buildResultImageUrl(
      tool.serviceUrl,
      `/outputs/web/${summary.result_name}/slices/pred_${String(index).padStart(3, "0")}.png`,
      sliceKey,
    );
    if (summary.has_reference_dose && refImage) {
      refImage.src = buildResultImageUrl(
        tool.serviceUrl,
        `/outputs/web/${summary.result_name}/slices/ref_${String(index).padStart(3, "0")}.png`,
        sliceKey,
      );
    }
  }

  function syncDoseChart() {
    const toolState = getState("dosePrediction");
    if (currentRole !== "doctor" || activeModuleKey !== "dosePrediction" || !toolState.summary || !window.Chart) return;
    ensureDoseSelection();
    const curves = toolState.summary.dvh_curves || {};
    const structures = Object.keys(curves);
    if (!structures.length) return;
    const canvas = document.getElementById("dose-dvh-chart");
    if (!canvas) return;
    const payload = curves[toolState.selectedStructure] || {};
    const pred = payload.pred || { dose: [], volume: [] };
    const ref = payload.ref || { dose: [], volume: [] };
    if (toolState.chart) toolState.chart.destroy();
    toolState.chart = new window.Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels: pred.dose.length ? pred.dose : ref.dose,
        datasets: [
          { label: "预测值", data: pred.volume || [], borderColor: "#1f6fd5", borderWidth: 2, pointRadius: 0, fill: false },
          { label: "参考值", data: ref.volume || [], borderColor: "#ef4444", borderWidth: 2, borderDash: [8, 4], pointRadius: 0, fill: false },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: { title: { display: true, text: "剂量 (Gy)" } },
          y: { title: { display: true, text: "体积 (%)" }, min: 0, max: 100 },
        },
      },
    });
  }

  const baseBuildMetrics = buildMetrics;
  buildMetrics = function (role, moduleKey) {
    if (role === "doctor" && moduleKey === "targetContouring") {
      const toolState = getState("targetContouring");
      return [
        { label: "病例总数", value: String(toolState.meta?.case_count || toolState.meta?.cases?.length || 0) },
        { label: "可用模型", value: String(toolState.meta?.model_count || 0) },
        { label: "最近结果", value: toolState.summary?.case_id || "-" },
      ];
    }
    if (role === "doctor" && moduleKey === "dosePrediction") {
      const toolState = getState("dosePrediction");
      return [
        { label: "训练集", value: String(toolState.meta?.counts?.train || 0) },
        { label: "验证集", value: String(toolState.meta?.counts?.validation || 0) },
        { label: "测试集", value: String(toolState.meta?.counts?.test || 0) },
      ];
    }
    return baseBuildMetrics(role, moduleKey);
  };

  const nativeBuildMetrics = buildMetrics;
  buildMetrics = function (role, moduleKey) {
    return nativeBuildMetrics(role, moduleKey);
  };

  const baseRenderChrome = renderChrome;
  renderChrome = function (role) {
    baseRenderChrome(role);
    if (role === "doctor" && activeModuleKey === "targetContouring") {
      pageSummaryRow.hidden = true;
    }
  };

  const baseRenderModuleContent = renderModuleContent;
  renderModuleContent = function () {
    if (currentRole === "doctor" && getTool(activeModuleKey)) {
      moduleContent.innerHTML = renderNativeModule(activeModuleKey);
      if (activeModuleKey === "targetContouring") {
        queueMicrotask(() => {
          initMaskRevisionEditors();
          initContouringEditor();
        });
      }
      return;
    }
    baseRenderModuleContent();
  };

  const baseEnsureModuleReady = ensureModuleReady;
  ensureModuleReady = async function (moduleKey, force = false) {
    await baseEnsureModuleReady(moduleKey, force);
    if (currentRole === "doctor" && getTool(moduleKey)) {
      await loadMeta(moduleKey, force);
    }
  };

  const baseGetPageActionHandler = getPageActionHandler;
  getPageActionHandler = function () {
    const tool = currentRole === "doctor" ? getTool(activeModuleKey) : null;
    if (!tool) return baseGetPageActionHandler();
    const toolState = getState(activeModuleKey);
    const resultUrl = toolState?.summary?.result_url ? `${tool.assetBaseUrl}${toolState.summary.result_url}` : tool.standaloneUrl;
    return () => window.open(resultUrl, "_blank", "noopener,noreferrer");
  };

  moduleContent.addEventListener("click", (event) => {
    const maskRevisionButton = event.target.closest("[data-mask-revision-action]");
    if (maskRevisionButton) {
      event.preventDefault();
      if (handleMaskRevisionAction(maskRevisionButton.dataset.maskRevisionAction, maskRevisionButton.dataset.editorTarget)) {
        return;
      }
    }

    const contourEditorButton = event.target.closest("[data-contour-editor-action]");
    if (contourEditorButton) {
      event.preventDefault();
      if (handleContourEditorAction(contourEditorButton.dataset.contourEditorAction, contourEditorButton.dataset.editorTarget)) {
        return;
      }
    }

    const actionButton = event.target.closest("[data-doctor-tool-action]");
    if (actionButton) {
      const tool = getTool(actionButton.dataset.toolKey);
      if (!tool) return;
      if (actionButton.dataset.doctorToolAction === "open") {
        const toolState = getState(actionButton.dataset.toolKey);
        const resultUrl = toolState?.summary?.result_url ? `${tool.assetBaseUrl}${toolState.summary.result_url}` : tool.standaloneUrl;
        window.open(resultUrl, "_blank", "noopener,noreferrer");
        return;
      }
      if (actionButton.dataset.doctorToolAction === "refresh") {
        const toolState = getState(actionButton.dataset.toolKey);
        toolState.summary = null;
        if (actionButton.dataset.toolKey === "targetContouring") {
          clearContouringTimer();
          toolState.running = false;
          toolState.previewSummary = null;
          toolState.visibleSlices = 0;
          toolState.progress = 0;
          toolState.progressMessage = "";
        }
        if (actionButton.dataset.toolKey === "dosePrediction") {
          clearDosePollTimer();
          toolState.running = false;
          toolState.currentJobId = "";
          toolState.progress = 0;
          toolState.progressMessage = "";
        }
        loadMeta(actionButton.dataset.toolKey, true).then(() => setAppNotice(`${tool.title}模块数据已刷新。`, "success"));
      }
      return;
    }

    const caseButton = event.target.closest("[data-doctor-case-id]");
    if (caseButton) {
      state.targetContouring.selectedCaseId = caseButton.dataset.doctorCaseId;
      refreshModuleView("targetContouring");
    }

    const doseCaseButton = event.target.closest("[data-dose-case-id]");
    if (doseCaseButton) {
      state.dosePrediction.patientId = doseCaseButton.dataset.doseCaseId;
      refreshModuleView("dosePrediction");
    }
  });

  moduleContent.addEventListener("change", (event) => {
    if (handleMaskRevisionControl(event)) return;
    if (handleContourEditorControl(event)) return;
    if (event.target.id === "contouring-case-select") state.targetContouring.selectedCaseId = event.target.value;
    if (event.target.id === "contouring-profile-select") state.targetContouring.selectedProfileId = event.target.value;
    if (event.target.id === "contouring-upload-file") {
      const label = document.getElementById("contouring-upload-name");
      if (label) label.textContent = event.target.files?.[0]?.name || "未选择上传文件";
    }
    if (event.target.id === "dose-split-select") {
      state.dosePrediction.split = event.target.value;
      const patients = getDosePatients(state.dosePrediction.meta, state.dosePrediction.split);
      state.dosePrediction.patientId = patients[0] || "";
      refreshModuleView("dosePrediction");
    }
    if (event.target.id === "dose-patient-select") state.dosePrediction.patientId = event.target.value;
    if (event.target.id === "dose-checkpoint-select") state.dosePrediction.checkpointPath = event.target.value;
    if (event.target.id === "dose-upload-checkpoint-select") state.dosePrediction.uploadCheckpointPath = event.target.value;
    if (event.target.id === "dose-upload-file") {
      const label = document.getElementById("dose-upload-name");
      if (label) label.textContent = event.target.files?.[0]?.name || "未选择上传文件";
    }
    if (event.target.id === "dose-structure-select") {
      state.dosePrediction.selectedStructure = event.target.value;
      syncDoseChart();
    }
  });

  moduleContent.addEventListener("input", (event) => {
    if (handleMaskRevisionControl(event)) return;
    if (handleContourEditorControl(event)) return;
    if (event.target.id === "dose-slice-slider") {
      state.dosePrediction.sliceIndex = Number(event.target.value || 0);
      updateDoseSliceViewer();
    }
  });

  moduleContent.addEventListener("submit", async (event) => {
    if (event.target.id === "contouring-case-form") {
      event.preventDefault();
      await runContouringCase(event.target);
      return;
    }
    if (event.target.id === "contouring-upload-form") {
      event.preventDefault();
      await runContouringUpload(event.target);
      return;
    }
    if (event.target.id === "dose-case-form") {
      event.preventDefault();
      await runDoseCase(event.target);
      return;
    }
    if (event.target.id === "dose-upload-form") {
      event.preventDefault();
      await runDoseUpload(event.target);
    }
  });
})();
