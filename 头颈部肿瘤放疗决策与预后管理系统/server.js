const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const net = require("net");
const { spawn } = require("child_process");
const { isDeepStrictEqual } = require("util");
const { URL } = require("url");
const {
  RADIOTHERAPY_DEMO_CASES,
  analyzeRadiotherapyDecision,
  buildFallbackExtraction,
  buildLocalRadiotherapyReport,
  buildRadiotherapyExamplesSummary,
  evaluateRadiotherapyDecision,
} = require("./radiotherapy-decision-engine");

const ROOT = __dirname;
const HOST = process.env.MED_HOST || "127.0.0.1";
const PORT = Number.parseInt(process.env.MED_PORT || "8080", 10) || 8080;
const CONTOUR_PORT = Number.parseInt(process.env.BRAIN_GTV_PORT || "8011", 10) || 8011;
const DOSE_PORT = Number.parseInt(process.env.DOSE_PRED_PORT || "8021", 10) || 8021;
const DATA_FILE = path.join(ROOT, "app-data.json");
const AI_CONFIG_FILE = path.join(ROOT, "ai-config.json");
const AI_CHATS_FILE = path.join(ROOT, "ai-chats.json");
const AI_DEBUG_RESPONSE_FILE = path.join(ROOT, "ai-last-response.json");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const PYTHON_EXECUTABLE = process.env.PYTHON || "python";
const SESSION_COOKIE_NAME = "med_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const sessionStore = new Map();
const managedDoctorToolProcesses = new Map();

const DOCTOR_TOOL_SERVICES = {
  contouring: {
    key: "contouring",
    name: "Contouring",
    port: CONTOUR_PORT,
    root: path.resolve(ROOT, "..", "brain_gtv_system"),
    entry: "app.py",
    env: { BRAIN_GTV_HOST: "127.0.0.1", BRAIN_GTV_PORT: String(CONTOUR_PORT) },
  },
  dosePrediction: {
    key: "dosePrediction",
    name: "Dose prediction",
    port: DOSE_PORT,
    root: path.resolve(ROOT, "..", "dose_prediction_system"),
    entry: "app.py",
    env: { DOSE_PRED_HOST: "127.0.0.1", DOSE_PRED_PORT: String(DOSE_PORT) },
  },
};

const ACCOUNTS = {
  doctor: { username: "doctor001", password: process.env.MED_DOCTOR_PASSWORD || "123456", name: "张明炜" },
  patient: { username: "patient001", password: process.env.MED_PATIENT_PASSWORD || "123456", name: "陈丽" },
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
  ".csv": "text/csv; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const ALLOWED_UPLOAD_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".txt", ".md", ".json", ".csv", ".pdf", ".doc", ".docx"]);
const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024;

const DEFAULT_APP_DATA = {
  patients: [],
  schedules: [],
  followups: [],
  escortRequests: [],
  escortStaffSchedules: [],
  healthManuals: [],
  products: [],
  orders: [],
  cartItems: [],
  addresses: [],
};

const CATALOG_SEED_FILE = path.join(ROOT, "catalog-seed.json");
if (fs.existsSync(CATALOG_SEED_FILE)) {
  try {
    const catalogSeed = JSON.parse(fs.readFileSync(CATALOG_SEED_FILE, "utf8"));
    DEFAULT_APP_DATA.products = Array.isArray(catalogSeed.products) ? catalogSeed.products : [];
    DEFAULT_APP_DATA.healthManuals = Array.isArray(catalogSeed.healthManuals) ? catalogSeed.healthManuals : [];
  } catch (error) {
    console.warn(`[catalog] Failed to load public catalog seed: ${error.message}`);
  }
}

const DEFAULT_AI_CONFIG = {
  providerName: "OpenAI \u517c\u5bb9\u63a5\u53e3",
  apiBaseUrl: "",
  model: "",
  apiKey: "",
  enableWebSearch: true,
  maxWebResults: 5,
  systemPrompt: "",
  updatedAt: "",
};

DEFAULT_AI_CONFIG.systemPrompt =
  "\u4f60\u662f\u5934\u9888\u90e8\u80bf\u7624\u653e\u7597\u51b3\u7b56\u4e0e\u9884\u540e\u7ba1\u7406\u4e00\u7ad9\u5f0f\u5e73\u53f0 AI \u52a9\u624b\u3002\u4f60\u7684\u56de\u7b54\u53ea\u80fd\u4f5c\u4e3a\u7ebf\u4e0a\u5206\u6790\u548c\u533b\u7597\u4fe1\u606f\u53c2\u8003\uff0c\u4e0d\u80fd\u66ff\u4ee3\u6267\u4e1a\u533b\u751f\u7684\u9762\u8bca\u3001\u68c0\u67e5\u3001\u75c5\u7406\u590d\u6838\u548c MDT \u6b63\u5f0f\u7ed3\u8bba\u3002\u9762\u5bf9\u4e0d\u786e\u5b9a\u4fe1\u606f\u65f6\u5fc5\u987b\u660e\u786e\u8bf4\u660e\uff0c\u5bf9\u6025\u5371\u91cd\u75c7\u5f81\u8c61\u5fc5\u987b\u4f18\u5148\u63d0\u793a\u7acb\u5373\u7ebf\u4e0b\u5c31\u533b\u6216\u6025\u8bca\u5904\u7406\u3002";

const DEFAULT_CHAT_STORE = {
  conversations: {},
};

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, message, extraHeaders = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    ...extraHeaders,
  });
  res.end(message);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureJsonFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
  }
}

function readJson(filePath, defaultValue) {
  ensureJsonFile(filePath, defaultValue);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function nowIsoString() {
  return new Date().toISOString();
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isPortListening(port, host = HOST, timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });

    const finish = (status) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(status);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function waitForPort(port, host = HOST, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortListening(port, host)) {
      return true;
    }
    await wait(500);
  }
  return false;
}

async function ensureDoctorToolService(service) {
  const entryPath = path.join(service.root, service.entry);
  if (!fs.existsSync(entryPath)) {
    console.warn(`[doctor-tool] Missing entry for ${service.name}: ${entryPath}`);
    return false;
  }

  if (await isPortListening(service.port, "127.0.0.1")) {
    console.log(`[doctor-tool] Reusing running service ${service.name} at http://127.0.0.1:${service.port}/`);
    return true;
  }

  const child = spawn(PYTHON_EXECUTABLE, [service.entry], {
    cwd: service.root,
    env: { ...process.env, ...service.env },
    windowsHide: true,
    stdio: ["ignore", "ignore", "ignore"],
  });

  managedDoctorToolProcesses.set(service.key, child);

  child.once("exit", (code) => {
    managedDoctorToolProcesses.delete(service.key);
    if (code !== 0 && code !== null) {
      console.warn(`[doctor-tool] ${service.name} exited with code ${code}`);
    }
  });

  const ready = await waitForPort(service.port, "127.0.0.1", 30000);
  if (ready) {
    console.log(`[doctor-tool] Started ${service.name} at http://127.0.0.1:${service.port}/`);
  } else {
    console.warn(`[doctor-tool] Startup timed out for ${service.name}. Please verify the Python environment and model files.`);
  }
  return ready;
}

async function ensureDoctorToolServicesStarted() {
  for (const service of Object.values(DOCTOR_TOOL_SERVICES)) {
    await ensureDoctorToolService(service);
  }
}

