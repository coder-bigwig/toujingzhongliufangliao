"use strict";

const SITES = [
  { key: "tongue", label: "舌", tumor: "舌鳞癌", surgery: "舌癌扩大切除术+选择性颈清扫术", aliases: [/舌鳞癌|舌癌|舌缘|tongue/i] },
  { key: "floor", label: "口底", tumor: "口底鳞癌", surgery: "口底肿瘤扩大切除术+颈清扫术", aliases: [/口底鳞癌|口底癌|floor\s*of\s*mouth/i] },
  { key: "gingiva", label: "牙龈", tumor: "牙龈鳞癌", surgery: "牙龈肿瘤扩大切除术+颈清扫术", aliases: [/牙龈鳞癌|牙龈癌|齿龈/i] },
  { key: "buccal", label: "颊黏膜", tumor: "颊黏膜鳞癌", surgery: "颊黏膜肿瘤扩大切除术+颈清扫术", aliases: [/颊黏膜鳞癌|颊黏膜癌|buccal/i] },
  { key: "oropharynx", label: "口咽", tumor: "口咽鳞癌", surgery: "口咽原发灶切除术+颈清扫术", aliases: [/口咽鳞癌|口咽癌|扁桃体鳞癌|oropharynx/i] },
  { key: "hypopharynx", label: "下咽", tumor: "下咽鳞癌", surgery: "下咽部分切除术+颈清扫术", aliases: [/下咽鳞癌|下咽癌|梨状窝鳞癌|hypopharynx/i] },
  { key: "larynx", label: "喉", tumor: "喉鳞癌", surgery: "喉部分切除术+颈清扫术", aliases: [/喉鳞癌|喉癌|声门癌|larynx/i] },
];

const PATTERNS = [
  { key: "observe", title: "早期低危术后观察", type: "observe", diff: "高分化", stage: "pT1N0M0", t: "T1", n: "N0", m: "M0", margin: "negative", marginMm: 8, doi: 4, pos: 0, total: 18, ene: false, pni: false, lvi: false },
  { key: "close", title: "近切缘倾向术后放疗", type: "rt", diff: "中分化", stage: "pT2N0M0", t: "T2", n: "N0", m: "M0", margin: "close", marginMm: 3, doi: 6, pos: 0, total: 20, ene: false, pni: false, lvi: false },
  { key: "deep", title: "浸润较深倾向术后放疗", type: "rt", diff: "中分化", stage: "pT2N0M0", t: "T2", n: "N0", m: "M0", margin: "negative", marginMm: 6, doi: 12, pos: 0, total: 22, ene: false, pni: false, lvi: false },
  { key: "t3", title: "局部晚期并神经侵犯", type: "rt", diff: "中低分化", stage: "pT3N0M0", t: "T3", n: "N0", m: "M0", margin: "negative", marginMm: 6, doi: 14, pos: 0, total: 24, ene: false, pni: true, lvi: false },
  { key: "node1", title: "单枚淋巴结转移", type: "rt", diff: "中分化", stage: "pT2N1M0", t: "T2", n: "N1", m: "M0", margin: "negative", marginMm: 6, doi: 8, pos: 1, total: 24, ene: false, pni: false, lvi: true },
  { key: "nodes", title: "多枚淋巴结转移", type: "rt", diff: "低分化", stage: "pT2N2bM0", t: "T2", n: "N2b", m: "M0", margin: "negative", marginMm: 5, doi: 9, pos: 3, total: 28, ene: false, pni: true, lvi: true },
  { key: "margin_pos", title: "切缘阳性倾向同步放化疗", type: "ccrt", diff: "低分化", stage: "pT3N1M0", t: "T3", n: "N1", m: "M0", margin: "positive", marginMm: 0, doi: 11, pos: 1, total: 22, ene: false, pni: true, lvi: true },
  { key: "ene", title: "包膜外侵犯倾向同步放化疗", type: "ccrt", diff: "低分化", stage: "pT2N2aM0", t: "T2", n: "N2a", m: "M0", margin: "negative", marginMm: 5, doi: 9, pos: 2, total: 26, ene: true, pni: false, lvi: true },
];

