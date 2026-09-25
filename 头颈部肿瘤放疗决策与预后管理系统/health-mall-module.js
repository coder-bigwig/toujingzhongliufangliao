
(() => {
  const MODULE_KEY = "healthMall";
  const PRODUCT_STATUS = { LISTED: "listed", UNLISTED: "unlisted" };
  const ORDER_STATUS = { PENDING: "pending_shipment", SHIPPED: "shipped", COMPLETED: "completed" };
  const ORDER_FILTERS = ["全部", "待发货", "已发货", "已完成"];
  const LOGISTICS = ["顺丰速运", "京东快递", "德邦快递", "中通快递", "圆通速递"];
  const STATUS_LABELS = {
    [PRODUCT_STATUS.LISTED]: "上架中",
    [PRODUCT_STATUS.UNLISTED]: "已下架",
    [ORDER_STATUS.PENDING]: "待发货",
    [ORDER_STATUS.SHIPPED]: "已发货",
    [ORDER_STATUS.COMPLETED]: "已完成",
  };
  const mallState = {
    doctorTab: "products",
    patientTab: "catalog",
    doctorKeyword: "",
    patientKeyword: "",
    doctorCategory: "全部",
    patientCategory: "全部",
    doctorOrderStatus: "全部",
    patientOrderStatus: "全部",
  };

  const insertModule = (role, moduleConfig, afterKey) => {
    const modules = appViews[role].modules;
    const existing = modules.findIndex((item) => item.key === moduleConfig.key);
    const anchor = modules.findIndex((item) => item.key === afterKey);
    if (existing >= 0) {
      modules.splice(existing, 1, moduleConfig);
      return;
    }
    modules.splice(anchor >= 0 ? anchor + 1 : modules.length, 0, moduleConfig);
  };

  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : fallback;
  };
  const int = (value, fallback = 0, minimum = 0) => {
    const parsed = Number.parseInt(String(value ?? fallback), 10);
    return Number.isFinite(parsed) ? Math.max(minimum, parsed) : minimum;
  };
  const tagList = (value) => Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : [];
  const imageList = (value) => Array.isArray(value)
    ? value.map((item) => typeof item === "string" ? item : item?.url).map((item) => String(item || "").trim()).filter(Boolean).slice(0, 8)
    : [];
  const productStatus = (value) => (value === PRODUCT_STATUS.UNLISTED || value === "下架" || value === "已下架" ? PRODUCT_STATUS.UNLISTED : PRODUCT_STATUS.LISTED);
  const orderStatus = (value) => {
    if (value === ORDER_STATUS.SHIPPED || value === "已发货") return ORDER_STATUS.SHIPPED;
    if (value === ORDER_STATUS.COMPLETED || value === "已完成") return ORDER_STATUS.COMPLETED;
    return ORDER_STATUS.PENDING;
  };
  const statusText = (value) => STATUS_LABELS[value] || value || "-";
  const statusClass = (value) => {
    if (value === PRODUCT_STATUS.LISTED || value === ORDER_STATUS.COMPLETED) return "success";
    if (value === ORDER_STATUS.PENDING) return "warning";
    if (value === ORDER_STATUS.SHIPPED) return "info";
    return "neutral";
  };
  const money = (value) => `¥${num(value).toFixed(2)}`;

  const normalizeProduct = (product = {}) => {
    const images = imageList(product.images);
    const coverImage = String(product.coverImage || images[0] || "").trim();
    return {
      id: String(product.id || "").trim(),
      skuCode: String(product.skuCode || product.id || "").trim(),
      name: String(product.name || "").trim(),
      brand: String(product.brand || product.coverTone || product.category || "").trim(),
      storeName: String(product.storeName || "").trim(),
      originLabel: String(product.originLabel || "").trim(),
      shippingLabel: String(product.shippingLabel || "").trim(),
      promoText: String(product.promoText || "").trim(),
      category: String(product.category || "健康支持").trim(),
      unit: String(product.unit || "件").trim(),
      price: num(product.price),
      originalPrice: num(product.originalPrice ?? product.price),
      stock: int(product.stock, 0, 0),
      sales: int(product.sales, 0, 0),
      lowStockThreshold: int(product.lowStockThreshold, 5, 0),
      status: productStatus(product.status),
      summary: String(product.summary || "").trim(),
      description: String(product.description || "").trim(),
      tags: tagList(product.tags),
      featured: Boolean(product.featured),
      coverTone: String(product.coverTone || product.category || "健康").trim(),
      coverImage,
      images,
      createdAt: String(product.createdAt || "").trim(),
      updatedAt: String(product.updatedAt || product.createdAt || "").trim(),
    };
  };

  const normalizeOrderItem = (item = {}) => {
    const quantity = int(item.quantity, 1, 1);
    const unitPrice = num(item.unitPrice);
    return {
      id: String(item.id || "").trim(),
      productId: String(item.productId || "").trim(),
      skuCode: String(item.skuCode || item.productId || "").trim(),
      productName: String(item.productName || "").trim(),
      category: String(item.category || item.productCategory || "").trim(),
      unit: String(item.unit || "件").trim(),
      unitPrice,
      quantity,
      subtotal: num(item.subtotal ?? unitPrice * quantity),
    };
  };

  const normalizeOrder = (order = {}) => {
    const items = (Array.isArray(order.items) && order.items.length ? order.items : [{
      id: String(order.productId || "").trim(),
      productId: String(order.productId || "").trim(),
      skuCode: String(order.productId || "").trim(),
      productName: String(order.productName || "").trim(),
      category: String(order.productCategory || "").trim(),
      unit: String(order.unit || "件").trim(),
      unitPrice: num(order.unitPrice),
      quantity: int(order.quantity, 1, 1),
      subtotal: num(order.totalPrice ?? (num(order.unitPrice) * int(order.quantity, 1, 1))),
    }]).map(normalizeOrderItem).filter((entry) => entry.productId || entry.productName);
    const first = items[0] || normalizeOrderItem();
    return {
      id: String(order.id || "").trim(),
      items,
      totalItems: items.reduce((sum, entry) => sum + entry.quantity, 0),
      totalPrice: num(order.totalPrice ?? items.reduce((sum, entry) => sum + entry.subtotal, 0)),
      patientId: String(order.patientId || "").trim(),
      patientUsername: String(order.patientUsername || "").trim(),
      patientName: String(order.patientName || "").trim(),
      addressId: String(order.addressId || "").trim(),
      contactName: String(order.contactName || "").trim(),
      contactPhone: String(order.contactPhone || "").trim(),
      address: String(order.address || "").trim(),
      note: String(order.note || "").trim(),
      logisticsCompany: String(order.logisticsCompany || "").trim(),
      trackingNumber: String(order.trackingNumber || "").trim(),
      fulfillmentNote: String(order.fulfillmentNote || "").trim(),
      status: orderStatus(order.status),
      createdAt: String(order.createdAt || "").trim(),
      updatedAt: String(order.updatedAt || order.createdAt || "").trim(),
      productId: first.productId,
      productName: first.productName,
      productCategory: first.category,
      unitPrice: first.unitPrice,
      quantity: items.reduce((sum, entry) => sum + entry.quantity, 0),
    };
  };

  const normalizeCartItem = (item = {}) => ({
    id: String(item.id || "").trim(),
    patientId: String(item.patientId || "").trim(),
    patientUsername: String(item.patientUsername || "").trim(),
    productId: String(item.productId || "").trim(),
    quantity: int(item.quantity, 1, 1),
    updatedAt: String(item.updatedAt || "").trim(),
  });

  const normalizeAddress = (address = {}) => {
    const addressLine = String(address.addressLine || address.address || "").trim();
    return {
      id: String(address.id || "").trim(),
      patientId: String(address.patientId || "").trim(),
      patientUsername: String(address.patientUsername || "").trim(),
      receiverName: String(address.receiverName || address.contactName || "").trim(),
      receiverPhone: String(address.receiverPhone || address.contactPhone || "").trim(),
      tag: String(address.tag || "").trim(),
      addressLine,
      address: addressLine,
      isDefault: Boolean(address.isDefault),
      updatedAt: String(address.updatedAt || "").trim(),
    };
  };

  DEFAULT_APP_DATA.products = Array.isArray(DEFAULT_APP_DATA.products) ? DEFAULT_APP_DATA.products : [];
  DEFAULT_APP_DATA.orders = Array.isArray(DEFAULT_APP_DATA.orders) ? DEFAULT_APP_DATA.orders : [];
  DEFAULT_APP_DATA.cartItems = Array.isArray(DEFAULT_APP_DATA.cartItems) ? DEFAULT_APP_DATA.cartItems : [];
  DEFAULT_APP_DATA.addresses = Array.isArray(DEFAULT_APP_DATA.addresses) ? DEFAULT_APP_DATA.addresses : [];

  const baseNormalizeAppData = normalizeAppData;
  normalizeAppData = (value) => {
    const base = baseNormalizeAppData(value);
    return {
      ...base,
      products: Array.isArray(value?.products) ? value.products.map(normalizeProduct) : cloneData(DEFAULT_APP_DATA.products),
      orders: Array.isArray(value?.orders) ? value.orders.map(normalizeOrder) : cloneData(DEFAULT_APP_DATA.orders),
      cartItems: Array.isArray(value?.cartItems) ? value.cartItems.map(normalizeCartItem) : cloneData(DEFAULT_APP_DATA.cartItems),
      addresses: Array.isArray(value?.addresses) ? value.addresses.map(normalizeAddress) : cloneData(DEFAULT_APP_DATA.addresses),
    };
  };

  const syncMallData = (value) => {
    appData = normalizeAppData(value || DEFAULT_APP_DATA);
    dataSnapshot = JSON.stringify(appData);
    localStorage.setItem(DATA_STORAGE_KEY, dataSnapshot);
  };

  syncMallData(appData || DEFAULT_APP_DATA);
  insertModule("doctor", { key: MODULE_KEY, icon: "购", title: "健康商城", desc: "商品、库存与履约管理", actionText: "新增商品" }, "healthManuals");
  insertModule("patient", { key: MODULE_KEY, icon: "购", title: "健康商城", desc: "商品浏览、下单与订单查询", actionText: "去结算" }, "healthManuals");

  const getKeyword = (role) => (role === "doctor" ? mallState.doctorKeyword : mallState.patientKeyword).trim().toLowerCase();
  const getCategory = (role) => (role === "doctor" ? mallState.doctorCategory : mallState.patientCategory);
  const getOrderFilter = (role) => (role === "doctor" ? mallState.doctorOrderStatus : mallState.patientOrderStatus);
  const filterStatus = (label) => ({ 待发货: ORDER_STATUS.PENDING, 已发货: ORDER_STATUS.SHIPPED, 已完成: ORDER_STATUS.COMPLETED }[label] || "");

  const getCategories = (role) => {
    const source = role === "doctor" ? appData.products : appData.products.filter((item) => productStatus(item.status) === PRODUCT_STATUS.LISTED);
    return ["全部", ...new Set(source.map((item) => item.category).filter(Boolean))];
  };

  const getProducts = (role) => {
    const source = role === "doctor" ? appData.products : appData.products.filter((item) => productStatus(item.status) === PRODUCT_STATUS.LISTED);
    const keyword = getKeyword(role);
    const category = getCategory(role);
    return [...source].filter((item) => {
      if (category !== "全部" && item.category !== category) return false;
      if (!keyword) return true;
      const haystack = [item.name, item.skuCode, item.category, item.summary, item.description, ...(item.tags || [])].join(" ").toLowerCase();
      return haystack.includes(keyword);
    }).sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || getTimestamp(b.updatedAt) - getTimestamp(a.updatedAt));
  };

  const getOrders = (role) => {
    const source = role === "doctor" ? appData.orders : appData.orders.filter((item) => item.patientUsername === currentUsername);
    const keyword = getKeyword(role);
    const expected = filterStatus(getOrderFilter(role));
    return [...source].filter((item) => {
      if (expected && orderStatus(item.status) !== expected) return false;
      if (!keyword) return true;
      const haystack = [item.id, item.patientName, item.contactName, item.address, item.logisticsCompany, item.trackingNumber, ...item.items.map((entry) => `${entry.productName} ${entry.skuCode}`)].join(" ").toLowerCase();
      return haystack.includes(keyword);
    }).sort((a, b) => (role === "doctor" ? Number(orderStatus(b.status) === ORDER_STATUS.PENDING) - Number(orderStatus(a.status) === ORDER_STATUS.PENDING) : 0) || getTimestamp(b.createdAt) - getTimestamp(a.createdAt));
  };

  const getAddresses = () => [...appData.addresses].filter((item) => item.patientUsername === currentUsername).sort((a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)) || getTimestamp(b.updatedAt) - getTimestamp(a.updatedAt));
  const getDefaultAddress = () => getAddresses().find((item) => item.isDefault) || getAddresses()[0] || null;
  const getCartItems = () => {
    const productMap = new Map(appData.products.map((item) => [item.id, normalizeProduct(item)]));
    return [...appData.cartItems].filter((item) => item.patientUsername === currentUsername).map((item) => {
      const product = productMap.get(item.productId) || null;
      let issue = "";
      if (!product) issue = "商品已不存在";
      else if (productStatus(product.status) !== PRODUCT_STATUS.LISTED) issue = "商品已下架";
      else if (product.stock < item.quantity) issue = `库存仅剩 ${product.stock}${product.unit || "件"}`;
      return { ...item, product, issue, available: !issue, subtotal: product ? num(product.price * item.quantity) : 0 };
    }).sort((a, b) => getTimestamp(b.updatedAt) - getTimestamp(a.updatedAt));
  };
  const getCartSummary = () => getCartItems().reduce((sum, item) => ({ count: sum.count + item.quantity, total: sum.total + item.subtotal }), { count: 0, total: 0 });
  const lowStockCount = () => appData.products.filter((item) => item.stock <= item.lowStockThreshold).length;
  const doctorPendingCount = () => appData.orders.filter((item) => orderStatus(item.status) === ORDER_STATUS.PENDING).length;
  const patientShippedCount = () => appData.orders.filter((item) => item.patientUsername === currentUsername && orderStatus(item.status) === ORDER_STATUS.SHIPPED).length;

  const createProductDraft = (payload = null) => {
    const product = normalizeProduct(payload || {});
    return {
      coverImage: product.coverImage || "",
      images: [...product.images],
      uploading: false,
    };
  };
  const ensureProductDraft = () => {
    if (!modalState || modalState.type !== "mall-product") return null;
    modalState.draft = modalState.draft || createProductDraft(modalState.payload);
    return modalState.draft;
  };
  const uploadMallFilesToServer = async (fileList) => {
    if (typeof uploadFilesToServer === "function") {
      return uploadFilesToServer(fileList);
    }
    const readBase64 = typeof readFileAsBase64 === "function"
      ? readFileAsBase64
      : (file) => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = String(reader.result || "");
            resolve(result.includes(",") ? result.split(",")[1] : result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
    const files = await Promise.all(fileList.map(async (file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      base64: await readBase64(file),
    })));
    const payload = await requestJson("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
    });
    return Array.isArray(payload.files) ? payload.files : [];
  };
  const uploadMallProductImages = async (fileList, kind = "gallery") => {
    if (!fileList.length || modalState?.type !== "mall-product") return;
    const draft = ensureProductDraft();
    if (!draft) return;
    draft.uploading = true;
    renderModal();
    modalOverlay.hidden = false;
    try {
      const uploadedFiles = (await uploadMallFilesToServer(fileList)).filter((item) => String(item.mimeType || "").startsWith("image/"));
      if (!uploadedFiles.length) {
        setAppNotice("仅支持上传图片文件。", "error");
        return;
      }
      const urls = uploadedFiles.map((item) => String(item.url || "").trim()).filter(Boolean);
      if (kind === "cover") {
        draft.coverImage = urls[0] || draft.coverImage;
        setAppNotice("商品封面已上传。", "success");
      } else {
        draft.images = [...imageList(draft.images), ...urls].slice(0, 8);
        if (!draft.coverImage && draft.images[0]) {
          draft.coverImage = draft.images[0];
        }
        setAppNotice(`已上传 ${urls.length} 张商品图片。`, "success");
      }
    } catch (error) {
      setAppNotice(error.message || "商品图片上传失败。", "error");
    } finally {
      draft.uploading = false;
      renderModal();
      modalOverlay.hidden = false;
    }
  };

  const requestMall = (url, body) => requestJson(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  const applyPayload = async (payload) => {
    if (payload?.data) return syncMallData(payload.data);
    if (typeof pullAppDataFromServer === "function") await pullAppDataFromServer({ rerender: false, silent: true });
  };
  const runAction = async (runner, message, options = {}) => {
    const { close = true, rerender = true } = options;
    try {
      const payload = await runner();
      await applyPayload(payload);
      if (close) closeModal();
      if (rerender) renderApp();
      if (message) setAppNotice(message, "success");
      return payload;
    } catch (error) {
      setAppNotice(error.message || "商城操作失败，请稍后重试。", "error");
      return null;
    }
  };

  const ensureAddress = () => {
    if (getAddresses().length) return true;
    mallState.patientTab = "addresses";
    renderApp();
    setAppNotice("请先新增收货地址，再提交订单。", "error");
    return false;
  };
  const clampText = (value, max = 16) => {
    const text = String(value || "").trim();
    return text.length > max ? `${text.slice(0, max)}…` : text;
  };
  const getProductDisplayMeta = (product) => {
    const normalized = normalizeProduct(product);
    const discount = Math.max(0, num(normalized.originalPrice - normalized.price));
    const brand = normalized.brand || normalized.coverTone || normalized.category || "院内康复";
    const storeName = normalized.storeName || `${brand}院内专区`;
    const originLabel = normalized.originLabel || (normalized.featured ? "院内甄选" : (normalized.category || "康复支持"));
    const shippingLabel = normalized.shippingLabel || (normalized.stock <= 0
      ? "当前补货中"
      : normalized.stock <= normalized.lowStockThreshold
        ? "少量现货，建议尽快下单"
        : "现货速配，支持物流跟踪");
    const promoText = normalized.promoText || (normalized.featured
      ? "院内推荐"
      : discount > 0
        ? `立减 ${money(discount)}`
        : (normalized.tags[0] || "康复支持"));
    const badges = [...new Set([
      normalized.category,
      originLabel,
      ...normalized.tags,
      normalized.stock <= normalized.lowStockThreshold ? "库存紧张" : "现货可发",
    ].filter(Boolean))].slice(0, 3);
    return {
      brand,
      storeName,
      originLabel,
      shippingLabel,
      promoText,
      badges,
      salesText: normalized.sales ? `已服务 ${normalized.sales} 人次` : "新上架",
      inventoryText: `库存 ${normalized.stock}${normalized.unit}`,
    };
  };
  const SERVICE_ICONS = {
    shipping: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v8H3z"/><path d="M14 10h3l3 3v2h-6z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/></svg>',
    origin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3.1 8.7-7 10-3.9-1.3-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    sku: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6v12"/><path d="M8 6v12"/><path d="M12 6v12"/><path d="M15 6v12"/><path d="M19 6v12"/></svg>',
    stock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8l8-4 8 4-8 4z"/><path d="M4 8v8l8 4 8-4V8"/><path d="M12 12v8"/></svg>',
  };
  const renderServiceItem = (iconKey, label, text) => `
    <div class="mall-service-item">
      <span class="mall-service-icon">${SERVICE_ICONS[iconKey] || SERVICE_ICONS.origin}</span>
      <span class="mall-service-copy"><small>${escapeHtml(label)}</small><strong>${escapeHtml(text)}</strong></span>
    </div>`;
  const renderStatus = (value) => `<span class="mall-status ${statusClass(value)}">${escapeHtml(statusText(value))}</span>`;
  const renderMetrics = (items) => `<div class="mall-metric-strip">${items.map((item) => `<article class="mall-metric-card"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(String(item.value))}</strong><small>${escapeHtml(item.tip || "")}</small></article>`).join("")}</div>`;
  const renderCategoryChips = (role) => {
    const selected = role === "doctor" ? mallState.doctorCategory : mallState.patientCategory;
    const action = role === "doctor" ? "set-doctor-category" : "set-patient-category";
    return `<div class="mall-chip-row">${getCategories(role).map((item) => `<button type="button" class="mall-chip${selected === item ? " active" : ""}" data-action="${action}" data-category="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("")}</div>`;
  };
  const PRODUCT_COVER_ILLUSTRATIONS = {
    support: '<svg viewBox="0 0 160 160" aria-hidden="true"><rect x="34" y="52" width="92" height="58" rx="24"></rect><path d="M52 82c8-10 18-15 28-15 11 0 21 5 28 15"></path><path d="M60 110v10M100 110v10"></path></svg>',
    monitor: '<svg viewBox="0 0 160 160" aria-hidden="true"><rect x="38" y="42" width="84" height="58" rx="16"></rect><path d="M52 78h15l10-15 14 27 9-12h10"></path><path d="M66 114h28"></path><path d="M80 100v14"></path></svg>',
    oral: '<svg viewBox="0 0 160 160" aria-hidden="true"><path d="M80 42c20 0 32 11 32 28 0 26-13 48-32 48S48 96 48 70c0-17 12-28 32-28z"></path><path d="M60 54c4 7 12 11 20 11s16-4 20-11"></path><path d="M102 98l24 24"></path><rect x="118" y="116" width="14" height="26" rx="7" transform="rotate(-45 125 129)"></rect></svg>',
    skin: '<svg viewBox="0 0 160 160" aria-hidden="true"><path d="M70 38h20v18l12 14v46c0 8-6 14-14 14H72c-8 0-14-6-14-14V70l12-14z"></path><path d="M70 56h20"></path><path d="M80 74v22"></path><path d="M94 86c10 0 18 8 18 18"></path></svg>',
    nutrition: '<svg viewBox="0 0 160 160" aria-hidden="true"><rect x="48" y="42" width="52" height="76" rx="16"></rect><path d="M62 42v-8h24v8"></path><path d="M62 74h24"></path><path d="M62 90h18"></path><path d="M110 90c8 2 14 8 16 16"></path></svg>',
    outing: '<svg viewBox="0 0 160 160" aria-hidden="true"><rect x="36" y="56" width="88" height="58" rx="18"></rect><path d="M60 56c0-12 8-20 20-20s20 8 20 20"></path><path d="M64 84h32"></path><path d="M108 86h8"></path></svg>',
    home: '<svg viewBox="0 0 160 160" aria-hidden="true"><path d="M40 74l40-30 40 30"></path><path d="M52 70v48h56V70"></path><path d="M72 118V88h16v30"></path><path d="M120 122c8 0 14-6 14-14 0-7-5-12-12-14"></path></svg>',
    generic: '<svg viewBox="0 0 160 160" aria-hidden="true"><rect x="42" y="42" width="76" height="76" rx="24"></rect><path d="M80 58v44"></path><path d="M58 80h44"></path><circle cx="118" cy="118" r="14"></circle></svg>',
  };
  const getProductCoverKey = (product) => {
    const normalized = normalizeProduct(product);
    const haystack = `${normalized.category} ${normalized.name} ${(normalized.tags || []).join(" ")}`.toLowerCase();
    if (/支撑|枕|训练/.test(haystack)) return "support";
    if (/监测|体温|血氧|血压|氧/.test(haystack)) return "monitor";
    if (/口|牙|黏膜|刷/.test(haystack)) return "oral";
    if (/喷雾|皮肤|护肤|唇/.test(haystack)) return "skin";
    if (/营养|蛋白|礼盒|补给/.test(haystack)) return "nutrition";
    if (/出行|步行|腰包|包/.test(haystack)) return "outing";
    if (/家庭|居家|家/.test(haystack)) return "home";
    return "generic";
  };
  const renderProductCoverIllustration = (product) => {
    const key = getProductCoverKey(product);
    return `<div class="mall-cover-illustration ${key}">${PRODUCT_COVER_ILLUSTRATIONS[key] || PRODUCT_COVER_ILLUSTRATIONS.generic}</div>`;
  };
  const renderProductVisual = (product, options = {}) => {
    const { compact = false, minimal = false, simple = false } = options;
    const normalized = normalizeProduct(product);
    const meta = getProductDisplayMeta(normalized);
    const image = normalized.coverImage || normalized.images[0] || "";
    const className = `mall-product-cover${compact ? " compact" : ""}${minimal ? " minimal" : ""}${simple ? " simple" : ""}${image ? " image" : " generated"}`;
    if (image) {
      if (minimal) {
        if (simple) {
          return `<div class="${className}"><img src="${escapeHtml(image)}" alt="${escapeHtml(normalized.name || normalized.category || "商品图片")}"></div>`;
        }
        return `<div class="${className}"><img src="${escapeHtml(image)}" alt="${escapeHtml(normalized.name || normalized.category || "商品图片")}"><div class="mall-poster-stack"><span class="mall-poster-badge">${escapeHtml(meta.originLabel)}</span>${meta.promoText ? `<span class="mall-poster-chip">${escapeHtml(meta.promoText)}</span>` : ""}</div></div>`;
      }
      return `<div class="${className}"><img src="${escapeHtml(image)}" alt="${escapeHtml(normalized.name || normalized.category || "商品图片")}"><span class="mall-poster-badge">${escapeHtml(meta.originLabel)}</span><div class="mall-product-cover-meta"><span>${escapeHtml(meta.brand)}</span><strong>${escapeHtml(normalized.name || normalized.category || "商品")}</strong><small>${escapeHtml(meta.shippingLabel)}</small></div></div>`;
    }
    if (minimal) {
      if (simple) {
        return `<div class="${className}"><div class="mall-generated-poster minimal simple">${renderProductCoverIllustration(normalized)}</div></div>`;
      }
      return `<div class="${className}"><div class="mall-generated-poster minimal"><div class="mall-poster-stack"><span class="mall-generated-kicker">${escapeHtml(meta.originLabel)}</span>${meta.promoText ? `<span class="mall-poster-chip">${escapeHtml(meta.promoText)}</span>` : ""}</div>${renderProductCoverIllustration(normalized)}<div class="mall-generated-minimal-copy"><small>${escapeHtml(meta.storeName || "院内专区")}</small><strong class="mall-generated-headline subtle">${escapeHtml(normalized.category || "健康支持")}</strong></div></div></div>`;
    }
    return `<div class="${className}"><div class="mall-generated-poster"><span class="mall-generated-kicker">${escapeHtml(meta.originLabel)}</span><strong class="mall-generated-headline">${escapeHtml(clampText(normalized.name || normalized.category, compact ? 12 : 18))}</strong><p class="mall-generated-summary">${escapeHtml(clampText(normalized.summary || normalized.description || meta.shippingLabel || normalized.category, compact ? 24 : 42))}</p><div class="mall-generated-footer"><span>${escapeHtml(meta.brand)}</span><span>${escapeHtml(normalized.category || "健康支持")}</span></div></div></div>`;
  };
  const formatDetailText = (value) => escapeHtml(String(value || "").trim() || "暂无详细说明").replace(/\r?\n/g, "<br>");
  const renderProductDraftImages = (draft) => {
    const images = imageList(draft?.images);
    if (!images.length) {
      return `<div class="mall-upload-empty">还没有详情图，病人端会优先展示封面图。建议补充 2-4 张商品细节图。</div>`;
    }
    return `<div class="mall-thumb-grid">${images.map((url, index) => `<article class="mall-thumb-card"><img src="${escapeHtml(url)}" alt="商品图片 ${index + 1}"><button type="button" class="danger-button" data-action="remove-product-image" data-index="${index}">移除</button></article>`).join("")}</div>`;
  };

  const renderProductCard = (product, role) => {
    const normalized = normalizeProduct(product);
    const meta = getProductDisplayMeta(normalized);
    const isLowStock = normalized.stock <= normalized.lowStockThreshold;
    if (role === "patient") {
      return `
        <article class="mall-product-card patient-simple${isLowStock ? " low-stock" : ""}" data-action="view-product" data-id="${normalized.id}" tabindex="0" role="button" aria-label="查看 ${escapeHtml(normalized.name)} 详情">
          ${renderProductVisual(normalized, { minimal: true, simple: true })}
          <div class="mall-product-body simple">
            <h3 class="mall-product-title">${escapeHtml(normalized.name)}</h3>
            <div class="mall-price-row simple"><div><strong>${escapeHtml(money(normalized.price))}</strong>${normalized.originalPrice > normalized.price ? `<span>${escapeHtml(money(normalized.originalPrice))}</span>` : ""}</div></div>
          </div>
        </article>`;
    }
    return `
      <article class="mall-product-card${isLowStock ? " low-stock" : ""}">
        <button type="button" class="mall-product-cover-trigger" data-action="view-product" data-id="${normalized.id}" aria-label="查看 ${escapeHtml(normalized.name)} 详情">
          ${renderProductVisual(normalized, { minimal: true })}
        </button>
        <div class="mall-product-body">
          ${role === "doctor" ? `<div class="mall-tag-row inline">${renderStatus(normalized.status)}${normalized.featured ? '<span class="mall-badge">院内推荐</span>' : ""}</div>` : ""}
          <h3 class="mall-product-title">${escapeHtml(normalized.name)}</h3>
          <p class="mall-summary tight">${escapeHtml(normalized.summary || normalized.description || meta.shippingLabel || "暂无商品说明")}</p>
          <div class="mall-price-row"><div><strong>${escapeHtml(money(normalized.price))}</strong>${normalized.originalPrice > normalized.price ? `<span>${escapeHtml(money(normalized.originalPrice))}</span>` : ""}</div><div class="mall-price-subline">${escapeHtml(meta.salesText)}</div></div>
          <div class="mall-service-row">
            ${role === "doctor"
              ? renderServiceItem("sku", "SKU", normalized.skuCode || "-")
              : renderServiceItem("shipping", "配送", meta.shippingLabel)}
            ${role === "doctor"
              ? renderServiceItem("stock", "库存", meta.inventoryText)
              : renderServiceItem("origin", "来源", normalized.originLabel || meta.originLabel || normalized.category)}
          </div>
          ${isLowStock ? `<div class="mall-inline-tip warning">库存接近预警线，当前剩余 ${escapeHtml(String(normalized.stock))}${escapeHtml(normalized.unit)}。</div>` : ""}
          <div class="mall-action-row">
            ${role === "doctor"
              ? `<button type="button" class="secondary-button" data-action="edit-product" data-id="${normalized.id}">编辑</button><button type="button" class="secondary-button" data-action="toggle-product" data-id="${normalized.id}">${productStatus(normalized.status) === PRODUCT_STATUS.LISTED ? "下架" : "上架"}</button>`
              : `<button type="button" class="secondary-button" data-action="add-cart" data-id="${normalized.id}" ${productStatus(normalized.status) !== PRODUCT_STATUS.LISTED || normalized.stock <= 0 ? "disabled" : ""}>加入购物车</button><button type="button" class="primary-action" data-action="buy-now" data-id="${normalized.id}" ${productStatus(normalized.status) !== PRODUCT_STATUS.LISTED || normalized.stock <= 0 ? "disabled" : ""}>立即购买</button>`}
          </div>
        </div>
      </article>`;
  };

  const renderOrderCard = (order, role) => `
    <article class="mall-order-card">
      <div class="mall-card-head"><div><span class="mall-order-id">订单号 ${escapeHtml(order.id)}</span><h3>${escapeHtml(role === "doctor" ? (order.patientName || order.contactName || "商城订单") : (order.contactName || order.patientName || "商城订单"))}</h3></div>${renderStatus(order.status)}</div>
      <div class="mall-order-items">${order.items.map((item) => `<span>${escapeHtml(item.productName)} × ${escapeHtml(String(item.quantity))}</span>`).join("")}</div>
      <div class="mall-order-grid"><div><span>下单时间</span><strong>${escapeHtml(formatDateTimeLabel(order.createdAt))}</strong></div><div><span>商品件数</span><strong>${escapeHtml(String(order.totalItems || order.quantity || 0))}</strong></div><div><span>订单金额</span><strong>${escapeHtml(money(order.totalPrice))}</strong></div><div><span>${role === "doctor" ? "收货人" : "收货地址"}</span><strong>${escapeHtml(role === "doctor" ? `${order.contactName} / ${order.contactPhone}` : (order.address || "-"))}</strong></div></div>
      <p class="mall-order-address">${escapeHtml(order.address || "暂无地址信息")}</p>
      ${order.logisticsCompany || order.trackingNumber ? `<div class="mall-inline-tip">物流信息：${escapeHtml([order.logisticsCompany, order.trackingNumber].filter(Boolean).join(" / "))}</div>` : ""}
      <div class="mall-action-row compact"><button type="button" class="secondary-button" data-action="view-order" data-id="${order.id}">查看详情</button>${role === "doctor" && orderStatus(order.status) === ORDER_STATUS.PENDING ? `<button type="button" class="primary-action" data-action="ship-order" data-id="${order.id}">发货录入</button>` : ""}${role === "doctor" && orderStatus(order.status) === ORDER_STATUS.SHIPPED ? `<button type="button" class="primary-action" data-action="complete-order" data-id="${order.id}">标记完成</button>` : ""}${role === "patient" && orderStatus(order.status) === ORDER_STATUS.SHIPPED ? `<button type="button" class="primary-action" data-action="confirm-order" data-id="${order.id}">确认收货</button>` : ""}</div>
    </article>`;

  const renderAddressCard = (address) => `
    <article class="mall-address-card">
      <div class="mall-card-head"><div><span class="mall-address-tag">${escapeHtml(address.tag || "收货地址")}</span><h3>${escapeHtml(address.receiverName)}</h3></div>${address.isDefault ? '<span class="mall-badge">默认地址</span>' : ""}</div>
      <p>${escapeHtml(address.receiverPhone)}</p>
      <p class="mall-address-line">${escapeHtml(address.addressLine)}</p>
      <div class="mall-action-row compact"><button type="button" class="secondary-button" data-action="edit-address" data-id="${address.id}">编辑</button>${address.isDefault ? "" : `<button type="button" class="secondary-button" data-action="set-default-address" data-id="${address.id}">设为默认</button>`}<button type="button" class="danger-button" data-action="delete-address" data-id="${address.id}">删除</button></div>
    </article>`;
  const renderAddressContextBanner = (address, context = "catalog") => {
    const pickerAction = context === "checkout" ? "checkout-open-address-picker" : "open-address-picker";
    const createAction = context === "checkout" ? "checkout-open-address" : "open-address";
    const hasAddress = Boolean(address);
    if (!hasAddress) {
      return `<div class="mall-context-banner warning interactive"><div class="mall-context-copy"><strong>还没有默认收货地址</strong><span>请先新增地址，后续下单时就能直接切换和选择。</span></div><div class="mall-context-actions"><button type="button" class="secondary-button" data-action="${createAction}">新增地址</button></div></div>`;
    }
    return `<div class="mall-context-banner interactive"><div class="mall-context-copy"><strong>默认收货</strong><span>${escapeHtml(address.receiverName)} / ${escapeHtml(address.receiverPhone)} / ${escapeHtml(address.addressLine)}</span></div><div class="mall-context-actions"><button type="button" class="secondary-button" data-action="${pickerAction}">切换地址</button><button type="button" class="secondary-button" data-action="${createAction}">新增地址</button></div></div>`;
  };
  const renderAddressPickerItem = (address) => `
    <article class="mall-address-switcher-item${address.isDefault ? " current" : ""}">
      <div class="mall-address-switcher-head">
        <div class="mall-tag-row inline"><span class="mall-address-tag">${escapeHtml(address.tag || "收货地址")}</span>${address.isDefault ? '<span class="mall-badge">当前默认</span>' : ""}</div>
        <div class="mall-address-switcher-actions">
          ${address.isDefault ? "" : `<button type="button" class="secondary-button" data-action="pick-default-address" data-id="${address.id}">设为默认</button>`}
          <button type="button" class="secondary-button" data-action="picker-edit-address" data-id="${address.id}">编辑</button>
        </div>
      </div>
      <div class="mall-address-switcher-copy">
        <strong>${escapeHtml(address.receiverName)} / ${escapeHtml(address.receiverPhone)}</strong>
        <p>${escapeHtml(address.addressLine)}</p>
      </div>
    </article>`;

  const renderCartCard = (item) => `
    <article class="mall-cart-card${item.available ? "" : " unavailable"}">
      <div class="mall-cart-main">
        ${renderProductVisual(item.product || { category: "商品", skuCode: item.productId, coverTone: "商城" }, { compact: true })}
        <div class="mall-cart-body">
          <div class="mall-card-head"><div><h3>${escapeHtml(item.product?.name || "商品已失效")}</h3><p class="mall-summary">${escapeHtml(item.product?.summary || item.issue || "请调整购物车商品后继续")}</p></div>${item.available ? renderStatus(PRODUCT_STATUS.LISTED) : '<span class="mall-status neutral">待处理</span>'}</div>
          <div class="mall-order-grid compact"><div><span>单价</span><strong>${escapeHtml(item.product ? money(item.product.price) : "-")}</strong></div><div><span>数量</span><strong>${escapeHtml(String(item.quantity))}${escapeHtml(item.product?.unit || "件")}</strong></div><div><span>小计</span><strong>${escapeHtml(money(item.subtotal))}</strong></div><div><span>库存</span><strong>${escapeHtml(item.product ? `${item.product.stock}${item.product.unit}` : "-")}</strong></div></div>
          ${item.issue ? `<div class="mall-inline-tip warning">${escapeHtml(item.issue)}</div>` : ""}
          <div class="mall-stepper-row"><div class="mall-stepper"><button type="button" data-action="decrease-cart" data-id="${item.id}">-</button><span>${escapeHtml(String(item.quantity))}</span><button type="button" data-action="increase-cart" data-id="${item.id}">+</button></div><button type="button" class="danger-button" data-action="remove-cart" data-id="${item.id}">移除</button></div>
        </div>
      </div>
    </article>`;

  const emptyState = (title, text, buttonLabel = "", action = "") => `<div class="mall-empty-state"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p>${buttonLabel && action ? `<button type="button" class="primary-action" data-action="${action}">${escapeHtml(buttonLabel)}</button>` : ""}</div>`;

  const renderDoctor = () => `
    <div class="mall-shell">
      <div class="mall-tabbar"><button type="button" class="mall-tab${mallState.doctorTab === "products" ? " active" : ""}" data-action="set-doctor-tab" data-tab="products">商品中心</button><button type="button" class="mall-tab${mallState.doctorTab === "orders" ? " active" : ""}" data-action="set-doctor-tab" data-tab="orders">订单中心</button></div>
      ${mallState.doctorTab === "products"
        ? `<section class="panel-card mall-panel"><div class="mall-market-toolbar"><label class="mall-search-shell"><span>搜索商品</span><input id="mallDoctorSearch" class="search-input" type="text" value="${escapeHtml(mallState.doctorKeyword)}" placeholder="搜索商品名、SKU、标签或分类"></label>${renderCategoryChips("doctor")}</div>${getProducts("doctor").length ? `<div class="mall-product-grid">${getProducts("doctor").map((item) => renderProductCard(item, "doctor")).join("")}</div>` : emptyState("还没有商品", "点击页面右上角“新增商品”，先把正式商品目录建起来。", "新增商品", "open-product")}</section>`
        : `<section class="panel-card mall-panel"><div class="mall-toolbar-row split"><input id="mallDoctorSearch" class="search-input" type="text" value="${escapeHtml(mallState.doctorKeyword)}" placeholder="搜索订单号、收货人、地址或商品名"><select id="mallDoctorOrderStatus" class="mall-select">${ORDER_FILTERS.map((item) => `<option value="${item}" ${mallState.doctorOrderStatus === item ? "selected" : ""}>${item}</option>`).join("")}</select></div>${getOrders("doctor").length ? `<div class="mall-order-list">${getOrders("doctor").map((item) => renderOrderCard(item, "doctor")).join("")}</div>` : emptyState("暂时没有订单", "患者下单后，待发货和已发货订单会在这里集中处理。")}</section>`}
    </div>`;

  const renderPatient = () => {
    const summary = getCartSummary();
    const defaultAddress = getDefaultAddress();
    const products = getProducts("patient");
    return `
      <div class="mall-shell">
        <div class="mall-tabbar"><button type="button" class="mall-tab${mallState.patientTab === "catalog" ? " active" : ""}" data-action="set-patient-tab" data-tab="catalog">商品中心</button><button type="button" class="mall-tab${mallState.patientTab === "cart" ? " active" : ""}" data-action="set-patient-tab" data-tab="cart">购物车</button><button type="button" class="mall-tab${mallState.patientTab === "addresses" ? " active" : ""}" data-action="set-patient-tab" data-tab="addresses">收货地址</button><button type="button" class="mall-tab${mallState.patientTab === "orders" ? " active" : ""}" data-action="set-patient-tab" data-tab="orders">我的订单</button></div>
        ${mallState.patientTab === "catalog" ? `<section class="panel-card mall-panel"><div class="mall-market-toolbar"><label class="mall-search-shell"><span>搜索商品</span><input id="mallPatientSearch" class="search-input" type="text" value="${escapeHtml(mallState.patientKeyword)}" placeholder="搜索商品名称、分类或标签"></label>${renderCategoryChips("patient")}</div>${products.length ? `<div class="mall-product-grid">${products.map((item) => renderProductCard(item, "patient")).join("")}</div>` : emptyState("当前没有可售商品", "医生端上架后，这里会同步显示正式商品。")}</section>` : ""}
        ${mallState.patientTab === "cart" ? `<section class="panel-card mall-panel">${getCartItems().length ? `<div class="mall-cart-layout"><div class="mall-order-list">${getCartItems().map(renderCartCard).join("")}</div><aside class="mall-summary-card"><span>购物车汇总</span><strong>${escapeHtml(String(summary.count))} 件商品</strong><p>合计金额：${escapeHtml(money(summary.total))}</p><p>${defaultAddress ? escapeHtml(`${defaultAddress.receiverName} / ${defaultAddress.addressLine}`) : "请先新增收货地址"}</p><button type="button" class="primary-action" data-action="checkout-cart" ${(getCartItems().every((item) => item.available) && defaultAddress) ? "" : "disabled"}>提交订单</button>${!defaultAddress ? '<small>缺少默认地址，暂时不能结算。</small>' : ""}${getCartItems().some((item) => !item.available) ? '<small>请先处理购物车中不可下单的商品。</small>' : ""}</aside></div>` : emptyState("购物车还是空的", "把需要的康复用品先加入购物车，统一结算更方便。", "去逛商品", "go-catalog")}</section>` : ""}
        ${mallState.patientTab === "addresses" ? `<section class="panel-card mall-panel">${getAddresses().length ? `<div class="mall-address-grid">${getAddresses().map(renderAddressCard).join("")}</div>` : emptyState("还没有收货地址", "先补一条常用地址，后续下单就能直接选择。", "新增地址", "open-address")}</section>` : ""}
        ${mallState.patientTab === "orders" ? `<section class="panel-card mall-panel"><div class="mall-toolbar-row split"><input id="mallPatientSearch" class="search-input" type="text" value="${escapeHtml(mallState.patientKeyword)}" placeholder="搜索订单号、商品名或地址"><select id="mallPatientOrderStatus" class="mall-select">${ORDER_FILTERS.map((item) => `<option value="${item}" ${mallState.patientOrderStatus === item ? "selected" : ""}>${item}</option>`).join("")}</select></div>${getOrders("patient").length ? `<div class="mall-order-list">${getOrders("patient").map((item) => renderOrderCard(item, "patient")).join("")}</div>` : emptyState("还没有订单", "购买商品后，订单和发货进度会在这里同步显示。", "去逛商品", "go-catalog")}</section>` : ""}
      </div>`;
  };

  const renderCheckoutRows = (items) => items.map((item) => `<div class="mall-checkout-row"><span>${escapeHtml(item.productName || item.product?.name || "商品")}</span><strong>${escapeHtml(String(item.quantity))}${escapeHtml(item.unit || item.product?.unit || "件")}</strong><strong>${escapeHtml(money(item.subtotal ?? ((item.product?.price || item.unitPrice || 0) * item.quantity)))}</strong></div>`).join("");

  const baseBuildMetrics = buildMetrics;
  buildMetrics = (role, moduleKey) => {
    if (moduleKey !== MODULE_KEY) return baseBuildMetrics(role, moduleKey);
    return [];
  };

  const baseRenderChrome = renderChrome;
  renderChrome = (role) => {
    baseRenderChrome(role);
    if (activeModuleKey !== MODULE_KEY) return;
    metricList.innerHTML = "";
    pageSummaryRow.hidden = true;
    if (role === "doctor") {
      pageActionButton.hidden = mallState.doctorTab !== "products";
      pageActionButton.textContent = "新增商品";
      return;
    }
    if (mallState.patientTab === "addresses") {
      pageActionButton.hidden = false;
      pageActionButton.textContent = "新增地址";
      return;
    }
    if (mallState.patientTab === "cart") {
      pageActionButton.hidden = !getCartItems().length;
      pageActionButton.textContent = "去结算";
      return;
    }
    pageActionButton.hidden = true;
  };

  const baseRenderModuleContent = renderModuleContent;
  renderModuleContent = () => {
    if (activeModuleKey !== MODULE_KEY) return baseRenderModuleContent();
    moduleContent.innerHTML = currentRole === "doctor" ? renderDoctor() : renderPatient();
  };

  const basePageActionHandler = getPageActionHandler;
  getPageActionHandler = () => {
    if (activeModuleKey !== MODULE_KEY) return basePageActionHandler();
    if (currentRole === "doctor") return () => openModal("mall-product");
    if (mallState.patientTab === "addresses") return () => openModal("mall-address");
    if (mallState.patientTab === "cart") {
      return () => {
        if (!getCartItems().length) return setAppNotice("购物车里还没有商品。", "error");
        if (!ensureAddress()) return;
        openModal("mall-checkout", { mode: "cart", cartItemIds: getCartItems().map((item) => item.id) });
      };
    }
    return () => setAppNotice("当前页不需要额外操作。", "info");
  };
  const baseRenderModal = renderModal;
  renderModal = () => {
    if (!modalState || !String(modalState.type || "").startsWith("mall-")) return baseRenderModal();
    if (modalState.type === "mall-product-detail") {
      const product = normalizeProduct(modalState.payload || {});
      const meta = getProductDisplayMeta(product);
      const gallery = [...new Set([product.coverImage, ...imageList(product.images)].filter(Boolean))];
      const unavailable = productStatus(product.status) !== PRODUCT_STATUS.LISTED || product.stock <= 0;
      modalTitle.textContent = "商品详情";
      modalBody.innerHTML = `
        <div class="mall-product-detail">
          <div class="mall-product-detail-hero">
            <div class="mall-product-detail-visual">${renderProductVisual(product, { minimal: true, simple: true })}</div>
            <div class="mall-product-detail-main">
              <div class="mall-product-topline">
                <div class="mall-tag-row inline">
                  ${currentRole === "doctor" ? renderStatus(product.status) : `<span class="mall-badge accent">${escapeHtml(meta.originLabel)}</span>`}
                  ${product.featured ? '<span class="mall-badge">院内推荐</span>' : ""}
                </div>
                <span class="mall-store-name">${escapeHtml(meta.storeName || "院内专区")}</span>
              </div>
              <h3>${escapeHtml(product.name)}</h3>
              <p class="mall-detail-summary">${escapeHtml(product.summary || product.description || meta.shippingLabel || "暂无商品说明")}</p>
              <div class="mall-price-row"><div><strong>${escapeHtml(money(product.price))}</strong>${product.originalPrice > product.price ? `<span>${escapeHtml(money(product.originalPrice))}</span>` : ""}</div><div class="mall-price-subline">${escapeHtml(meta.salesText)}</div></div>
              <div class="detail-grid">
                ${currentRole === "doctor"
                  ? `<div class="detail-line"><span>SKU</span><strong>${escapeHtml(product.skuCode || "-")}</strong></div>
                     <div class="detail-line"><span>库存</span><strong>${escapeHtml(meta.inventoryText)}</strong></div>
                     <div class="detail-line"><span>分类</span><strong>${escapeHtml(product.category || "正式商品")}</strong></div>
                     <div class="detail-line"><span>配送说明</span><strong>${escapeHtml(meta.shippingLabel)}</strong></div>`
                  : `<div class="detail-line"><span>配送</span><strong>${escapeHtml(meta.shippingLabel)}</strong></div>
                     <div class="detail-line"><span>来源</span><strong>${escapeHtml(product.originLabel || meta.originLabel || product.category)}</strong></div>
                     <div class="detail-line"><span>分类</span><strong>${escapeHtml(product.category || "健康支持")}</strong></div>
                     <div class="detail-line"><span>库存</span><strong>${escapeHtml(meta.inventoryText)}</strong></div>`}
              </div>
              <div class="mall-tag-row">${meta.badges.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
            </div>
          </div>
          ${gallery.length ? `<section class="mall-detail-section"><h4>图文展示</h4><div class="mall-detail-gallery">${gallery.map((url, index) => `<div class="mall-detail-gallery-item"><img src="${escapeHtml(url)}" alt="${escapeHtml(`${product.name || "商品"} 图片 ${index + 1}`)}"></div>`).join("")}</div></section>` : ""}
          <section class="mall-detail-section">
            <h4>商品介绍</h4>
            <div class="mall-detail-richtext">${formatDetailText(product.description || product.summary)}</div>
          </section>
          <div class="modal-actions">
            <button class="secondary-button" type="button" id="cancelModal">关闭</button>
            ${currentRole === "doctor"
              ? `<button class="secondary-button" type="button" data-action="detail-edit-product" data-id="${product.id}">编辑商品</button><button class="danger-button" type="button" data-action="detail-delete-product" data-id="${product.id}">删除商品</button>`
              : `<button class="secondary-button" type="button" data-action="detail-add-cart" data-id="${product.id}" ${unavailable ? "disabled" : ""}>加入购物车</button><button class="primary-action" type="button" data-action="detail-buy-now" data-id="${product.id}" ${unavailable ? "disabled" : ""}>立即购买</button>`}
          </div>
        </div>`;
      return;
    }
    if (modalState.type === "mall-product") {
      const product = normalizeProduct(modalState.payload || {});
      const draft = ensureProductDraft();
      modalTitle.textContent = modalState.payload ? "编辑商品" : "新增商品";
      modalBody.innerHTML = `
        <form class="modal-form" id="modalForm">
          <div class="form-grid">
            <label class="wide"><span>商品名称</span><input name="name" value="${escapeHtml(product.name)}" required></label>
            <label><span>SKU</span><input name="skuCode" value="${escapeHtml(product.skuCode)}"></label>
            <label><span>品牌/系列</span><input name="brand" value="${escapeHtml(product.brand)}" placeholder="如：院内康复 / 术后营养"></label>
            <label><span>分类</span><input name="category" value="${escapeHtml(product.category)}" required></label>
            <label><span>单位</span><input name="unit" value="${escapeHtml(product.unit)}"></label>
            <label><span>售价</span><input name="price" type="number" min="0.01" step="0.01" value="${escapeHtml(product.price || 0)}" required></label>
            <label><span>划线价</span><input name="originalPrice" type="number" min="0" step="0.01" value="${escapeHtml(product.originalPrice || 0)}"></label>
            <label><span>库存</span><input name="stock" type="number" min="0" value="${escapeHtml(product.stock || 0)}" required></label>
            <label><span>预警线</span><input name="lowStockThreshold" type="number" min="0" value="${escapeHtml(product.lowStockThreshold || 0)}"></label>
            <label><span>状态</span><select name="status"><option value="listed" ${productStatus(product.status) === PRODUCT_STATUS.LISTED ? "selected" : ""}>上架中</option><option value="unlisted" ${productStatus(product.status) === PRODUCT_STATUS.UNLISTED ? "selected" : ""}>已下架</option></select></label>
            <label><span>专区/店铺名</span><input name="storeName" value="${escapeHtml(product.storeName)}" placeholder="如：院内营养专区"></label>
            <label><span>来源/产地</span><input name="originLabel" value="${escapeHtml(product.originLabel)}" placeholder="如：院内甄选 / 福建 福州"></label>
            <label><span>配送说明</span><input name="shippingLabel" value="${escapeHtml(product.shippingLabel)}" placeholder="如：现货速配，支持物流跟踪"></label>
            <label><span>主推短语</span><input name="promoText" value="${escapeHtml(product.promoText)}" placeholder="如：院内推荐 / 立减 ¥20"></label>
            <label><span>视觉关键词</span><input name="coverTone" value="${escapeHtml(product.coverTone)}" placeholder="如：营养 / 轻养护"></label>
            <label class="wide"><span>标签</span><input name="tags" value="${escapeHtml((product.tags || []).join("，"))}" placeholder="术后恢复，口腔护理"></label>
            <label class="wide"><span>一句话推荐</span><textarea name="summary" required>${escapeHtml(product.summary)}</textarea></label>
            <label class="wide"><span>商品详情</span><textarea name="description" required>${escapeHtml(product.description)}</textarea></label>
            <label class="checkbox-field"><input name="featured" type="checkbox" ${product.featured ? "checked" : ""}><span>设为推荐商品</span></label>
          </div>
          <div class="mall-media-panel">
            <div class="mall-media-head">
              <div><strong>商品图片</strong><span>支持 JPG、PNG、JPEG、WEBP。建议上传 1 张封面图和 2-4 张详情图。</span></div>
              <div class="card-actions"><button class="secondary-button" type="button" data-action="trigger-product-cover-upload">${draft?.uploading ? "上传中..." : "上传封面"}</button><button class="secondary-button" type="button" data-action="trigger-product-gallery-upload">${draft?.uploading ? "上传中..." : "上传详情图"}</button></div>
            </div>
            <input id="mallProductCoverInput" type="file" hidden accept="image/*">
            <input id="mallProductGalleryInput" type="file" hidden accept="image/*" multiple>
            <div class="mall-product-editor-cover">${draft?.coverImage ? `<img src="${escapeHtml(draft.coverImage)}" alt="商品封面">` : `<div class="mall-upload-empty">当前还没有商品封面，患者端会先显示渐变占位图。</div>`}${draft?.coverImage ? `<button type="button" class="mall-cover-remove" data-action="remove-product-cover">移除封面</button>` : ""}</div>
            ${renderProductDraftImages(draft)}
          </div>
          <div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">取消</button><button class="primary-action" type="submit">${modalState.payload ? "保存商品" : "创建商品"}</button></div>
        </form>`;
      return;
    }
    if (modalState.type === "mall-address") {
      const address = normalizeAddress(modalState.payload || {});
      modalTitle.textContent = modalState.payload ? "编辑收货地址" : "新增收货地址";
      modalBody.innerHTML = `<form class="modal-form" id="modalForm"><div class="form-grid"><label><span>地址标签</span><input name="tag" value="${escapeHtml(address.tag)}" placeholder="家 / 康复公寓"></label><label><span>收货人</span><input name="receiverName" value="${escapeHtml(address.receiverName)}" required></label><label><span>联系电话</span><input name="receiverPhone" value="${escapeHtml(address.receiverPhone)}" required></label><label class="wide"><span>详细地址</span><textarea name="addressLine" required>${escapeHtml(address.addressLine)}</textarea></label><label class="checkbox-field"><input name="isDefault" type="checkbox" ${address.isDefault ? "checked" : ""}><span>设为默认收货地址</span></label></div><div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">取消</button><button class="primary-action" type="submit">${modalState.payload ? "保存地址" : "新增地址"}</button></div></form>`;
      return;
    }
    if (modalState.type === "mall-address-picker") {
      const addresses = getAddresses();
      modalTitle.textContent = "切换收货地址";
      modalBody.innerHTML = addresses.length
        ? `<div class="mall-address-switcher"><div class="mall-address-switcher-list">${addresses.map(renderAddressPickerItem).join("")}</div><div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">关闭</button><button class="primary-action" type="button" data-action="picker-add-address">新增地址</button></div></div>`
        : `<div class="mall-empty-state in-modal"><strong>还没有收货地址</strong><p>先新增一条常用地址，后续就可以在这里直接切换。</p><div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">关闭</button><button class="primary-action" type="button" data-action="picker-add-address">新增地址</button></div></div>`;
      return;
    }
    if (modalState.type === "mall-checkout") {
      const addresses = getAddresses();
      const mode = modalState.payload?.mode || "cart";
      const directProduct = mode === "direct" ? appData.products.find((item) => item.id === modalState.payload?.productId) : null;
      const directQuantity = int(modalState.payload?.quantity, 1, 1);
      const selectedAddressId = String(modalState.payload?.addressId || "").trim();
      const selectedAddress = addresses.find((item) => item.id === selectedAddressId) || getDefaultAddress() || addresses[0] || null;
      const items = mode === "cart"
        ? getCartItems().filter((item) => !Array.isArray(modalState.payload?.cartItemIds) || !modalState.payload.cartItemIds.length || modalState.payload.cartItemIds.includes(item.id))
        : (directProduct ? [{ productName: directProduct.name, quantity: directQuantity, unit: directProduct.unit, subtotal: directProduct.price * directQuantity }] : []);
      const total = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
      modalTitle.textContent = "确认订单";
      modalBody.innerHTML = addresses.length ? `<form class="modal-form" id="modalForm"><input name="addressId" type="hidden" value="${escapeHtml(selectedAddress?.id || "")}"><div class="mall-checkout-address">${renderAddressContextBanner(selectedAddress, "checkout")}</div><div class="mall-checkout-box"><strong>${mode === "cart" ? "本次将结算购物车商品" : `立即购买：${escapeHtml(directProduct?.name || "商品")}`}</strong><div class="mall-checkout-list">${renderCheckoutRows(items)}</div><div class="mall-checkout-total">订单金额：${escapeHtml(money(total))}</div></div><div class="form-grid">${mode === "direct" ? `<label><span>购买数量</span><input name="quantity" type="number" min="1" max="${escapeHtml(String(Math.max(1, directProduct?.stock || 1)))}" value="${escapeHtml(String(directQuantity))}" required></label>` : ""}<label class="wide"><span>备注</span><textarea name="note" placeholder="例如：工作日配送、提前电话联系"></textarea></label></div><div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">取消</button><button class="primary-action" type="submit">提交订单</button></div></form>` : `<div class="mall-empty-state in-modal"><strong>还没有收货地址</strong><p>先补齐收货地址，再继续提交订单。</p><div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">取消</button><button class="primary-action" type="button" data-action="checkout-open-address">去新增地址</button></div></div>`;
      return;
    }
    if (modalState.type === "mall-order") {
      const order = normalizeOrder(modalState.payload || {});
      modalTitle.textContent = "订单详情";
      modalBody.innerHTML = `<div class="mall-order-detail"><div class="detail-grid"><div class="detail-line"><span>订单号</span><strong>${escapeHtml(order.id)}</strong></div><div class="detail-line"><span>订单状态</span><strong>${escapeHtml(statusText(order.status))}</strong></div><div class="detail-line"><span>收货人</span><strong>${escapeHtml(order.contactName || "-")}</strong></div><div class="detail-line"><span>联系电话</span><strong>${escapeHtml(order.contactPhone || "-")}</strong></div><div class="detail-line wide"><span>收货地址</span><strong>${escapeHtml(order.address || "-")}</strong></div><div class="detail-line"><span>物流公司</span><strong>${escapeHtml(order.logisticsCompany || "未录入")}</strong></div><div class="detail-line"><span>物流单号</span><strong>${escapeHtml(order.trackingNumber || "未录入")}</strong></div><div class="detail-line wide"><span>发货备注</span><strong>${escapeHtml(order.fulfillmentNote || order.note || "无")}</strong></div></div><div class="mall-detail-list">${order.items.map((item) => `<div class="mall-checkout-row"><span>${escapeHtml(`${item.productName} / ${item.skuCode}`)}</span><strong>${escapeHtml(String(item.quantity))}${escapeHtml(item.unit || "件")}</strong><strong>${escapeHtml(money(item.subtotal))}</strong></div>`).join("")}</div><div class="mall-checkout-total">实付金额：${escapeHtml(money(order.totalPrice))}</div></div>`;
      return;
    }
    if (modalState.type === "mall-ship") {
      const order = normalizeOrder(modalState.payload || {});
      modalTitle.textContent = "录入发货信息";
      modalBody.innerHTML = `<form class="modal-form" id="modalForm"><div class="mall-checkout-box compact"><strong>${escapeHtml(order.id)}</strong><div class="mall-checkout-list">${renderCheckoutRows(order.items)}</div><div class="mall-checkout-total">订单金额：${escapeHtml(money(order.totalPrice))}</div></div><div class="form-grid"><label><span>物流公司</span><select name="logisticsCompany">${LOGISTICS.map((item) => `<option value="${item}" ${order.logisticsCompany === item ? "selected" : ""}>${item}</option>`).join("")}</select></label><label><span>物流单号</span><input name="trackingNumber" value="${escapeHtml(order.trackingNumber || "")}" required></label><label class="wide"><span>发货备注</span><textarea name="fulfillmentNote" placeholder="例如：已与家属确认签收时间">${escapeHtml(order.fulfillmentNote || "")}</textarea></label></div><div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">取消</button><button class="primary-action" type="submit">确认发货</button></div></form>`;
    }
  };

  const baseHandleModalSubmit = handleModalSubmit;
  handleModalSubmit = async (event) => {
    if (!modalState || !String(modalState.type || "").startsWith("mall-")) return baseHandleModalSubmit(event);
    event.preventDefault();
    const formData = new FormData(event.target);
    if (modalState.type === "mall-product") {
      const draft = ensureProductDraft();
      await runAction(() => requestMall("/api/mall/product/save", {
        product: {
          id: modalState.payload?.id || "",
          name: formData.get("name")?.trim(),
          skuCode: formData.get("skuCode")?.trim(),
          brand: formData.get("brand")?.trim(),
          category: formData.get("category")?.trim(),
          unit: formData.get("unit")?.trim() || "件",
          price: Number(formData.get("price") || 0),
          originalPrice: Number(formData.get("originalPrice") || 0),
          stock: Number(formData.get("stock") || 0),
          lowStockThreshold: Number(formData.get("lowStockThreshold") || 0),
          status: formData.get("status") || PRODUCT_STATUS.LISTED,
          storeName: formData.get("storeName")?.trim(),
          originLabel: formData.get("originLabel")?.trim(),
          shippingLabel: formData.get("shippingLabel")?.trim(),
          promoText: formData.get("promoText")?.trim(),
          summary: formData.get("summary")?.trim(),
          description: formData.get("description")?.trim(),
          tags: String(formData.get("tags") || "").split(/[，,、]/).map((item) => item.trim()).filter(Boolean),
          featured: formData.get("featured") === "on",
          coverTone: formData.get("coverTone")?.trim() || formData.get("brand")?.trim() || formData.get("category")?.trim() || "健康",
          coverImage: draft?.coverImage || "",
          images: imageList(draft?.images),
        },
      }), modalState.payload ? "商品信息已更新。" : "商品已新增上架。");
      return;
    }
    if (modalState.type === "mall-address") {
      const returnToCheckout = modalState.payload?.returnToCheckout || null;
      await runAction(() => requestMall("/api/mall/address/save", { address: { id: modalState.payload?.id || "", tag: formData.get("tag")?.trim(), receiverName: formData.get("receiverName")?.trim(), receiverPhone: formData.get("receiverPhone")?.trim(), addressLine: formData.get("addressLine")?.trim(), isDefault: formData.get("isDefault") === "on" } }), modalState.payload?.id ? "收货地址已更新。" : "收货地址已新增。");
      if (returnToCheckout) {
        const latestAddress = getDefaultAddress() || getAddresses()[0];
        openModal("mall-checkout", { ...returnToCheckout, addressId: latestAddress?.id || "" });
      }
      return;
    }
    if (modalState.type === "mall-checkout") {
      const mode = modalState.payload?.mode || "cart";
      const payload = mode === "direct" ? { addressId: formData.get("addressId")?.trim(), note: formData.get("note")?.trim(), items: [{ productId: modalState.payload?.productId, quantity: Number(formData.get("quantity") || modalState.payload?.quantity || 1) }] } : { addressId: formData.get("addressId")?.trim(), note: formData.get("note")?.trim(), cartItemIds: modalState.payload?.cartItemIds || getCartItems().map((item) => item.id) };
      const result = await runAction(() => requestMall("/api/mall/checkout", payload), "订单已提交，医生端会继续处理发货。");
      if (result) {
        mallState.patientTab = "orders";
        renderApp();
      }
      return;
    }
    if (modalState.type === "mall-ship") {
      await runAction(() => requestMall("/api/mall/order/status", { orderId: modalState.payload?.id, status: ORDER_STATUS.SHIPPED, logisticsCompany: formData.get("logisticsCompany")?.trim(), trackingNumber: formData.get("trackingNumber")?.trim(), fulfillmentNote: formData.get("fulfillmentNote")?.trim() }), "订单已录入发货信息。");
    }
  };

  modalBody.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (modalState?.type === "mall-checkout") {
      const checkoutPayload = { ...(modalState.payload || {}) };
      if (button.dataset.action === "checkout-open-address-picker") {
        openModal("mall-address-picker", { returnToCheckout: checkoutPayload });
        return;
      }
      if (button.dataset.action === "checkout-open-address") {
        openModal("mall-address", { returnToCheckout: checkoutPayload });
        return;
      }
    }
    if (modalState?.type === "mall-address-picker") {
      const { action, id } = button.dataset;
      const returnToCheckout = modalState.payload?.returnToCheckout || null;
      if (action === "picker-add-address") {
        openModal("mall-address", { returnToCheckout });
        return;
      }
      if (action === "picker-edit-address") {
        const address = getAddresses().find((item) => item.id === id);
        if (address) openModal("mall-address", { ...address, returnToCheckout });
        return;
      }
      if (action === "pick-default-address") {
        const address = getAddresses().find((item) => item.id === id);
        if (!address) return;
        await runAction(() => requestMall("/api/mall/address/save", { address: { ...address, isDefault: true } }), "默认收货地址已更新。");
        if (returnToCheckout) {
          openModal("mall-checkout", { ...returnToCheckout, addressId: id });
        }
        return;
      }
    }
    if (modalState?.type === "mall-product-detail") {
      const { action, id } = button.dataset;
      if (action === "detail-edit-product") {
        const product = appData.products.find((item) => item.id === id);
        if (product) openModal("mall-product", product);
      }
      if (action === "detail-delete-product") {
        const product = appData.products.find((item) => item.id === id);
        if (!product || !window.confirm(`确定删除“${product.name}”吗？没有订单历史的商品才允许删除。`)) return;
        runAction(() => requestMall("/api/mall/product/delete", { productId: id }), "商品已删除。", { close: true });
      }
      if (action === "detail-add-cart") {
        runAction(() => requestMall("/api/mall/cart/add", { productId: id, quantity: 1 }), "已加入购物车。", { close: false });
      }
      if (action === "detail-buy-now") {
        const product = appData.products.find((item) => item.id === id);
        if (!product) return;
        if (!ensureAddress()) return;
        openModal("mall-checkout", { mode: "direct", productId: product.id, quantity: 1 });
      }
      return;
    }
    if (modalState?.type !== "mall-product") return;
    if (button.dataset.action === "trigger-product-cover-upload") {
      document.getElementById("mallProductCoverInput")?.click();
    }
    if (button.dataset.action === "trigger-product-gallery-upload") {
      document.getElementById("mallProductGalleryInput")?.click();
    }
    if (button.dataset.action === "remove-product-cover") {
      const draft = ensureProductDraft();
      if (!draft) return;
      draft.coverImage = "";
      renderModal();
      modalOverlay.hidden = false;
    }
    if (button.dataset.action === "remove-product-image") {
      const draft = ensureProductDraft();
      if (!draft) return;
      const index = Number(button.dataset.index);
      draft.images = imageList(draft.images).filter((_, itemIndex) => itemIndex !== index);
      renderModal();
      modalOverlay.hidden = false;
    }
  });

  modalBody.addEventListener("change", async (event) => {
    if (event.target.id === "mallProductCoverInput") {
      const files = Array.from(event.target.files || []).slice(0, 1);
      event.target.value = "";
      await uploadMallProductImages(files, "cover");
    }
    if (event.target.id === "mallProductGalleryInput") {
      const files = Array.from(event.target.files || []);
      event.target.value = "";
      await uploadMallProductImages(files, "gallery");
    }
  });

  moduleContent.addEventListener("input", (event) => {
    if (activeModuleKey !== MODULE_KEY) return;
    if (event.target.id === "mallDoctorSearch") {
      mallState.doctorKeyword = event.target.value;
      renderModuleContent();
      return;
    }
    if (event.target.id === "mallPatientSearch") {
      mallState.patientKeyword = event.target.value;
      renderModuleContent();
      return;
    }
    if (event.target.matches('[data-mall-filter="category"]')) {
      if (currentRole === "doctor") mallState.doctorCategory = event.target.value;
      else mallState.patientCategory = event.target.value;
      renderModuleContent();
    }
  });

  moduleContent.addEventListener("change", (event) => {
    if (activeModuleKey !== MODULE_KEY) return;
    if (event.target.id === "mallDoctorOrderStatus") {
      mallState.doctorOrderStatus = event.target.value;
      renderModuleContent();
      return;
    }
    if (event.target.id === "mallPatientOrderStatus") {
      mallState.patientOrderStatus = event.target.value;
      renderModuleContent();
      return;
    }
    if (event.target.matches('[data-mall-filter="category"]')) {
      if (currentRole === "doctor") mallState.doctorCategory = event.target.value;
      else mallState.patientCategory = event.target.value;
      renderModuleContent();
    }
  });

  moduleContent.addEventListener("click", async (event) => {
    if (activeModuleKey !== MODULE_KEY) return;
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id, tab } = button.dataset;
    if (action === "set-doctor-tab") {
      mallState.doctorTab = tab || "products";
      renderApp();
      return;
    }
    if (action === "set-patient-tab") {
      mallState.patientTab = tab || "catalog";
      renderApp();
      return;
    }
    if (action === "set-doctor-category") {
      mallState.doctorCategory = button.dataset.category || "全部";
      renderApp();
      return;
    }
    if (action === "set-patient-category") {
      mallState.patientCategory = button.dataset.category || "全部";
      renderApp();
      return;
    }
    if (action === "go-catalog") {
      mallState.patientTab = "catalog";
      renderApp();
      return;
    }
    if (action === "open-address-picker") return openModal("mall-address-picker");
    if (action === "open-product") return openModal("mall-product");
    if (action === "open-address") return openModal("mall-address");
    if (action === "checkout-open-address") {
      closeModal();
      mallState.patientTab = "addresses";
      renderApp();
      return openModal("mall-address");
    }
    if (action === "edit-product") {
      const product = appData.products.find((item) => item.id === id);
      if (product) openModal("mall-product", product);
      return;
    }
    if (action === "view-product") {
      const product = appData.products.find((item) => item.id === id);
      if (product) openModal("mall-product-detail", product);
      return;
    }
    if (action === "toggle-product") {
      const product = appData.products.find((item) => item.id === id);
      if (!product) return;
      await runAction(() => requestMall("/api/mall/product/save", { product: { ...product, status: productStatus(product.status) === PRODUCT_STATUS.LISTED ? PRODUCT_STATUS.UNLISTED : PRODUCT_STATUS.LISTED } }), productStatus(product.status) === PRODUCT_STATUS.LISTED ? "商品已下架。" : "商品已重新上架。", { close: false });
      return;
    }
    if (action === "delete-product") {
      const product = appData.products.find((item) => item.id === id);
      if (!product || !window.confirm(`确定删除“${product.name}”吗？没有订单历史的商品才允许删除。`)) return;
      await runAction(() => requestMall("/api/mall/product/delete", { productId: id }), "商品已删除。", { close: false });
      return;
    }
    if (action === "add-cart") {
      await runAction(() => requestMall("/api/mall/cart/add", { productId: id, quantity: 1 }), "已加入购物车。", { close: false });
      return;
    }
    if (action === "buy-now") {
      const product = appData.products.find((item) => item.id === id);
      if (!product) return;
      if (!ensureAddress()) return;
      openModal("mall-checkout", { mode: "direct", productId: product.id, quantity: 1 });
      return;
    }
    if (action === "increase-cart" || action === "decrease-cart") {
      const item = getCartItems().find((entry) => entry.id === id);
      if (!item) return;
      const nextQuantity = action === "increase-cart" ? item.quantity + 1 : item.quantity - 1;
      await runAction(() => requestMall("/api/mall/cart/update", { cartItemId: id, quantity: nextQuantity }), nextQuantity > 0 ? "购物车数量已更新。" : "商品已从购物车移除。", { close: false });
      return;
    }
    if (action === "remove-cart") {
      await runAction(() => requestMall("/api/mall/cart/remove", { cartItemId: id }), "商品已从购物车移除。", { close: false });
      return;
    }
    if (action === "checkout-cart") {
      if (!getCartItems().length) return setAppNotice("购物车里还没有商品。", "error");
      if (!ensureAddress()) return;
      openModal("mall-checkout", { mode: "cart", cartItemIds: getCartItems().map((item) => item.id) });
      return;
    }
    if (action === "edit-address") {
      const address = getAddresses().find((item) => item.id === id);
      if (address) openModal("mall-address", address);
      return;
    }
    if (action === "set-default-address") {
      const address = getAddresses().find((item) => item.id === id);
      if (!address) return;
      await runAction(() => requestMall("/api/mall/address/save", { address: { ...address, isDefault: true } }), "默认收货地址已更新。", { close: false });
      return;
    }
    if (action === "delete-address") {
      const address = getAddresses().find((item) => item.id === id);
      if (!address || !window.confirm(`确定删除地址“${address.tag || address.addressLine}”吗？`)) return;
      await runAction(() => requestMall("/api/mall/address/delete", { addressId: id }), "收货地址已删除。", { close: false });
      return;
    }
    if (action === "view-order") {
      const order = appData.orders.find((item) => item.id === id);
      if (order) openModal("mall-order", order);
      return;
    }
    if (action === "ship-order") {
      const order = appData.orders.find((item) => item.id === id);
      if (order) openModal("mall-ship", order);
      return;
    }
    if (action === "complete-order") {
      await runAction(() => requestMall("/api/mall/order/status", { orderId: id, status: ORDER_STATUS.COMPLETED }), "订单已标记为已完成。", { close: false });
      return;
    }
    if (action === "confirm-order") {
      await runAction(() => requestMall("/api/mall/order/status", { orderId: id, status: ORDER_STATUS.COMPLETED }), "已确认收货。", { close: false });
    }
  });

  if (!loginView.hidden) renderRole(currentRole);
  if (!appShell.hidden) renderApp();
})();