function shutdownDoctorToolServices() {
  for (const [key, child] of managedDoctorToolProcesses.entries()) {
    try {
      if (!child.killed) {
        child.kill();
      }
    } catch (error) {
      console.warn(`[doctor-tool] Failed to stop ${key}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  managedDoctorToolProcesses.clear();
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseCookies(req) {
  const header = String(req.headers.cookie || "");
  if (!header) {
    return {};
  }

  return header.split(";").reduce((accumulator, item) => {
    const [rawName, ...rawValue] = item.trim().split("=");
    if (!rawName) {
      return accumulator;
    }
    accumulator[rawName] = decodeURIComponent(rawValue.join("="));
    return accumulator;
  }, {});
}

function pruneExpiredSessions() {
  const now = Date.now();
  Array.from(sessionStore.entries()).forEach(([token, session]) => {
    if (session.expiresAt <= now) {
      sessionStore.delete(token);
    }
  });
}

function buildSessionCookie(token, persistent = false) {
  const parts = [`${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (persistent) {
    parts.push(`Max-Age=${SESSION_MAX_AGE_SECONDS}`);
  }
  return parts.join("; ");
}

function buildExpiredSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function createSession(account, persistent = false) {
  const token = crypto.randomBytes(24).toString("hex");
  const session = {
    token,
    role: account.role,
    username: account.username,
    name: account.name,
    persistent: Boolean(persistent),
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  sessionStore.set(token, session);
  return session;
}

function getSession(req) {
  pruneExpiredSessions();
  const token = parseCookies(req)[SESSION_COOKIE_NAME];
  if (!token) {
    return null;
  }
  const session = sessionStore.get(token);
  if (!session) {
    return null;
  }
  session.expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  return session;
}

function destroySession(req) {
  const token = parseCookies(req)[SESSION_COOKIE_NAME];
  if (token) {
    sessionStore.delete(token);
  }
}

function serializeSession(session) {
  return {
    role: session.role,
    username: session.username,
    name: session.name,
  };
}

function requireSession(req, res, requiredRole = "") {
  const session = getSession(req);
  if (!session) {
    sendJson(res, 401, { ok: false, message: "Login expired. Please sign in again." });
    return null;
  }
  if (requiredRole && session.role !== requiredRole) {
    sendJson(res, 403, { ok: false, message: "The current account does not have permission for this action." });
    return null;
  }
  return session;
}

function readBody(req, maxBytes = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function parseJsonBody(body) {
  if (!body) {
    return {};
  }
  return JSON.parse(body);
}

function normalizeMallProductStatus(status) {
  if (status === "listed" || status === "上架" || status === "已上架" || status === "上架中") {
    return "listed";
  }
  if (status === "unlisted" || status === "下架") {
    return "unlisted";
  }
  return "listed";
}

function normalizeMallOrderStatus(status) {
  if (status === "pending_shipment" || status === "待发货") {
    return "pending_shipment";
  }
  if (status === "shipped" || status === "已发货") {
    return "shipped";
  }
  if (status === "completed" || status === "已完成") {
    return "completed";
  }
  return "pending_shipment";
}

function normalizeMallMoney(value, fallback = 0) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return Number(fallback || 0);
  }
  return Number(amount.toFixed(2));
}

function normalizeMallInteger(value, fallback = 0, minimum = 0) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (!Number.isFinite(parsed)) {
    return minimum;
  }
  return Math.max(minimum, parsed);
}

function normalizeMallText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function normalizeMallTags(tags) {
  return Array.isArray(tags)
    ? tags
        .map((item) => normalizeMallText(item))
        .filter(Boolean)
        .slice(0, 12)
    : [];
}

function normalizeMallImageList(images) {
  if (!Array.isArray(images)) {
    return [];
  }
  return images
    .map((item) => normalizeMallText(typeof item === "string" ? item : item?.url))
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeMallProduct(product = {}) {
  const images = normalizeMallImageList(product.images);
  const coverImage = normalizeMallText(product.coverImage || images[0]);
  return {
    id: normalizeMallText(product.id),
    skuCode: normalizeMallText(product.skuCode || product.id),
    name: normalizeMallText(product.name),
    brand: normalizeMallText(product.brand || product.coverTone || product.category),
    storeName: normalizeMallText(product.storeName),
    originLabel: normalizeMallText(product.originLabel),
    shippingLabel: normalizeMallText(product.shippingLabel),
    promoText: normalizeMallText(product.promoText),
    category: normalizeMallText(product.category, "健康支持"),
    unit: normalizeMallText(product.unit, "件"),
    price: normalizeMallMoney(product.price),
    originalPrice: normalizeMallMoney(product.originalPrice ?? product.price),
    stock: normalizeMallInteger(product.stock, 0, 0),
    sales: normalizeMallInteger(product.sales, 0, 0),
    lowStockThreshold: normalizeMallInteger(product.lowStockThreshold, 5, 0),
    status: normalizeMallProductStatus(product.status),
    summary: normalizeMallText(product.summary),
    description: normalizeMallText(product.description),
    tags: normalizeMallTags(product.tags),
    featured: Boolean(product.featured),
    coverTone: normalizeMallText(product.coverTone || product.category),
    coverImage,
    images,
    createdAt: normalizeMallText(product.createdAt),
    updatedAt: normalizeMallText(product.updatedAt || product.createdAt),
  };
}

function normalizeMallOrderItem(item = {}) {
  const quantity = normalizeMallInteger(item.quantity, 1, 1);
  const unitPrice = normalizeMallMoney(item.unitPrice);
  const subtotal = normalizeMallMoney(item.subtotal, unitPrice * quantity);
  return {
    id: normalizeMallText(item.id),
    productId: normalizeMallText(item.productId),
    skuCode: normalizeMallText(item.skuCode || item.productId),
    productName: normalizeMallText(item.productName),
    category: normalizeMallText(item.category || item.productCategory),
    unit: normalizeMallText(item.unit, "件"),
    unitPrice,
    quantity,
    subtotal,
  };
}

function normalizeMallOrder(order = {}) {
  const rawItems = Array.isArray(order.items) && order.items.length
    ? order.items
    : [
        {
          id: normalizeMallText(order.productId),
          productId: normalizeMallText(order.productId),
          skuCode: normalizeMallText(order.productId),
          productName: normalizeMallText(order.productName),
          category: normalizeMallText(order.productCategory),
          unitPrice: normalizeMallMoney(order.unitPrice),
          quantity: normalizeMallInteger(order.quantity, 1, 1),
          subtotal: normalizeMallMoney(order.totalPrice, normalizeMallMoney(order.unitPrice) * normalizeMallInteger(order.quantity, 1, 1)),
        },
      ];
  const items = rawItems
    .map((item) => normalizeMallOrderItem(item))
    .filter((item) => item.productId || item.productName);
  const firstItem = items[0] || normalizeMallOrderItem();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const computedTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalPrice = normalizeMallMoney(order.totalPrice, computedTotal);
  return {
    id: normalizeMallText(order.id),
    items,
    totalItems,
    totalPrice,
    patientId: normalizeMallText(order.patientId),
    patientUsername: normalizeMallText(order.patientUsername),
    patientName: normalizeMallText(order.patientName),
    addressId: normalizeMallText(order.addressId),
    contactName: normalizeMallText(order.contactName),
    contactPhone: normalizeMallText(order.contactPhone),
    address: normalizeMallText(order.address),
    note: normalizeMallText(order.note),
    logisticsCompany: normalizeMallText(order.logisticsCompany),
    trackingNumber: normalizeMallText(order.trackingNumber),
    fulfillmentNote: normalizeMallText(order.fulfillmentNote),
    status: normalizeMallOrderStatus(order.status),
    createdAt: normalizeMallText(order.createdAt),
    updatedAt: normalizeMallText(order.updatedAt || order.createdAt),
    productId: firstItem.productId,
    productName: firstItem.productName,
    productCategory: firstItem.category,
    unitPrice: firstItem.unitPrice,
    quantity: totalItems,
  };
}

function normalizeMallCartItem(item = {}) {
  return {
    id: normalizeMallText(item.id),
    patientId: normalizeMallText(item.patientId),
    patientUsername: normalizeMallText(item.patientUsername),
    productId: normalizeMallText(item.productId),
    quantity: normalizeMallInteger(item.quantity, 1, 1),
    updatedAt: normalizeMallText(item.updatedAt),
  };
}

function normalizeMallAddress(address = {}) {
  const addressLine = normalizeMallText(address.addressLine || address.address);
  return {
    id: normalizeMallText(address.id),
    patientId: normalizeMallText(address.patientId),
    patientUsername: normalizeMallText(address.patientUsername),
    receiverName: normalizeMallText(address.receiverName || address.contactName),
    receiverPhone: normalizeMallText(address.receiverPhone || address.contactPhone),
    tag: normalizeMallText(address.tag),
    addressLine,
    address: addressLine,
    isDefault: Boolean(address.isDefault),
    updatedAt: normalizeMallText(address.updatedAt),
  };
}

function unwrapArrayField(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === "object" && Array.isArray(value.value)) {
    return value.value;
  }
  return [];
}

function normalizeAppData(data) {
  return {
    patients: unwrapArrayField(data?.patients),
    schedules: unwrapArrayField(data?.schedules),
    followups: unwrapArrayField(data?.followups),
    escortRequests: unwrapArrayField(data?.escortRequests),
    escortStaffSchedules: unwrapArrayField(data?.escortStaffSchedules),
    healthManuals: unwrapArrayField(data?.healthManuals),
    products: unwrapArrayField(data?.products)
      ? unwrapArrayField(data?.products).map((item) => normalizeMallProduct(item))
      : [],
    orders: unwrapArrayField(data?.orders)
      ? unwrapArrayField(data?.orders).map((item) => normalizeMallOrder(item))
      : [],
    cartItems: unwrapArrayField(data?.cartItems)
      ? unwrapArrayField(data?.cartItems).map((item) => normalizeMallCartItem(item))
      : [],
    addresses: unwrapArrayField(data?.addresses)
      ? unwrapArrayField(data?.addresses).map((item) => normalizeMallAddress(item))
      : [],
  };
}

function isValidAppData(data) {
  return (
    data &&
    Array.isArray(data.patients) &&
    Array.isArray(data.schedules) &&
    Array.isArray(data.followups) &&
    Array.isArray(data.escortRequests) &&
    Array.isArray(data.escortStaffSchedules) &&
    Array.isArray(data.healthManuals) &&
    Array.isArray(data.products) &&
    Array.isArray(data.orders) &&
    Array.isArray(data.cartItems) &&
    Array.isArray(data.addresses)
  );
}

function loadAppData() {
  const data = normalizeAppData(readJson(DATA_FILE, DEFAULT_APP_DATA));
  if (ensureQuickFollowupWindow(data, 7)) {
    writeJson(DATA_FILE, data);
  }
  return data;
}

function saveAppData(data) {
  const normalized = normalizeAppData(data);
  if (!isValidAppData(normalized)) {
    throw new Error("Invalid app data");
  }
  writeJson(DATA_FILE, normalized);
}

function sameSerializedValue(left, right) {
  return isDeepStrictEqual(left, right);
}

function findPatientByUsername(data, username) {
  return Array.isArray(data?.patients) ? data.patients.find((item) => item.username === username) : null;
}

function getPatientScopedData(data, username) {
  const patient = findPatientByUsername(data, username);
  return {
    patients: patient ? [cloneData(patient)] : [],
    schedules: Array.isArray(data?.schedules)
      ? data.schedules
          .filter((item) => normalizeMallText(item.date) >= formatLocalDate(new Date()))
          .sort((left, right) => getScheduleSortValue(left) - getScheduleSortValue(right))
          .map((item) => cloneData(item))
      : [],
    followups: Array.isArray(data?.followups) && patient?.id
      ? data.followups.filter((item) => item.patientId === patient.id).map((item) => cloneData(item))
      : [],
    escortRequests: Array.isArray(data?.escortRequests) && patient?.id
      ? data.escortRequests
          .filter((item) => item.patientId === patient.id || item.patientUsername === username)
          .map((item) => cloneData(item))
      : [],
    escortStaffSchedules: Array.isArray(data?.escortStaffSchedules)
      ? data.escortStaffSchedules
          .filter((item) => normalizeMallText(item.status, "已排班") !== "停用")
          .map((item) => cloneData(item))
      : [],
    healthManuals: Array.isArray(data?.healthManuals) ? cloneData(data.healthManuals) : [],
    products: Array.isArray(data?.products) ? cloneData(data.products) : [],
    orders: Array.isArray(data?.orders)
      ? data.orders
          .filter((item) => item.patientUsername === username || (patient?.id && item.patientId === patient.id))
          .map((item) => cloneData(item))
      : [],
    cartItems: Array.isArray(data?.cartItems)
      ? data.cartItems
          .filter((item) => item.patientUsername === username || (patient?.id && item.patientId === patient.id))
          .map((item) => cloneData(item))
      : [],
    addresses: Array.isArray(data?.addresses)
      ? data.addresses
          .filter((item) => item.patientUsername === username || (patient?.id && item.patientId === patient.id))
          .map((item) => cloneData(item))
      : [],
  };
}

const SCHEDULE_PERIOD_TIME = {
  上午: "09:00",
  下午: "14:30",
  夜间: "19:00",
};

const QUICK_FOLLOWUP_DEPARTMENTS = [
  { key: "hnrt", label: "头颈放疗门诊", clinic: "头颈放疗门诊 301", period: "上午", capacity: 18 },
  { key: "nutrition", label: "营养支持门诊", clinic: "营养支持门诊 312", period: "上午", capacity: 12 },
  { key: "swallow", label: "吞咽康复门诊", clinic: "吞咽康复门诊 323", period: "下午", capacity: 12 },
  { key: "symptom", label: "症状管理门诊", clinic: "症状管理门诊 325", period: "上午", capacity: 10 },
];

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildQuickFollowupScheduleId(dateText, departmentConfig) {
  const safeDate = normalizeMallText(dateText).replace(/-/g, "");
  const safeKey = normalizeMallText(departmentConfig?.key || "hnrt").toUpperCase();
  const periodCode = ({
    上午: "AM",
    下午: "PM",
    夜间: "EV",
  }[normalizeMallText(departmentConfig?.period)] || "AM");
  return `SCH-${safeDate}-${safeKey}-${periodCode}`;
}

function ensureQuickFollowupWindow(data, daysAhead = 7) {
  if (!data || !Array.isArray(data.schedules) || !QUICK_FOLLOWUP_DEPARTMENTS.length) {
    return false;
  }

  const today = new Date();
  today.setHours(8, 0, 0, 0);
  let changed = false;

  QUICK_FOLLOWUP_DEPARTMENTS.forEach((departmentConfig) => {
    for (let offset = 0; offset < daysAhead; offset += 1) {
      const targetDate = formatLocalDate(addDays(today, offset));
      const hasSchedule = data.schedules.some((item) =>
        normalizeMallText(item.date) === targetDate
        && isScheduleMatchedDepartment(item, departmentConfig),
      );

      if (hasSchedule) {
        continue;
      }

      data.schedules.push({
        id: buildQuickFollowupScheduleId(targetDate, departmentConfig),
        date: targetDate,
        period: normalizeMallText(departmentConfig.period, "上午"),
        clinic: normalizeMallText(departmentConfig.clinic, "头颈放疗门诊 301"),
        capacity: Math.max(Number(departmentConfig.capacity || 0), 1),
        booked: 0,
      });
      changed = true;
    }
  });

  if (changed) {
    data.schedules.sort((left, right) => getScheduleSortValue(left) - getScheduleSortValue(right));
  }

  return changed;
}

function getScheduleSortValue(schedule) {
  const dateText = normalizeMallText(schedule?.date);
  const periodText = normalizeMallText(schedule?.period);
  const timeText = SCHEDULE_PERIOD_TIME[periodText] || "09:00";
  return new Date(`${dateText}T${timeText}:00`).getTime() || 0;
}

function getScheduleRoomLabel(clinic) {
  const text = normalizeMallText(clinic);
  const directRoom = text.match(/诊室\s*([A-Za-z0-9-]+)$/);
  if (directRoom) {
    return `诊室 ${directRoom[1]}`;
  }
  const trailingRoom = text.match(/(?:^|\s)(\d{3,}[A-Za-z0-9-]*)$/);
  if (trailingRoom) {
    return `诊室 ${trailingRoom[1]}`;
  }
  return "待分配诊室";
}

function getScheduleDepartmentLabel(clinic) {
  const text = normalizeMallText(clinic);
  return text
    .replace(/诊室\s*[A-Za-z0-9-]+$/u, "")
    .replace(/(?:^|\s)\d{3,}[A-Za-z0-9-]*$/u, "")
    .trim() || "复诊门诊";
}

function getPendingAppointment(patient) {
  return Array.isArray(patient?.appointments)
    ? patient.appointments.find((item) => normalizeMallText(item.status) === "已预约")
    : null;
}

function findQuickFollowupDepartmentConfig(value) {
  const text = normalizeMallText(value).toLowerCase();
  if (!text) {
    return null;
  }
  return QUICK_FOLLOWUP_DEPARTMENTS.find((item) =>
    item.key.toLowerCase() === text
    || item.label.toLowerCase() === text
    || item.clinic.toLowerCase() === text,
  ) || null;
}

function isScheduleMatchedDepartment(schedule, departmentConfig) {
  if (!departmentConfig) {
    return true;
  }
  return getScheduleDepartmentLabel(schedule?.clinic) === departmentConfig.label;
}

function ensureAvailableFollowupSchedule(data, requestedDepartment = "") {
  const schedules = Array.isArray(data?.schedules) ? data.schedules : [];
  const today = formatLocalDate(new Date());
  const departmentConfig = findQuickFollowupDepartmentConfig(requestedDepartment);
  const availableFutureSchedules = schedules
    .filter((item) => isScheduleMatchedDepartment(item, departmentConfig))
    .filter((item) => Number(item.capacity || 0) > Number(item.booked || 0))
    .filter((item) => normalizeMallText(item.date) >= today)
    .sort((left, right) => getScheduleSortValue(left) - getScheduleSortValue(right));

  if (availableFutureSchedules.length) {
    return { schedule: availableFutureSchedules[0], created: false };
  }

  const scheduleTemplate = schedules
    .filter((item) => isScheduleMatchedDepartment(item, departmentConfig))
    .filter((item) => Number(item.capacity || 0) > 0)
    .sort((left, right) => getScheduleSortValue(left) - getScheduleSortValue(right))[0];

  const fallbackDepartmentConfig = departmentConfig || (scheduleTemplate ? findQuickFollowupDepartmentConfig(getScheduleDepartmentLabel(scheduleTemplate.clinic)) : QUICK_FOLLOWUP_DEPARTMENTS[0]);

  if (!scheduleTemplate && !fallbackDepartmentConfig) {
    throw new Error("当前没有可用门诊排班，请先在医生端维护未来排班。");
  }

  const nextDate = formatLocalDate(addDays(new Date(), 1));
  const targetClinic = normalizeMallText(scheduleTemplate?.clinic || fallbackDepartmentConfig?.clinic, "头颈放疗复诊门诊 301");
  const targetPeriod = normalizeMallText(scheduleTemplate?.period || fallbackDepartmentConfig?.period, "上午");
  const existingNext = schedules.find((item) =>
    normalizeMallText(item.date) === nextDate
    && normalizeMallText(item.period) === targetPeriod
    && normalizeMallText(item.clinic) === targetClinic,
  );

  if (existingNext && Number(existingNext.capacity || 0) > Number(existingNext.booked || 0)) {
    return { schedule: existingNext, created: false };
  }

  const nextSchedule = {
    id: createId("SCH"),
    date: nextDate,
    period: targetPeriod,
    clinic: targetClinic,
    capacity: Math.max(Number(scheduleTemplate?.capacity || fallbackDepartmentConfig?.capacity || 0), 1),
    booked: 0,
  };
  schedules.unshift(nextSchedule);
  data.schedules = schedules;
  return { schedule: nextSchedule, created: true };
}

function buildQuickFollowupAppointment(schedule, createdBy) {
  const department = getScheduleDepartmentLabel(schedule.clinic);
  const room = getScheduleRoomLabel(schedule.clinic);
  const time = SCHEDULE_PERIOD_TIME[normalizeMallText(schedule.period)] || "09:00";
  return {
    id: createId("APT"),
    date: `${normalizeMallText(schedule.date)} ${time}`,
    department,
    room,
    status: "已预约",
    visitType: "复诊",
    source: "quickFollowup",
    scheduleId: normalizeMallText(schedule.id),
    createdAt: nowIsoString(),
    createdBy,
  };
}

const ESCORT_REQUEST_TYPES = new Set(["门诊陪诊", "检查陪同", "取药协助", "住院接送"]);
const ESCORT_REQUEST_STATUSES = new Set(["待确认", "已安排", "进行中", "已到达", "已完成", "已取消"]);
const ESCORT_FEE_STATUSES = new Set(["待确认", "待支付", "已支付", "已减免"]);
const ESCORT_CONFIRMATION_STATUSES = new Set(["待确认", "已确认"]);
const ESCORT_STAFF_PERIODS = new Set(["上午", "下午", "晚间"]);
const ESCORT_STAFF_ROLES = new Set(["护士", "陪诊员", "导诊员", "志愿者"]);
const ESCORT_STAFF_STATUSES = new Set(["已排班", "停用"]);
const ESCORT_REQUEST_FEE_SUGGESTIONS = {
  门诊陪诊: 80,
  检查陪同: 120,
  取药协助: 50,
  住院接送: 180,
};

function extractDatePart(value) {
  const text = normalizeMallText(value);
  const matched = text.match(/\d{4}-\d{2}-\d{2}/);
  return matched ? matched[0] : "";
}

function extractTimePart(value) {
  const text = normalizeMallText(value);
  const matched = text.match(/\d{2}:\d{2}/);
  return matched ? matched[0] : "";
}

function addDaysToLocalDate(dateText, offsetDays) {
  const baseDate = extractDatePart(dateText);
  if (!baseDate) {
    return formatLocalDate(new Date());
  }
  const nextDate = new Date(`${baseDate}T08:00:00`);
  if (Number.isNaN(nextDate.getTime())) {
    return baseDate;
  }
  nextDate.setDate(nextDate.getDate() + offsetDays);
  return formatLocalDate(nextDate);
}

function getEscortServiceDay(value) {
  return extractDatePart(value);
}

function getEscortServicePeriod(value) {
  const time = extractTimePart(value);
  if (!time) {
    return "上午";
  }
  const hour = Number(time.split(":")[0] || 0);
  if (hour >= 18) {
    return "晚间";
  }
  if (hour >= 13) {
    return "下午";
  }
  return "上午";
}

function normalizeEscortMoney(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return Math.max(Number(fallback || 0), 0);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return Math.max(Number(fallback || 0), 0);
  }
  return Math.round(parsed * 100) / 100;
}

function buildEscortTimelineEntry(stage, label, actor, note = "", at = nowIsoString()) {
  return {
    id: createId("ESCTL"),
    stage: normalizeMallText(stage),
    label: normalizeMallText(label),
    at: normalizeMallText(at),
    by: normalizeMallText(actor),
    note: normalizeMallText(note),
  };
}

function appendEscortTimeline(entries, stage, label, actor, note = "", at = nowIsoString()) {
  const timeline = Array.isArray(entries) ? entries.map((item) => cloneData(item)) : [];
  timeline.push(buildEscortTimelineEntry(stage, label, actor, note, at));
  return timeline;
}

function getEscortStatusTimelineLabel(status) {
  switch (normalizeMallText(status)) {
    case "已安排":
      return "已安排陪诊";
    case "进行中":
      return "开始陪诊";
    case "已到达":
      return "已到达集合点";
    case "已完成":
      return "已完成陪诊";
    case "已取消":
      return "已取消陪诊";
    default:
      return "已更新陪诊状态";
  }
}

function buildEscortConfirmationCode(recordId, existingCode = "") {
  if (existingCode) {
    return normalizeMallText(existingCode);
  }
  const codeDate = formatLocalDate(new Date()).replace(/-/g, "");
  const suffix = normalizeMallText(recordId || createId("ESC")).replace(/[^A-Za-z0-9]/g, "").slice(-6).toUpperCase();
  return `PD-${codeDate}-${suffix}`;
}

function getPatientAppointmentById(patient, appointmentId) {
  if (!appointmentId || !Array.isArray(patient?.appointments)) {
    return null;
  }
  return patient.appointments.find((item) => normalizeMallText(item.id) === normalizeMallText(appointmentId)) || null;
}

function normalizeEscortStaffScheduleRecord(body, existingRecord = null) {
  const period = normalizeMallText(body?.period || existingRecord?.period, "上午");
  const role = normalizeMallText(body?.role || existingRecord?.role, "陪诊员");
  const status = normalizeMallText(body?.status || existingRecord?.status, "已排班");
  const capacity = Math.max(Number(body?.capacity || existingRecord?.capacity || 1), 1);

  if (!ESCORT_STAFF_PERIODS.has(period)) {
    throw new Error("陪诊排班时段无效，请重新选择。");
  }
  if (!ESCORT_STAFF_ROLES.has(role)) {
    throw new Error("陪诊人员角色无效，请重新选择。");
  }
  if (!ESCORT_STAFF_STATUSES.has(status)) {
    throw new Error("陪诊排班状态无效，请重新选择。");
  }

  const record = {
    id: normalizeMallText(existingRecord?.id || body?.id || createId("ESCS")),
    staffName: normalizeMallText(body?.staffName || existingRecord?.staffName),
    role,
    phone: normalizeMallText(body?.phone || existingRecord?.phone),
    date: normalizeMallText(body?.date || existingRecord?.date),
    period,
    department: normalizeMallText(body?.department || existingRecord?.department, "头颈放疗门诊"),
    capacity,
    note: normalizeMallText(body?.note || existingRecord?.note),
    status,
    createdAt: normalizeMallText(existingRecord?.createdAt || nowIsoString()),
    updatedAt: nowIsoString(),
  };

  if (!record.staffName || !record.date || !record.department) {
    throw new Error("请补全陪诊人员、日期和排班科室信息。");
  }

  return record;
}

function getEscortScheduleAssignedCount(data, scheduleRecord, excludingRequestId = "") {
  if (!scheduleRecord) {
    return 0;
  }
  const staffName = normalizeMallText(scheduleRecord.staffName);
  const serviceDay = normalizeMallText(scheduleRecord.date);
  return Array.isArray(data?.escortRequests)
    ? data.escortRequests.filter((item) => {
        if (normalizeMallText(item.id) === normalizeMallText(excludingRequestId)) {
          return false;
        }
        if (normalizeMallText(item.assignedStaff) !== staffName) {
          return false;
        }
        if (getEscortServiceDay(item.serviceDate) !== serviceDay) {
          return false;
        }
        return normalizeMallText(item.status) !== "已取消";
      }).length
    : 0;
}

function findEscortStaffScheduleForRequest(data, assignedStaff, serviceDate) {
  const staffName = normalizeMallText(assignedStaff);
  const serviceDay = getEscortServiceDay(serviceDate);
  if (!staffName || !serviceDay) {
    return null;
  }
  return Array.isArray(data?.escortStaffSchedules)
    ? data.escortStaffSchedules.find((item) =>
        normalizeMallText(item.staffName) === staffName
        && normalizeMallText(item.date) === serviceDay
        && normalizeMallText(item.status, "已排班") !== "停用")
    : null;
}

function ensureEscortStaffAvailable(data, assignedStaff, serviceDate, excludingRequestId = "") {
  const staffName = normalizeMallText(assignedStaff);
  if (!staffName) {
    return null;
  }

  const scheduleRecord = findEscortStaffScheduleForRequest(data, staffName, serviceDate);
  if (!scheduleRecord) {
    throw new Error("所选陪诊人员当天没有排班，请先维护陪诊人员排班。");
  }

  const assignedCount = getEscortScheduleAssignedCount(data, scheduleRecord, excludingRequestId);
  if (assignedCount >= Number(scheduleRecord.capacity || 0)) {
    throw new Error("所选陪诊人员当前排班容量已满，请调整陪诊人员或扩大容量。");
  }

  return scheduleRecord;
}

function applyEscortStatusTransition(record, nextStatus, actor, note = "", existingRecord = null) {
  const normalizedStatus = normalizeMallText(nextStatus || record?.status);
  if (!ESCORT_REQUEST_STATUSES.has(normalizedStatus)) {
    throw new Error("陪诊状态无效，请重新选择。");
  }

  const previousStatus = normalizeMallText(existingRecord?.status || record?.status);
  const now = nowIsoString();
  const nextRecord = {
    ...record,
    status: normalizedStatus,
    updatedAt: now,
  };

  if (normalizedStatus !== previousStatus) {
    nextRecord.timeline = appendEscortTimeline(
      nextRecord.timeline,
      normalizedStatus,
      getEscortStatusTimelineLabel(normalizedStatus),
      actor,
      note,
      now,
    );
  }

  if (["已安排", "进行中", "已到达", "已完成"].includes(normalizedStatus)) {
    nextRecord.confirmationCode = buildEscortConfirmationCode(nextRecord.id, nextRecord.confirmationCode);
  }

  if (normalizedStatus === "已安排" && !nextRecord.arrangedAt) {
    nextRecord.arrangedAt = now;
  }
  if (normalizedStatus === "进行中" && !nextRecord.startedAt) {
    nextRecord.startedAt = now;
  }
  if (normalizedStatus === "已到达" && !nextRecord.arrivedAt) {
    nextRecord.arrivedAt = now;
  }
  if (normalizedStatus === "已完成" && !nextRecord.completedAt) {
    nextRecord.completedAt = now;
  }
  if (normalizedStatus === "已取消" && !nextRecord.cancelledAt) {
    nextRecord.cancelledAt = now;
  }

  return nextRecord;
}

function buildEscortRequestRecord(body, patient, session, data, existingRecord = null) {
  const linkedAppointment = getPatientAppointmentById(patient, body?.appointmentId || existingRecord?.appointmentId);
  const requestType = normalizeMallText(body?.requestType || existingRecord?.requestType, "门诊陪诊");
  const assignedStaff = normalizeMallText(
    session.role === "doctor" ? (body?.assignedStaff || existingRecord?.assignedStaff) : existingRecord?.assignedStaff,
  );
  const initialStatus = normalizeMallText(
    body?.status || existingRecord?.status,
    session.role === "doctor" ? (assignedStaff ? "已安排" : "待确认") : "待确认",
  );
  const createdBy = session.role === "doctor" ? normalizeMallText(session.name || session.username) : "patient-self-service";

  if (!ESCORT_REQUEST_TYPES.has(requestType)) {
    throw new Error("陪诊类型无效，请重新选择。");
  }
  if (!ESCORT_REQUEST_STATUSES.has(initialStatus)) {
    throw new Error("陪诊状态无效，请重新选择。");
  }

  const record = {
    id: normalizeMallText(existingRecord?.id || body?.id || createId("ESC")),
    patientId: normalizeMallText(patient.id),
    patientUsername: normalizeMallText(patient.username),
    patientName: normalizeMallText(patient.name),
    appointmentId: normalizeMallText(linkedAppointment?.id || body?.appointmentId || existingRecord?.appointmentId),
    requestType,
    serviceDate: normalizeMallText(body?.serviceDate || linkedAppointment?.date || existingRecord?.serviceDate),
    department: normalizeMallText(body?.department || linkedAppointment?.department || existingRecord?.department),
    room: normalizeMallText(body?.room || linkedAppointment?.room || existingRecord?.room),
    meetingPoint: normalizeMallText(body?.meetingPoint || existingRecord?.meetingPoint),
    contactName: normalizeMallText(body?.contactName || existingRecord?.contactName || patient.name),
    contactPhone: normalizeMallText(body?.contactPhone || existingRecord?.contactPhone || patient.phone),
    note: normalizeMallText(body?.note || existingRecord?.note),
    status: initialStatus,
    assignedStaff,
    feeAmount: normalizeEscortMoney(
      session.role === "doctor"
        ? body?.feeAmount
        : existingRecord?.feeAmount,
      existingRecord?.feeAmount ?? (session.role === "doctor" ? ESCORT_REQUEST_FEE_SUGGESTIONS[requestType] || 0 : 0),
    ),
    feeStatus: normalizeMallText(
      session.role === "doctor" ? (body?.feeStatus || existingRecord?.feeStatus) : existingRecord?.feeStatus,
      "待确认",
    ),
    feeNote: normalizeMallText(session.role === "doctor" ? (body?.feeNote || existingRecord?.feeNote) : existingRecord?.feeNote),
    confirmationCode: normalizeMallText(existingRecord?.confirmationCode || body?.confirmationCode),
    confirmationStatus: normalizeMallText(existingRecord?.confirmationStatus || "待确认"),
    confirmedAt: normalizeMallText(existingRecord?.confirmedAt),
    confirmedBy: normalizeMallText(existingRecord?.confirmedBy),
    followupId: normalizeMallText(existingRecord?.followupId),
    followupCreatedAt: normalizeMallText(existingRecord?.followupCreatedAt),
    timeline: Array.isArray(existingRecord?.timeline) ? existingRecord.timeline.map((item) => cloneData(item)) : [],
    arrangedAt: normalizeMallText(existingRecord?.arrangedAt),
    startedAt: normalizeMallText(existingRecord?.startedAt),
    arrivedAt: normalizeMallText(existingRecord?.arrivedAt),
    completedAt: normalizeMallText(existingRecord?.completedAt),
    cancelledAt: normalizeMallText(existingRecord?.cancelledAt),
    createdAt: normalizeMallText(existingRecord?.createdAt || nowIsoString()),
    createdBy: normalizeMallText(existingRecord?.createdBy || createdBy),
    updatedAt: nowIsoString(),
    handledBy: session.role === "doctor" ? normalizeMallText(session.name || session.username) : normalizeMallText(existingRecord?.handledBy),
    handledAt: session.role === "doctor" ? nowIsoString() : normalizeMallText(existingRecord?.handledAt),
  };

  if (!record.serviceDate || !record.department || !record.room) {
    throw new Error("请补全陪诊时间、科室和诊室信息。");
  }
  if (!ESCORT_FEE_STATUSES.has(record.feeStatus)) {
    throw new Error("陪诊费用状态无效，请重新选择。");
  }
  if (!ESCORT_CONFIRMATION_STATUSES.has(record.confirmationStatus)) {
    throw new Error("确认单状态无效，请重新选择。");
  }

  const assignedSchedule = ensureEscortStaffAvailable(data, record.assignedStaff, record.serviceDate, record.id);
  if (record.status === "已安排" && !record.assignedStaff) {
    throw new Error("请先安排陪诊人员，再保存为已安排状态。");
  }
  if (["进行中", "已到达", "已完成"].includes(record.status) && !record.assignedStaff) {
    throw new Error("当前状态需要先指定陪诊人员。");
  }
  if (assignedSchedule) {
    record.scheduleId = normalizeMallText(assignedSchedule.id);
  } else {
    record.scheduleId = normalizeMallText(existingRecord?.scheduleId);
  }

  if (!existingRecord) {
    record.timeline = appendEscortTimeline(
      record.timeline,
      "待确认",
      session.role === "doctor" ? "医生已录入陪诊单" : "已提交陪诊申请",
      session.role === "doctor" ? normalizeMallText(session.name || session.username) : normalizeMallText(patient.name || session.username),
      record.note,
      record.createdAt,
    );
  }

  const transitionActor = normalizeMallText(session.name || session.username || patient.name);
  const nextRecord = applyEscortStatusTransition(record, record.status, transitionActor, record.note, existingRecord);

  if (existingRecord && normalizeMallText(existingRecord.assignedStaff) !== normalizeMallText(nextRecord.assignedStaff) && nextRecord.assignedStaff) {
    nextRecord.timeline = appendEscortTimeline(
      nextRecord.timeline,
      "staff-updated",
      `已调整陪诊人员为${nextRecord.assignedStaff}`,
      transitionActor,
      "",
    );
  }

  return nextRecord;
}

function normalizeEscortRecordForStatusUpdate(record, session, body, data) {
  const nextStatus = normalizeMallText(body?.status || record?.status);
  const actor = normalizeMallText(session.name || session.username);
  const nextAssignedStaff = session.role === "doctor"
    ? normalizeMallText(body?.assignedStaff || record.assignedStaff)
    : normalizeMallText(record.assignedStaff);
  const nextNote = session.role === "doctor" && normalizeMallText(body?.note)
    ? normalizeMallText(body.note)
    : normalizeMallText(record.note);
  const nextRecord = {
    ...record,
    assignedStaff: nextAssignedStaff,
    note: nextNote,
    handledBy: session.role === "doctor" ? actor : normalizeMallText(record.handledBy),
    handledAt: session.role === "doctor" ? nowIsoString() : normalizeMallText(record.handledAt),
  };

  if (session.role === "doctor" && nextAssignedStaff) {
    const assignedSchedule = ensureEscortStaffAvailable(data, nextAssignedStaff, nextRecord.serviceDate, nextRecord.id);
    nextRecord.scheduleId = normalizeMallText(assignedSchedule?.id || nextRecord.scheduleId);
  }

  if (["已安排", "进行中", "已到达", "已完成"].includes(nextStatus) && !nextAssignedStaff) {
    throw new Error("请先安排陪诊人员，再更新当前陪诊状态。");
  }

  return applyEscortStatusTransition(nextRecord, nextStatus, actor, nextNote, record);
}

function handleEscortRequestSave(req, res, session, body) {
  const data = loadAppData();
  const isDoctor = session.role === "doctor";
  const targetPatient = isDoctor
    ? data.patients.find((item) => item.id === normalizeMallText(body?.patientId))
    : findPatientByUsername(data, session.username);

  if (!targetPatient) {
    sendJson(res, 404, { ok: false, message: "没有找到对应病人档案。" });
    return;
  }

  const requestId = normalizeMallText(body?.id);
  const existingRecord = requestId
    ? (Array.isArray(data.escortRequests) ? data.escortRequests.find((item) => normalizeMallText(item.id) === requestId) : null)
    : null;

  if (!isDoctor && existingRecord) {
    sendJson(res, 403, { ok: false, message: "病人端不能直接修改已有陪诊单，请联系医生端处理。" });
    return;
  }

  const record = buildEscortRequestRecord(body, targetPatient, session, data, existingRecord);
  data.escortRequests = existingRecord
    ? data.escortRequests.map((item) => (normalizeMallText(item.id) === requestId ? record : item))
    : [record, ...(Array.isArray(data.escortRequests) ? data.escortRequests : [])];

  saveAppData(data);
  const latestData = loadAppData();
  sendJson(res, 200, {
    ok: true,
    message: existingRecord
      ? `陪诊单已更新：${record.patientName} / ${record.department} / ${record.status}`
      : `已提交陪诊申请：${record.patientName} / ${record.department} / ${record.serviceDate}`,
    record,
    data: isDoctor ? latestData : getPatientScopedData(latestData, session.username),
  });
}

function handleEscortRequestStatus(req, res, session, body) {
  const data = loadAppData();
  const requestId = normalizeMallText(body?.id);
  const nextStatus = normalizeMallText(body?.status);
  const targetRecord = Array.isArray(data.escortRequests)
    ? data.escortRequests.find((item) => normalizeMallText(item.id) === requestId)
    : null;

  if (!targetRecord) {
    sendJson(res, 404, { ok: false, message: "没有找到对应陪诊单。" });
    return;
  }

  if (session.role === "patient") {
    const patient = findPatientByUsername(data, session.username);
    if (!patient || (targetRecord.patientId !== patient.id && targetRecord.patientUsername !== session.username)) {
      sendJson(res, 403, { ok: false, message: "只能处理当前账号自己的陪诊单。" });
      return;
    }
    if (nextStatus !== "已取消") {
      sendJson(res, 403, { ok: false, message: "病人端只能取消自己的陪诊申请。" });
      return;
    }
    if (normalizeMallText(targetRecord.status) === "已完成") {
      sendJson(res, 409, { ok: false, message: "已完成的陪诊单不能再取消。" });
      return;
    }
  } else if (!ESCORT_REQUEST_STATUSES.has(nextStatus)) {
    sendJson(res, 400, { ok: false, message: "陪诊状态无效，请重新选择。" });
    return;
  }

  const nextRecord = normalizeEscortRecordForStatusUpdate(targetRecord, session, body, data);
  data.escortRequests = data.escortRequests.map((item) =>
    normalizeMallText(item.id) === requestId ? nextRecord : item,
  );

  saveAppData(data);
  const latestData = loadAppData();
  sendJson(res, 200, {
    ok: true,
    message: `陪诊单状态已更新为${nextStatus}。`,
    data: session.role === "doctor" ? latestData : getPatientScopedData(latestData, session.username),
  });
}

function handleEscortStaffScheduleSave(req, res, session, body) {
  if (session.role !== "doctor") {
    sendJson(res, 403, { ok: false, message: "只有医生端可以维护陪诊人员排班。" });
    return;
  }

  const data = loadAppData();
  const recordId = normalizeMallText(body?.id);
  const existingRecord = recordId
    ? data.escortStaffSchedules.find((item) => normalizeMallText(item.id) === recordId)
    : null;
  const record = normalizeEscortStaffScheduleRecord(body, existingRecord);

  data.escortStaffSchedules = existingRecord
    ? data.escortStaffSchedules.map((item) => (normalizeMallText(item.id) === record.id ? record : item))
    : [record, ...(Array.isArray(data.escortStaffSchedules) ? data.escortStaffSchedules : [])];

  saveAppData(data);
  sendJson(res, 200, {
    ok: true,
    message: existingRecord ? `陪诊排班已更新：${record.staffName} / ${record.date} ${record.period}` : `已新增陪诊排班：${record.staffName} / ${record.date} ${record.period}`,
    record,
    data: loadAppData(),
  });
}

function handleEscortRequestConfirm(req, res, session, body) {
  if (session.role !== "patient") {
    sendJson(res, 403, { ok: false, message: "确认服务单仅支持病人端提交。" });
    return;
  }

  const data = loadAppData();
  const patient = findPatientByUsername(data, session.username);
  const requestId = normalizeMallText(body?.id);
  const targetRecord = Array.isArray(data.escortRequests)
    ? data.escortRequests.find((item) => normalizeMallText(item.id) === requestId)
    : null;

  if (!patient || !targetRecord || (targetRecord.patientId !== patient.id && targetRecord.patientUsername !== session.username)) {
    sendJson(res, 404, { ok: false, message: "没有找到对应陪诊单。" });
    return;
  }
  if (normalizeMallText(targetRecord.status) !== "已完成") {
    sendJson(res, 409, { ok: false, message: "请在陪诊完成后再确认服务单。" });
    return;
  }
  if (normalizeMallText(targetRecord.confirmationStatus) === "已确认") {
    sendJson(res, 409, { ok: false, message: "该陪诊服务单已确认，无需重复提交。" });
    return;
  }

  const now = nowIsoString();
  data.escortRequests = data.escortRequests.map((item) =>
    normalizeMallText(item.id) === requestId
      ? {
          ...item,
          confirmationStatus: "已确认",
          confirmedAt: now,
          confirmedBy: normalizeMallText(patient.name || session.username),
          feeStatus: normalizeMallText(item.feeStatus) === "待确认"
            ? (Number(item.feeAmount || 0) > 0 ? "待支付" : "已减免")
            : normalizeMallText(item.feeStatus),
          updatedAt: now,
          timeline: appendEscortTimeline(item.timeline, "confirmed", "病人已确认服务单", normalizeMallText(patient.name || session.username), normalizeMallText(body?.note), now),
        }
      : item,
  );

  saveAppData(data);
  const latestData = loadAppData();
  sendJson(res, 200, {
    ok: true,
    message: "服务确认单已提交，病人端与医生端已同步。",
    data: getPatientScopedData(latestData, session.username),
  });
}

function handleEscortConvertFollowup(req, res, session, body) {
  if (session.role !== "doctor") {
    sendJson(res, 403, { ok: false, message: "只有医生端可以将陪诊单转成复诊提醒。" });
    return;
  }

  const data = loadAppData();
  const requestId = normalizeMallText(body?.id);
  const targetRecord = Array.isArray(data.escortRequests)
    ? data.escortRequests.find((item) => normalizeMallText(item.id) === requestId)
    : null;

  if (!targetRecord) {
    sendJson(res, 404, { ok: false, message: "没有找到对应陪诊单。" });
    return;
  }
  if (normalizeMallText(targetRecord.status) === "已取消") {
    sendJson(res, 409, { ok: false, message: "已取消的陪诊单不能转成复诊提醒。" });
    return;
  }

  const followupDate = normalizeMallText(body?.dueDate || targetRecord.followupDate, addDaysToLocalDate(targetRecord.serviceDate, 7));
  const existingFollowup = Array.isArray(data.followups)
    ? data.followups.find((item) => normalizeMallText(item.sourceEscortRequestId) === requestId)
    : null;
  const followupId = normalizeMallText(existingFollowup?.id || targetRecord.followupId || createId("FU"));
  const followupRecord = {
    id: followupId,
    patientId: normalizeMallText(targetRecord.patientId),
    patientName: normalizeMallText(targetRecord.patientName),
    dueDate: followupDate,
    method: "复诊",
    status: normalizeMallText(existingFollowup?.status || "待随访"),
    note: normalizeMallText(
      body?.note,
      existingFollowup?.note || `由陪诊单转入：${targetRecord.requestType} / ${targetRecord.department} / ${targetRecord.serviceDate}，请结合放疗复查情况安排复诊提醒。`,
    ),
    sourceEscortRequestId: requestId,
    updatedAt: nowIsoString(),
    createdAt: normalizeMallText(existingFollowup?.createdAt || nowIsoString()),
  };

  data.followups = existingFollowup
    ? data.followups.map((item) => (normalizeMallText(item.id) === followupId ? followupRecord : item))
    : [followupRecord, ...(Array.isArray(data.followups) ? data.followups : [])];

  data.escortRequests = data.escortRequests.map((item) =>
    normalizeMallText(item.id) === requestId
      ? {
          ...item,
          followupId,
          followupDate,
          followupCreatedAt: nowIsoString(),
          updatedAt: nowIsoString(),
          timeline: appendEscortTimeline(item.timeline, "followup", "已转成复诊提醒", normalizeMallText(session.name || session.username), followupDate),
        }
      : item,
  );

  saveAppData(data);
  sendJson(res, 200, {
    ok: true,
    message: `已转成复诊提醒：${targetRecord.patientName} / ${followupDate}`,
    data: loadAppData(),
  });
}

function handleQuickFollowupReservation(req, res, session, body) {
  const data = loadAppData();
  const requestedDepartment = normalizeMallText(body?.departmentKey || body?.department);
  const requestedScheduleId = normalizeMallText(body?.scheduleId);
  if (requestedDepartment && !findQuickFollowupDepartmentConfig(requestedDepartment)) {
    sendJson(res, 400, { ok: false, message: "未识别的预约科室，请刷新页面后重试。" });
    return;
  }
  const patient =
    session.role === "patient"
      ? findPatientByUsername(data, session.username)
      : (Array.isArray(data.patients) ? data.patients.find((item) => item.id === normalizeMallText(body?.patientId)) : null);

  if (!patient) {
    sendJson(res, 404, { ok: false, message: "没有找到对应病人档案。" });
    return;
  }

  const existingAppointment = getPendingAppointment(patient);
  if (existingAppointment) {
    sendJson(res, 409, {
      ok: false,
      message: `已存在待就诊预约：${existingAppointment.date} / ${existingAppointment.department} / ${existingAppointment.room}`,
    });
    return;
  }

  let schedule;
  let created = false;

  if (requestedScheduleId) {
    schedule = (Array.isArray(data.schedules) ? data.schedules : []).find((item) => normalizeMallText(item.id) === requestedScheduleId) || null;
    if (!schedule) {
      sendJson(res, 404, { ok: false, message: "未找到指定号源，请刷新后重试。" });
      return;
    }
    if (requestedDepartment) {
      const departmentConfig = findQuickFollowupDepartmentConfig(requestedDepartment);
      if (departmentConfig && !isScheduleMatchedDepartment(schedule, departmentConfig)) {
        sendJson(res, 400, { ok: false, message: "所选时段与当前科室不匹配，请重新选择。" });
        return;
      }
    }
    if (normalizeMallText(schedule.date) < formatLocalDate(new Date())) {
      sendJson(res, 400, { ok: false, message: "该时段已过期，请重新选择可用号源。" });
      return;
    }
  } else {
    ({ schedule, created } = ensureAvailableFollowupSchedule(data, requestedDepartment));
  }
  if (Number(schedule.capacity || 0) <= Number(schedule.booked || 0)) {
    sendJson(res, 409, { ok: false, message: "当前复诊排班余号不足，请先调整医生端号源。" });
    return;
  }

  const appointment = buildQuickFollowupAppointment(schedule, session.role === "doctor" ? session.name || session.username : "patient-self-service");

  data.patients = data.patients.map((item) =>
    item.id === patient.id
      ? { ...item, appointments: [appointment, ...(Array.isArray(item.appointments) ? item.appointments : [])] }
      : item,
  );
  data.schedules = data.schedules.map((item) =>
    item.id === schedule.id
      ? { ...item, booked: Number(item.booked || 0) + 1 }
      : item,
  );

  saveAppData(data);
  const scopeData = session.role === "doctor" ? loadAppData() : getPatientScopedData(loadAppData(), session.username);
  sendJson(res, 200, {
    ok: true,
    message: `${created ? "已自动补充未来门诊并" : "已"}为 ${patient.name} 预约复诊：${appointment.date} / ${appointment.department} / ${appointment.room}`,
    appointment,
    data: scopeData,
  });
}

function validatePatientAppointments(previousAppointments, nextAppointments) {
  if (!Array.isArray(nextAppointments)) {
    throw new Error("Patient appointment data is invalid.");
  }

  if (nextAppointments.length < previousAppointments.length) {
    throw new Error("Patients cannot remove or roll back existing appointments.");
  }

  const previousMap = new Map(previousAppointments.map((item) => [item.id, item]));
  const nextIds = new Set();

  nextAppointments.forEach((item) => {
    if (!item?.id || nextIds.has(item.id)) {
      throw new Error("Appointment records contain duplicate or invalid identifiers.");
    }
    nextIds.add(item.id);

    if (previousMap.has(item.id)) {
      if (!sameSerializedValue(previousMap.get(item.id), item)) {
        throw new Error("Patients cannot modify existing appointment details or status.");
      }
      return;
    }

    if (!item.date || !item.department || !item.room) {
      throw new Error("Submitted appointment information is incomplete.");
    }

    item.status = "\u5df2\u9884\u7ea6";
  });
}
function validatePatientScopedData(previousData, nextData, username) {
  if (!username) {
    throw new Error("Missing patient identity. Unable to save data.");
  }

  const previousScopedData = getPatientScopedData(previousData, username);

  if (!sameSerializedValue(previousScopedData.schedules, nextData.schedules || [])) {
    throw new Error("Patients cannot modify schedules.");
  }

  if (!sameSerializedValue(previousScopedData.followups, nextData.followups || [])) {
    throw new Error("Patients cannot modify follow-up records.");
  }

  if (!sameSerializedValue(previousScopedData.escortRequests, nextData.escortRequests || [])) {
    throw new Error("Patients cannot directly modify escort requests.");
  }

  if (!sameSerializedValue(previousScopedData.escortStaffSchedules, nextData.escortStaffSchedules || [])) {
    throw new Error("Patients cannot modify escort staff schedules.");
  }

  if (!sameSerializedValue(previousScopedData.healthManuals, nextData.healthManuals || [])) {
    throw new Error("Patients cannot modify health manuals.");
  }

  if (!sameSerializedValue(previousScopedData.products, nextData.products || [])) {
    throw new Error("病人端不能直接修改商城商品。");
  }

  if (!sameSerializedValue(previousScopedData.orders, nextData.orders || [])) {
    throw new Error("病人端不能直接修改商城订单。");
  }

  if (!sameSerializedValue(previousScopedData.cartItems, nextData.cartItems || [])) {
    throw new Error("病人端不能直接修改购物车数据。");
  }

  if (!sameSerializedValue(previousScopedData.addresses, nextData.addresses || [])) {
    throw new Error("病人端不能直接修改地址簿数据。");
  }

  if (!Array.isArray(nextData.patients) || nextData.patients.length !== 1) {
    throw new Error("Patient-scoped profile data is invalid.");
  }

  const previousPatient = findPatientByUsername(previousData, username);
  const nextPatient = nextData.patients[0];

  if (!previousPatient || !nextPatient) {
    throw new Error("Unable to locate the current patient profile.");
  }

  if (previousPatient.id !== nextPatient.id || previousPatient.username !== nextPatient.username) {
    throw new Error("Patients cannot replace the signed-in profile.");
  }

  const {
    appointments: previousAppointments = [],
    reports: previousReports = [],
    ...previousReadonly
  } = previousPatient;
  const {
    appointments: nextAppointments = [],
    reports: nextReports = [],
    ...nextReadonly
  } = nextPatient;

  if (!Array.isArray(nextReports)) {
    throw new Error("Patient report data is invalid.");
  }

  if (!sameSerializedValue(previousReadonly, nextReadonly)) {
    throw new Error("Basic patient profile fields are read-only on the patient side.");
  }

  if (!sameSerializedValue(previousReports, nextReports)) {
    throw new Error("Patients cannot modify clinician-shared reports.");
  }

  validatePatientAppointments(previousAppointments, nextAppointments);

  return {
    ...previousData,
    patients: previousData.patients.map((item) =>
      item.username === username
        ? {
            ...item,
            appointments: cloneData(nextAppointments),
          }
        : item,
    ),
  };
}
function sanitizeMallQuantity(value) {
  const quantity = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("购买数量不合法。");
  }
  return quantity;
}

function findMallProductIndex(data, productId) {
  return Array.isArray(data?.products) ? data.products.findIndex((item) => item?.id === productId) : -1;
}

function ensureMallPatient(data, session) {
  const patient = findPatientByUsername(data, session.username);
  if (!patient) {
    throw new Error("未找到当前病人档案。");
  }
  return patient;
}

function ensureMallProductAvailable(data, productId, quantity) {
  const productIndex = findMallProductIndex(data, productId);
  if (productIndex === -1) {
    throw new Error("商品不存在。");
  }
  const product = normalizeMallProduct(data.products[productIndex]);
  if (normalizeMallProductStatus(product.status) !== "listed") {
    throw new Error(`商品“${product.name || product.id}”当前不可购买。`);
  }
  if (product.stock < quantity) {
    throw new Error(`商品“${product.name || product.id}”库存不足，当前仅剩 ${product.stock}${product.unit || "件"}。`);
  }
  return { product, productIndex };
}

function sanitizeMallOrderItems(rawItems) {
  if (!Array.isArray(rawItems) || !rawItems.length) {
    throw new Error("请至少选择一件商品。");
  }
  const merged = new Map();
  rawItems.forEach((item) => {
    const productId = normalizeMallText(item?.productId);
    const quantity = sanitizeMallQuantity(item?.quantity);
    if (!productId) {
      throw new Error("缺少商品信息。");
    }
    merged.set(productId, (merged.get(productId) || 0) + quantity);
  });
  return Array.from(merged.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

function getPatientMallAddresses(data, patient) {
  return Array.isArray(data?.addresses)
    ? data.addresses.filter((item) => item.patientUsername === patient.username || (patient.id && item.patientId === patient.id))
    : [];
}

function resolveMallAddressSnapshot(data, patient, body = {}) {
  const addressId = normalizeMallText(body.addressId);
  const patientAddresses = getPatientMallAddresses(data, patient);
  const selectedAddress = addressId
    ? patientAddresses.find((item) => item.id === addressId)
    : patientAddresses.find((item) => item.isDefault) || patientAddresses[0];

  if (selectedAddress) {
    return {
      addressId: selectedAddress.id,
      contactName: selectedAddress.receiverName,
      contactPhone: selectedAddress.receiverPhone,
      address: selectedAddress.addressLine,
    };
  }

  const contactName = normalizeMallText(body.contactName || patient.name);
  const contactPhone = normalizeMallText(body.contactPhone || patient.phone);
  const address = normalizeMallText(body.address || patient.address);
  if (!contactName || !contactPhone || !address) {
    throw new Error("请补全收货人、联系电话和收货地址。");
  }
  return {
    addressId: "",
    contactName,
    contactPhone,
    address,
  };
}

function createMallOrderTransaction(data, session, patient, items, addressSnapshot, note = "", options = {}) {
  const normalizedItems = sanitizeMallOrderItems(items);
  const timestamp = nowIsoString();
  const orderItems = [];
  const stockDelta = new Map();

  normalizedItems.forEach((item) => {
    const { product } = ensureMallProductAvailable(data, item.productId, item.quantity);
    orderItems.push({
      id: createId("ITEM"),
      productId: product.id,
      skuCode: product.skuCode || product.id,
      productName: product.name,
      category: product.category,
      unit: product.unit || "件",
      unitPrice: normalizeMallMoney(product.price),
      quantity: item.quantity,
      subtotal: normalizeMallMoney(product.price * item.quantity),
    });
    stockDelta.set(product.id, item.quantity);
  });

  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = normalizeMallMoney(orderItems.reduce((sum, item) => sum + item.subtotal, 0));
  const firstItem = orderItems[0] || normalizeMallOrderItem();
  const order = normalizeMallOrder({
    id: createId("ORD"),
    items: orderItems,
    totalItems,
    totalPrice,
    patientId: patient.id || "",
    patientUsername: session.username,
    patientName: patient.name || session.name || "",
    addressId: addressSnapshot.addressId || "",
    contactName: addressSnapshot.contactName,
    contactPhone: addressSnapshot.contactPhone,
    address: addressSnapshot.address,
    note: normalizeMallText(note),
    logisticsCompany: "",
    trackingNumber: "",
    fulfillmentNote: "",
    status: "pending_shipment",
    createdAt: timestamp,
    updatedAt: timestamp,
    productId: firstItem.productId,
    productName: firstItem.productName,
    productCategory: firstItem.category,
    unitPrice: firstItem.unitPrice,
    quantity: totalItems,
  });

  const nextProducts = data.products.map((item) => {
    const product = normalizeMallProduct(item);
    const quantity = stockDelta.get(product.id) || 0;
    if (!quantity) {
      return product;
    }
    return normalizeMallProduct({
      ...product,
      stock: product.stock - quantity,
      sales: product.sales + quantity,
      updatedAt: timestamp,
    });
  });

  const removeProductIds = new Set(normalizedItems.map((item) => item.productId));
  const removeCartItemIds = new Set(Array.isArray(options.cartItemIds) ? options.cartItemIds.map((item) => normalizeMallText(item)).filter(Boolean) : []);
  const nextCartItems = Array.isArray(data.cartItems)
    ? data.cartItems.filter((item) => {
        if (item.patientUsername !== session.username) {
          return true;
        }
        if (removeCartItemIds.size && removeCartItemIds.has(item.id)) {
          return false;
        }
        return removeCartItemIds.size ? true : !removeProductIds.has(item.productId);
      })
    : [];

  return {
    order,
    data: {
      ...data,
      products: nextProducts,
      orders: [order, ...data.orders],
      cartItems: nextCartItems,
    },
  };
}

function handleMallProductSave(req, res, session, body) {
  const rawProduct = body && typeof body === "object" && body.product ? body.product : body;
  const product = normalizeMallProduct(rawProduct);
  if (!product.name) {
    sendJson(res, 400, { ok: false, message: "请填写商品名称。" });
    return;
  }
  if (!product.category) {
    sendJson(res, 400, { ok: false, message: "请填写商品分类。" });
    return;
  }
  if (product.price <= 0) {
    sendJson(res, 400, { ok: false, message: "商品售价必须大于 0。" });
    return;
  }

  const data = loadAppData();
  const existing = data.products.find((item) => item.id === product.id);
  const timestamp = nowIsoString();
  const nextProduct = normalizeMallProduct({
    ...existing,
    ...product,
    id: product.id || createId("PROD"),
    skuCode: product.skuCode || existing?.skuCode || createId("SKU"),
    originalPrice: product.originalPrice > 0 ? product.originalPrice : product.price,
    sales: existing ? existing.sales : product.sales,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
  });

  const nextProducts = existing
    ? data.products.map((item) => (item.id === existing.id ? nextProduct : item))
    : [nextProduct, ...data.products];

  const nextData = {
    ...data,
    products: nextProducts,
  };
  saveAppData(nextData);
  sendJson(res, 200, { ok: true, product: nextProduct, data: loadAppData() });
}

function handleMallProductDelete(req, res, session, body) {
  const productId = normalizeMallText(body.productId);
  if (!productId) {
    sendJson(res, 400, { ok: false, message: "缺少商品标识。" });
    return;
  }

  const data = loadAppData();
  const product = data.products.find((item) => item.id === productId);
  if (!product) {
    sendJson(res, 404, { ok: false, message: "未找到该商品。" });
    return;
  }

  const hasOrders = data.orders.some((order) => {
    const normalized = normalizeMallOrder(order);
    return normalized.items.some((item) => item.productId === productId);
  });
  if (hasOrders) {
    sendJson(res, 400, { ok: false, message: "该商品已有订单历史，请先下架保留。"});
    return;
  }

  saveAppData({
    ...data,
    products: data.products.filter((item) => item.id !== productId),
    cartItems: data.cartItems.filter((item) => item.productId !== productId),
  });

  sendJson(res, 200, { ok: true, data: loadAppData() });
}

function handleMallCartAdd(req, res, session, body) {
  const productId = normalizeMallText(body.productId);
  const quantity = sanitizeMallQuantity(body.quantity);
  const data = loadAppData();
  const patient = ensureMallPatient(data, session);
  const { product } = ensureMallProductAvailable(data, productId, quantity);
  const existing = data.cartItems.find((item) => item.patientUsername === session.username && item.productId === productId);
  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > product.stock) {
    sendJson(res, 400, { ok: false, message: `购物车数量超过当前库存，剩余 ${product.stock}${product.unit || "件"}。` });
    return;
  }

  const timestamp = nowIsoString();
  const nextCartItems = existing
    ? data.cartItems.map((item) => item.id === existing.id ? normalizeMallCartItem({ ...item, quantity: nextQuantity, updatedAt: timestamp }) : item)
    : [
        normalizeMallCartItem({
          id: createId("CART"),
          patientId: patient.id || "",
          patientUsername: session.username,
          productId,
          quantity,
          updatedAt: timestamp,
        }),
        ...data.cartItems,
      ];

  saveAppData({
    ...data,
    cartItems: nextCartItems,
  });

  sendJson(res, 200, { ok: true, data: getPatientScopedData(loadAppData(), session.username) });
}

function handleMallCartUpdate(req, res, session, body) {
  const cartItemId = normalizeMallText(body.cartItemId);
  const productId = normalizeMallText(body.productId);
  const quantity = normalizeMallInteger(body.quantity, 1, 0);
  const data = loadAppData();
  const cartItem = data.cartItems.find((item) =>
    item.patientUsername === session.username &&
    ((cartItemId && item.id === cartItemId) || (productId && item.productId === productId))
  );
  if (!cartItem) {
    sendJson(res, 404, { ok: false, message: "未找到购物车商品。" });
    return;
  }

  if (quantity === 0) {
    saveAppData({
      ...data,
      cartItems: data.cartItems.filter((item) => item.id !== cartItem.id),
    });
    sendJson(res, 200, { ok: true, data: getPatientScopedData(loadAppData(), session.username) });
    return;
  }

  const { product } = ensureMallProductAvailable(data, cartItem.productId, quantity);
  if (quantity > product.stock) {
    sendJson(res, 400, { ok: false, message: `购物车数量超过当前库存，剩余 ${product.stock}${product.unit || "件"}。` });
    return;
  }

  saveAppData({
    ...data,
    cartItems: data.cartItems.map((item) =>
      item.id === cartItem.id ? normalizeMallCartItem({ ...item, quantity, updatedAt: nowIsoString() }) : item
    ),
  });

  sendJson(res, 200, { ok: true, data: getPatientScopedData(loadAppData(), session.username) });
}

function handleMallCartRemove(req, res, session, body) {
  const cartItemId = normalizeMallText(body.cartItemId);
  const productId = normalizeMallText(body.productId);
  const data = loadAppData();
  saveAppData({
    ...data,
    cartItems: data.cartItems.filter((item) =>
      !(item.patientUsername === session.username && ((cartItemId && item.id === cartItemId) || (productId && item.productId === productId)))
    ),
  });
  sendJson(res, 200, { ok: true, data: getPatientScopedData(loadAppData(), session.username) });
}

function handleMallAddressSave(req, res, session, body) {
  const data = loadAppData();
  const patient = ensureMallPatient(data, session);
  const rawAddress = body && typeof body === "object" && body.address ? body.address : body;
  const address = normalizeMallAddress(rawAddress);
  if (!address.receiverName || !address.receiverPhone || !address.addressLine) {
    sendJson(res, 400, { ok: false, message: "请补全收货人、联系电话和详细地址。" });
    return;
  }

  const timestamp = nowIsoString();
  const patientAddresses = getPatientMallAddresses(data, patient);
  const isEditing = address.id && patientAddresses.some((item) => item.id === address.id);
  const shouldDefault = Boolean(address.isDefault) || !patientAddresses.length || (isEditing && patientAddresses.find((item) => item.id === address.id)?.isDefault);
  const nextAddress = normalizeMallAddress({
    ...address,
    id: isEditing ? address.id : createId("ADDR"),
    patientId: patient.id || "",
    patientUsername: session.username,
    isDefault: shouldDefault,
    updatedAt: timestamp,
  });

  let nextAddresses = data.addresses.filter((item) => !(item.patientUsername === session.username && item.id === nextAddress.id));
  nextAddresses = nextAddresses.map((item) =>
    item.patientUsername === session.username && shouldDefault
      ? normalizeMallAddress({ ...item, isDefault: false, updatedAt: timestamp })
      : item
  );
  nextAddresses = [nextAddress, ...nextAddresses];

  saveAppData({
    ...data,
    addresses: nextAddresses,
  });

  sendJson(res, 200, { ok: true, data: getPatientScopedData(loadAppData(), session.username) });
}

function handleMallAddressDelete(req, res, session, body) {
  const addressId = normalizeMallText(body.addressId);
  if (!addressId) {
    sendJson(res, 400, { ok: false, message: "缺少地址标识。" });
    return;
  }

  const data = loadAppData();
  const patientAddresses = data.addresses.filter((item) => item.patientUsername === session.username);
  const target = patientAddresses.find((item) => item.id === addressId);
  if (!target) {
    sendJson(res, 404, { ok: false, message: "未找到该地址。" });
    return;
  }

  let nextAddresses = data.addresses.filter((item) => item.id !== addressId);
  if (target.isDefault) {
    const fallback = nextAddresses.find((item) => item.patientUsername === session.username);
    if (fallback) {
      nextAddresses = nextAddresses.map((item) =>
        item.id === fallback.id
          ? normalizeMallAddress({ ...item, isDefault: true, updatedAt: nowIsoString() })
          : item
      );
    }
  }

  saveAppData({
    ...data,
    addresses: nextAddresses,
  });
  sendJson(res, 200, { ok: true, data: getPatientScopedData(loadAppData(), session.username) });
}

function handleMallCheckout(req, res, session, body) {
  const data = loadAppData();
  const patient = ensureMallPatient(data, session);
  const cartItemIds = Array.isArray(body.cartItemIds)
    ? body.cartItemIds.map((item) => normalizeMallText(item)).filter(Boolean)
    : [];

  let items = [];
  if (Array.isArray(body.items) && body.items.length) {
    items = body.items;
  } else if (cartItemIds.length) {
    items = data.cartItems
      .filter((item) => item.patientUsername === session.username && cartItemIds.includes(item.id))
      .map((item) => ({ productId: item.productId, quantity: item.quantity }));
  } else {
    items = data.cartItems
      .filter((item) => item.patientUsername === session.username)
      .map((item) => ({ productId: item.productId, quantity: item.quantity }));
  }

  const addressSnapshot = resolveMallAddressSnapshot(data, patient, body);
  const transaction = createMallOrderTransaction(data, session, patient, items, addressSnapshot, body.note, { cartItemIds });
  saveAppData(transaction.data);
  sendJson(res, 200, {
    ok: true,
    order: transaction.order,
    data: getPatientScopedData(loadAppData(), session.username),
  });
}

function handleMallOrderStatus(req, res, session, body) {
  const orderId = normalizeMallText(body.orderId);
  const nextStatus = normalizeMallOrderStatus(body.status);
  if (!orderId) {
    sendJson(res, 400, { ok: false, message: "缺少订单标识。" });
    return;
  }

  const data = loadAppData();
  const order = data.orders.find((item) => item.id === orderId);
  if (!order) {
    sendJson(res, 404, { ok: false, message: "未找到该订单。" });
    return;
  }

  const normalizedOrder = normalizeMallOrder(order);
  if (session.role === "patient" && normalizedOrder.patientUsername !== session.username) {
    sendJson(res, 403, { ok: false, message: "当前账号无权修改该订单。" });
    return;
  }

  const currentStatus = normalizeMallOrderStatus(normalizedOrder.status);
  const isDoctor = session.role === "doctor";
  const isPatient = session.role === "patient";
  const canShip = isDoctor && currentStatus === "pending_shipment" && nextStatus === "shipped";
  const canComplete = currentStatus === "shipped" && nextStatus === "completed" && (isDoctor || isPatient);

  if (!canShip && !canComplete) {
    sendJson(res, 400, { ok: false, message: "当前订单状态不允许这样流转。" });
    return;
  }

  const nextOrder = normalizeMallOrder({
    ...normalizedOrder,
    status: nextStatus,
    logisticsCompany: canShip ? normalizeMallText(body.logisticsCompany) : normalizedOrder.logisticsCompany,
    trackingNumber: canShip ? normalizeMallText(body.trackingNumber) : normalizedOrder.trackingNumber,
    fulfillmentNote: canShip ? normalizeMallText(body.fulfillmentNote) : normalizedOrder.fulfillmentNote,
    updatedAt: nowIsoString(),
  });

  saveAppData({
    ...data,
    orders: data.orders.map((item) => (item.id === orderId ? nextOrder : item)),
  });

  const latestData = loadAppData();
  sendJson(res, 200, {
    ok: true,
    order: latestData.orders.find((item) => item.id === orderId),
    data: session.role === "doctor" ? latestData : getPatientScopedData(latestData, session.username),
  });
}

function handleMallPurchase(req, res, session, body) {
  try {
    const data = loadAppData();
    const patient = ensureMallPatient(data, session);
    const addressSnapshot = resolveMallAddressSnapshot(data, patient, body);
    const transaction = createMallOrderTransaction(
      data,
      session,
      patient,
      [{ productId: body.productId, quantity: body.quantity }],
      addressSnapshot,
      body.note,
    );
    saveAppData(transaction.data);
    sendJson(res, 200, {
      ok: true,
      order: transaction.order,
      data: getPatientScopedData(loadAppData(), session.username),
    });
  } catch (error) {
    sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "商城下单失败。" });
  }
}