const NOTES = [
  "演示版规则仅面向头颈部鳞状细胞癌术后病例。",
  "切缘阳性或包膜外侵犯优先视为高危，提示术后同步放化疗评估。",
  "近切缘、pT3-4、淋巴结转移、PNI、LVI、DOI较深等视为中危，提示术后放疗评估。",
  "未识别到明确危险因素时，演示版输出 NO，但仍需结合原始病理和 MDT。",
];

function t(v) { return String(v || "").replace(/\r/g, "").replace(/\s+/g, " ").trim(); }
function uniq(list) { return Array.from(new Set((list || []).map((x) => t(x)).filter(Boolean))); }
function toNum(v) { if (v === null || v === undefined || v === "") return null; const m = String(v).match(/-?\d+(?:\.\d+)?/); return m ? Number(m[0]) : null; }
function toBool(v) {
  if (v === true || v === false) return v;
  const s = t(v).toLowerCase();
  if (!s) return null;
  if (/^(true|1|yes|是|有|阳性|可见|存在)$/.test(s)) return true;
  if (/^(false|0|no|否|无|阴性|未见)$/.test(s)) return false;
  return null;
}
function label(type) { if (type === "ccrt") return "术后同步放化疗"; if (type === "rt") return "术后放疗"; if (type === "unsupported") return "当前场景不适用"; return "观察随访"; }
function siteByText(text) { const hit = SITES.find((s) => s.aliases.some((p) => p.test(t(text)))); return hit || null; }

function summaryOf(site, pattern, index) {
  const sex = index % 2 === 0 ? "男" : "女";
  const age = 44 + (index % 23);
  const pathology = `${pattern.diff}${site.tumor}`;
  const margin = pattern.margin === "positive" ? "切缘阳性" : `切缘阴性，最近切缘 ${pattern.marginMm} mm`;
  const node = pattern.pos === 0
    ? `颈清扫淋巴结 ${pattern.pos}/${pattern.total} 枚转移`
    : pattern.ene
      ? `颈清扫淋巴结 ${pattern.pos}/${pattern.total} 枚转移，其中见包膜外侵犯`
      : `颈清扫淋巴结 ${pattern.pos}/${pattern.total} 枚转移，未见包膜外侵犯`;
  return [
    `患者${sex}，${age}岁，因“${site.label}原发肿物”收治入院。`,
    `完善评估后行${site.surgery}。`,
    `术后病理示：${pathology}。`,
    `浸润深度约 ${pattern.doi} mm。`,
    `${margin}。`,
    `${node}。`,
    pattern.pni ? "病理提示神经侵犯。" : "未见明确神经侵犯。",
    pattern.lvi ? "可见脉管侵犯。" : "未见明确脉管侵犯。",
    `病理分期 ${pattern.stage}。`,
    "术后恢复可，予以带药出院，嘱门诊随访并携病理复诊。",
  ].join(" ");
}

function buildCases() {
  const out = [];
  let i = 1;
  for (const site of SITES) {
    for (const pattern of PATTERNS) {
      out.push({
        id: `HNSCC-${String(i).padStart(2, "0")}`,
        title: `${site.tumor} · ${pattern.title}`,
        site: site.label,
        pathology: `${pattern.diff}${site.tumor}`,
        recommendationType: pattern.type,
        recommendationTitle: label(pattern.type),
        tags: uniq([site.label, pattern.stage, label(pattern.type), pattern.margin === "positive" ? "切缘阳性" : "切缘阴性", pattern.ene ? "ENE+" : "ENE-", pattern.pni ? "PNI+" : "PNI-", pattern.lvi ? "LVI+" : "LVI-"]),
        summaryText: summaryOf(site, pattern, i),
        structuredTruth: {
          scenarioType: "postoperative_hnscc",
          primarySite: site.key,
          primarySiteLabel: site.label,
          pathology: `${pattern.diff}${site.tumor}`,
          isSquamousCellCarcinoma: true,
          surgeryPerformed: site.surgery,
          pathologicStage: pattern.stage,
          tStage: pattern.t,
          nStage: pattern.n,
          mStage: pattern.m,
          marginStatus: pattern.margin,
          closestMarginMm: pattern.marginMm,
          positiveNodes: pattern.pos,
          examinedNodes: pattern.total,
          extranodalExtension: pattern.ene,
          perineuralInvasion: pattern.pni,
          lymphovascularInvasion: pattern.lvi,
          depthOfInvasionMm: pattern.doi,
          supportingEvidence: [],
          uncertainties: [],
        },
      });
      i += 1;
    }
  }
  return out;
}