function loadAiConfig() {
  const config = readJson(AI_CONFIG_FILE, DEFAULT_AI_CONFIG);
  return {
    ...DEFAULT_AI_CONFIG,
    ...config,
  };
}

function saveAiConfig(config) {
  writeJson(AI_CONFIG_FILE, {
    ...DEFAULT_AI_CONFIG,
    ...config,
    updatedAt: nowIsoString(),
  });
}

function serializeAiConfig(config) {
  return {
    providerName: config.providerName || DEFAULT_AI_CONFIG.providerName,
    apiBaseUrl: config.apiBaseUrl || "",
    model: config.model || "",
    hasApiKey: Boolean(config.apiKey),
    enableWebSearch: Boolean(config.enableWebSearch),
    maxWebResults: Number(config.maxWebResults || DEFAULT_AI_CONFIG.maxWebResults),
    systemPrompt: config.systemPrompt || DEFAULT_AI_CONFIG.systemPrompt,
    updatedAt: config.updatedAt || "",
    isConfigured: Boolean(config.apiBaseUrl && config.model && config.apiKey),
  };
}

function normalizeConversation(conversation) {
  return {
    id: conversation.id || createId("conv"),
    title: conversation.title || "New conversation",
    mode: conversation.mode || "health",
    createdAt: conversation.createdAt || nowIsoString(),
    updatedAt: conversation.updatedAt || nowIsoString(),
    messages: Array.isArray(conversation.messages) ? conversation.messages : [],
  };
}

function loadChatStore() {
  const store = readJson(AI_CHATS_FILE, DEFAULT_CHAT_STORE);
  if (!store || typeof store !== "object" || typeof store.conversations !== "object" || store.conversations === null) {
    return { conversations: {} };
  }

  const normalized = {};
  Object.entries(store.conversations).forEach(([username, conversations]) => {
    normalized[username] = Array.isArray(conversations) ? conversations.map((item) => normalizeConversation(item)) : [];
  });
  return { conversations: normalized };
}

function saveChatStore(store) {
  writeJson(AI_CHATS_FILE, store);
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

function sanitizeFilename(name) {
  return String(name || "file")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/");
}

function stripTags(text) {
  return decodeHtmlEntities(String(text || "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function resolveApiUrl(apiBaseUrl) {
  const trimmed = String(apiBaseUrl || "").trim();
  if (!trimmed) {
    return "";
  }
  if (/\/chat\/completions$/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed.replace(/\/+$/, "")}/chat/completions`;
}

function collectTextCandidates(value, depth = 0) {
  if (depth > 6 || value === null || value === undefined) {
    return [];
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectTextCandidates(item, depth + 1));
  }

  if (typeof value !== "object") {
    return [];
  }

  const priorityKeys = [
    "output_text",
    "text",
    "content",
    "reasoning_content",
    "answer",
    "response",
    "message",
  ];

  const collected = [];
  priorityKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      collected.push(...collectTextCandidates(value[key], depth + 1));
    }
  });

  if (collected.length) {
    return collected;
  }

  return Object.values(value).flatMap((item) => collectTextCandidates(item, depth + 1));
}

function extractModelText(payload) {
  const directCandidates = [
    payload?.choices?.[0]?.message?.content,
    payload?.choices?.[0]?.message?.reasoning_content,
    payload?.choices?.[0]?.text,
    payload?.message?.content,
    payload?.output_text,
    payload?.output?.text,
    payload?.output?.choices?.[0]?.message?.content,
    payload?.response?.output_text,
    payload?.response?.output?.[0]?.content,
  ];

  for (const candidate of directCandidates) {
    const text = collectTextCandidates(candidate).join("\n").trim();
    if (text) {
      return text;
    }
  }

  return collectTextCandidates(payload).join("\n").trim();
}

function saveDebugModelResponse(context) {
  writeJson(AI_DEBUG_RESPONSE_FILE, {
    savedAt: nowIsoString(),
    ...context,
  });
}

function getPatientByUsername(username) {
  const data = loadAppData();
  return data.patients.find((item) => item.username === username) || null;
}

function buildPatientContext(patient) {
  if (!patient) {
    return "No structured patient profile was found.";
  }

  const latestReport = Array.isArray(patient.reports) && patient.reports.length ? patient.reports[0] : null;
  const latestAppointment = Array.isArray(patient.appointments) && patient.appointments.length ? patient.appointments[0] : null;

  return [
    `Current patient: ${patient.name || "Unnamed patient"}`, 
    `Gender/Age: ${patient.gender || "-"} / ${patient.age || "-"}`, 
    `Phone: ${patient.phone || "-"}`, 
    `Last visit: ${patient.lastVisit || "-"}`, 
    `Current status: ${patient.status || "-"}`, 
    `History: ${patient.history || "-"}`, 
    `Current diagnosis: ${patient.diagnosis || "-"}`, 
    `Latest appointment: ${latestAppointment ? `${latestAppointment.date}, ${latestAppointment.department}, ${latestAppointment.status}` : "None"}`, 
    `Latest report: ${latestReport ? `${latestReport.name}, ${latestReport.date}, ${latestReport.result}, ${latestReport.summary}` : "None"}`, 
  ].join("\n");
}

async function searchWeb(query, limit = 5) {
  const trimmed = String(query || "").trim();
  if (!trimmed) {
    return [];
  }

  const targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(trimmed)}`;
  const response = await fetch(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  const html = await response.text();
  const results = [];
  const regex =
    /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|div)>|class="result__extras__url"[^>]*>([\s\S]*?)<\/a>)/gi;

  let match;
  while ((match = regex.exec(html)) && results.length < limit) {
    const href = match[1] || "";
    const title = stripTags(match[2]);
    const snippet = stripTags(match[3] || match[4] || "");
    const uddgMatch = href.match(/[?&]uddg=([^&]+)/);
    const url = uddgMatch ? decodeURIComponent(uddgMatch[1]) : href.startsWith("//") ? `https:${href}` : href;

    if (!title || !url) {
      continue;
    }

    results.push({ title, snippet, url });
  }

  return results;
}

function summarizeSearchResults(results) {
  if (!results.length) {
    return "Web search: no usable results were returned.";
  }
  return results
    .map((item, index) => `${index + 1}. ${item.title}\nLink: ${item.url}\nSummary: ${item.snippet || "No summary"}`)
    .join("\n\n");
}

function createConversationTitle(message, mode) {
  const cleaned = String(message || "").replace(/\s+/g, " ").trim();
  if (cleaned) {
    return cleaned.length > 18 ? `${cleaned.slice(0, 18)}...` : cleaned;
  }
  const modeLabels = {
    deep: "Deep review",
    health: "Health consult",
    report: "Report review",
    medication: "Medication guide",
  };
  return modeLabels[mode] || "New conversation";
}
function getModeInstruction(mode) {
  switch (mode) {
    case "deep":
      return "Provide a deeper clinical explanation using the structured patient profile, uploaded files, and any available web results.";
    case "report":
      return "Prioritize interpreting uploaded reports or test results, explain the key findings, and note what still needs clinician confirmation.";
    case "medication":
      return "Focus on medication safety, usage precautions, and when the patient should seek in-person care. Do not invent prescriptions or dosages.";
    default:
      return "Give a practical health answer grounded in the patient context, clearly flag uncertainty, and avoid overclaiming.";
  }
}
function getTextFileContent(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();
  const isText =
    String(mimeType || "").startsWith("text/") ||
    [".txt", ".md", ".json", ".csv", ".xml", ".html", ".js", ".ts"].includes(ext);

  if (!isText) {
    return "";
  }

  const content = fs.readFileSync(filePath, "utf8");
  return content.length > 12000 ? `${content.slice(0, 12000)}\n\n[Content truncated]` : content;
}
function buildHistoryMessages(messages) {
  return messages.slice(-10).map((item) => {
    const attachmentText = Array.isArray(item.attachments) && item.attachments.length
      ? `\nAttachments: ${item.attachments.map((attachment) => attachment.originalName).join(", ")}`
      : "";
    return {
      role: item.role,
      content: `${item.text || ""}${attachmentText}`.trim(),
    };
  });
}
function buildCurrentUserContent(messageText, attachments) {
  const parts = [];
  const textSegments = [messageText];
  const imageParts = [];

  attachments.forEach((attachment) => {
    const filePath = path.join(UPLOAD_DIR, attachment.storedName);
    if (!fs.existsSync(filePath)) {
      return;
    }

    if (String(attachment.mimeType || "").startsWith("image/")) {
      const base64 = fs.readFileSync(filePath).toString("base64");
      imageParts.push({
        type: "image_url",
        image_url: {
          url: `data:${attachment.mimeType};base64,${base64}`,
        },
      });
      textSegments.push(`Uploaded image: ${attachment.originalName}`);
      return;
    }

    const textContent = getTextFileContent(filePath, attachment.mimeType);
    if (textContent) {
      textSegments.push(`Attachment \"${attachment.originalName}\" content:\n${textContent}`);
      return;
    }

    textSegments.push(`Uploaded file: ${attachment.originalName} (${attachment.mimeType || "unknown type"}, ${attachment.size || 0} bytes)`);
  });

  parts.push({
    type: "text",
    text: textSegments.filter(Boolean).join("\n\n"),
  });

  return [...parts, ...imageParts];
}
async function requestModelAnswer({ config, username, conversation, mode, messageText, attachments, searchResults }) {
  const apiUrl = resolveApiUrl(config.apiBaseUrl);
  if (!apiUrl || !config.model || !config.apiKey) {
    throw new Error("AI model endpoint, model name, or API key is missing.");
  }

  const patientContext = buildPatientContext(getPatientByUsername(username));
  const searchContext = searchResults.length ? summarizeSearchResults(searchResults) : "Web search: disabled or no results.";
  const messages = [
    { role: "system", content: config.systemPrompt || DEFAULT_AI_CONFIG.systemPrompt },
    {
      role: "system",
      content: [
        "You are assisting a head and neck radiotherapy decision and follow-up platform. Use the structured patient profile, uploaded files, and any approved web results as context. Be explicit about uncertainty, do not fabricate findings, and advise in-person care for urgent red-flag symptoms.",
        `Mode instruction: ${getModeInstruction(mode)}`,
        `Patient context:\n${patientContext}`,
        `Web context:\n${searchContext}`,
      ].join("\n\n"),
    },
    ...buildHistoryMessages(conversation.messages),
    { role: "user", content: buildCurrentUserContent(messageText, attachments) },
  ];

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      messages,
    }),
  });

  const rawText = await response.text();
  let payload = {};

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch (error) {
      saveDebugModelResponse({
        providerName: config.providerName,
        apiBaseUrl: config.apiBaseUrl,
        model: config.model,
        username,
        mode,
        requestMessage: messageText,
        status: response.status,
        contentType: response.headers.get("content-type") || "",
        rawBody: rawText.slice(0, 20000),
      });
      throw new Error("The model response was not valid JSON. Please verify the API base URL and chat completions endpoint.");
    }
  }

  if (!response.ok) {
    const errorMessage = payload?.error?.message || payload?.message || `Model request failed with HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  const text = extractModelText(payload);
  if (!text) {
    saveDebugModelResponse({
      providerName: config.providerName,
      apiBaseUrl: config.apiBaseUrl,
      model: config.model,
      username,
      mode,
      requestMessage: messageText,
      status: response.status,
      contentType: response.headers.get("content-type") || "",
      rawBody: rawText.slice(0, 20000),
      responsePayload: payload,
    });
    throw new Error("The model returned a response, but no usable text was extracted. See ai-last-response.json for details.");
  }

  return text;
}
function extractAssistantText(payload) {
  const candidates = [
    payload?.choices?.[0]?.message?.content,
    payload?.choices?.[0]?.text,
    payload?.message?.content,
    payload?.output_text,
    payload?.output?.text,
    payload?.output?.choices?.[0]?.message?.content,
    payload?.response?.output_text,
  ];

  for (const candidate of candidates) {
    const text = collectTextCandidates(candidate).join("\n").trim();
    if (text) {
      return text;
    }
  }

  return extractModelText(payload);
}

async function callConfiguredModelText({
  config,
  messages,
  temperature = 0.2,
  requestLabel = "",
  responseFormat = null,
  maxTokens = null,
}) {
  const apiUrl = resolveApiUrl(config.apiBaseUrl);
  if (!apiUrl || !config.model || !config.apiKey) {
    throw new Error("AI model configuration is incomplete.");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      ...(/reasoner/i.test(String(config.model || "")) ? {} : { temperature }),
      messages,
      ...(responseFormat ? { response_format: responseFormat } : {}),
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
    }),
  });

  const rawText = await response.text();
  let payload = {};

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch (error) {
      saveDebugModelResponse({
        providerName: config.providerName,
        apiBaseUrl: config.apiBaseUrl,
        model: config.model,
        requestLabel,
        status: response.status,
        contentType: response.headers.get("content-type") || "",
        rawBody: rawText.slice(0, 20000),
      });
      throw new Error("AI returned a non-JSON payload.");
    }
  }

  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || `AI request failed with HTTP ${response.status}`);
  }

  const text = extractAssistantText(payload);
  if (!text) {
    saveDebugModelResponse({
      providerName: config.providerName,
      apiBaseUrl: config.apiBaseUrl,
      model: config.model,
      requestLabel,
      status: response.status,
      contentType: response.headers.get("content-type") || "",
      rawBody: rawText.slice(0, 20000),
      responsePayload: payload,
    });
    throw new Error("AI returned a payload, but no usable text was extracted.");
  }

  return text.trim();
}
function findFirstJsonObject(text) {
  const source = String(text || "");
  const start = source.indexOf("{");
  if (start < 0) {
    return "";
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "{") {
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  return "";
}

function parseModelJsonObject(text) {
  const trimmed = String(text || "").trim();
  const candidates = [];
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    candidates.push(fencedMatch[1].trim());
  }
  if (trimmed) {
    candidates.push(trimmed);
  }
  const balanced = findFirstJsonObject(trimmed);
  if (balanced) {
    candidates.push(balanced);
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      // try next candidate
    }
  }

  throw new Error("Unable to parse a JSON object from the model output.");
}
function buildRadiotherapyGenerationPrompt(target) {
  const targetMap = {
    observe: "Generate a low-risk postoperative summary that should lead to a final recommendation of NO adjuvant radiotherapy.",
    rt: "Generate a postoperative summary that should lead to YES and recommend postoperative radiotherapy.",
    ccrt: "Generate a postoperative summary that should lead to YES and recommend concurrent chemoradiotherapy.",
  };
  const targetInstruction = targetMap[target] || "Generate a postoperative head and neck cancer discharge summary with a plausible risk profile.";
  return [
    "You are a head and neck oncology clinician writing a fictional demonstration discharge summary.",
    targetInstruction,
    "Requirements:",
    "1. Output only the discharge summary in Chinese. Do not output markdown or JSON.",
    "2. Include a realistic primary site, pathology, stage, surgery, margins, lymph nodes, and risk factors that match the target outcome.",
    "3. Keep it concise but complete, around 150-260 Chinese characters.",
    "4. Do not mention that the case is fictional, simulated, or for demonstration.",
  ].join("\n");
}
function buildRadiotherapyExtractionPrompt(summaryText) {
  return [
    "Extract structured radiotherapy decision fields from the discharge summary below.",
    "Return JSON only. Use null when a field is not available, and do not invent evidence.",
    "JSON schema:",
    "{",
    '  "primarySiteLabel": "oral tongue / floor of mouth / buccal mucosa / gingiva / other",',
    '  "pathology": "squamous cell carcinoma",',
    '  "isSquamousCellCarcinoma": true,',
    '  "surgeryPerformed": "resection",',
    '  "pathologicStage": "pT2N1M0",',
    '  "tStage": "T2",',
    '  "nStage": "N1",',
    '  "mStage": "M0",',
    '  "marginStatus": "negative/close/positive/unknown",',
    '  "closestMarginMm": 3,',
    '  "positiveNodes": 1,',
    '  "examinedNodes": 24,',
    '  "extranodalExtension": false,',
    '  "perineuralInvasion": false,',
    '  "lymphovascularInvasion": false,',
    '  "depthOfInvasionMm": 8,',
    '  "supportingEvidence": [{"field":"marginStatus","evidence":"closest margin 3 mm"}],',
    '  "uncertainties": ["stage not explicitly documented"]',
    "}",
    "",
    "Discharge summary:",
    summaryText,
  ].join("\n");
}
function buildRadiotherapyReportPrompt({ summaryText, extracted, analysis }) {
  return [
    "Turn the radiotherapy decision output into a concise clinician-facing report in Chinese.",
    "Requirements:",
    "1. Keep the report around 220-360 Chinese characters.",
    "2. State the final yes/no recommendation clearly and explain the main reasons.",
    "3. Mention the major pathology and risk factors that drive the recommendation.",
    "4. Output plain text only. Do not use markdown.",
    "",
    `Discharge summary: ${summaryText}`,
    `Extracted JSON: ${JSON.stringify(extracted)}`,
    `Decision analysis: ${JSON.stringify({
      yesNo: analysis.yesNo,
      recommendationType: analysis.recommendationType,
      recommendationTitle: analysis.recommendationTitle,
      strongReasons: analysis.strongReasons,
      nextSteps: analysis.nextSteps,
      missingFields: analysis.missingFields,
    })}`,
  ].join("\n");
}
function normalizeRadiotherapyReportText(text) {
  return String(text || "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function generateRadiotherapyCaseWithAi(target = "") {
  const config = loadAiConfig();
  if (!config.apiBaseUrl || !config.model || !config.apiKey) {
    throw new Error("Please finish the AI configuration before generating a demo discharge summary.");
  }

  return callConfiguredModelText({
    config,
    temperature: 0.8,
    requestLabel: "radiotherapy-generate-case",
    messages: [
      { role: "system", content: "You are a head and neck oncology clinician generating a concise, realistic demonstration discharge summary." },
      { role: "user", content: buildRadiotherapyGenerationPrompt(target) },
    ],
  });
}

async function extractRadiotherapyJsonWithAi(config, text) {
  const attempts = [
    { config, mode: "configured" },
    ...(/deepseek/i.test(String(config.providerName || "") + String(config.apiBaseUrl || "")) && /reasoner/i.test(String(config.model || ""))
      ? [{ config: { ...config, model: "deepseek-chat" }, mode: "deepseek-chat" }]
      : []),
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      const extractionText = await callConfiguredModelText({
        config: attempt.config,
        requestLabel: "radiotherapy-extract-json",
        responseFormat: { type: "json_object" },
        maxTokens: 1800,
        messages: [
          { role: "system", content: "Extract the postoperative summary into JSON only. Do not output any non-JSON content." },
          { role: "user", content: buildRadiotherapyExtractionPrompt(text) },
        ],
      });
      return {
        json: parseModelJsonObject(extractionText),
        mode: attempt.mode,
        model: attempt.config.model || "",
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("AI structured extraction failed.");
}

async function generateRadiotherapyReportWithAi(config, text, analysis) {
  const attempts = [
    { config, mode: "configured" },
    ...(/deepseek/i.test(String(config.providerName || "") + String(config.apiBaseUrl || "")) && /reasoner/i.test(String(config.model || ""))
      ? [{ config: { ...config, model: "deepseek-chat" }, mode: "deepseek-chat" }]
      : []),
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      const reportText = await callConfiguredModelText({
        config: attempt.config,
        temperature: 0.4,
        requestLabel: "radiotherapy-human-report",
        maxTokens: 1800,
        messages: [
          { role: "system", content: "Turn the radiotherapy engine output into a concise, professional, and clear clinician-facing report." },
          { role: "user", content: buildRadiotherapyReportPrompt({ summaryText: text, extracted: analysis.extractedJson, analysis }) },
        ],
      });
      return {
        text: normalizeRadiotherapyReportText(reportText),
        mode: attempt.mode,
        model: attempt.config.model || "",
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("AI report generation failed.");
}

async function analyzeRadiotherapyWithAi(text, caseId = "") {
  const config = loadAiConfig();
  const warnings = [];
  let extracted;
  let extractionMode = "ai";
  let extractionModel = config.model || "";

  if (!config.apiBaseUrl || !config.model || !config.apiKey) {
    const fallback = analyzeRadiotherapyDecision(text, { caseId });
    return {
      ...fallback,
      pipeline: { extraction: "local_fallback", report: "local_fallback", model: "" },
      warnings: ["AI is not configured, so local fallback logic was used."],
    };
  }

  try {
    const extractionResult = await extractRadiotherapyJsonWithAi(config, text);
    extracted = extractionResult.json;
    extractionModel = extractionResult.model;
    if (extractionResult.mode === "deepseek-chat") {
      warnings.push("Structured extraction automatically switched to deepseek-chat for better compatibility.");
    }
  } catch (error) {
    extractionMode = "local_fallback";
    warnings.push(`AI structured extraction failed. Switched to local fallback: ${error.message}`);
    extracted = buildFallbackExtraction(text, caseId);
  }

  const analysis = evaluateRadiotherapyDecision(extracted, { sourceText: text });
  let reportText = "";
  let reportMode = "ai";
  let reportModel = config.model || "";

  try {
    const reportResult = await generateRadiotherapyReportWithAi(config, text, analysis);
    reportText = reportResult.text;
    reportModel = reportResult.model;
    if (reportResult.mode === "deepseek-chat") {
      warnings.push("Report generation automatically switched to deepseek-chat for better compatibility.");
    }
  } catch (error) {
    reportMode = "local_fallback";
    warnings.push(`AI report generation failed. Switched to local fallback: ${error.message}`);
    reportText = buildLocalRadiotherapyReport(analysis);
  }

  return {
    ...analysis,
    reportText,
    pipeline: {
      extraction: extractionMode,
      report: reportMode,
      model: config.model || "",
      extractionModel,
      reportModel,
      provider: config.providerName || "",
    },
    warnings,
  };
}
function getConversationsForUser(store, username) {
  return Array.isArray(store.conversations[username]) ? store.conversations[username] : [];
}

function saveConversationsForUser(store, username, conversations) {
  store.conversations[username] = conversations
    .map((item) => normalizeConversation(item))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

function createAttachmentRecord(file) {
  const timestamp = Date.now();
  const safeName = sanitizeFilename(file.name);
  const ext = path.extname(safeName);
  if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext.toLowerCase())) {
    throw new Error("当前文件类型暂不支持上传。");
  }
  if (Number(file.size || 0) <= 0 || Number(file.size || 0) > MAX_UPLOAD_FILE_SIZE) {
    throw new Error("文件大小超出允许范围。");
  }
  const storedName = `${timestamp}-${crypto.randomBytes(4).toString("hex")}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storedName);
  fs.writeFileSync(filePath, Buffer.from(file.base64, "base64"));
  return {
    id: createId("file"),
    originalName: file.name,
    storedName,
    mimeType: file.type || "application/octet-stream",
    size: Number(file.size || 0),
    url: `/uploads/${storedName}`,
    uploadedAt: nowIsoString(),
  };
}
function serveStaticFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendText(res, 404, "Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    };

    if ([".html", ".css", ".js"].includes(ext)) {
      headers["Cache-Control"] = "no-store, max-age=0";
    }

    res.writeHead(200, headers);
    res.end(content);
  });
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  if (
    /^\/(?:app-data|ai-config|ai-chats|ai-last-response|radiomics-results)\.json(?:\.|$)/.test(safePath) ||
    safePath.startsWith("/radiomics-images/") ||
    safePath.startsWith("/.")
  ) {
    sendText(res, 404, "Not Found");
    return;
  }
  if (safePath.startsWith("/uploads/")) {
    const session = getSession(req);
    if (!session) {
      sendText(res, 401, "Unauthorized");
      return;
    }
  }
  const targetPath = path.normalize(path.join(ROOT, safePath));
  if (!targetPath.startsWith(ROOT)) {
    sendText(res, 403, "Forbidden");
    return;
  }
  serveStaticFile(res, targetPath);
}