const RADIOTHERAPY_DEMO_CASES = buildCases();

function buildRadiotherapyExamplesSummary() {
  return RADIOTHERAPY_DEMO_CASES.reduce((s, item) => {
    s.total += 1;
    if (item.recommendationType === "ccrt") s.ccrtCount += 1;
    else if (item.recommendationType === "rt") s.rtCount += 1;
    else s.observeCount += 1;
    return s;
  }, { total: 0, ccrtCount: 0, rtCount: 0, observeCount: 0 });
}

function getRadiotherapyDemoCaseById(id) {
  return RADIOTHERAPY_DEMO_CASES.find((item) => item.id === id) || null;
}
function normalizeStage(value) {
  const s = t(value).replace(/\s+/g, "");
  const m = s.match(/p?(T[0-4][ab]?)(N[0-3][abc]?)(M[0-1x])/i);
  return m ? { stage: `p${m[1].toUpperCase()}${m[2].toUpperCase()}${m[3].toUpperCase()}`, t: m[1].toUpperCase(), n: m[2].toUpperCase(), m: m[3].toUpperCase() } : { stage: "", t: "", n: "", m: "" };
}

function normalizeInput(input = {}, options = {}) {
  const sourceText = t(options.sourceText || "");
  const stage = normalizeStage(input.pathologicStage || input.stage || input.stageText || sourceText);
  const site = siteByText([input.primarySiteLabel, input.primarySite, input.site, sourceText].join(" "));
  const pathology = t(input.pathology || input.histology || input.pathologyDiagnosis);
  const marginMm = toNum(input.closestMarginMm ?? input.marginMm ?? input.closest_margin_mm);
  const rawMargin = t(input.marginStatus || input.margin || input.margin_state || sourceText);
  const marginStatus = /切缘阳性|残端阳性|R1|positive margin/i.test(rawMargin) || marginMm === 0
    ? "positive"
    : /近切缘|切缘近|close margin/i.test(rawMargin)
      ? "close"
      : typeof marginMm === "number"
        ? (marginMm < 5 ? "close" : "negative")
        : /切缘阴性|negative margin/i.test(rawMargin)
          ? "negative"
          : "unknown";
  const scc = (() => {
    const b = toBool(input.isSquamousCellCarcinoma ?? input.isScc);
    if (b !== null) return b;
    return /鳞状细胞癌|鳞癌|squamous cell carcinoma/i.test([pathology, sourceText].join(" ")) ? true : null;
  })();
  return {
    scenarioType: "postoperative_hnscc",
    primarySite: site ? site.key : "other",
    primarySiteLabel: t(input.primarySiteLabel || input.primarySite || input.siteLabel) || (site ? site.label : "其他"),
    pathology,
    isSquamousCellCarcinoma: scc,
    surgeryPerformed: t(input.surgeryPerformed || input.surgery || input.operation || input.procedure),
    pathologicStage: t(input.pathologicStage || input.stage || stage.stage),
    tStage: t(input.tStage || stage.t),
    nStage: t(input.nStage || stage.n),
    mStage: t(input.mStage || stage.m),
    marginStatus,
    closestMarginMm: marginMm,
    positiveNodes: toNum(input.positiveNodes ?? input.nodePositive ?? input.positive_nodes),
    examinedNodes: toNum(input.examinedNodes ?? input.nodeTotal ?? input.examined_nodes),
    extranodalExtension: toBool(input.extranodalExtension ?? input.ene ?? input.extranodal_extension),
    perineuralInvasion: toBool(input.perineuralInvasion ?? input.pni ?? input.perineural_invasion),
    lymphovascularInvasion: toBool(input.lymphovascularInvasion ?? input.lvi ?? input.lymphovascular_invasion),
    depthOfInvasionMm: toNum(input.depthOfInvasionMm ?? input.doiMm ?? input.depth_of_invasion_mm),
    supportingEvidence: Array.isArray(input.supportingEvidence)
      ? input.supportingEvidence.map((x) => ({ field: t(x.field), evidence: t(x.evidence) })).filter((x) => x.field && x.evidence)
      : [],
    uncertainties: uniq(input.uncertainties || []),
  };
}