async function handleUpload(req, res) {
  try {
    ensureDir(UPLOAD_DIR);
    const body = parseJsonBody(await readBody(req));
    const files = Array.isArray(body.files) ? body.files : [];

    if (!files.length) {
      sendJson(res, 400, { ok: false, message: "没有检测到要上传的文件。" });
      return;
    }

    const uploaded = files.map((file) => {
      if (!file.name || !file.base64) {
        throw new Error("上传文件数据不完整。");
      }
      return createAttachmentRecord(file);
    });

    sendJson(res, 200, { ok: true, files: uploaded });
  } catch (error) {
    sendJson(res, 400, { ok: false, message: error.message || "文件上传失败。" });
  }
}

function getDoctorToolProxyTarget(pathname) {
  const match = pathname.match(/^\/doctor-tool-proxy\/(targetContouring|dosePrediction)(\/.*)?$/);
  if (!match) {
    return null;
  }
  const service = DOCTOR_TOOL_SERVICES[match[1] === "targetContouring" ? "contouring" : match[1]];
  return {
    service,
    path: match[2] || "/",
  };
}

async function handleDoctorToolProxy(req, res, pathname, searchParams) {
  const target = getDoctorToolProxyTarget(pathname);
  if (!target) {
    return false;
  }

  const session = requireSession(req, res, "doctor");
  if (!session) {
    return true;
  }

  const { service } = target;
  if (!service || !(await isPortListening(service.port, "127.0.0.1"))) {
    sendJson(res, 503, {
      ok: false,
      code: "DOCTOR_TOOL_UNAVAILABLE",
      message: `${service?.name || "医生工具"}服务尚未启动，请先配置 Python 子服务和模型文件。`,
    });
    return true;
  }

  const targetUrl = `http://127.0.0.1:${service.port}${target.path}${searchParams?.toString() ? `?${searchParams}` : ""}`;
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  const requestOptions = {
    method: req.method,
    headers,
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    requestOptions.body = req;
    requestOptions.duplex = "half";
  }

  try {
    const response = await fetch(targetUrl, requestOptions);
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    let body = Buffer.from(await response.arrayBuffer());
    if (contentType.includes("text/html")) {
      const proxyBase = `/doctor-tool-proxy/${service.key === "contouring" ? "targetContouring" : "dosePrediction"}`;
      const html = body.toString("utf8").replace(/(["'`])\/(api|static|outputs|result|run-case|run-upload|run-inference)(?=\/|["'`])/g,
        (_, quote, segment) => `${quote}${proxyBase}/${segment}`);
      body = Buffer.from(html, "utf8");
    }
    res.writeHead(response.status, {
      "Content-Type": contentType,
      "Cache-Control": "no-store, max-age=0",
    });
    res.end(body);
  } catch (error) {
    sendJson(res, 502, {
      ok: false,
      code: "DOCTOR_TOOL_PROXY_FAILED",
      message: error instanceof Error ? error.message : "医生工具代理请求失败。",
    });
  }
  return true;
}

function loadRadiomicsPrognosis() {
  const empty = {
    total: 0,
    featureCount: 6,
    highRiskCount: 0,
    threshold: 0.5,
  };
  const resultFile = path.join(ROOT, "radiomics-results.json");
  if (!fs.existsSync(resultFile)) {
    return { summary: empty, features: [], cases: [] };
  }
  try {
    const payload = JSON.parse(fs.readFileSync(resultFile, "utf8"));
    const cases = Array.isArray(payload.cases) ? payload.cases : [];
    const summary = { ...empty, ...(payload.summary || {}), total: cases.length || Number(payload.summary?.total || 0) };
    return { summary, features: Array.isArray(payload.features) ? payload.features : [], cases };
  } catch (error) {
    return { summary: empty, features: [], cases: [], error: "影像组学结果文件格式无效。" };
  }
}

async function handleAiChat(req, res, session) {
  try {
    const body = parseJsonBody(await readBody(req));
    const username = session.username;
    const mode = String(body.mode || "health").trim();
    const rawMessage = String(body.message || "").trim();
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];

    if (!username) {
      sendJson(res, 400, { ok: false, message: "Missing patient account." });
      return;
    }

    const messageText = rawMessage || (attachments.length ? "Please review the uploaded files and help me analyze them." : "");
    if (!messageText) {
      sendJson(res, 400, { ok: false, message: "Please enter a question or upload an attachment before sending." });
      return;
    }

    const config = loadAiConfig();
    if (!config.apiBaseUrl || !config.model || !config.apiKey) {
      sendJson(res, 400, { ok: false, message: "The doctor-side AI configuration is not complete yet." });
      return;
    }

    const store = loadChatStore();
    const conversations = getConversationsForUser(store, username);
    let conversation = conversations.find((item) => item.id === body.conversationId);
    if (!conversation) {
      conversation = normalizeConversation({
        id: createId("conv"),
        title: createConversationTitle(messageText, mode),
        mode,
        messages: [],
      });
      conversations.unshift(conversation);
    }

    const searchResults =
      config.enableWebSearch && mode === "deep"
        ? await searchWeb(messageText, Number(config.maxWebResults) || DEFAULT_AI_CONFIG.maxWebResults).catch(() => [])
        : [];

    const answerText = await requestModelAnswer({
      config,
      username,
      conversation,
      mode,
      messageText,
      attachments,
      searchResults,
    });

    const timestamp = nowIsoString();
    const userMessage = {
      id: createId("msg"),
      role: "user",
      text: messageText,
      createdAt: timestamp,
      attachments,
    };
    const assistantMessage = {
      id: createId("msg"),
      role: "assistant",
      text: answerText,
      createdAt: nowIsoString(),
      sources: searchResults,
      mode,
    };

    conversation.mode = mode;
    conversation.updatedAt = assistantMessage.createdAt;
    conversation.title = conversation.messages.length ? conversation.title : createConversationTitle(messageText, mode);
    conversation.messages = [...conversation.messages, userMessage, assistantMessage];

    saveConversationsForUser(store, username, conversations);
    saveChatStore(store);

    sendJson(res, 200, {
      ok: true,
      conversation,
      conversations: getConversationsForUser(store, username),
    });
  } catch (error) {
    sendJson(res, 502, { ok: false, message: error.message || "AI consultation request failed." });
  }
}

ACCOUNTS.doctor.name = "张明炜";
ACCOUNTS.patient.name = "陈丽";
DEFAULT_AI_CONFIG.providerName = "OpenAI \u517c\u5bb9\u63a5\u53e3";
DEFAULT_AI_CONFIG.systemPrompt =
  "";

DEFAULT_AI_CONFIG.systemPrompt =
  "\u4f60\u662f\u5934\u9888\u80bf\u7624\u653e\u7597\u51b3\u7b56\u4e0e\u9884\u540e\u7ba1\u7406\u4e00\u7ad9\u5f0f\u5e73\u53f0 AI \u52a9\u624b\u3002\u4f60\u7684\u56de\u7b54\u53ea\u80fd\u4f5c\u4e3a\u7ebf\u4e0a\u5206\u6790\u548c\u533b\u7597\u4fe1\u606f\u53c2\u8003\uff0c\u4e0d\u80fd\u66ff\u4ee3\u6267\u4e1a\u533b\u751f\u7684\u9762\u8bca\u3001\u68c0\u67e5\u3001\u75c5\u7406\u590d\u6838\u548c MDT \u6b63\u5f0f\u7ed3\u8bba\u3002\u9762\u5bf9\u4e0d\u786e\u5b9a\u4fe1\u606f\u65f6\u5fc5\u987b\u660e\u786e\u8bf4\u660e\uff0c\u5bf9\u6025\u5371\u91cd\u75c7\u5f81\u8c61\u5fc5\u987b\u4f18\u5148\u63d0\u793a\u7acb\u5373\u7ebf\u4e0b\u5c31\u533b\u6216\u6025\u8bca\u5904\u7406\u3002";

normalizeConversation = function (conversation) {
  return {
    id: conversation.id || createId("conv"),
    title: conversation.title || "New conversation",
    mode: conversation.mode || "health",
    createdAt: conversation.createdAt || nowIsoString(),
    updatedAt: conversation.updatedAt || nowIsoString(),
    messages: Array.isArray(conversation.messages) ? conversation.messages : [],
  };
};

buildPatientContext = function (patient) {
  if (!patient) {
    return "No structured patient profile was found.";
  }

  const latestReport = Array.isArray(patient.reports) && patient.reports.length ? patient.reports[0] : null;
  const latestAppointment = Array.isArray(patient.appointments) && patient.appointments.length ? patient.appointments[0] : null;

  return [
    `Current patient: ${patient.name || "Unnamed patient"}`, 
    `Gender/Age: ${patient.gender || "-"} / ${patient.age || "-"}`, 
    `Phone: ${patient.phone || "-"}`, 
    `Last visit: ${patient.lastVisit || "-"}`, 
    `Current status: ${patient.status || "-"}`, 
    `History: ${patient.history || "-"}`, 
    `Current diagnosis: ${patient.diagnosis || "-"}`, 
    `Latest appointment: ${latestAppointment ? `${latestAppointment.date}, ${latestAppointment.department}, ${latestAppointment.status}` : "None"}`, 
    `Latest report: ${latestReport ? `${latestReport.name}, ${latestReport.date}, ${latestReport.result}, ${latestReport.summary}` : "None"}`, 
  ].join("\n");
};

summarizeSearchResults = function (results) {
  if (!results.length) {
    return "Web search: no usable results were returned.";
  }
  return results
    .map((item, index) => `${index + 1}. ${item.title}\nLink: ${item.url}\nSummary: ${item.snippet || "No summary"}`)
    .join("\n\n");
};

createConversationTitle = function (message, mode) {
  const cleaned = String(message || "").replace(/\s+/g, " ").trim();
  if (cleaned) {
    return cleaned.length > 18 ? `${cleaned.slice(0, 18)}...` : cleaned;
  }
  const modeLabels = {
    deep: "Deep review",
    health: "Health consult",
    report: "Report review",
    medication: "Medication guide",
  };
  return modeLabels[mode] || "New conversation";
};
getModeInstruction = function (mode) {
  switch (mode) {
    case "deep":
      return "Provide a deeper clinical explanation using the structured patient profile, uploaded files, and any available web results.";
    case "report":
      return "Prioritize interpreting uploaded reports or test results, explain the key findings, and note what still needs clinician confirmation.";
    case "medication":
      return "Focus on medication safety, usage precautions, and when the patient should seek in-person care. Do not invent prescriptions or dosages.";
    default:
      return "Give a practical health answer grounded in the patient context, clearly flag uncertainty, and avoid overclaiming.";
  }
};
getTextFileContent = function (filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();
  const isText =
    String(mimeType || "").startsWith("text/") ||
    [".txt", ".md", ".json", ".csv", ".xml", ".html", ".js", ".ts"].includes(ext);

  if (!isText) {
    return "";
  }

  const content = fs.readFileSync(filePath, "utf8");
  return content.length > 12000 ? `${content.slice(0, 12000)}\n\n[Content truncated]` : content;
};
buildHistoryMessages = function (messages) {
  return messages.slice(-10).map((item) => {
    const attachmentText = Array.isArray(item.attachments) && item.attachments.length
      ? `\nAttachments: ${item.attachments.map((attachment) => attachment.originalName).join(", ")}`
      : "";
    return {
      role: item.role,
      content: `${item.text || ""}${attachmentText}`.trim(),
    };
  });
};
buildCurrentUserContent = function (messageText, attachments) {
  const parts = [];
  const textSegments = [messageText];
  const imageParts = [];

  attachments.forEach((attachment) => {
    const filePath = path.join(UPLOAD_DIR, attachment.storedName);
    if (!fs.existsSync(filePath)) {
      return;
    }

    if (String(attachment.mimeType || "").startsWith("image/")) {
      const base64 = fs.readFileSync(filePath).toString("base64");
      imageParts.push({
        type: "image_url",
        image_url: {
          url: `data:${attachment.mimeType};base64,${base64}`,
        },
      });
      textSegments.push(`Uploaded image: ${attachment.originalName}`);
      return;
    }

    const textContent = getTextFileContent(filePath, attachment.mimeType);
    if (textContent) {
      textSegments.push(`Attachment \"${attachment.originalName}\" content:\n${textContent}`);
      return;
    }

    textSegments.push(`Uploaded file: ${attachment.originalName} (${attachment.mimeType || "unknown type"}, ${attachment.size || 0} bytes)`);
  });

  parts.push({
    type: "text",
    text: textSegments.filter(Boolean).join("\n\n"),
  });

  return [...parts, ...imageParts];
};
const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const { pathname, searchParams } = requestUrl;

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, { ok: true, time: nowIsoString() });
    return;
  }

  if (req.method === "GET" && pathname === "/api/session") {
    const session = requireSession(req, res);
    if (!session) {
      return;
    }
    sendJson(res, 200, { ok: true, ...serializeSession(session) });
    return;
  }

  if (req.method === "POST" && pathname === "/api/login") {
    try {
      const body = parseJsonBody(await readBody(req));
      const account = ACCOUNTS[body.role];
      if (!account || account.username !== body.username || account.password !== body.password) {
        sendJson(res, 401, { ok: false, message: "Incorrect username or password." });
        return;
      }
      const session = createSession({ role: body.role, username: body.username, name: account.name }, Boolean(body.persistent));
      sendJson(res, 200, {
        ok: true,
        role: body.role,
        username: body.username,
        name: account.name,
      }, { "Set-Cookie": buildSessionCookie(session.token, session.persistent) });
    } catch (error) {
      sendJson(res, 400, { ok: false, message: "Invalid request payload." });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/logout") {
    destroySession(req);
    sendJson(res, 200, { ok: true }, { "Set-Cookie": buildExpiredSessionCookie() });
    return;
  }

  if (req.method === "POST" && pathname === "/api/appointments/quick-followup") {
    try {
      const session = requireSession(req, res);
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleQuickFollowupReservation(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "一键预约复诊失败。" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/escort-requests/save") {
    try {
      const session = requireSession(req, res);
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleEscortRequestSave(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "陪诊申请保存失败。" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/escort-requests/status") {
    try {
      const session = requireSession(req, res);
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleEscortRequestStatus(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "陪诊状态更新失败。" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/escort-staff-schedules/save") {
    try {
      const session = requireSession(req, res);
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleEscortStaffScheduleSave(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "陪诊排班保存失败。" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/escort-requests/confirm") {
    try {
      const session = requireSession(req, res);
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleEscortRequestConfirm(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "服务确认单提交失败。" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/escort-requests/convert-followup") {
    try {
      const session = requireSession(req, res);
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleEscortConvertFollowup(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "转成复诊提醒失败。" });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/api/data") {
    try {
      const session = requireSession(req, res);
      if (!session) {
        return;
      }
      const data = loadAppData();
      sendJson(res, 200, {
        ok: true,
        data: session.role === "doctor" ? data : getPatientScopedData(data, session.username),
      });
    } catch (error) {
      sendJson(res, 500, { ok: false, message: "Failed to load shared app data." });
    }
    return;
  }

  if (req.method === "PUT" && pathname === "/api/data") {
    try {
      const session = requireSession(req, res);
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      const data = body && typeof body === "object" && !Array.isArray(body) && body.data ? body.data : body;
      if (!isValidAppData(data)) {
        sendJson(res, 400, { ok: false, message: "Shared app data has an invalid structure." });
        return;
      }
      const currentData = loadAppData();
      const nextData = session.role === "patient" ? validatePatientScopedData(currentData, data, session.username) : data;
      saveAppData(nextData);
      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, 500, { ok: false, message: error instanceof Error && error.message ? error.message : "Failed to save shared app data." });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/mall/purchase") {
    try {
      const session = requireSession(req, res, "patient");
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleMallPurchase(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "商城下单失败。" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/mall/product/save") {
    try {
      const session = requireSession(req, res, "doctor");
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleMallProductSave(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "商品保存失败。" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/mall/product/delete") {
    try {
      const session = requireSession(req, res, "doctor");
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleMallProductDelete(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "商品删除失败。" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/mall/cart/add") {
    try {
      const session = requireSession(req, res, "patient");
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleMallCartAdd(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "加入购物车失败。" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/mall/cart/update") {
    try {
      const session = requireSession(req, res, "patient");
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleMallCartUpdate(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "购物车更新失败。" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/mall/cart/remove") {
    try {
      const session = requireSession(req, res, "patient");
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleMallCartRemove(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "购物车移除失败。" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/mall/address/save") {
    try {
      const session = requireSession(req, res, "patient");
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleMallAddressSave(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "地址保存失败。" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/mall/address/delete") {
    try {
      const session = requireSession(req, res, "patient");
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleMallAddressDelete(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "地址删除失败。" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/mall/checkout") {
    try {
      const session = requireSession(req, res, "patient");
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleMallCheckout(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "结算失败。" });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/mall/order/status") {
    try {
      const session = requireSession(req, res);
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      handleMallOrderStatus(req, res, session, body);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : "订单状态更新失败。" });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/api/ai/config") {
    const session = requireSession(req, res);
    if (!session) {
      return;
    }
    sendJson(res, 200, { ok: true, config: serializeAiConfig(loadAiConfig()) });
    return;
  }

  if (req.method === "PUT" && pathname === "/api/ai/config") {
    try {
      const session = requireSession(req, res, "doctor");
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      const currentConfig = loadAiConfig();
      saveAiConfig({
        providerName: String(body.providerName || DEFAULT_AI_CONFIG.providerName).trim(),
        apiBaseUrl: String(body.apiBaseUrl || "").trim(),
        model: String(body.model || "").trim(),
        apiKey: String(body.apiKey || "").trim() || currentConfig.apiKey || "",
        enableWebSearch: Boolean(body.enableWebSearch),
        maxWebResults: Math.max(1, Math.min(8, Number(body.maxWebResults || DEFAULT_AI_CONFIG.maxWebResults))),
        systemPrompt: String(body.systemPrompt || DEFAULT_AI_CONFIG.systemPrompt).trim(),
      });
      sendJson(res, 200, { ok: true, config: serializeAiConfig(loadAiConfig()) });
    } catch (error) {
      sendJson(res, 400, { ok: false, message: "Failed to save AI configuration." });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/api/ai/conversations") {
    const session = requireSession(req, res);
    if (!session) {
      return;
    }
    const username = session.username;
    if (!username) {
        sendJson(res, 400, { ok: false, message: "Missing account identifier." });
      return;
    }

    const store = loadChatStore();
    sendJson(res, 200, {
      ok: true,
      conversations: getConversationsForUser(store, username),
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/ai/conversations") {
    try {
      const session = requireSession(req, res);
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      const username = session.username;
      const mode = String(body.mode || "health").trim();
      if (!username) {
          sendJson(res, 400, { ok: false, message: "Missing patient account." });
        return;
      }

      const store = loadChatStore();
      const conversations = getConversationsForUser(store, username);
      const conversation = normalizeConversation({
        id: createId("conv"),
        title: body.title ? String(body.title).trim() : createConversationTitle("", mode),
        mode,
        messages: [],
      });
      conversations.unshift(conversation);
      saveConversationsForUser(store, username, conversations);
      saveChatStore(store);
      sendJson(res, 200, { ok: true, conversation, conversations: getConversationsForUser(store, username) });
    } catch (error) {
      sendJson(res, 400, { ok: false, message: "Failed to create a new conversation." });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/ai/conversations/delete") {
    try {
      const session = requireSession(req, res);
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      const username = session.username;
      const conversationId = String(body.conversationId || "").trim();
      if (!username || !conversationId) {
          sendJson(res, 400, { ok: false, message: "Missing required parameters." });
        return;
      }

      const store = loadChatStore();
      const conversations = getConversationsForUser(store, username).filter((item) => item.id !== conversationId);
      saveConversationsForUser(store, username, conversations);
      saveChatStore(store);
      sendJson(res, 200, { ok: true, conversations: getConversationsForUser(store, username) });
    } catch (error) {
      sendJson(res, 400, { ok: false, message: "Failed to delete the conversation." });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/api/radiotherapy-decision/examples") {
    const session = requireSession(req, res, "doctor");
    if (!session) {
      return;
    }
    sendJson(res, 200, {
      ok: true,
      examples: RADIOTHERAPY_DEMO_CASES,
      summary: buildRadiotherapyExamplesSummary(),
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/radiotherapy-decision/analyze") {
    try {
      const session = requireSession(req, res, "doctor");
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      const text = String(body.text || "").trim();
      if (!text) {
          sendJson(res, 400, { ok: false, message: "Please enter a discharge summary or select a demo case." });
        return;
      }
      const analysis = await analyzeRadiotherapyWithAi(text, String(body.caseId || "").trim());
      sendJson(res, 200, { ok: true, analysis });
    } catch (error) {
      sendJson(res, 400, { ok: false, message: "Radiotherapy indication analysis failed." });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/radiotherapy-decision/generate-case") {
    try {
      const session = requireSession(req, res, "doctor");
      if (!session) {
        return;
      }
      const body = parseJsonBody(await readBody(req));
      const target = String(body.target || "").trim().toLowerCase();
      const summaryText = await generateRadiotherapyCaseWithAi(target);
      sendJson(res, 200, { ok: true, summaryText, target });
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error.message || "AI demo discharge summary generation failed." });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/uploads") {
    const session = requireSession(req, res);
    if (!session) {
      return;
    }
    await handleUpload(req, res);
    return;
  }

  if (req.method === "POST" && pathname === "/api/ai/chat") {
    const session = requireSession(req, res);
    if (!session) {
      return;
    }
    await handleAiChat(req, res, session);
    return;
  }

  if (req.method === "GET" && pathname === "/api/radiomics-prognosis") {
    const session = requireSession(req, res, "doctor");
    if (!session) {
      return;
    }
    const payload = loadRadiomicsPrognosis();
    sendJson(res, 200, { ok: true, ...payload });
    return;
  }

  const radiomicsImage = req.method === "GET"
    ? pathname.match(/^\/api\/radiomics-prognosis\/(mri-preview|zscore)\/([A-Za-z0-9_.-]+\.png)$/)
    : null;
  if (radiomicsImage) {
    const session = requireSession(req, res, "doctor");
    if (!session) {
      return;
    }
    const imagePath = path.join(ROOT, "radiomics-images", radiomicsImage[1], radiomicsImage[2]);
    serveStaticFile(res, imagePath);
    return;
  }

  if (pathname.startsWith("/doctor-tool-proxy/")) {
    const handled = await handleDoctorToolProxy(req, res, pathname, searchParams);
    if (handled) {
      return;
    }
  }

  serveStatic(req, res, pathname);
});

ensureDir(UPLOAD_DIR);
ensureJsonFile(DATA_FILE, DEFAULT_APP_DATA);
ensureJsonFile(AI_CONFIG_FILE, DEFAULT_AI_CONFIG);
ensureJsonFile(AI_CHATS_FILE, DEFAULT_CHAT_STORE);

process.once("SIGINT", () => {
  shutdownDoctorToolServices();
  process.exit(0);
});

process.once("SIGTERM", () => {
  shutdownDoctorToolServices();
  process.exit(0);
});

process.once("exit", shutdownDoctorToolServices);

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
  ensureDoctorToolServicesStarted().catch((error) => {
    console.warn(`[doctor-tool] Failed to start doctor tools: ${error instanceof Error ? error.message : String(error)}`);
  });
});