function findBinary(text, yes, no, field) {
  const s = t(text);
  const neg = no && s.match(no);
  if (neg) return { value: false, evidence: [{ field, evidence: neg[0] }] };
  const pos = s.match(yes);
  if (pos) return { value: true, evidence: [{ field, evidence: pos[0] }] };
  return { value: null, evidence: [] };
}

function buildFallbackExtraction(summaryText, caseId = "") {
  const known = getRadiotherapyDemoCaseById(caseId);
  if (known) return { ...known.structuredTruth, supportingEvidence: [], uncertainties: [] };
  const text = t(summaryText);
  const stage = normalizeStage(text);
  const marginMatch = text.match(/最近切缘\s*(\d+(?:\.\d+)?)\s*mm/i) || text.match(/切缘[^。；;]{0,18}?(\d+(?:\.\d+)?)\s*mm/i);
  const marginMm = marginMatch ? Number(marginMatch[1]) : null;
  const nodeMatch = text.match(/(?:淋巴结|颈清扫淋巴结)[^0-9]{0,8}(\d+)\s*\/\s*(\d+)\s*枚?(?:转移|阳性)?/i) || text.match(/(\d+)\s*\/\s*(\d+)\s*枚?(?:淋巴结)?转移/i);
  const doiMatch = text.match(/浸润深度(?:约)?\s*(\d+(?:\.\d+)?)\s*mm/i);
  const pathologyMatch = text.match(/([高低中分化]*鳞状细胞癌|鳞癌)/i);
  const ene = findBinary(text, /包膜外侵犯|结外侵犯|ENE\+?/i, /未见包膜外侵犯|未见结外侵犯|ENE阴性/i, "extranodalExtension");
  const pni = findBinary(text, /神经侵犯|PNI\+?/i, /未见神经侵犯|PNI阴性/i, "perineuralInvasion");
  const lvi = findBinary(text, /脉管侵犯|脉管内癌栓|LVI\+?/i, /未见脉管侵犯|未见癌栓|LVI阴性/i, "lymphovascularInvasion");
  return normalizeInput({
    primarySiteLabel: (siteByText(text) || {}).label || "其他",
    pathology: pathologyMatch ? pathologyMatch[0] : "",
    isSquamousCellCarcinoma: pathologyMatch ? true : null,
    pathologicStage: stage.stage,
    tStage: stage.t,
    nStage: stage.n,
    mStage: stage.m,
    marginStatus: /切缘阳性|残端阳性|R1/i.test(text) ? "positive" : (marginMm !== null ? (marginMm < 5 ? "close" : "negative") : "unknown"),
    closestMarginMm: marginMm,
    positiveNodes: nodeMatch ? Number(nodeMatch[1]) : null,
    examinedNodes: nodeMatch ? Number(nodeMatch[2]) : null,
    extranodalExtension: ene.value,
    perineuralInvasion: pni.value,
    lymphovascularInvasion: lvi.value,
    depthOfInvasionMm: doiMatch ? Number(doiMatch[1]) : null,
    supportingEvidence: [
      ...(stage.stage ? [{ field: "pathologicStage", evidence: stage.stage }] : []),
      ...(marginMatch ? [{ field: "marginStatus", evidence: marginMatch[0] }, { field: "closestMarginMm", evidence: marginMatch[0] }] : []),
      ...(nodeMatch ? [{ field: "positiveNodes", evidence: nodeMatch[0] }, { field: "examinedNodes", evidence: nodeMatch[0] }] : []),
      ...(doiMatch ? [{ field: "depthOfInvasionMm", evidence: doiMatch[0] }] : []),
      ...ene.evidence,
      ...pni.evidence,
      ...lvi.evidence,
    ],
  }, { sourceText: text });
}

function boolLabel(v) { if (v === true) return "是"; if (v === false) return "否"; return "未提及"; }
function marginLabel(s, mm) { if (s === "positive") return "阳性"; if (s === "close") return typeof mm === "number" ? `近切缘（${mm} mm）` : "近切缘"; if (s === "negative") return typeof mm === "number" ? `阴性（最近切缘 ${mm} mm）` : "阴性"; return "未提及"; }
function nodeLabel(pos, total) { if (typeof pos !== "number") return "未提及"; return typeof total === "number" ? `${pos}/${total}` : String(pos); }
function numLabel(v, unit = "") { return typeof v === "number" && !Number.isNaN(v) ? `${v}${unit}` : "未提及"; }

function buildElements(extracted) {
  const map = (extracted.supportingEvidence || []).reduce((m, x) => { if (!m[x.field]) m[x.field] = []; m[x.field].push(x.evidence); return m; }, {});
  const ev = (field) => (map[field] || []).join("；") || "-";
  return [
    { label: "原发部位", value: extracted.primarySiteLabel || "未提及", evidence: ev("primarySiteLabel") },
    { label: "病理类型", value: extracted.pathology || "未提及", evidence: ev("pathology") },
    { label: "术式", value: extracted.surgeryPerformed || "未提及", evidence: ev("surgeryPerformed") },
    { label: "病理分期", value: extracted.pathologicStage || "未提及", evidence: ev("pathologicStage") },
    { label: "切缘状态", value: marginLabel(extracted.marginStatus, extracted.closestMarginMm), evidence: [ev("marginStatus"), ev("closestMarginMm")].filter((x) => x !== "-").join("；") || "-" },
    { label: "阳性淋巴结", value: nodeLabel(extracted.positiveNodes, extracted.examinedNodes), evidence: ev("positiveNodes") },
    { label: "包膜外侵犯", value: boolLabel(extracted.extranodalExtension), evidence: ev("extranodalExtension") },
    { label: "神经侵犯", value: boolLabel(extracted.perineuralInvasion), evidence: ev("perineuralInvasion") },
    { label: "脉管侵犯", value: boolLabel(extracted.lymphovascularInvasion), evidence: ev("lymphovascularInvasion") },
    { label: "浸润深度", value: numLabel(extracted.depthOfInvasionMm, " mm"), evidence: ev("depthOfInvasionMm") },
  ];
}
function evaluateRadiotherapyDecision(input, options = {}) {
  const extracted = normalizeInput(input, options);
  const high = [];
  const mid = [];
  const trace = [];

  if (extracted.isSquamousCellCarcinoma === false) {
    trace.push({ level: "blocked", text: "病理信息未指向鳞状细胞癌，本模块不适用。" });
  }
  if (extracted.marginStatus === "positive") {
    high.push("切缘阳性");
    trace.push({ level: "high", text: "切缘阳性属于高危因素，优先提示术后同步放化疗评估。" });
  }
  if (extracted.extranodalExtension === true) {
    high.push("淋巴结包膜外侵犯（ENE+）");
    trace.push({ level: "high", text: "淋巴结包膜外侵犯属于高危因素，优先提示术后同步放化疗评估。" });
  }
  if (!high.length) {
    if (extracted.marginStatus === "close") {
      mid.push(typeof extracted.closestMarginMm === "number" ? `近切缘（${extracted.closestMarginMm} mm）` : "近切缘");
      trace.push({ level: "intermediate", text: "近切缘提示局部复发风险增加，纳入术后放疗评估。" });
    }
    if (["T3", "T4", "T4A", "T4B"].includes(extracted.tStage)) {
      mid.push(`${extracted.tStage} 局部晚期`);
      trace.push({ level: "intermediate", text: "pT3-4 属于局部晚期，纳入术后放疗评估。" });
    }
    if (typeof extracted.positiveNodes === "number" && extracted.positiveNodes >= 1) {
      mid.push(typeof extracted.examinedNodes === "number" ? `淋巴结转移 ${extracted.positiveNodes}/${extracted.examinedNodes}` : `存在淋巴结转移 ${extracted.positiveNodes} 枚`);
      trace.push({ level: "intermediate", text: "存在淋巴结转移，纳入术后放疗评估。" });
    }
    if (extracted.perineuralInvasion === true) {
      mid.push("神经侵犯（PNI+）");
      trace.push({ level: "intermediate", text: "神经侵犯提示局部复发风险增加。" });
    }
    if (extracted.lymphovascularInvasion === true) {
      mid.push("脉管侵犯（LVI+）");
      trace.push({ level: "intermediate", text: "脉管侵犯提示复发风险增加。" });
    }
    if (typeof extracted.depthOfInvasionMm === "number" && extracted.depthOfInvasionMm >= 10) {
      mid.push(`浸润深度较深（${extracted.depthOfInvasionMm} mm）`);
      trace.push({ level: "intermediate", text: "浸润深度较深提示复发风险增加。" });
    }
  }

  let type = "observe";
  let applicable = true;
  if (extracted.isSquamousCellCarcinoma === false) {
    type = "unsupported";
    applicable = false;
  } else if (high.length) {
    type = "ccrt";
  } else if (mid.length) {
    type = "rt";
  }

  const reasons = high.length ? high : mid;
  if (!reasons.length && type === "observe") {
    trace.push({ level: "observe", text: "未识别到明确高危或中危因素，演示版暂不提示必须术后放疗。" });
  }
  const uncertainties = uniq([
    ...(extracted.uncertainties || []),
    !extracted.pathologicStage ? "病理分期未完整提取" : "",
    extracted.marginStatus === "unknown" ? "切缘信息未完整提取" : "",
    extracted.extranodalExtension === null ? "包膜外侵犯未明确提及" : "",
    extracted.perineuralInvasion === null ? "神经侵犯未明确提及" : "",
    extracted.lymphovascularInvasion === null ? "脉管侵犯未明确提及" : "",
  ]);
  const requiresRadiotherapy = type === "rt" || type === "ccrt";
  const yesNo = applicable ? (requiresRadiotherapy ? "YES" : "NO") : "N/A";
  const summary = type === "ccrt"
    ? `识别到高危因素：${reasons.join("；")}`
    : type === "rt"
      ? `识别到术后风险因素：${reasons.join("；")}`
      : type === "unsupported"
        ? "当前文本不属于头颈部鳞癌术后场景，暂不输出放疗结论。"
        : "当前未识别到明确高危或中危放疗指征。";

  return {
    applicable,
    yesNo,
    requiresRadiotherapy,
    recommendationType: type,
    recommendationTitle: label(type),
    recommendationSummary: summary,
    strongReasons: reasons,
    rtReasons: [...high, ...mid],
    highRiskReasons: high,
    intermediateReasons: mid,
    nextSteps: type === "ccrt"
      ? ["优先复核原始病理，确认切缘阳性或 ENE 是否明确成立。", "进入放疗科评估术后同步放化疗适应证、时机和耐受性。", "建议 MDT 讨论靶区、剂量和全身治疗配合方案。"]
      : type === "rt"
        ? ["补齐完整病理原文，确认近切缘、分期和侵犯相关信息。", "安排放疗科门诊评估术后放疗适应证和靶区方案。", "若后续病理复核发现切缘阳性或 ENE，应重新上调为同步放化疗评估。"]
        : type === "unsupported"
          ? ["当前文本不属于本演示模块适用病种或场景，建议人工复核。", "若为非鳞癌、鼻咽癌或未手术病例，应切换到相应病种流程。"]
          : ["当前未提示必须术后放疗，但仍建议结合完整病理和 MDT 结论综合判断。", "若后续补充病理出现切缘异常、ENE、PNI、LVI 或淋巴结转移，应重新评估。", "保留常规门诊随访和病理复核流程。"],
    extractedJson: {
      scenarioType: extracted.scenarioType,
      primarySite: extracted.primarySite,
      primarySiteLabel: extracted.primarySiteLabel,
      pathology: extracted.pathology,
      isSquamousCellCarcinoma: extracted.isSquamousCellCarcinoma,
      surgeryPerformed: extracted.surgeryPerformed,
      pathologicStage: extracted.pathologicStage,
      tStage: extracted.tStage,
      nStage: extracted.nStage,
      mStage: extracted.mStage,
      marginStatus: extracted.marginStatus,
      closestMarginMm: extracted.closestMarginMm,
      positiveNodes: extracted.positiveNodes,
      examinedNodes: extracted.examinedNodes,
      extranodalExtension: extracted.extranodalExtension,
      perineuralInvasion: extracted.perineuralInvasion,
      lymphovascularInvasion: extracted.lymphovascularInvasion,
      depthOfInvasionMm: extracted.depthOfInvasionMm,
      supportingEvidence: extracted.supportingEvidence,
      uncertainties,
    },
    extractedElements: buildElements(extracted),
    ruleTrace: trace,
    guidelineNotes: NOTES,
    caution: "本模块为演示版临床决策支持原型，不能替代原始病理复核、影像评估、分期讨论和 MDT 正式结论。",
    missingFields: uncertainties,
  };
}

function buildLocalRadiotherapyReport(analysis) {
  const x = analysis.extractedJson || {};
  const basis = analysis.strongReasons && analysis.strongReasons.length ? analysis.strongReasons.join("；") : "未识别到明确高危或中危因素";
  return [
    `一、结论：${analysis.yesNo}。${analysis.recommendationTitle}。`,
    `二、判断依据：${basis}。`,
    `三、结构化要点：原发部位 ${x.primarySiteLabel || "未提及"}；病理分期 ${x.pathologicStage || "未提及"}；切缘 ${marginLabel(x.marginStatus, x.closestMarginMm)}；淋巴结 ${nodeLabel(x.positiveNodes, x.examinedNodes)}；ENE ${boolLabel(x.extranodalExtension)}；PNI ${boolLabel(x.perineuralInvasion)}；LVI ${boolLabel(x.lymphovascularInvasion)}；浸润深度 ${numLabel(x.depthOfInvasionMm, " mm")}。`,
    `四、建议：${(analysis.nextSteps || []).join("；")}`,
    `五、提示：${analysis.caution || ""}`,
  ].join("\n");
}

function analyzeRadiotherapyDecision(summaryText, options = {}) {
  const extracted = buildFallbackExtraction(summaryText, options.caseId || "");
  const analysis = evaluateRadiotherapyDecision(extracted, { sourceText: summaryText });
  return {
    ...analysis,
    reportText: buildLocalRadiotherapyReport(analysis),
    pipeline: { extraction: "local_fallback", report: "local_fallback" },
  };
}

module.exports = {
  RADIOTHERAPY_DEMO_CASES,
  analyzeRadiotherapyDecision,
  buildFallbackExtraction,
  buildLocalRadiotherapyReport,
  buildRadiotherapyExamplesSummary,
  evaluateRadiotherapyDecision,
  getRadiotherapyDemoCaseById,
  normalizeDecisionInput: normalizeInput,
};
