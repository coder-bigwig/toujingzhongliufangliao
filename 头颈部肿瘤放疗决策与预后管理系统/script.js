const AUTH_STORAGE_KEY = "patient-management-auth";
const AUTH_SESSION_KEY = "patient-management-auth-session";
const DATA_STORAGE_KEY = "patient-management-data";
const DATA_STORAGE_VERSION_KEY = "patient-management-data-version";
const CURRENT_DATA_VERSION = "20260413-manuals-flat-1";

const DEFAULT_AI_CONFIG = {
  providerName: "OpenAI 兼容接口",
  apiBaseUrl: "",
  model: "",
  apiKey: "",
  hasApiKey: false,
  enableWebSearch: true,
  maxWebResults: 5,
  systemPrompt:
    "你是GBM-DeepNeuro-Treg AI 助手。你的回答只能作为线上分诊和健康信息参考，不能替代执业医生的面诊、检查、化验、影像和处方。面对不确定信息必须明确说明，对急危重症征象必须优先提示立即线下就医或急诊处理，不得编造检查结果、药物剂量或医学结论。",
  updatedAt: "",
  isConfigured: false,
};

const accounts = {
  patient: {
    title: "病人账号",
    placeholder: "请输入病人账号",
    name: "陈丽",
  },
  doctor: {
    title: "医生账号",
    placeholder: "请输入医生账号",
    name: "张明炜",
  },
};

const appViews = {
  doctor: {
    roleLabel: "医生端",
    avatar: "医",
    defaultName: "张明炜",
    headerMeta: "角色：医生端",
    subtitle: "医生管理端 / AI 问诊配置",
    modules: [
      { key: "patients", icon: "病", title: "病人信息管理", desc: "病历与基础档案", actionText: "新增病人" },
      { key: "doctorAppointments", icon: "约", title: "预约管理", desc: "查看病人预约申请", actionText: "代病人预约" },
      { key: "doctorReports", icon: "报", title: "报告管理", desc: "录入并发送检查报告", actionText: "发送报告" },
      { key: "targetContouring", icon: "靶", title: "靶区勾画", desc: "调用本地勾画工作台与 NIfTI 上传推理", actionText: "打开工作台" },
      { key: "radiotherapyDecision", icon: "疗", title: "放疗适应证决策", desc: "头颈部鳞癌术后出院小结判读", actionText: "打开模块" },
      { key: "radiomicsPrognosis", icon: "组", title: "影像组学预后评分", desc: "六项特征与Treg预测概率", actionText: "刷新数据" },
      { key: "healthManuals", icon: "册", title: "健康手册", desc: "发布头颈放疗护理文章", actionText: "发布文章" },
      { key: "aiConfig", icon: "智", title: "AI 问诊配置", desc: "模型与联网搜索设置", actionText: "保存配置" },
      { key: "schedule", icon: "排", title: "门诊排班", desc: "查看当日坐诊安排", actionText: "新增排班" },
      { key: "followups", icon: "访", title: "随访记录", desc: "术后与慢病随访", actionText: "新增随访" },
    ],
  },
  patient: {
    roleLabel: "病人端",
    avatar: "患",
    defaultName: "陈丽",
    headerMeta: "角色：病人端",
    subtitle: "病人服务端 / 智能问诊中心",
    modules: [
      { key: "aiChat", icon: "问", title: "AI 问诊", desc: "在线问答与报告解读", actionText: "新建对话" },
      { key: "healthManuals", icon: "册", title: "健康手册", desc: "查看头颈放疗护理文章", actionText: "查看文章" },
      { key: "profile", icon: "档", title: "个人信息", desc: "基础资料与联系方式", actionText: "编辑信息" },
      { key: "appointments", icon: "约", title: "我的预约", desc: "查看预约与复诊安排", actionText: "新增预约" },
      { key: "reports", icon: "报", title: "检查报告", desc: "医生发送的检验与影像结果", actionText: "查看报告" },
    ],
  },
};

const DEFAULT_APP_DATA = {
  patients: [
    {
      id: "MR-20260301",
      username: "patient001",
      name: "陈丽",
      gender: "女",
      age: 46,
      phone: "138 8888 2026",
      lastVisit: "2026-04-10",
      createdAt: "2026-03-01",
      status: "待复诊",
      address: "江苏省南京市鼓楼区汉中路 88 号",
      history: "鼻咽癌放疗后随访中，既往无重大手术史，对青霉素不过敏。",
      emergency: "陈先生 / 139 7777 1028",
      diagnosis: "鼻咽癌放疗后随访期",
      alerts: ["已实名认证", "医保已绑定", "电子病历已开通"],
      appointments: [{ id: "APT-20260418-01", date: "2026-04-10 09:30", department: "头颈放疗门诊", room: "诊室 305", status: "已接诊" }],
      reports: [{ id: "REP-20260410-01", name: "鼻咽癌放疗后复查 MRI 报告", date: "2026-04-10", result: "待复查", summary: "鼻咽部软组织较前稳定，建议结合鼻咽镜检查于两周后复诊。" }],
    },
    {
      id: "MR-20260302",
      username: "",
      name: "张悦",
      gender: "女",
      age: 52,
      phone: "138 0000 2811",
      lastVisit: "2026-04-11",
      createdAt: "2026-03-11",
      status: "待复诊",
      address: "福州市台江区工业路 21 号",
      history: "口咽癌完成调强放疗后第 2 周，近期口干和吞咽不适较明显。",
      emergency: "张先生 / 137 8888 2233",
      diagnosis: "口咽癌放疗后复查",
      alerts: ["放疗后第 14 天", "建议口腔黏膜评估"],
      appointments: [],
      reports: [],
    },
    {
      id: "MR-20260303",
      username: "",
      name: "李晨",
      gender: "男",
      age: 58,
      phone: "139 0000 4418",
      lastVisit: "2026-04-12",
      createdAt: "2026-03-12",
      status: "治疗中",
      address: "福州市鼓楼区五四路 66 号",
      history: "下咽癌同步放化疗第 4 周，既往高血压病史，头孢类药物过敏。",
      emergency: "李女士 / 136 5555 8821",
      diagnosis: "下咽癌同步放化疗中",
      alerts: ["头孢类药物过敏", "治疗中需监测体重"],
      appointments: [],
      reports: [],
    },
    {
      id: "MR-20260304",
      username: "",
      name: "王雪",
      gender: "女",
      age: 39,
      phone: "136 0000 9023",
      lastVisit: "2026-04-08",
      createdAt: "2026-03-08",
      status: "已建档",
      address: "福州市仓山区金山大道 18 号",
      history: "喉癌拟行放疗前建档，既往无重大基础疾病。",
      emergency: "王女士 / 135 1111 9902",
      diagnosis: "喉癌放疗前评估",
      alerts: ["待补充定位 CT 资料"],
      appointments: [],
      reports: [],
    },
    {
      id: "MR-20260305",
      username: "",
      name: "陈涛",
      gender: "男",
      age: 61,
      phone: "137 0000 1260",
      lastVisit: "2026-04-09",
      createdAt: "2026-03-09",
      status: "稳定",
      address: "福州市晋安区长乐北路 80 号",
      history: "喉癌放疗结束 6 个月，近期总体恢复平稳，仍有轻度声音嘶哑。",
      emergency: "陈女士 / 138 2222 1026",
      diagnosis: "喉癌放疗后稳定随访期",
      alerts: ["建议月度随访"],
      appointments: [],
      reports: [],
    },
  ],
  schedules: [
    { id: "SCH-20260413-HNRT-AM", date: "2026-04-13", period: "上午", clinic: "头颈放疗门诊 301", capacity: 18, booked: 0 },
    { id: "SCH-20260413-REVIEW-PM", date: "2026-04-13", period: "下午", clinic: "放疗复诊门诊 305", capacity: 16, booked: 0 },
    { id: "SCH-20260413-NUTR-AM", date: "2026-04-13", period: "上午", clinic: "营养支持门诊 312", capacity: 12, booked: 0 },
    { id: "SCH-20260414-ORAL-AM", date: "2026-04-14", period: "上午", clinic: "口腔护理门诊 318", capacity: 10, booked: 0 },
    { id: "SCH-20260414-SKIN-PM", date: "2026-04-14", period: "下午", clinic: "皮肤护理门诊 320", capacity: 10, booked: 0 },
    { id: "SCH-20260415-SWALLOW-PM", date: "2026-04-15", period: "下午", clinic: "吞咽康复门诊 323", capacity: 12, booked: 0 },
    { id: "SCH-20260415-SYMPTOM-AM", date: "2026-04-15", period: "上午", clinic: "症状管理门诊 325", capacity: 10, booked: 0 },
  ],
  followups: [
    { id: "FU-20260314-01", patientId: "MR-20260302", patientName: "张悦", dueDate: "2026-03-14", method: "电话", status: "待随访", note: "放疗后第 7 天电话回访，重点关注口腔黏膜炎和进食情况。" },
    { id: "FU-20260313-02", patientId: "MR-20260303", patientName: "李晨", dueDate: "2026-03-13", method: "复诊", status: "已完成", note: "已确认皮肤反应、体重变化和用药记录，并同步到本次门诊档案。" },
    { id: "FU-20260417-ESC01", patientId: "MR-20260301", patientName: "陈丽", dueDate: "2026-04-17", method: "复诊", status: "待随访", sourceEscortRequestId: "ESC-20260410-01", note: "由陪诊单转入：头颈放疗门诊 / 门诊陪诊 / 2026-04-10 09:00，请结合鼻咽癌放疗后复查情况安排下一次复诊提醒。" },
  ],
  escortRequests: [
    {
      id: "ESC-20260410-01",
      patientId: "MR-20260301",
      patientUsername: "patient001",
      patientName: "陈丽",
      appointmentId: "APT-20260418-01",
      requestType: "门诊陪诊",
      serviceDate: "2026-04-10 09:00",
      department: "头颈放疗门诊",
      room: "诊室 305",
      meetingPoint: "门诊一楼导诊台",
      contactName: "陈丽",
      contactPhone: "138 8888 2026",
      note: "需要协助签到、路线引导和复诊后取药。",
      status: "已完成",
      assignedStaff: "李护士",
      scheduleId: "ESCS-20260410-01",
      feeAmount: 80,
      feeStatus: "已支付",
      feeNote: "已通过门诊服务台结算。",
      confirmationCode: "PD-20260410-ESC001",
      confirmationStatus: "已确认",
      confirmedAt: "2026-04-10T11:25:00.000Z",
      confirmedBy: "陈丽",
      followupId: "FU-20260417-ESC01",
      followupDate: "2026-04-17",
      followupCreatedAt: "2026-04-10T11:30:00.000Z",
      arrangedAt: "2026-04-10T08:40:00.000Z",
      startedAt: "2026-04-10T08:55:00.000Z",
      arrivedAt: "2026-04-10T09:05:00.000Z",
      completedAt: "2026-04-10T10:30:00.000Z",
      timeline: [
        { id: "ESCTL-01", stage: "待确认", label: "已提交陪诊申请", at: "2026-04-09T16:30:00.000Z", by: "陈丽", note: "需要协助签到、路线引导和复诊后取药。" },
        { id: "ESCTL-02", stage: "已安排", label: "已安排陪诊", at: "2026-04-10T08:40:00.000Z", by: "张明炜", note: "安排李护士接应。" },
        { id: "ESCTL-03", stage: "进行中", label: "开始陪诊", at: "2026-04-10T08:55:00.000Z", by: "李护士", note: "" },
        { id: "ESCTL-04", stage: "已到达", label: "已到达集合点", at: "2026-04-10T09:05:00.000Z", by: "李护士", note: "" },
        { id: "ESCTL-05", stage: "已完成", label: "已完成陪诊", at: "2026-04-10T10:30:00.000Z", by: "李护士", note: "已陪同完成复诊与取药。" },
        { id: "ESCTL-06", stage: "confirmed", label: "病人已确认服务单", at: "2026-04-10T11:25:00.000Z", by: "陈丽", note: "" },
      ],
      createdAt: "2026-04-09T16:30:00.000Z",
      createdBy: "patient-self-service",
      updatedAt: "2026-04-10T11:20:00.000Z",
      handledBy: "张明炜",
      handledAt: "2026-04-10T08:50:00.000Z",
    },
    {
      id: "ESC-20260413-02",
      patientId: "MR-20260302",
      patientUsername: "",
      patientName: "张悦",
      appointmentId: "",
      requestType: "检查陪同",
      serviceDate: "2026-04-13 14:00",
      department: "影像复查中心",
      room: "CT 室 2",
      meetingPoint: "影像中心服务台",
      contactName: "张悦",
      contactPhone: "138 0000 2811",
      note: "复查 MRI 与抽血项目较多，希望协助签到和院内流程引导。",
      status: "待确认",
      assignedStaff: "",
      feeAmount: 120,
      feeStatus: "待确认",
      feeNote: "待医生确认检查陪同费用。",
      confirmationCode: "",
      confirmationStatus: "待确认",
      confirmedAt: "",
      confirmedBy: "",
      followupId: "",
      followupDate: "",
      followupCreatedAt: "",
      arrangedAt: "",
      startedAt: "",
      arrivedAt: "",
      completedAt: "",
      timeline: [
        { id: "ESCTL-10", stage: "待确认", label: "医生已录入陪诊单", at: "2026-04-12T09:20:00.000Z", by: "张明炜", note: "复查 MRI 与抽血项目较多，希望协助签到和院内流程引导。" },
      ],
      createdAt: "2026-04-12T09:20:00.000Z",
      createdBy: "doctor001",
      updatedAt: "2026-04-12T09:20:00.000Z",
      handledBy: "",
      handledAt: "",
    },
  ],
  escortStaffSchedules: [
    {
      id: "ESCS-20260410-01",
      staffName: "李护士",
      role: "护士",
      phone: "139 6666 1001",
      date: "2026-04-10",
      period: "上午",
      department: "头颈放疗门诊",
      capacity: 3,
      note: "负责门诊导诊与复诊陪同。",
      status: "已排班",
      createdAt: "2026-04-09T15:00:00.000Z",
      updatedAt: "2026-04-09T15:00:00.000Z",
    },
    {
      id: "ESCS-20260413-02",
      staffName: "王敏",
      role: "陪诊员",
      phone: "139 6666 1002",
      date: "2026-04-13",
      period: "下午",
      department: "影像复查中心",
      capacity: 2,
      note: "负责影像中心复查陪同。",
      status: "已排班",
      createdAt: "2026-04-12T08:30:00.000Z",
      updatedAt: "2026-04-12T08:30:00.000Z",
    },
    {
      id: "ESCS-20260414-03",
      staffName: "周婷",
      role: "导诊员",
      phone: "139 6666 1003",
      date: "2026-04-14",
      period: "上午",
      department: "口腔护理门诊",
      capacity: 2,
      note: "负责口腔护理门诊陪同与取药协助。",
      status: "已排班",
      createdAt: "2026-04-12T08:35:00.000Z",
      updatedAt: "2026-04-12T08:35:00.000Z",
    },
  ],
  healthManuals: [
    {
      id: "MAN-20260315-01",
      title: "头颈放疗期间口腔黏膜炎护理要点",
      category: "放疗护理",
      coverImage: "",
      images: [],
      pinned: true,
      summary: "围绕口腔溃疡、咽痛、口干和进食困难，帮助患者做好放疗期口腔护理。",
      content:
        "1. 每天用温水或医生建议的漱口液轻柔漱口，保持口腔清洁。\n2. 进食尽量选择温凉、软烂、少刺激的食物，避免辛辣、过烫和粗糙食物。\n3. 出现口腔溃疡、吞咽痛加重或明显进食困难时，要及时联系医生评估是否需要用药处理。\n4. 若伴随发热、口腔出血、无法进食或体重下降明显，应尽快复诊。",
      tags: ["口腔黏膜炎", "放疗护理", "吞咽疼痛"],
      author: "张明远",
      publishedAt: "2026-03-15T09:00:00.000Z",
      updatedAt: "2026-03-15T09:00:00.000Z",
    },
    {
      id: "MAN-20260314-02",
      title: "头颈放疗患者营养补充与进食建议",
      category: "营养支持",
      coverImage: "",
      images: [],
      pinned: false,
      summary: "针对食欲下降、吞咽不适和体重波动，整理放疗期更容易执行的营养补充建议。",
      content:
        "1. 放疗期间优先保证能量和蛋白摄入，可以少量多餐，避免长时间空腹。\n2. 如果咽痛明显，可选择温凉流食、半流食或软食，比如蒸蛋、粥、营养粉和高蛋白奶昔。\n3. 每周关注体重变化，若连续下降或吃不下饭，应及时和医生或营养师沟通。\n4. 如出现明显呛咳、吞咽困难加重或脱水表现，要尽快复诊评估。",
      tags: ["营养支持", "体重管理", "进食困难"],
      author: "张明远",
      publishedAt: "2026-03-14T16:30:00.000Z",
      updatedAt: "2026-03-14T16:30:00.000Z",
    },
    {
      id: "MAN-20260313-03",
      title: "放疗后颈部皮肤反应观察与居家护理",
      category: "皮肤护理",
      coverImage: "",
      images: [],
      pinned: false,
      summary: "帮助患者识别放疗后常见皮肤发红、干燥、瘙痒和破溃风险，做好居家观察。",
      content:
        "1. 放疗区域皮肤应保持清洁、干燥，清洗时用温水轻柔处理，不要用力搓擦。\n2. 未经医生确认前，不建议自行涂抹刺激性护肤品、酒精类产品或膏药。\n3. 外出时注意防晒和衣物摩擦，尽量穿柔软、宽松、透气的衣物。\n4. 一旦出现渗液、破溃、明显疼痛或局部感染迹象，应及时复诊。",
      tags: ["皮肤反应", "居家护理", "放疗后管理"],
      author: "张明远",
      publishedAt: "2026-03-13T11:20:00.000Z",
      updatedAt: "2026-03-13T11:20:00.000Z",
    },
    {
      id: "MAN-20260312-04",
      title: "头颈放疗复诊随访前需要准备什么",
      category: "复诊随访",
      coverImage: "",
      images: [],
      pinned: false,
      summary: "整理复诊前建议准备的症状记录、检查资料和常见提问点，帮助患者更高效就诊。",
      content:
        "1. 复诊前可以先记录近期症状变化，包括疼痛、吞咽、口干、睡眠和体重变化。\n2. 带齐近期检查报告、影像资料、用药记录以及外院就诊材料，方便医生连续评估。\n3. 如果近期出现新发肿块、持续发热、明显消瘦或进食困难，要在就诊时重点说明。\n4. 可提前列出自己最关心的问题，如复查周期、饮食调整、口腔护理或下一步治疗安排。",
      tags: ["复诊准备", "随访管理", "检查资料"],
      author: "张明远",
      publishedAt: "2026-03-12T09:40:00.000Z",
      updatedAt: "2026-03-12T09:40:00.000Z",
    },
  ],
};

const body = document.body;
const loginView = document.getElementById("loginView");
const appShell = document.getElementById("appShell");
const menuList = document.getElementById("menuList");
const metricList = document.getElementById("metricList");
const appKicker = document.getElementById("appKicker");
const appTitle = document.getElementById("appTitle");
const pageActionButton = document.getElementById("pageActionButton");
const pageCrumbCard = document.querySelector(".page-crumb-card");
const pageSummaryRow = document.querySelector(".page-summary-row");
const appMain = document.querySelector(".app-main");
const moduleContent = document.getElementById("moduleContent");
const appNotice = document.getElementById("appNotice");
const headerUserName = document.getElementById("headerUserName");
const headerUserMeta = document.getElementById("headerUserMeta");
const headerUserAvatar = document.getElementById("headerUserAvatar");
const topbarSubtitle = document.getElementById("topbarSubtitle");
const logoutButton = document.getElementById("logoutButton");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const roleTabs = document.querySelectorAll(".role-tab");
const form = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const accountLabel = document.getElementById("accountLabel");
const rememberLogin = document.getElementById("rememberLogin");
const messageBox = document.getElementById("messageBox");

let appData = loadAppData();
let dataSnapshot = JSON.stringify(appData);
let dataRevision = "";
let currentRole = "doctor";
let currentUsername = "";
let activeModuleKey = "patients";
let doctorSearchKeyword = "";
let manualSearchKeyword = "";
let manualCategoryFilter = "全部";
let escortCatalogCategoryFilter = "班组服务";
let modalState = null;
let syncTimer = null;
let currentUserName = accounts.doctor.name;

const aiState = {
  config: { ...DEFAULT_AI_CONFIG },
  configLoaded: false,
  configSaving: false,
  conversations: [],
  conversationsLoaded: false,
  conversationsLoading: false,
  activeConversationId: "",
  activeMode: "health",
  historyDrawerOpen: false,
  pendingAttachments: [],
  uploading: false,
  sending: false,
};

const radiotherapyState = {
  summary: { total: 0, ccrtCount: 0, rtCount: 0, observeCount: 0 },
  examples: [],
  loaded: false,
  loading: false,
  error: "",
};
const RADIOTHERAPY_DEMO_VERSION = "20260621-radiotherapy-ui1";

const radiomicsPrognosisState = {
  summary: { total: 0, featureCount: 6, highRiskCount: 0, threshold: 0.5 },
  cases: [],
  features: [],
  selectedCaseId: "",
  loaded: false,
  loading: false,
  error: "",
};

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizePatient(patient) {
  return {
    id: "",
    username: "",
    name: "",
    gender: "男",
    age: 0,
    phone: "",
    lastVisit: "",
    createdAt: "",
    status: "已建档",
    address: "",
    history: "",
    emergency: "",
    diagnosis: "",
    alerts: [],
    appointments: [],
    reports: [],
    ...patient,
    alerts: Array.isArray(patient?.alerts) ? patient.alerts : [],
    appointments: Array.isArray(patient?.appointments) ? patient.appointments : [],
    reports: Array.isArray(patient?.reports) ? patient.reports : [],
  };
}

function normalizeHealthManual(manual) {
  return {
    id: "",
    title: "",
    category: "健康科普",
    coverImage: "",
    images: [],
    pinned: false,
    summary: "",
    content: "",
    tags: [],
    author: "张明炜",
    publishedAt: "",
    updatedAt: "",
    ...manual,
    tags: Array.isArray(manual?.tags) ? manual.tags : [],
    images: Array.isArray(manual?.images) ? manual.images : [],
    pinned: Boolean(manual?.pinned),
  };
}

function normalizeEscortRequest(request) {
  return {
    id: "",
    patientId: "",
    patientUsername: "",
    patientName: "",
    appointmentId: "",
    requestType: "门诊陪诊",
    serviceDate: "",
    department: "",
    room: "",
    meetingPoint: "",
    contactName: "",
    contactPhone: "",
    note: "",
    status: "待确认",
    assignedStaff: "",
    scheduleId: "",
    feeAmount: 0,
    feeStatus: "待确认",
    feeNote: "",
    confirmationCode: "",
    confirmationStatus: "待确认",
    confirmedAt: "",
    confirmedBy: "",
    followupId: "",
    followupDate: "",
    followupCreatedAt: "",
    arrangedAt: "",
    startedAt: "",
    arrivedAt: "",
    completedAt: "",
    cancelledAt: "",
    timeline: [],
    createdAt: "",
    createdBy: "",
    updatedAt: "",
    handledBy: "",
    handledAt: "",
    ...request,
    feeAmount: Number(request?.feeAmount || 0),
    timeline: Array.isArray(request?.timeline) ? request.timeline.map((item) => ({
      id: "",
      stage: "",
      label: "",
      at: "",
      by: "",
      note: "",
      ...item,
    })) : [],
  };
}

function normalizeEscortStaffSchedule(schedule) {
  return {
    id: "",
    staffName: "",
    role: "陪诊员",
    phone: "",
    date: "",
    period: "上午",
    department: "",
    capacity: 1,
    note: "",
    status: "已排班",
    createdAt: "",
    updatedAt: "",
    ...schedule,
    capacity: Math.max(Number(schedule?.capacity || 1), 1),
  };
}

function normalizeAppData(value) {
  return {
    patients: Array.isArray(value?.patients) ? value.patients.map((item) => normalizePatient(item)) : cloneData(DEFAULT_APP_DATA.patients),
    schedules: Array.isArray(value?.schedules) ? value.schedules : cloneData(DEFAULT_APP_DATA.schedules),
    followups: Array.isArray(value?.followups) ? value.followups : cloneData(DEFAULT_APP_DATA.followups),
    escortRequests: Array.isArray(value?.escortRequests) ? value.escortRequests.map((item) => normalizeEscortRequest(item)) : cloneData(DEFAULT_APP_DATA.escortRequests),
    escortStaffSchedules: Array.isArray(value?.escortStaffSchedules) ? value.escortStaffSchedules.map((item) => normalizeEscortStaffSchedule(item)) : cloneData(DEFAULT_APP_DATA.escortStaffSchedules),
    healthManuals: Array.isArray(value?.healthManuals) ? value.healthManuals.map((item) => normalizeHealthManual(item)) : cloneData(DEFAULT_APP_DATA.healthManuals),
  };
}

function loadAppData() {
  const currentVersion = localStorage.getItem(DATA_STORAGE_VERSION_KEY);
  if (currentVersion !== CURRENT_DATA_VERSION) {
    localStorage.setItem(DATA_STORAGE_VERSION_KEY, CURRENT_DATA_VERSION);
    localStorage.removeItem(DATA_STORAGE_KEY);
    return cloneData(DEFAULT_APP_DATA);
  }

  const cached = localStorage.getItem(DATA_STORAGE_KEY);
  if (!cached) {
    return cloneData(DEFAULT_APP_DATA);
  }

  try {
    return normalizeAppData(JSON.parse(cached));
  } catch (error) {
    localStorage.removeItem(DATA_STORAGE_KEY);
    return cloneData(DEFAULT_APP_DATA);
  }
}

function createId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTimeLabel(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getTimestamp(value) {
  const time = new Date(value || "").getTime();
  return Number.isFinite(time) ? time : 0;
}

function getSortedHealthManuals(list = appData.healthManuals) {
  return [...list].sort((left, right) => {
    if (Boolean(left.pinned) !== Boolean(right.pinned)) {
      return Number(Boolean(right.pinned)) - Number(Boolean(left.pinned));
    }
    return getTimestamp(right.publishedAt || right.updatedAt) - getTimestamp(left.publishedAt || left.updatedAt);
  });
}

function getManualCategories() {
  return ["全部", ...new Set(appData.healthManuals.map((item) => item.category).filter(Boolean))];
}

function getFilteredHealthManuals() {
  const keyword = manualSearchKeyword.trim().toLowerCase();
  return getSortedHealthManuals().filter((item) => {
    if (manualCategoryFilter !== "全部" && item.category !== manualCategoryFilter) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const haystack = [item.title, item.summary, item.content, item.author, item.category, ...(item.tags || [])].join(" ").toLowerCase();
    return haystack.includes(keyword);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatText(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function stripAiDecorators(value) {
  return String(value || "").replace(/\*\*/g, "");
}

function formatAiText(value) {
  return formatText(stripAiDecorators(value));
}

async function requestJson(url, options = {}) {
  const { skipAuthRedirect = false, ...fetchOptions } = options;
  const response = await fetch(url, {
    credentials: "same-origin",
    ...fetchOptions,
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 && !skipAuthRedirect) {
    handleUnauthorizedSession(payload.message || "登录状态已失效，请重新登录。");
  }
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.message || `请求失败（${response.status}）`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function applyServerAppData(nextPayload, options = {}) {
  const { rerender = false } = options;
  const nextData = normalizeAppData(nextPayload?.data || nextPayload || appData);
  const nextSnapshot = JSON.stringify(nextData);
  const changed = nextSnapshot !== dataSnapshot;
  appData = nextData;
  dataSnapshot = nextSnapshot;
  if (typeof nextPayload?.revision === "string" && nextPayload.revision) {
    dataRevision = nextPayload.revision;
  }
  localStorage.setItem(DATA_STORAGE_VERSION_KEY, CURRENT_DATA_VERSION);
  localStorage.setItem(DATA_STORAGE_KEY, nextSnapshot);
  if (rerender && !appShell.hidden) {
    renderApp();
  }
  return changed;
}

async function pushAppDataToServer(snapshot) {
  try {
    const payload = await requestJson("/api/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: JSON.parse(snapshot),
        revision: dataRevision,
      }),
    });
    applyServerAppData(payload);
  } catch (error) {
    if (error?.payload?.data) {
      applyServerAppData(error.payload, { rerender: true });
    }
    setAppNotice(error.message || "共享数据保存失败。", "error");
  }
}

async function pullAppDataFromServer(options = {}) {
  const { rerender = false, silent = true } = options;

  try {
    const payload = await requestJson("/api/data");
    const changed = applyServerAppData(payload, { rerender });
    return true;
  } catch (error) {
    if (!silent) {
      setAppNotice(error.message || "无法连接共享数据服务。", "error");
    }
    return false;
  }
}

function saveAppData() {
  const snapshot = JSON.stringify(appData);
  dataSnapshot = snapshot;
  localStorage.setItem(DATA_STORAGE_VERSION_KEY, CURRENT_DATA_VERSION);
  localStorage.setItem(DATA_STORAGE_KEY, snapshot);
  void pushAppDataToServer(snapshot);
}

function startSyncPolling() {
  stopSyncPolling();
  syncTimer = setInterval(async () => {
    if (appShell.hidden || modalState || aiState.uploading || aiState.sending) {
      return;
    }
    await pullAppDataFromServer({ rerender: true, silent: true });
    if (currentRole === "patient" && activeModuleKey === "aiChat") {
      await loadAiConversations(true, true);
    }
  }, 5000);
}

function stopSyncPolling() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

function clearMessage() {
  messageBox.hidden = true;
  messageBox.textContent = "";
  messageBox.className = "message-box";
}

function setMessage(text, type) {
  messageBox.hidden = false;
  messageBox.textContent = text;
  messageBox.className = "message-box";
  if (type) {
    messageBox.classList.add(type);
  }
}

function clearAppNotice() {
  appNotice.hidden = true;
  appNotice.textContent = "";
  appNotice.className = "app-notice";
}

function setAppNotice(text, type = "info") {
  appNotice.hidden = false;
  appNotice.textContent = text;
  appNotice.className = `app-notice ${type}`;
}

function clearSavedAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}

function saveAuth(role, username, persistent) {
  const payload = JSON.stringify({ role, username });
  clearSavedAuth();
  if (persistent) {
    localStorage.setItem(AUTH_STORAGE_KEY, payload);
    return;
  }
  sessionStorage.setItem(AUTH_SESSION_KEY, payload);
}

function getSavedAuth() {
  const cached = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!cached) {
    return null;
  }

  try {
    const parsed = JSON.parse(cached);
    const account = accounts[parsed.role];
    if (!account || typeof parsed.username !== "string" || !parsed.username.trim()) {
      clearSavedAuth();
      return null;
    }
    return parsed;
  } catch (error) {
    clearSavedAuth();
    return null;
  }
}

function showLoginView(role = currentRole) {
  appShell.hidden = true;
  loginView.hidden = false;
  body.classList.remove("app-mode");
  clearAppNotice();
  closeModal();
  resetActiveModule(role);
  renderRole(role);
}

function handleUnauthorizedSession(message = "登录状态已失效，请重新登录。") {
  clearSavedAuth();
  stopSyncPolling();
  clearAiState();
  showLoginView(currentRole);
  setMessage(message, "error");
}

async function requestSession() {
  return requestJson("/api/session", { skipAuthRedirect: true });
}

async function requestLogout() {
  return requestJson("/api/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    skipAuthRedirect: true,
  });
}

function renderRole(role) {
  const config = accounts[role];
  currentRole = role;
  roleTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.role === role));
  accountLabel.textContent = config.title;
  usernameInput.placeholder = config.placeholder;
  usernameInput.value = "";
  passwordInput.value = "";
  clearMessage();
}

function getModulesForRole(role) {
  return appViews[role].modules.filter((item) => item.visible !== false);
}

function getModuleConfig(role, moduleKey = activeModuleKey) {
  return getModulesForRole(role).find((item) => item.key === moduleKey) || getModulesForRole(role)[0];
}

function resetActiveModule(role) {
  activeModuleKey = getModulesForRole(role)[0].key;
}

function getStatusClass(status) {
  if (["待复诊", "待随访", "待复查", "异常", "已取消"].includes(status)) {
    return "warning";
  }
  if (["治疗中", "稳定", "已完成", "正常", "已接诊"].includes(status)) {
    return "success";
  }
  return "neutral";
}

function findPatientById(id) {
  return appData.patients.find((item) => item.id === id);
}

function getCurrentPatient() {
  return appData.patients.find((item) => item.username === currentUsername) || appData.patients[0];
}

function getSafeCurrentPatient() {
  return getCurrentPatient() || normalizePatient({});
}

function getDisplayName(role) {
  return role === "patient" ? getSafeCurrentPatient().name || appViews.patient.defaultName : currentUserName || appViews.doctor.defaultName;
}

function getUpcomingAppointment(patient) {
  const appointments = Array.isArray(patient?.appointments) ? patient.appointments : [];
  return appointments.find((item) => item.status === "已预约") || null;
}

function formatRoomLabel(room) {
  const text = String(room ?? "").trim();
  if (!text) {
    return "-";
  }
  return text.startsWith("诊室") ? text : `诊室 ${text}`;
}

function calculateProfileCompleteness(patient) {
  const currentPatient = patient || normalizePatient({});
  const fields = [currentPatient.name, currentPatient.gender, currentPatient.age, currentPatient.phone, currentPatient.address, currentPatient.history, currentPatient.emergency, currentPatient.diagnosis];
  const filled = fields.filter((item) => String(item ?? "").trim()).length;
  return `${Math.round((filled / fields.length) * 100)}%`;
}

function getAiConversationCountToday() {
  const today = getTodayString();
  return aiState.conversations.flatMap((item) => item.messages || []).filter((item) => item.role === "user" && String(item.createdAt || "").startsWith(today)).length;
}

function buildMetrics(role, moduleKey) {
  if (role === "doctor" && moduleKey === "patients") {
    return [
      { label: "病人总数", value: String(appData.patients.length) },
      { label: "待复诊", value: String(appData.patients.filter((item) => item.status === "待复诊").length) },
      { label: "今日新增", value: String(appData.patients.filter((item) => item.createdAt === getTodayString()).length) },
    ];
  }

  if (role === "doctor" && moduleKey === "doctorAppointments") {
    const doctorAppointments = appData.patients.flatMap((patient) => patient.appointments.map((appointment) => ({ ...appointment, patientId: patient.id, patientName: patient.name })));
    return [
      { label: "预约总数", value: String(doctorAppointments.length) },
      { label: "待处理", value: String(doctorAppointments.filter((item) => item.status === "已预约").length) },
      { label: "已接诊", value: String(doctorAppointments.filter((item) => item.status === "已接诊").length) },
    ];
  }

  if (role === "doctor" && moduleKey === "doctorReports") {
    const doctorReports = appData.patients.flatMap((patient) => patient.reports.map((report) => ({ ...report, patientId: patient.id, patientName: patient.name })));
    return [
      { label: "报告总数", value: String(doctorReports.length) },
      { label: "异常结果", value: String(doctorReports.filter((item) => item.result !== "正常").length) },
      { label: "今日发送", value: String(doctorReports.filter((item) => String(item.sharedAt || item.date || "").startsWith(getTodayString())).length) },
    ];
  }

  if (role === "doctor" && moduleKey === "tregPrognosis") {
    return [
      { label: "分层模型", value: "Treg" },
      { label: "指标数量", value: "5" },
      { label: "输出结果", value: "低 / 中 / 高" },
    ];
  }

  if (role === "doctor" && moduleKey === "radiomicsPrognosis") {
    return [
      { label: "病例总数", value: String(radiomicsPrognosisState.summary.total || radiomicsPrognosisState.cases.length || 0) },
      { label: "特征数量", value: String(radiomicsPrognosisState.summary.featureCount || 6) },
      { label: "高风险", value: String(radiomicsPrognosisState.summary.highRiskCount || 0) },
    ];
  }

  if (moduleKey === "healthManuals") {
    const latestManual = getSortedHealthManuals()[0];
    return role === "doctor"
      ? [
          { label: "文章总数", value: String(appData.healthManuals.length) },
          { label: "置顶文章", value: String(appData.healthManuals.filter((item) => item.pinned).length) },
          { label: "今日发布", value: String(appData.healthManuals.filter((item) => String(item.publishedAt || "").startsWith(getTodayString())).length) },
        ]
      : [
          { label: "可读文章", value: String(appData.healthManuals.length) },
          { label: "置顶推荐", value: String(appData.healthManuals.filter((item) => item.pinned).length) },
          { label: "最新发布", value: latestManual?.publishedAt ? formatDateTimeLabel(latestManual.publishedAt) : "-" },
        ];
  }

  if (role === "doctor" && moduleKey === "aiConfig") {
    return [
      { label: "模型状态", value: aiState.config.isConfigured ? "已配置" : "未配置" },
      { label: "联网搜索", value: aiState.config.enableWebSearch ? "已开启" : "已关闭" },
      { label: "最近更新", value: aiState.config.updatedAt ? formatDateTimeLabel(aiState.config.updatedAt) : "-" },
    ];
  }

  if (role === "doctor" && moduleKey === "radiotherapyDecision") {
    return [];
  }

  if (role === "doctor" && moduleKey === "schedule") {
    return [
      { label: "排班数量", value: String(appData.schedules.length) },
      { label: "总号源", value: String(appData.schedules.reduce((sum, item) => sum + Number(item.capacity || 0), 0)) },
      { label: "已预约", value: String(appData.schedules.reduce((sum, item) => sum + Number(item.booked || 0), 0)) },
    ];
  }

  if (role === "doctor" && moduleKey === "followups") {
    return [
      { label: "待随访", value: String(appData.followups.filter((item) => item.status === "待随访").length) },
      { label: "已完成", value: String(appData.followups.filter((item) => item.status === "已完成").length) },
      { label: "今日到期", value: String(appData.followups.filter((item) => item.dueDate === getTodayString()).length) },
    ];
  }

  if (role === "doctor" && moduleKey === "escortManagement") {
    return [
      { label: "陪诊总数", value: String((appData.escortRequests || []).length) },
      { label: "待确认", value: String((appData.escortRequests || []).filter((item) => item.status === "待确认").length) },
      { label: "进行中", value: String((appData.escortRequests || []).filter((item) => ["已安排", "进行中", "已到达"].includes(item.status)).length) },
      { label: "陪诊排班", value: String((appData.escortStaffSchedules || []).filter((item) => item.status !== "停用").length) },
    ];
  }

  const patient = getSafeCurrentPatient();
  if (moduleKey === "aiChat") {
    return [
      { label: "对话总数", value: String(aiState.conversations.length) },
      { label: "今日提问", value: String(getAiConversationCountToday()) },
      { label: "待发送附件", value: String(aiState.pendingAttachments.length) },
    ];
  }

  if (moduleKey === "profile") {
    return [
      { label: "档案完整度", value: calculateProfileCompleteness(patient) },
      { label: "最近就诊", value: patient.lastVisit || "-" },
      { label: "下次预约", value: getUpcomingAppointment(patient)?.date || "-" },
    ];
  }

  if (moduleKey === "appointments") {
    return [
      { label: "预约总数", value: String(patient.appointments.length) },
      { label: "已预约", value: String(patient.appointments.filter((item) => item.status === "已预约").length) },
      { label: "已取消", value: String(patient.appointments.filter((item) => item.status === "已取消").length) },
    ];
  }

  if (moduleKey === "escortService") {
    return [
      { label: "陪诊总数", value: String((appData.escortRequests || []).length) },
      { label: "待确认", value: String((appData.escortRequests || []).filter((item) => item.status === "待确认").length) },
      { label: "已安排", value: String((appData.escortRequests || []).filter((item) => ["已安排", "进行中", "已到达"].includes(item.status)).length) },
      { label: "待确认单", value: String((appData.escortRequests || []).filter((item) => item.confirmationStatus !== "已确认" && item.status === "已完成").length) },
    ];
  }

  return [
    { label: "报告总数", value: String(patient.reports.length) },
    { label: "异常结果", value: String(patient.reports.filter((item) => item.result !== "正常").length) },
    { label: "最近报告", value: patient.reports[0]?.date || "-" },
  ];
}

function renderMenu(role) {
  menuList.innerHTML = getModulesForRole(role)
    .map((item) => {
      const activeClass = item.key === activeModuleKey ? " active" : "";
      return `
        <button class="menu-item${activeClass}" type="button" data-module-key="${item.key}">
          <span class="menu-icon">${escapeHtml(item.icon)}</span>
          <span class="menu-copy">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.desc)}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderMetrics(role) {
  metricList.innerHTML = buildMetrics(role, activeModuleKey)
    .map((item) => `<div class="metric-pill"><span>${escapeHtml(item.label)}：</span><strong>${escapeHtml(item.value)}</strong></div>`)
    .join("");
}

function renderChrome(role) {
  const module = getModuleConfig(role);
  const isAiChatView = role === "patient" && activeModuleKey === "aiChat";
  const isRadiotherapyView = role === "doctor" && activeModuleKey === "radiotherapyDecision";
  appKicker.textContent = appViews[role].roleLabel;
  appTitle.textContent = module.title;
  let actionText = module.actionText;
  if (role === "patient" && activeModuleKey === "appointments") {
    actionText = "提交预约";
  } else if (role === "patient" && activeModuleKey === "profile") {
    actionText = "医生端维护";
  } else if (role === "patient" && activeModuleKey === "healthManuals") {
    actionText = "医生发布";
  } else if (role === "patient" && activeModuleKey === "reports") {
    actionText = "医生端发送";
  }
  pageActionButton.textContent = actionText;
  pageActionButton.hidden = isRadiotherapyView || (role === "patient" && (activeModuleKey === "profile" || activeModuleKey === "healthManuals" || activeModuleKey === "reports"));
  appShell.classList.toggle("ai-chat-shell", isAiChatView);
  body.classList.toggle("ai-chat-page", isAiChatView);
  pageCrumbCard.hidden = isAiChatView || isRadiotherapyView;
  pageSummaryRow.hidden = isAiChatView || isRadiotherapyView;
  appMain.classList.toggle("ai-main-screen", isAiChatView);
  moduleContent.classList.toggle("ai-page-panel", isAiChatView);
  moduleContent.classList.toggle("radiotherapy-page-panel", isRadiotherapyView);
  headerUserName.textContent = getDisplayName(role);
  headerUserMeta.textContent = String(appViews[role].headerMeta || "").replace(/^角色：/, "");
  headerUserAvatar.textContent = appViews[role].avatar;
  topbarSubtitle.textContent = appViews[role].subtitle;
}

function renderDoctorPatientsModule() {
  const keyword = doctorSearchKeyword.trim().toLowerCase();
  const filteredPatients = appData.patients.filter((item) => `${item.id}${item.name}${item.phone}`.toLowerCase().includes(keyword));
  const rows = filteredPatients.length
    ? filteredPatients
        .map((item) => {
          const hasPendingAppointment = Array.isArray(item.appointments) && item.appointments.some((appointment) => appointment.status === "已预约");
          return `
          <tr>
            <td>${escapeHtml(item.id)}</td>
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(`${item.gender} / ${item.age}`)}</td>
            <td>${escapeHtml(item.phone)}</td>
            <td>${escapeHtml(item.lastVisit || "-")}</td>
            <td><span class="table-tag ${getStatusClass(item.status)}">${escapeHtml(item.status)}</span></td>
            <td>
              <div class="table-actions">
                <button class="table-action" type="button" data-action="view-patient" data-id="${item.id}">查看</button>
                <button class="table-action" type="button" data-action="edit-patient" data-id="${item.id}">编辑</button>
                <button class="table-action" type="button" data-action="open-quick-followup" data-id="${item.id}" ${hasPendingAppointment ? "disabled" : ""}>${hasPendingAppointment ? "已预约" : "预约复诊"}</button>
                <button class="table-action danger" type="button" data-action="delete-patient" data-id="${item.id}">删除</button>
              </div>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7"><div class="empty-state"><strong>没有匹配的病人信息</strong><p>请更换搜索关键词，或从右上角新增病人档案。</p></div></td></tr>`;

  const reminders = appData.followups
    .filter((item) => item.status === "待随访")
    .slice(0, 3)
    .map((item) => `<article class="info-item"><span>${escapeHtml(item.method)}随访</span><strong>${escapeHtml(item.patientName)}</strong><p>${escapeHtml(`${item.dueDate} 需要处理：${item.note}`)}</p></article>`)
    .join("");

  return `
    <div class="panel-head"><div><h2>病人信息管理</h2><p>集中查看病人基础资料、最近就诊、联系方式和随访状态。</p></div></div>
    <div class="panel-grid">
      <section class="panel-card">
        <div class="section-head">
          <div><h3>病人列表</h3><p>可按姓名、手机号或病历号搜索。</p></div>
          <input id="patientSearch" class="search-input" type="text" value="${escapeHtml(doctorSearchKeyword)}" placeholder="搜索姓名 / 电话 / 病历号">
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>病历号</th><th>姓名</th><th>性别 / 年龄</th><th>联系电话</th><th>最近就诊</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
      <aside class="panel-card">
        <div class="section-head section-head-compact"><div><h3>重点提醒</h3><p>自动提取当前待处理的随访事项。</p></div></div>
        <div class="info-stack">${reminders || `<div class="empty-state"><strong>暂无重点提醒</strong><p>当前没有待处理的随访任务。</p></div>`}</div>
      </aside>
    </div>`;
}

function renderDoctorAppointmentsModule() {
  const doctorAppointments = appData.patients.flatMap((patient) => patient.appointments.map((appointment) => ({ ...appointment, patientId: patient.id, patientName: patient.name })));
  const items = doctorAppointments.length
    ? doctorAppointments
        .map((item) => `
          <article class="appointment-card">
            <span>${escapeHtml(item.date)}</span>
            <strong>${escapeHtml(item.patientName)}</strong>
            <p>${escapeHtml(`${item.department} / ${formatRoomLabel(item.room)} / 状态：${item.status}`)}</p>
            <div class="card-meta"><span>病历号 <b>${escapeHtml(item.patientId)}</b></span></div>
            <div class="card-actions">
              <button class="secondary-button" type="button" data-action="edit-doctor-appointment" data-patient-id="${item.patientId}" data-id="${item.id}">编辑</button>
              <button class="secondary-button" type="button" data-action="toggle-doctor-appointment" data-patient-id="${item.patientId}" data-id="${item.id}">${item.status === "已接诊" ? "恢复已预约" : "标记已接诊"}</button>
              <button class="danger-button" type="button" data-action="delete-doctor-appointment" data-patient-id="${item.patientId}" data-id="${item.id}">删除</button>
            </div>
          </article>`)
        .join("")
    : `<div class="empty-state"><strong>当前暂无病人预约</strong><p>病人端提交预约后，这里会自动同步显示。</p></div>`;
  return `<div class="panel-head"><div><h2>预约管理</h2><p>病人提交的预约会汇总到这里，医生端可以统一查看、调整和接诊。</p></div></div><div class="appointment-list">${items}</div>`;
}

function renderDoctorReportsModule() {
  const doctorReports = appData.patients.flatMap((patient) =>
    patient.reports.map((report) => ({
      ...report,
      patientId: patient.id,
      patientName: patient.name,
    })),
  );

  const items = doctorReports.length
    ? doctorReports
        .map(
          (item) => `
          <article class="report-card">
            <span>${escapeHtml(item.date)}</span>
            <strong>${escapeHtml(item.name)}</strong>
            <p>${escapeHtml(item.summary || "暂无摘要")}</p>
            <div class="card-meta">
              <span>病人 <b>${escapeHtml(item.patientName)}</b></span>
              <span>结果 <b>${escapeHtml(item.result)}</b></span>
            </div>
            <div class="card-meta">
              <span>病历号 <b>${escapeHtml(item.patientId)}</b></span>
              <span>发送信息 <b>${escapeHtml(item.sharedBy ? `${item.sharedBy} / ${formatDateTimeLabel(item.sharedAt || item.date)}` : "已同步到病人端")}</b></span>
            </div>
            <div class="card-actions">
              <button class="secondary-button" type="button" data-action="edit-doctor-report" data-patient-id="${item.patientId}" data-id="${item.id}">编辑</button>
              <button class="secondary-button" type="button" data-action="resend-doctor-report" data-patient-id="${item.patientId}" data-id="${item.id}">发给病人</button>
              <button class="danger-button" type="button" data-action="delete-doctor-report" data-patient-id="${item.patientId}" data-id="${item.id}">删除</button>
            </div>
          </article>`,
        )
        .join("")
    : `<div class="empty-state"><strong>当前暂无检查报告</strong><p>医生端可从右上角录入新报告并发送给病人。</p></div>`;

  return `<div class="panel-head"><div><h2>报告管理</h2><p>检查报告由医生端统一录入、修改并发送给病人，病人端仅可查看。</p></div></div><div class="report-list">${items}</div>`;
}

function renderHealthManualTags(tags = []) {
  return Array.isArray(tags) && tags.length
    ? `<div class="manual-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";
}

function renderManualCategoryFilters() {
  return `<div class="manual-category-row">${getManualCategories()
    .map(
      (category) =>
        `<button class="manual-category-chip${manualCategoryFilter === category ? " active" : ""}" type="button" data-action="set-manual-category" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`,
    )
    .join("")}</div>`;
}

function renderManualToolbar(totalCount, role) {
  return `
    <section class="panel-card manual-toolbar">
      <div class="manual-toolbar-top">
        <div>
          <strong>${role === "doctor" ? "内容管理" : "阅读筛选"}</strong>
          <span>${role === "doctor" ? `当前共 ${totalCount} 篇文章，可按分类和关键词管理。` : `当前共 ${totalCount} 篇文章，可按分类和关键词快速查找。`}</span>
        </div>
        <div class="manual-toolbar-actions">
          <input id="manualSearch" class="search-input" type="text" value="${escapeHtml(manualSearchKeyword)}" placeholder="搜索标题 / 摘要 / 标签 / 正文">
          <button class="secondary-button" type="button" data-action="clear-manual-filters">清空筛选</button>
        </div>
      </div>
      ${renderManualCategoryFilters()}
    </section>`;
}

function getManualCoverFallback(item) {
  const category = escapeHtml(item.category || "健康科普");
  const title = escapeHtml(item.title || "健康手册");
  return `<div class="manual-cover-fallback"><span>${category}</span><strong>${title}</strong><em>健康手册</em></div>`;
}

function renderManualCover(item) {
  const image = String(item.coverImage || "").trim();
  return `<div class="manual-cover${image ? " has-image" : ""}">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}">` : getManualCoverFallback(item)}${item.pinned ? `<span class="manual-pin-badge">置顶</span>` : ""}</div>`;
}

function renderManualImages(images = [], compact = false) {
  if (!Array.isArray(images) || !images.length) {
    return "";
  }

  return `<div class="manual-image-grid${compact ? " compact" : ""}">${images
    .map(
      (image, index) =>
        `<a class="manual-image-card" href="${escapeHtml(image.url || image)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(image.url || image)}" alt="${escapeHtml(image.originalName || `插图 ${index + 1}`)}"></a>`,
    )
    .join("")}</div>`;
}

function renderManualDraftImages() {
  const images = modalState?.draft?.images || [];
  if (!images.length) {
    return `<div class="manual-upload-empty">还没有插图，点击“插入图片”后会自动上传并附加到文章中。</div>`;
  }

  return `<div class="manual-editor-grid">${images
    .map(
      (image, index) => `<article class="manual-editor-card">
        <img src="${escapeHtml(image.url || image)}" alt="${escapeHtml(image.originalName || `插图 ${index + 1}`)}">
        <div>
          <strong>${escapeHtml(image.originalName || `插图 ${index + 1}`)}</strong>
          <span>${escapeHtml(image.mimeType || "图片")}</span>
        </div>
        <button type="button" data-action="remove-manual-image" data-index="${index}">移除</button>
      </article>`,
    )
    .join("")}</div>`;
}

function renderDoctorHealthManualsModule() {
  const manuals = getFilteredHealthManuals();
  const items = manuals.length
    ? manuals
        .map(
          (item) => `
          <article class="manual-card">
            ${renderManualCover(item)}
            <div class="manual-card-head">
              <div>
                <span>${escapeHtml(formatDateTimeLabel(item.publishedAt))}</span>
                <strong>${escapeHtml(item.title)}</strong>
              </div>
              <span class="manual-author">${escapeHtml(item.author || "医生端")}</span>
            </div>
            <p class="manual-summary">${escapeHtml(item.summary || "暂无摘要")}</p>
            ${renderHealthManualTags(item.tags)}
            ${renderManualImages(item.images, true)}
            <div class="manual-content-preview">${formatText(String(item.content || "").slice(0, 140))}${String(item.content || "").length > 140 ? "..." : ""}</div>
            <div class="card-actions">
              <button class="secondary-button" type="button" data-action="view-manual" data-id="${item.id}">查看</button>
              <button class="secondary-button" type="button" data-action="edit-manual" data-id="${item.id}">编辑</button>
              <button class="secondary-button" type="button" data-action="toggle-manual-pinned" data-id="${item.id}">${item.pinned ? "取消置顶" : "设为置顶"}</button>
              <button class="danger-button" type="button" data-action="delete-manual" data-id="${item.id}">删除</button>
            </div>
          </article>`,
        )
        .join("")
    : `<div class="empty-state"><strong>没有匹配的健康手册文章</strong><p>请更换关键词或分类，或者从右上角发布新文章。</p></div>`;

  return `<div class="panel-head"><div><h2>健康手册</h2><p>医生端可发布头颈放疗护理、营养支持和复诊随访相关文章，病人端会实时同步查看。</p></div></div>${renderManualToolbar(appData.healthManuals.length, "doctor")}<div class="manual-grid">${items}</div>`;
}

function renderPatientHealthManualsModule() {
  const manuals = getFilteredHealthManuals();
  const featured = getSortedHealthManuals().find((item) => item.pinned) || getSortedHealthManuals()[0];
  const items = manuals.length
    ? manuals
        .map(
          (item) => `
          <article class="manual-card patient manual-card-lite" data-action="view-manual" data-id="${item.id}" data-keyboard-activate="true" role="button" tabindex="0" aria-label="${escapeHtml(`阅读文章：${item.title}`)}">
            ${renderManualCover(item)}
            <div class="manual-card-head">
              <div>
                <span>${escapeHtml(formatDateTimeLabel(item.publishedAt))}</span>
                <strong>${escapeHtml(item.title)}</strong>
              </div>
              <span class="manual-author">${escapeHtml(item.author || "医生")}</span>
            </div>
            <p class="manual-summary">${escapeHtml(item.summary || "暂无摘要")}</p>
            ${renderHealthManualTags(item.tags)}
            ${renderManualImages(item.images, true)}
            <div class="card-actions">
              <button class="secondary-button" type="button" data-action="view-manual" data-id="${item.id}">阅读全文</button>
            </div>
          </article>`,
        )
        .join("")
    : `<div class="empty-state"><strong>没有匹配的健康手册文章</strong><p>请更换关键词或分类，或者稍后查看医生发布的新内容。</p></div>`;

  return `
    <div class="panel-head"><div><h2>健康手册</h2><p>查看医生发布的头颈放疗护理、营养补充、皮肤管理和复诊准备文章。</p></div></div>
    ${renderManualToolbar(appData.healthManuals.length, "patient")}
    ${featured ? `<section class="panel-card manual-feature">${renderManualCover(featured)}<span>${featured.pinned ? "置顶推荐" : "最新推荐"}</span><h3>${escapeHtml(featured.title)}</h3><p>${escapeHtml(featured.summary || "")}</p><div class="card-actions"><button class="primary-action" type="button" data-action="view-manual" data-id="${featured.id}">立即查看</button></div></section>` : ""}
    <div class="manual-grid">${items}</div>`;
}

function renderHealthManualsModule() {
  return currentRole === "doctor" ? renderDoctorHealthManualsModule() : renderPatientHealthManualsModule();
}

function renderDoctorRadiotherapyDecisionModule() {
  return `
    ${radiotherapyState.error ? `<div class="app-notice error radiotherapy-inline-notice">${escapeHtml(radiotherapyState.error)}</div>` : ""}
    <div class="doctor-tool-frame-card radiotherapy-portal-frame">
      <iframe
        class="doctor-tool-iframe radiotherapy-portal-iframe"
        data-radiotherapy-version="${RADIOTHERAPY_DEMO_VERSION}"
        src="/radiotherapy-demo.html?embedded=1&v=${RADIOTHERAPY_DEMO_VERSION}"
        title="放疗适应证决策模块"
        loading="lazy"
        style="display:block;width:100%;min-height:1280px;border:0;background:transparent;"
      ></iframe>
    </div>`;
}

const TREG_DEMO_VALUES = {
  patientId: "MR-20260301",
  tregPercent: 8.6,
  cd8TregRatio: 2.2,
  foxp3Score: 72,
  nlr: 3.8,
  stage: "III",
};

const TREG_EMPTY_VALUES = {
  patientId: "",
  tregPercent: "",
  cd8TregRatio: "",
  foxp3Score: "",
  nlr: "",
  stage: "",
};

let tregPrognosisState = {
  inputs: { ...TREG_DEMO_VALUES },
  result: null,
  empty: false,
};

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function normalizeTregInputs(raw = {}) {
  return {
    patientId: String(raw.patientId || TREG_DEMO_VALUES.patientId).trim() || TREG_DEMO_VALUES.patientId,
    tregPercent: clampNumber(raw.tregPercent, 0, 30),
    cd8TregRatio: clampNumber(raw.cd8TregRatio, 0, 12),
    foxp3Score: clampNumber(raw.foxp3Score, 0, 100),
    nlr: clampNumber(raw.nlr, 0, 20),
    stage: ["I", "II", "III", "IV"].includes(String(raw.stage || "").toUpperCase()) ? String(raw.stage).toUpperCase() : TREG_DEMO_VALUES.stage,
  };
}

function scoreTregFeature(value, lowCut, highCut, inverse = false) {
  const bounded = clampNumber(value, lowCut, highCut);
  const ratio = (bounded - lowCut) / Math.max(0.001, highCut - lowCut);
  return inverse ? 1 - ratio : ratio;
}

function calculateTregRisk(rawInputs = {}) {
  const inputs = normalizeTregInputs(rawInputs);
  const stageScoreMap = { I: 0.08, II: 0.24, III: 0.58, IV: 0.88 };
  const components = [
    { key: "tregPercent", label: "CD4+CD25+FoxP3+ Treg比例", value: inputs.tregPercent, score: scoreTregFeature(inputs.tregPercent, 3, 14), weight: 0.28, unit: "%" },
    { key: "cd8TregRatio", label: "CD8/Treg比值", value: inputs.cd8TregRatio, score: scoreTregFeature(inputs.cd8TregRatio, 1.2, 6.5, true), weight: 0.22, unit: "" },
    { key: "foxp3Score", label: "FoxP3表达评分", value: inputs.foxp3Score, score: scoreTregFeature(inputs.foxp3Score, 20, 90), weight: 0.2, unit: "" },
    { key: "nlr", label: "NLR", value: inputs.nlr, score: scoreTregFeature(inputs.nlr, 1.5, 6.5), weight: 0.15, unit: "" },
    { key: "stage", label: "临床分期", value: inputs.stage, score: stageScoreMap[inputs.stage], weight: 0.15, unit: "" },
  ];
  const weighted = components.reduce((sum, item) => sum + item.score * item.weight, 0);
  const riskScore = Math.round(clampNumber(weighted * 100, 0, 100));
  const stratum = riskScore >= 68 ? "高风险" : riskScore >= 38 ? "中风险" : "低风险";
  const tone = riskScore >= 68 ? "high" : riskScore >= 38 ? "medium" : "low";
  const recommendation =
    tone === "high"
      ? "建议纳入强化随访队列，结合影像复查、营养炎症指标和治疗反应进行动态评估。"
      : tone === "medium"
        ? "建议常规随访基础上增加免疫炎症指标复测，关注Treg比例和CD8/Treg比值变化。"
        : "当前免疫风险较低，按标准随访节奏观察，获得新检验结果后可重新分层。";
  return { inputs, components, riskScore, stratum, tone, recommendation };
}

function renderTregRiskResult(result = calculateTregRisk(TREG_DEMO_VALUES)) {
  const componentBars = result.components
    .map((item) => {
      const percent = Math.round(clampNumber(item.score * 100, 0, 100));
      return `
        <div class="treg-feature-bar">
          <div><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(`${item.value}${item.unit}`)}</strong></div>
          <div class="treg-bar-track"><i style="width:${percent}%"></i></div>
          <em>${percent}</em>
        </div>`;
    })
    .join("");

  return `
    <article class="treg-risk-card ${escapeHtml(result.tone)}">
      <span>综合风险评分</span>
      <strong>${escapeHtml(String(result.riskScore))}</strong>
      <b>${escapeHtml(result.stratum)}</b>
      <p>${escapeHtml(result.recommendation)}</p>
      <div class="treg-risk-scale"><i style="width:${result.riskScore}%"></i></div>
    </article>
    <section class="panel-card treg-feature-bars">
      <div class="section-head section-head-compact"><div><h3>分层因子贡献</h3><p>分数越高表示该项越偏向不良预后方向。</p></div></div>
      ${componentBars}
    </section>`;
}

function renderTregPrognosisModule() {
  const result = tregPrognosisState.empty
    ? null
    : tregPrognosisState.result || calculateTregRisk(tregPrognosisState.inputs);
  const inputs = tregPrognosisState.empty ? { ...TREG_EMPTY_VALUES } : normalizeTregInputs(tregPrognosisState.inputs);
  return `
    <div class="panel-head">
      <div>
        <h2>Treg预后分层</h2>
        <p>基于Treg比例、CD8/Treg比值、FoxP3表达、NLR和临床分期生成探索性预后风险分层。</p>
      </div>
    </div>
    <div class="treg-stratification-grid">
      <section class="panel-card">
        <div class="section-head section-head-compact">
          <div><h3>指标录入</h3><p>输入患者免疫微环境和炎症指标，点击生成分层结果。</p></div>
        </div>
        <div class="form-grid treg-input-grid">
          <label><span>病例编号</span><input data-treg-input="patientId" value="${escapeHtml(String(inputs.patientId))}"></label>
          <label><span>Treg比例(%)</span><input data-treg-input="tregPercent" type="number" step="0.1" min="0" max="30" value="${escapeHtml(String(inputs.tregPercent))}"></label>
          <label><span>CD8/Treg比值</span><input data-treg-input="cd8TregRatio" type="number" step="0.1" min="0" max="12" value="${escapeHtml(String(inputs.cd8TregRatio))}"></label>
          <label><span>FoxP3评分</span><input data-treg-input="foxp3Score" type="number" step="1" min="0" max="100" value="${escapeHtml(String(inputs.foxp3Score))}"></label>
          <label><span>NLR</span><input data-treg-input="nlr" type="number" step="0.1" min="0" max="20" value="${escapeHtml(String(inputs.nlr))}"></label>
          <label><span>临床分期</span><select data-treg-input="stage"><option value="" ${inputs.stage ? "" : "selected"}>请选择</option>${["I", "II", "III", "IV"].map((stage) => `<option value="${stage}" ${stage === inputs.stage ? "selected" : ""}>${stage}</option>`).join("")}</select></label>
        </div>
        <div class="card-actions treg-actions">
          <button class="secondary-button" type="button" data-action="treg-fill-demo">填入示例</button>
          <button class="secondary-button" type="button" data-action="treg-reset">清空</button>
          <button class="primary-action" type="button" data-action="treg-calculate">生成分层</button>
        </div>
      </section>
      <div class="treg-result-stack" data-treg-result>${result ? renderTregRiskResult(result) : `<div class="empty-state"><strong>等待生成分层</strong><p>录入Treg相关指标后点击生成分层。</p></div>`}</div>
    </div>`;
}

function readTregFormInputs() {
  const values = {};
  moduleContent.querySelectorAll("[data-treg-input]").forEach((input) => {
    values[input.dataset.tregInput] = input.value;
  });
  tregPrognosisState.inputs = { ...tregPrognosisState.inputs, ...values };
  tregPrognosisState.empty = false;
  return values;
}

function writeTregFormInputs(values = TREG_DEMO_VALUES) {
  const normalized = normalizeTregInputs(values);
  tregPrognosisState = { inputs: { ...normalized }, result: null, empty: false };
  Object.entries(normalized).forEach(([key, value]) => {
    const input = moduleContent.querySelector(`[data-treg-input="${key}"]`);
    if (input) input.value = value;
  });
}

function updateTregResult(result = calculateTregRisk(readTregFormInputs())) {
  tregPrognosisState = { inputs: { ...result.inputs }, result, empty: false };
  const resultNode = moduleContent.querySelector("[data-treg-result]");
  if (resultNode) {
    resultNode.innerHTML = renderTregRiskResult(result);
  }
}

function handleTregInputState(event) {
  const input = event.target.closest?.("[data-treg-input]");
  if (!input || activeModuleKey !== "tregPrognosis") {
    return;
  }
  tregPrognosisState.inputs = {
    ...tregPrognosisState.inputs,
    [input.dataset.tregInput]: input.value,
  };
  tregPrognosisState.result = null;
  tregPrognosisState.empty = false;
}

function formatRadiomicsProbability(value) {
  const probability = Number(value || 0);
  return Number.isFinite(probability) ? probability.toFixed(3) : "0.000";
}

function getRadiomicsProbabilityLabel(value) {
  const probability = Number(value || 0);
  return probability > 0.5 ? "Treg浸润丰度高，预后较差" : "Treg浸润丰度低，预后较好";
}

function getSelectedRadiomicsCase() {
  return radiomicsPrognosisState.cases.find((item) => item.caseId === radiomicsPrognosisState.selectedCaseId) || radiomicsPrognosisState.cases[0] || null;
}

function renderRadiomicsWorkflow() {
  return `
    <section class="radiomics-workflow-strip">
      ${["DICOM导入", "N4偏置校正", "重采样", "靶区勾画", "特征提取", "Treg概率预测", "报告生成"].map((step, index) => `
        <span><b>${index + 1}</b>${escapeHtml(step)}</span>
      `).join("")}
    </section>`;
}

function renderRadiomicsCaseRows() {
  const selected = getSelectedRadiomicsCase();
  return radiomicsPrognosisState.cases
    .map((item) => {
      const active = selected?.caseId === item.caseId ? " active" : "";
      const riskClass = item.tregProbability > 0.5 ? "high" : "low";
      return `
        <button class="radiomics-case-row${active}" type="button" data-action="select-radiomics-case" data-id="${escapeHtml(item.caseId)}">
          <span>${escapeHtml(item.caseId)}</span>
          <strong>${formatRadiomicsProbability(item.tregProbability)}</strong>
          <em class="${riskClass}">${escapeHtml(item.abundance || (item.tregProbability > 0.5 ? "Treg浸润丰度高" : "Treg浸润丰度低"))}</em>
        </button>`;
    })
    .join("");
}

function renderRadiomicsMriPreview(caseItem) {
  if (caseItem?.mriPreviewImageUrl) {
    return `
      <figure class="radiomics-mri-preview">
        <img src="${escapeHtml(caseItem.mriPreviewImageUrl)}" alt="${escapeHtml(caseItem.caseId || "case")} MRI segmentation preview">
      </figure>`;
  }
  return `
    <div class="radiomics-mri-preview radiomics-mri-preview-empty">
      <strong>暂无MRI预览</strong>
      <span>请先运行 radiomics_pipeline/scripts/generate_mri_preview_assets.py 生成病例四视图。</span>
    </div>`;
}

function renderRadiomicsFeatureChart(caseItem) {
  const features = Array.isArray(caseItem?.featureValues) ? caseItem.featureValues : [];
  if (!features.length) {
    return `<div class="empty-state compact"><strong>暂无特征数据</strong></div>`;
  }

  return `
    <section class="radiomics-feature-chart">
      <div class="section-head section-head-compact">
        <div><h3>Feature z-score Compared with Cohort</h3><p>按当前病例相对队列均值的 z-score 展示六项影像组学特征。</p></div>
      </div>
      <div class="radiomics-feature-bars">
        ${features.map((feature) => {
          const zScore = Number(feature.zScore || 0);
          const width = Math.min(100, Math.abs(zScore) / 4 * 100);
          const className = zScore >= 0 ? "positive" : "negative";
          return `
            <div class="radiomics-feature-row ${className}">
              <span>${escapeHtml(feature.label || feature.key)}</span>
              <div class="radiomics-zbar"><i style="width:${width}%"></i></div>
              <em>${zScore.toFixed(2)}</em>
            </div>`;
        }).join("")}
      </div>
    </section>`;
}

function getRadiomicsFeatureAdvice(caseItem) {
  const features = Array.isArray(caseItem?.featureValues) ? caseItem.featureValues : [];
  const top = [...features]
    .filter((item) => Number.isFinite(Number(item.zScore)))
    .sort((left, right) => Math.abs(Number(right.zScore)) - Math.abs(Number(left.zScore)))
    .slice(0, 2);
  if (!top.length) {
    return ["当前病例特征偏离不明显，建议结合 MRI 影像、Treg 概率和临床分期综合判断。"];
  }
  const featureText = top
    .map((item) => `${item.label || item.key} ${Number(item.zScore) >= 0 ? "升高" : "降低"}（Z=${Number(item.zScore).toFixed(2)}）`)
    .join("；");
  const riskText = Number(caseItem?.tregProbability || 0) > 0.5
    ? "Treg 概率偏高，建议重点关注免疫抑制相关风险，并结合治疗反应动态复核。"
    : "Treg 概率偏低，建议维持常规随访，同时关注显著偏离的影像组学特征变化。";
  return [`主要偏离特征：${featureText}。`, riskText];
}


function getRadiomicsRehabAdvice(caseItem) {
  const features = Array.isArray(caseItem?.featureValues) ? caseItem.featureValues : [];
  const top = [...features]
    .filter((item) => Number.isFinite(Number(item.zScore)))
    .sort((left, right) => Math.abs(Number(right.zScore)) - Math.abs(Number(left.zScore)))
    .slice(0, 2);
  const highRisk = Number(caseItem?.tregProbability || 0) > 0.5;
  const featureCue = top.length
    ? `重点随访 ${top.map((item) => item.label || item.key).join("、")} 等偏离特征。`
    : "持续记录影像组学特征变化趋势。";
  if (highRisk) {
    return [
      "建议缩短复查间隔，重点观察局部复发、炎症反应和免疫相关指标变化。",
      `${featureCue} 若连续升高或症状加重，建议提前进行 MDT 复核。`,
      "康复阶段加强营养、吞咽/张口训练和口腔黏膜管理，出现疼痛、出血或体重下降需及时就诊。",
    ];
  }
  return [
    "建议按常规随访节奏复查，保持影像、症状和实验室指标的连续记录。",
    `${featureCue} 当前整体风险较低，但仍需关注异常特征是否持续偏离。`,
    "康复阶段以规律作息、营养支持、口腔护理和适度功能训练为主，若出现新症状及时反馈医生。",
  ];
}

function renderRadiomicsRiskCard(caseItem) {
  const probability = Number(caseItem?.tregProbability || 0);
  const high = probability > 0.5;
  const abundance = high ? "Treg浸润丰度高" : "Treg浸润丰度低";
  const prognosis = high ? "预后较差" : "预后较好";
  const conclusion = getRadiomicsProbabilityLabel(probability);
  return `
    <aside class="radiomics-risk-card ${high ? "high" : "low"}">
      <span>预测概率</span>
      <strong>${formatRadiomicsProbability(probability)}</strong>
      <b>${escapeHtml(abundance)}</b>
      <h3>${escapeHtml(prognosis)}</h3>
      <p>${escapeHtml(conclusion)}。阈值 0.50，概率大于 0.50 判定为Treg浸润丰度高。</p>
      <div class="radiomics-risk-meter"><i style="width:${Math.round(probability * 100)}%"></i></div>
      <dl>
        <div><dt>病例编号</dt><dd>${escapeHtml(caseItem?.caseId || "-")}</dd></div>
        <div><dt>队列排序</dt><dd>${escapeHtml(String(caseItem?.rank || "-"))}</dd></div>
        <div><dt>特征数量</dt><dd>${escapeHtml(String(caseItem?.featureValues?.length || 6))}</dd></div>
      </dl>
      <section class="treg-rehab-advice-card">
        <h4>康复建议</h4>
        <ul>${rehabAdvice.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
    </aside>`;
}

function renderRadiomicsPrognosisModule() {
  if (radiomicsPrognosisState.loading && !radiomicsPrognosisState.loaded) {
    return `<div class="empty-state"><strong>正在读取影像组学结果</strong><p>DICOM预处理、六项特征和Treg预测概率正在加载。</p></div>`;
  }

  if (radiomicsPrognosisState.error && !radiomicsPrognosisState.cases.length) {
    return `
      <div class="empty-state">
        <strong>影像组学预后评分不可用</strong>
        <p>${escapeHtml(radiomicsPrognosisState.error)}</p>
        <button class="primary-action" type="button" data-action="refresh-radiomics-prognosis">重新读取</button>
      </div>`;
  }

  const selected = getSelectedRadiomicsCase();
  if (!selected) {
    return `
      <div class="panel-head"><div><h2>影像组学预后评分</h2></div></div>
      <div class="empty-state"><strong>暂无病例结果</strong><p>请先完成影像组学流程，生成 unsupervised_patient_scores.csv 和病例级 z-score 图。</p></div>`;
  }

  return `
    ${renderRadiomicsWorkflow()}
    <div class="radiomics-prognosis-grid">
      <section class="panel-card radiomics-case-panel">
        <div class="section-head section-head-compact"><div><h3>病例队列</h3></div></div>
        <div class="radiomics-case-list">${renderRadiomicsCaseRows()}</div>
      </section>
      <section class="panel-card radiomics-detail-panel">
        <div class="section-head section-head-compact">
          <div><h3>${escapeHtml(selected.caseId)}</h3><p>当前病例的影像预览和六项特征队列对比。</p></div>
          <span class="radiomics-threshold-pill">阈值 0.50</span>
        </div>
        ${renderRadiomicsMriPreview(selected)}
        ${renderRadiomicsFeatureChart(selected)}
      </section>
      ${renderRadiomicsRiskCard(selected)}
    </div>`;
}

function getRadiomicsRiskMeta(caseItem) {
  const probability = Number(caseItem?.tregProbability || 0);
  const high = probability > 0.5;
  return {
    probability,
    high,
    level: high ? "high" : "low",
    abundance: high ? "Treg浸润丰度高" : "Treg浸润丰度低",
    prognosis: high ? "预后较差" : "预后较好",
    conclusion: high ? "Treg浸润丰度高，预后较差" : "Treg浸润丰度低，预后较好",
  };
}


function getRadiomicsInfiltrationLabel(risk) {
  return risk?.high ? "高" : "低";
}

function getRadiomicsDeathRiskLabel(risk) {
  return risk?.high ? "高" : "低";
}

function getRadiomicsTreatmentAdvice(caseItem, risk) {
  const features = Array.isArray(caseItem?.featureValues) ? caseItem.featureValues : [];
  const topFeatures = [...features]
    .filter((item) => Number.isFinite(Number(item.zScore)))
    .sort((left, right) => Math.abs(Number(right.zScore)) - Math.abs(Number(left.zScore)))
    .slice(0, 2);
  const featureCue = topFeatures.length
    ? topFeatures.map((item) => `${item.label || item.key}${Number(item.zScore) >= 0 ? "升高" : "降低"}（Z=${Number(item.zScore).toFixed(2)}）`).join("；")
    : "当前六项影像组学特征未见显著偏离";
  if (risk?.high) {
    return [
      `重点依据偏离特征：${featureCue}。`,
      "建议优先进行放疗靶区、剂量分布和同步治疗方案的 MDT 复核。",
      "随访时加强 MRI 复查、免疫炎症指标和治疗反应的动态评估。",
    ];
  }
  return [
    `重点依据偏离特征：${featureCue}。`,
    "当前模型提示低风险，可按标准治疗路径推进并保持常规复查节奏。",
    "若上述特征连续升高或影像表现进展，建议提前复核治疗计划。",
  ];
}

function renderRadiomicsTreatmentAdviceCard(caseItem, risk) {
  const adviceItems = getRadiomicsTreatmentAdvice(caseItem, risk);
  return `
    <section class="radiomics-treatment-advice-card">
      <h4>治疗建议</h4>
      <ul>${adviceItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>`;
}

function renderRadiomicsSummaryCards() {
  const total = radiomicsPrognosisState.summary.total || radiomicsPrognosisState.cases.length || 0;
  const featureCount = radiomicsPrognosisState.summary.featureCount || 6;
  const highRiskCount = radiomicsPrognosisState.summary.highRiskCount || 0;
  const cards = [
    { iconSrc: "assets/radiomics/case-count-icon.png", label: "病例总数", value: total, tone: "blue" },
    { iconSrc: "assets/radiomics/feature-count-icon.png", label: "特征数量", value: featureCount, tone: "green" },
    { iconSrc: "assets/radiomics/high-risk-icon.png", label: "高风险", value: highRiskCount, tone: "red" },
  ];
  return `
    <section class="radiomics-summary-cards">
      ${cards.map((card) => `
        <article class="radiomics-summary-card ${card.tone}">
          <span class="radiomics-summary-icon-shell"><img class="radiomics-summary-icon-img" src="${escapeHtml(card.iconSrc)}" alt=""></span>
          <div>
            <small>${escapeHtml(card.label)}</small>
            <strong>${escapeHtml(String(card.value))}</strong>
          </div>
        </article>
      `).join("")}
    </section>`;
}

function renderRadiomicsWorkflow() {
  const steps = [
    { title: "DICOM导入", detail: "读取原始影像" },
    { title: "N4偏置校正", detail: "消除强度非均匀" },
    { title: "重采样", detail: "1.0 x 1.0 x 1.0 mm" },
    { title: "靶区勾画", detail: "DPNU-Net自动勾画" },
    { title: "特征提取", detail: "PyRadiomics" },
    { title: "Treg概率预测", detail: "Treg模型推理" },
    { title: "报告生成", detail: "可视化与导出" },
  ];
  const workflowIconPaths = [
    "assets/radiomics/workflow-dicom-icon.png",
    "assets/radiomics/workflow-n4-icon.png",
    "assets/radiomics/workflow-resample-icon.png",
    "assets/radiomics/workflow-contour-icon.png",
    "assets/radiomics/workflow-feature-icon.png",
    "assets/radiomics/workflow-treg-icon.png",
    "assets/radiomics/workflow-report-icon.png",
  ];
  return `
    <section class="radiomics-workflow-strip radiomics-workflow-strip-polished">
      ${steps.map((step, index) => `
        <div class="radiomics-workflow-step">
          <span class="radiomics-workflow-index">${index + 1}</span>
          <span class="radiomics-workflow-icon-shell"><img class="radiomics-workflow-icon-img" src="${escapeHtml(workflowIconPaths[index])}" alt=""></span>
          <div class="radiomics-workflow-copy">
            <span>${escapeHtml(step.title)}</span>
            <em>${escapeHtml(step.detail)}</em>
          </div>
        </div>
      `).join("")}
    </section>`;
}

function renderRadiomicsCaseRows() {
  const selected = getSelectedRadiomicsCase();
  return `
    <table class="radiomics-case-table">
      <colgroup>
        <col class="radiomics-case-col-id">
        <col class="radiomics-case-col-probability">
        <col class="radiomics-case-col-infiltration">
        <col class="radiomics-case-col-risk">
      </colgroup>
      <thead>
        <tr><th>病例编号</th><th>预测概率</th><th>Treg浸润丰度</th><th>死亡风险</th></tr>
      </thead>
      <tbody>
        ${radiomicsPrognosisState.cases.map((item) => {
          const active = selected?.caseId === item.caseId ? " active" : "";
          const risk = getRadiomicsRiskMeta(item);
          return `
            <tr class="${active}" data-action="select-radiomics-case" data-id="${escapeHtml(item.caseId)}" tabindex="0" role="button">
              <td><i></i>${escapeHtml(item.caseId)}</td>
              <td>${formatRadiomicsProbability(item.predictionProbability ?? item.tregProbability)}</td>
              <td><span class="radiomics-risk-badge ${risk.level}">${risk.high ? "高浸润" : "低浸润"}</span></td>
              <td><span class="radiomics-prognosis-badge ${risk.level}">${risk.high ? "高风险" : "低风险"}</span></td>
            </tr>`;
        }).join("")}
      </tbody>
    </table>`;
}

function renderRadiomicsRiskCard(caseItem) {
  const risk = getRadiomicsRiskMeta(caseItem);
  const probabilityLabel = formatRadiomicsProbability(risk.probability);
  const degree = Math.max(0, Math.min(360, Math.round(risk.probability * 360)));
  const riskPercent = Math.max(0, Math.min(100, Math.round(risk.probability * 100)));
  const infiltrationLabel = getRadiomicsInfiltrationLabel(risk);
  const deathRiskLabel = getRadiomicsDeathRiskLabel(risk);
  return `
    <aside class="radiomics-risk-card ${risk.level}">
      <h3 class="radiomics-risk-title">预测结果</h3>
      <div class="radiomics-risk-card-head radiomics-risk-card-head-centered">
        <div class="radiomics-risk-donut" style="--risk-deg:${degree}deg">
          <strong>${probabilityLabel}</strong>
        </div>
      </div>
      <div class="radiomics-risk-scale" style="--risk-marker:${riskPercent}%">
        <span>低风险</span><span>0.50 标准</span><span>高风险</span>
      </div>
      <section class="radiomics-result-box">
        <dl class="radiomics-primary-results">
          <div>
            <dt>Treg浸润</dt>
            <dd>${escapeHtml(infiltrationLabel)}</dd>
          </div>
          <div>
            <dt>死亡风险</dt>
            <dd>${escapeHtml(deathRiskLabel)}</dd>
          </div>
        </dl>
      </section>
      ${renderRadiomicsTreatmentAdviceCard(caseItem, risk)}
      <dl>
        <div><dt>病例编号</dt><dd>${escapeHtml(caseItem?.caseId || "-")}</dd></div>
        <div><dt>队列排序</dt><dd>${escapeHtml(String(caseItem?.rank || "-"))}</dd></div>
        <div><dt>特征数量</dt><dd>${escapeHtml(String(caseItem?.featureValues?.length || 6))}</dd></div>
      </dl>
      <div class="card-actions">
        <button class="primary-action" type="button" data-action="export-radiomics-report">导出报告</button>
        <button class="secondary-button" type="button" data-action="view-radiomics-features">查看特征</button>
      </div>
    </aside>`;
}

function renderRadiomicsPrognosisModule() {
  if (radiomicsPrognosisState.loading && !radiomicsPrognosisState.loaded) {
    return `<div class="empty-state"><strong>正在读取影像组学结果</strong><p>DICOM预处理、六项特征和Treg预测概率正在加载。</p></div>`;
  }

  if (radiomicsPrognosisState.error && !radiomicsPrognosisState.cases.length) {
    return `
      <div class="empty-state">
        <strong>影像组学预后评分不可用</strong>
        <p>${escapeHtml(radiomicsPrognosisState.error)}</p>
        <button class="primary-action" type="button" data-action="refresh-radiomics-prognosis">重新读取</button>
      </div>`;
  }

  const selected = getSelectedRadiomicsCase();
  if (!selected) {
    return `
      <div class="panel-head"><div><h2>影像组学预后评分</h2></div></div>
      <div class="empty-state"><strong>暂无病例结果</strong><p>请先完成影像组学流程，生成 unsupervised_patient_scores.csv 和病例级图像。</p></div>`;
  }

  return `
    ${renderRadiomicsSummaryCards()}
    ${renderRadiomicsWorkflow()}
    <div class="radiomics-prognosis-grid radiomics-prognosis-grid-polished">
      <section class="panel-card radiomics-case-panel">
        <div class="section-head section-head-compact radiomics-case-list-head">
          <div><h3>病例列表（${escapeHtml(String(radiomicsPrognosisState.cases.length))}）</h3></div>
          <button class="secondary-button compact radiomics-import-case-button" type="button" data-action="refresh-radiomics-prognosis">导入病例</button>
        </div>
        <div class="radiomics-case-table-wrap">${renderRadiomicsCaseRows()}</div>
      </section>
      <section class="panel-card radiomics-detail-panel">
        <div class="section-head section-head-compact">
          <div class="radiomics-case-id-box"><h3>病例编号：${escapeHtml(selected.caseId)}</h3></div>
          <button class="secondary-button compact" type="button" data-action="view-radiomics-features">特征详情</button>
        </div>
        ${renderRadiomicsMriPreview(selected)}
        <div class="radiomics-zscore-image radiomics-zscore-image-compact">
          ${selected.zscoreImageUrl
            ? `<img src="${escapeHtml(selected.zscoreImageUrl)}" alt="${escapeHtml(selected.caseId)} z-score feature chart">`
            : renderRadiomicsFeatureChart(selected)}
        </div>
      </section>
      ${renderRadiomicsRiskCard(selected)}
    </div>`;
}

function hasCurrentRadiotherapyFrame() {
  const iframe = moduleContent.querySelector("iframe.radiotherapy-portal-iframe");
  if (!iframe) {
    return false;
  }

  const expectedPath = `/radiotherapy-demo.html?embedded=1&v=${RADIOTHERAPY_DEMO_VERSION}`;
  return iframe.dataset.radiotherapyVersion === RADIOTHERAPY_DEMO_VERSION && iframe.src.endsWith(expectedPath);
}

function renderDoctorAiConfigModule() {
  const config = aiState.config;
  return `
    <div class="panel-head"><div><h2>AI 问诊配置</h2><p>配置模型、API 地址、密钥和联网搜索策略。病人端问诊将统一走这里的设置。</p></div></div>
    <div class="panel-grid ai-config-layout">
      <section class="panel-card">
        <form class="modal-form" id="aiConfigForm">
          <div class="form-grid">
            <label><span>模型提供方</span><input name="providerName" value="${escapeHtml(config.providerName || "")}" placeholder="例如 OpenAI、阿里百炼、火山方舟"></label>
            <label><span>模型名称</span><input name="model" value="${escapeHtml(config.model || "")}" placeholder="例如 gpt-4.1、qwen-max"></label>
            <label class="wide"><span>API 地址</span><input name="apiBaseUrl" value="${escapeHtml(config.apiBaseUrl || "")}" placeholder="支持填写到 /v1 或完整的 /chat/completions 地址"></label>
            <label><span>API 密钥</span><input name="apiKey" type="password" value="" placeholder="${config.hasApiKey ? "已保存，如需更换请重新输入" : "请输入 API Key"}"></label>
            <label><span>联网结果数</span><input name="maxWebResults" type="number" min="1" max="8" value="${escapeHtml(config.maxWebResults || 5)}"></label>
            <label class="wide"><span>系统提示词</span><textarea name="systemPrompt">${escapeHtml(config.systemPrompt || "")}</textarea></label>
            <label class="wide ai-switch-line"><input name="enableWebSearch" type="checkbox" ${config.enableWebSearch ? "checked" : ""}><span>启用联网搜索。开启后，病人端在“深度搜索”模式下会先调用服务端联网检索，再把结果交给大模型整理回答。</span></label>
          </div>
          <div class="module-toolbar">
            <div class="module-subtitle">${config.updatedAt ? `最近保存时间：${escapeHtml(formatDateTimeLabel(config.updatedAt))}` : "当前尚未保存过 AI 配置。"}</div>
            <div class="card-actions">
              <button class="secondary-button" type="button" data-action="reload-ai-config">重新读取</button>
              <button class="primary-action" type="submit" ${aiState.configSaving ? "disabled" : ""}>${aiState.configSaving ? "保存中..." : "保存配置"}</button>
            </div>
          </div>
        </form>
      </section>
      <aside class="panel-card">
        <div class="section-head section-head-compact"><div><h3>使用说明</h3><p>这里的配置会直接影响病人端问诊的真实调用链路。</p></div></div>
        <div class="info-stack">
          <article class="info-item"><span>模型调用</span><strong>${escapeHtml(config.model || "未配置模型")}</strong><p>病人端不会直接暴露密钥，所有问诊请求都由本地后端转发。</p></article>
          <article class="info-item"><span>联网检索</span><strong>${config.enableWebSearch ? "已开启" : "已关闭"}</strong><p>当前后端会先联网检索，再把结果交给大模型整理回答。</p></article>
          <article class="info-item"><span>附件能力</span><strong>图片与文本文件</strong><p>支持图片、TXT、MD、JSON、CSV 等附件；图片会随消息一并发送给兼容视觉输入的模型。</p></article>
        </div>
      </aside>
    </div>`;
}

function renderDoctorScheduleModule() {
  const cards = appData.schedules.length
    ? appData.schedules
        .map((item) => `<article class="schedule-card"><span>${escapeHtml(`${item.date} / ${item.period}`)}</span><strong>${escapeHtml(item.clinic)}</strong><div class="card-meta"><span>总号源 <b>${escapeHtml(item.capacity)}</b></span><span>已预约 <b>${escapeHtml(item.booked)}</b></span></div><div class="card-actions"><button class="secondary-button" type="button" data-action="edit-schedule" data-id="${item.id}">编辑</button><button class="danger-button" type="button" data-action="delete-schedule" data-id="${item.id}">删除</button></div></article>`)
        .join("")
    : `<div class="empty-state"><strong>当前暂无排班</strong><p>可通过右上角新增门诊排班。</p></div>`;
  return `<div class="panel-head"><div><h2>门诊排班</h2><p>管理医生当日坐诊排班、诊室和号源数量。</p></div></div><div class="schedule-list">${cards}</div>`;
}

function renderDoctorFollowupsModule() {
  const items = appData.followups.length
    ? appData.followups
        .map((item) => `<article class="followup-card"><span>${escapeHtml(item.method)}随访 / ${escapeHtml(item.dueDate)}</span><strong>${escapeHtml(item.patientName)}</strong><p>${escapeHtml(item.note)}</p><div class="card-meta"><span>状态 <b>${escapeHtml(item.status)}</b></span></div><div class="card-actions"><button class="secondary-button" type="button" data-action="edit-followup" data-id="${item.id}">编辑</button><button class="secondary-button" type="button" data-action="toggle-followup" data-id="${item.id}">${item.status === "已完成" ? "恢复待随访" : "标记完成"}</button><button class="danger-button" type="button" data-action="delete-followup" data-id="${item.id}">删除</button></div></article>`)
        .join("")
    : `<div class="empty-state"><strong>暂无随访任务</strong><p>可通过右上角新增随访计划。</p></div>`;
  return `<div class="panel-head"><div><h2>随访记录</h2><p>记录术后回访、慢病复诊提醒以及完成状态。</p></div></div><div class="followup-list">${items}</div>`;
}

function renderPatientProfileModule() {
  const patient = getSafeCurrentPatient();
  const alerts = (patient.alerts.length ? patient.alerts : ["个人档案已开通"]).map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  return `
    <div class="panel-head"><div><h2>个人信息</h2><p>查看并维护基础资料，修改后会同步到当前账号。</p></div></div>
    <div class="panel-grid patient-grid">
      <section class="panel-card">
        <div class="patient-summary"><div class="patient-avatar">患</div><div><h3>${escapeHtml(patient.name)}</h3><p>病人编号 ${escapeHtml(patient.id)}</p></div></div>
        <div class="profile-tags">${alerts}</div>
        <div class="info-grid">
          <div class="info-box"><span>姓名</span><strong>${escapeHtml(patient.name)}</strong></div>
          <div class="info-box"><span>性别</span><strong>${escapeHtml(patient.gender)}</strong></div>
          <div class="info-box"><span>年龄</span><strong>${escapeHtml(`${patient.age} 岁`)}</strong></div>
          <div class="info-box"><span>联系电话</span><strong>${escapeHtml(patient.phone)}</strong></div>
          <div class="info-box wide"><span>居住地址</span><strong>${escapeHtml(patient.address)}</strong></div>
          <div class="info-box wide"><span>既往病史</span><strong>${escapeHtml(patient.history)}</strong></div>
          <div class="info-box wide"><span>紧急联系人</span><strong>${escapeHtml(patient.emergency)}</strong></div>
          <div class="info-box wide"><span>当前诊断</span><strong>${escapeHtml(patient.diagnosis)}</strong></div>
        </div>
      </section>
      <aside class="panel-card">
        <div class="section-head section-head-compact"><div><h3>健康摘要</h3><p>来自最近就诊、预约与报告记录。</p></div></div>
        <div class="summary-list">
          <article class="summary-item"><span>最近就诊</span><strong>${escapeHtml(patient.lastVisit || "-")}</strong><p>${escapeHtml(patient.diagnosis || "暂无诊断信息")}</p></article>
          <article class="summary-item"><span>下次预约</span><strong>${escapeHtml(getUpcomingAppointment(patient)?.date || "暂无预约")}</strong><p>${escapeHtml(getUpcomingAppointment(patient)?.department ? `${getUpcomingAppointment(patient).department} / ${formatRoomLabel(getUpcomingAppointment(patient).room)}` : "可在预约模块中新增复诊安排")}</p></article>
          <article class="summary-item"><span>最近报告</span><strong>${escapeHtml(patient.reports[0]?.name || "暂无报告")}</strong><p>${escapeHtml(patient.reports[0]?.summary || "当前没有新的检查结果。")}</p></article>
        </div>
      </aside>
    </div>`;
}

function renderPatientAppointmentsModule() {
  const patient = getSafeCurrentPatient();
  const items = patient.appointments.length
    ? patient.appointments
        .map((item) => `<article class="appointment-card"><span>${escapeHtml(item.date)}</span><strong>${escapeHtml(item.department)}</strong><p>${escapeHtml(`${formatRoomLabel(item.room)} / 状态：${item.status}`)}</p><div class="card-actions"><button class="secondary-button" type="button" data-action="edit-appointment" data-id="${item.id}" ${item.status === "已接诊" ? "disabled" : ""}>编辑</button><button class="secondary-button" type="button" data-action="toggle-appointment" data-id="${item.id}" ${item.status === "已接诊" ? "disabled" : ""}>${item.status === "已取消" ? "恢复预约" : item.status === "已接诊" ? "已接诊" : "取消预约"}</button><button class="danger-button" type="button" data-action="delete-appointment" data-id="${item.id}">删除</button></div></article>`)
        .join("")
    : `<div class="empty-state"><strong>暂无预约记录</strong><p>可通过右上角新增预约。</p></div>`;
  return `<div class="panel-head"><div><h2>我的预约</h2><p>支持新增、编辑、取消和删除预约记录，医生端会看到同一份预约数据。</p></div></div><div class="appointment-list">${items}</div>`;
}

function renderPatientReportsModule() {
  const patient = getSafeCurrentPatient();
  const items = patient.reports.length
    ? patient.reports
        .map(
          (item) => `<article class="report-card">
            <span>${escapeHtml(item.date)}</span>
            <strong>${escapeHtml(item.name)}</strong>
            <p>${escapeHtml(item.summary || "暂无摘要")}</p>
            <div class="card-meta">
              <span>结果 <b>${escapeHtml(item.result)}</b></span>
              <span>发送医生 <b>${escapeHtml(item.sharedBy || "医生端")}</b></span>
            </div>
            <div class="card-meta"><span>发送时间 <b>${escapeHtml(item.sharedAt ? formatDateTimeLabel(item.sharedAt) : item.date)}</b></span></div>
          </article>`,
        )
        .join("")
    : `<div class="empty-state"><strong>暂无检查报告</strong><p>医生端发送新报告后，会自动同步到这里。</p></div>`;
  return `<div class="panel-head"><div><h2>检查报告</h2><p>病人端仅查看医生发送的检查、检验与影像结果；如需调整内容，请由医生端处理。</p></div></div><div class="report-list">${items}</div>`;
}

function getModeLabel(mode) {
  const modeMap = {
    deep: "深度搜索",
    health: "健康问答",
    report: "报告解读",
    medication: "药盒识别",
  };
  return modeMap[mode] || "AI 问诊";
}

function getModeDescription(mode) {
  const descriptions = {
    deep: "聚焦循证信息和联网检索，适合查资料、看指南和了解最新公开信息。",
    health: "直接描述症状、病程和既往史，系统会结合病历资料给出分诊和就医建议。",
    report: "上传检查报告或化验结果，系统会先梳理异常项，再给出需要重点关注的部分。",
    medication: "上传药盒、处方或药品图片，系统会帮助识别药物信息和常见注意事项。",
  };
  return descriptions[mode] || "直接输入问题，系统会结合你的档案、附件和医生端配置统一回答。";
}

function getModePlaceholder(mode) {
  const placeholders = {
    deep: "请输入你想检索的临床问题。",
    health: "请输入你的健康问题。",
    report: "请输入你的解读要求。",
    medication: "请输入你的识药需求。",
  };
  return placeholders[mode] || "请输入症状、问题、报告解读需求，或描述你上传的图片与文件。Shift + Enter 换行，Enter 发送。";
}

function getAiModeMeta(mode) {
  const modeMap = {
    deep: {
      label: "深度搜索",
      icon: "索",
      intro: "聚焦临床决策，专业文献循证",
      footnote: "适合查指南、看公开文献和检索最新公开资料。",
      quickPrompt: "请帮我检索幽门螺杆菌阳性的常见诊疗路径和复查建议。",
    },
    health: {
      label: "健康问答",
      icon: "问",
      intro: "健康问题尽管问，大众科普解答",
      footnote: "可先补充症状时长、部位、严重程度和伴随表现。",
      quickPrompt: "请先帮我梳理症状，再告诉我是否需要尽快线下就医。",
    },
    report: {
      label: "报告解读",
      icon: "报",
      intro: "点击或拖拽报告图片或文件。图片支持 jpg、png、jpeg，最多 5 张；PDF 最多 1 份。",
      footnote: "上传后再输入你最想关注的异常项或解读诉求。",
      quickPrompt: "请帮我解读这份报告，重点看异常指标和复查建议。",
    },
    medication: {
      label: "药盒识别",
      icon: "药",
      intro: "点击或拖拽药盒图片，支持格式 jpg、png、jpeg，最多 5 张。",
      footnote: "上传后可继续补充服药目的、症状和想确认的注意事项。",
      quickPrompt: "请识别这是什么药，并说明常见用途和注意事项。",
    },
  };
  return modeMap[mode] || modeMap.health;
}

function isAiUploadMode(mode) {
  return mode === "report" || mode === "medication";
}

function getActiveConversation() {
  return aiState.conversations.find((item) => item.id === aiState.activeConversationId) || aiState.conversations[0] || null;
}

function renderMessageAttachments(attachments) {
  if (!Array.isArray(attachments) || !attachments.length) {
    return "";
  }
  return `<div class="chat-attachments">${attachments
    .map((attachment) =>
      String(attachment.mimeType || "").startsWith("image/")
        ? `<a class="chat-attachment image" href="${escapeHtml(attachment.url)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(attachment.url)}" alt="${escapeHtml(attachment.originalName)}"><span>${escapeHtml(attachment.originalName)}</span></a>`
        : `<a class="chat-attachment file" href="${escapeHtml(attachment.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(attachment.originalName)}</strong><span>${escapeHtml(attachment.mimeType || "文件")}</span></a>`,
    )
    .join("")}</div>`;
}

function renderMessageSources(sources) {
  if (!Array.isArray(sources) || !sources.length) {
    return "";
  }
  return `<div class="chat-sources"><div class="chat-source-title">联网参考</div>${sources
    .map((item) => `<a class="chat-source-card" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.snippet || "无摘要")}</span></a>`)
    .join("")}</div>`;
}

function renderAiBrandMark() {
  return `
    <svg viewBox="0 0 260 260" class="ai-brand-mark-svg" aria-hidden="true">
      <defs>
        <linearGradient id="aiBrandStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#cfe1ff"></stop>
          <stop offset="52%" stop-color="#6f9fe8"></stop>
          <stop offset="100%" stop-color="#3e6fb9"></stop>
        </linearGradient>
        <radialGradient id="aiBrandGlow" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stop-color="#e4efff" stop-opacity="0.55"></stop>
          <stop offset="100%" stop-color="#e4efff" stop-opacity="0"></stop>
        </linearGradient>
        <filter id="aiBrandShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#4c77c3" flood-opacity="0.16"></feDropShadow>
        </filter>
      </defs>
      <circle cx="128" cy="126" r="92" fill="url(#aiBrandGlow)"></circle>
      <path d="M86 34c-30 17-52 47-57 82-7 46 16 93 56 114 24 13 52 16 79 9" fill="none" stroke="url(#aiBrandStroke)" stroke-width="17" stroke-linecap="round" filter="url(#aiBrandShadow)"></path>
      <path d="M158 54c32 9 57 33 65 62 7 24 2 51-14 73-14 18-34 31-56 36" fill="none" stroke="url(#aiBrandStroke)" stroke-width="17" stroke-linecap="round"></path>
      <path d="M78 138c28 11 67 10 97-3 16-7 29-16 38-27 9-11 13-24 8-34-4-9-14-14-29-14-24 0-51 12-73 34" fill="none" stroke="url(#aiBrandStroke)" stroke-width="17" stroke-linecap="round"></path>
      <path d="M97 181c22 7 48 5 70-6 21-11 39-31 43-53" fill="none" stroke="url(#aiBrandStroke)" stroke-width="15" stroke-linecap="round" opacity="0.95"></path>
      <circle cx="204" cy="192" r="19" fill="none" stroke="url(#aiBrandStroke)" stroke-width="16"></circle>
    </svg>`;
}

function renderAiModeTabs() {
  return ["deep", "health", "report", "medication"]
    .map((key) => {
      const mode = getAiModeMeta(key);
      return `<button class="ai-mode-tab${aiState.activeMode === key ? " active" : ""}" type="button" data-action="switch-ai-mode" data-mode="${key}"><span class="ai-mode-tab-mark">${escapeHtml(mode.icon)}</span><span>${escapeHtml(mode.label)}</span></button>`;
    })
    .join("");
}

function renderAiHistoryDrawer() {
  return `
    <div class="ai-history-drawer${aiState.historyDrawerOpen ? " open" : ""}">
      <button class="ai-history-backdrop" type="button" data-action="toggle-ai-history" aria-label="关闭对话记录"></button>
      <aside class="ai-history-panel">
        <div class="ai-history-head">
          <div>
            <span class="ai-history-kicker">问诊记录</span>
            <h3>历史对话</h3>
            <p>按当前病人账号自动保存</p>
          </div>
          <button class="secondary-button" type="button" data-action="new-ai-conversation">新对话</button>
        </div>
        <div class="ai-history-list">${aiState.conversations.length
          ? aiState.conversations
              .map((item) => {
                const lastMessage = item.messages?.length ? item.messages[item.messages.length - 1] : null;
                const preview = lastMessage?.text ? `${String(lastMessage.text).slice(0, 40)}${String(lastMessage.text).length > 40 ? "..." : ""}` : "点击继续对话";
                return `<article class="ai-history-item${aiState.activeConversationId === item.id ? " active" : ""}"><button type="button" data-action="select-ai-conversation" data-id="${item.id}"><strong>${escapeHtml(item.title || "新对话")}</strong><span>${escapeHtml(getModeLabel(item.mode))}</span><p>${escapeHtml(preview)}</p><em>${escapeHtml(formatDateTimeLabel(item.updatedAt))}</em></button><button class="delete-session" type="button" data-action="delete-ai-conversation" data-id="${item.id}">删</button></article>`;
              })
              .join("")
          : `<div class="empty-state compact"><strong>暂无对话</strong><p>点击右上角“新对话”开始第一次问诊。</p></div>`}</div>
      </aside>
    </div>`;
}

function renderAiUploadTiles() {
  return `<div class="ai-upload-grid">${aiState.pendingAttachments
    .map((attachment) =>
      String(attachment.mimeType || "").startsWith("image/")
        ? `<article class="ai-upload-card"><img src="${escapeHtml(attachment.url)}" alt="${escapeHtml(attachment.originalName)}"><div><strong>${escapeHtml(attachment.originalName)}</strong><span>图片附件</span></div><button type="button" data-action="remove-pending-attachment" data-id="${attachment.id}">移除</button></article>`
        : `<article class="ai-upload-card file"><div class="ai-upload-file-mark">文</div><div><strong>${escapeHtml(attachment.originalName)}</strong><span>${escapeHtml(attachment.mimeType || "文件附件")}</span></div><button type="button" data-action="remove-pending-attachment" data-id="${attachment.id}">移除</button></article>`,
    )
    .join("")}</div>`;
}

function renderAiUploadActions(mode) {
  const imageLabel = aiState.uploading ? "图片上传中..." : mode === "medication" ? "上传药盒图片" : "上传图片";
  const fileLabel = aiState.uploading ? "文件上传中..." : mode === "report" ? "上传报告文件" : "上传文件";
  if (mode === "medication") {
    return `<div class="ai-upload-actions"><button class="af-upload-button image" type="button" data-action="trigger-ai-image-upload" ${aiState.uploading ? "disabled" : ""}><span class="af-button-icon">图</span><span class="af-button-text">${imageLabel}</span></button></div>`;
  }
  return `<div class="ai-upload-actions"><button class="af-upload-button image" type="button" data-action="trigger-ai-image-upload" ${aiState.uploading ? "disabled" : ""}><span class="af-button-icon">图</span><span class="af-button-text">${imageLabel}</span></button><button class="af-upload-button file" type="button" data-action="trigger-ai-file-upload" ${aiState.uploading ? "disabled" : ""}><span class="af-button-icon">文</span><span class="af-button-text">${fileLabel}</span></button></div>`;
}

function renderAiLandingCanvas(mode) {
  const meta = getAiModeMeta(mode);
  const uploadMode = isAiUploadMode(mode);
  return `
    <div class="ai-mode-canvas${uploadMode ? " upload-mode" : ""}">
      <p class="ai-mode-canvas-copy">${escapeHtml(meta.intro)}</p>
      ${uploadMode ? `<div class="ai-upload-panel">${renderAiUploadActions(mode)}${aiState.pendingAttachments.length ? renderAiUploadTiles() : `<div class="ai-upload-empty"><span>点击上传后，文件会先保存到本地服务器，点击“发送问诊”时会和本次文字一起提交给 AI。</span></div>`}</div>` : ""}
      ${uploadMode ? `<div class="ai-mode-canvas-divider"></div>` : ""}
      ${mode === "health" ? `<button class="ai-think-pill" type="button" data-action="fill-ai-prompt" data-text="${escapeHtml(meta.quickPrompt)}">智能思考</button>` : ""}
    </div>`;
}

function renderConversationMessages(conversation) {
  if (!conversation || !Array.isArray(conversation.messages) || !conversation.messages.length) {
    return "";
  }

  const items = conversation.messages
    .map((message) => {
      const roleClass = message.role === "assistant" ? "assistant" : "user";
      const roleName = message.role === "assistant" ? "AI 问诊助手" : "我";
      const avatarText = message.role === "assistant" ? "AI" : "我";
      return `<article class="chat-row ${roleClass}"><div class="chat-avatar-badge">${avatarText}</div><div class="chat-bubble"><div class="chat-message-head"><strong>${roleName}</strong><span>${escapeHtml(formatDateTimeLabel(message.createdAt))}</span></div><div class="chat-message-body">${message.role === "assistant" ? formatAiText(message.text || "") : formatText(message.text || "")}</div>${renderMessageAttachments(message.attachments)}${renderMessageSources(message.sources)}</div></article>`;
    })
    .join("");

  const thinking = aiState.sending
    ? `<article class="chat-row assistant"><div class="chat-avatar-badge">AI</div><div class="chat-bubble thinking"><div class="chat-message-head"><strong>AI 问诊助手</strong><span>正在生成</span></div><div class="chat-thinking-dots"><span></span><span></span><span></span></div></div></article>`
    : "";

  return `<div class="ai-thread-content">${items}${thinking}</div>`;
}

function renderPendingAttachments() {
  if (!aiState.pendingAttachments.length) {
    return "";
  }
  return `<div class="composer-attachments">${aiState.pendingAttachments
    .map((attachment) => `<div class="composer-attachment"><div><strong>${escapeHtml(attachment.originalName)}</strong><span>${escapeHtml(attachment.mimeType || "文件附件")}</span></div><button type="button" data-action="remove-pending-attachment" data-id="${attachment.id}">移除</button></div>`)
    .join("")}</div>`;
}

function renderPatientAiChatModule() {
  const conversation = getActiveConversation();
  const hasMessages = Boolean(conversation?.messages?.length);
  const configuredState = aiState.config.isConfigured ? "已配置" : "未配置";
  const modeMeta = getAiModeMeta(aiState.activeMode);
  const uploadMode = isAiUploadMode(aiState.activeMode);
  const showAttachmentList = !uploadMode || hasMessages;
  const pendingAttachmentCount = aiState.pendingAttachments.length;
  return `
    <div class="ai-af-page">
      <div class="ai-page-toolbar">
        <div class="ai-page-toolbar-left">
          <div class="ai-page-platform">
            <strong>AI 智能问诊</strong>
            <span>病人端智能问诊中心</span>
          </div>
        </div>
        <div class="ai-page-toolbar-right">
          <button class="ai-ghost-pill" type="button" data-action="toggle-ai-history">对话记录${aiState.conversations.length ? ` ${aiState.conversations.length}` : ""}</button>
          <button class="ai-ghost-pill" type="button" data-action="new-ai-conversation">新对话</button>
          <span class="ai-page-status ${aiState.config.isConfigured ? "ready" : "warning"}">模型 ${escapeHtml(configuredState)}${aiState.config.enableWebSearch ? " · 联网搜索开启" : ""}</span>
        </div>
      </div>

      ${renderAiHistoryDrawer()}

      <section class="ai-brand-hero">
        <div class="ai-brand-mark">${renderAiBrandMark()}</div>
        <div class="ai-brand-copy">
          <h2>我是<span>GBM-DeepNeuro-TregAI助手</span><br>你的放疗医生朋友</h2>
          <p>放疗决策 · 解读报告 · 预后评估，都来问GBM-DeepNeuro-Treg吧 ~</p>
        </div>
      </section>

      <section class="ai-console-shell${hasMessages ? " is-chatting" : ""}">
        <div class="ai-console-tabs">${renderAiModeTabs()}</div>
        <div class="ai-console-surface">
          ${hasMessages ? `<div class="ai-thread-wrap"><div class="ai-thread" id="aiThread">${renderConversationMessages(conversation)}</div></div>` : renderAiLandingCanvas(aiState.activeMode)}

          <form class="ai-composer af-composer" id="aiComposerForm">
            ${showAttachmentList ? renderPendingAttachments() : ""}
            <div class="af-composer-frame">
              <textarea id="aiComposerInput" name="message" rows="4" placeholder="${escapeHtml(getModePlaceholder(aiState.activeMode))}"></textarea>
              <div class="af-composer-foot">
                <div class="af-composer-left">
                  <span class="af-composer-note">${escapeHtml(modeMeta.footnote)}</span>
                  <span class="af-upload-state">${pendingAttachmentCount ? `已添加 ${pendingAttachmentCount} 个待发送附件，发送问诊时会一并提交给 AI` : "支持上传图片、PDF、Word、TXT、CSV 等文件，发送问诊时会和文字一起提交给 AI"}</span>
                </div>
                <div class="af-composer-right">
                  <button class="af-upload-button image" type="button" data-action="trigger-ai-image-upload" ${aiState.uploading ? "disabled" : ""}><span class="af-button-icon">图</span><span class="af-button-text">${aiState.uploading ? "上传中..." : "上传图片"}</span></button>
                  <button class="af-upload-button file" type="button" data-action="trigger-ai-file-upload" ${aiState.uploading ? "disabled" : ""}><span class="af-button-icon">文</span><span class="af-button-text">${aiState.uploading ? "上传中..." : "上传文件"}</span></button>
                  <input id="aiImageInput" type="file" multiple hidden accept="image/*">
                  <input id="aiFileInput" type="file" multiple hidden accept=".txt,.md,.json,.csv,.pdf,.doc,.docx">
                  <button class="ai-send-button" type="submit" ${aiState.sending || !aiState.config.isConfigured ? "disabled" : ""}><span class="af-button-icon send">${aiState.sending ? "…" : "发"}</span><span class="af-button-text">${aiState.sending ? "发送中" : "提交问诊"}</span></button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>`;
}

function renderModuleContent() {
  const renderers = {
    patients: renderDoctorPatientsModule,
    doctorAppointments: renderDoctorAppointmentsModule,
    doctorReports: renderDoctorReportsModule,
    escortManagement: renderDoctorEscortModule,
    radiotherapyDecision: renderDoctorRadiotherapyDecisionModule,
    tregPrognosis: renderTregPrognosisModule,
    radiomicsPrognosis: renderRadiomicsPrognosisModule,
    healthManuals: renderHealthManualsModule,
    aiConfig: renderDoctorAiConfigModule,
    schedule: renderDoctorScheduleModule,
    followups: renderDoctorFollowupsModule,
    aiChat: renderPatientAiChatModule,
    profile: renderPatientProfileModule,
    appointments: renderPatientAppointmentsModule,
    escortService: renderPatientEscortModule,
    reports: renderPatientReportsModule,
  };
  const renderer = renderers[activeModuleKey];
  if (activeModuleKey === "radiotherapyDecision" && hasCurrentRadiotherapyFrame()) {
    return;
  }

  if (typeof renderer !== "function") {
    moduleContent.innerHTML = `<div class="empty-state"><strong>页面暂时无法显示</strong><p>模块 ${escapeHtml(activeModuleKey)} 未找到对应内容，请刷新页面后重试。</p></div>`;
    setAppNotice("当前模块没有可用的渲染内容。", "error");
    return;
  }

  try {
    moduleContent.innerHTML = renderer();
  } catch (error) {
    console.error("[renderModuleContent] failed", activeModuleKey, error);
    moduleContent.innerHTML = `<div class="empty-state"><strong>页面加载失败</strong><p>${escapeHtml(error?.message || "当前模块渲染异常，请刷新页面后重试。")}</p></div>`;
    setAppNotice(`页面加载失败：${error?.message || "请刷新后重试。"}`, "error");
  }
}

function renderApp() {
  renderMenu(currentRole);
  renderChrome(currentRole);
  renderMetrics(currentRole);
  renderModuleContent();
  if (activeModuleKey === "aiChat") {
    queueMicrotask(scrollAiThreadToBottom);
  }
}

function openModal(type, payload = null) {
  modalState = { type, payload };
  renderModal();
  modalOverlay.hidden = false;
}

function closeModal() {
  modalState = null;
  modalOverlay.hidden = true;
  modalBody.innerHTML = "";
}

function renderModal() {
  if (!modalState) {
    return;
  }

  const { type, payload } = modalState;
  if (type === "manual-detail") {
    modalTitle.textContent = payload?.title || "健康手册";
    modalBody.innerHTML = `
      <div class="manual-detail">
        ${renderManualCover(payload || {})}
        <div class="manual-detail-meta">
          <span>${escapeHtml(formatDateTimeLabel(payload?.publishedAt || payload?.updatedAt || ""))}</span>
          <strong>${escapeHtml(payload?.author || "医生")}</strong>
        </div>
        ${renderHealthManualTags(payload?.tags || [])}
        <p class="manual-detail-summary">${escapeHtml(payload?.summary || "")}</p>
        ${renderManualImages(payload?.images || [])}
        <div class="manual-detail-content">${formatText(payload?.content || "")}</div>
      </div>`;
    return;
  }

  if (type === "patient-detail") {
    modalTitle.textContent = "病人详情";
    modalBody.innerHTML = `
      <div class="detail-grid">
        <div class="detail-line"><span>病历号</span><strong>${escapeHtml(payload.id)}</strong></div>
        <div class="detail-line"><span>姓名</span><strong>${escapeHtml(payload.name)}</strong></div>
        <div class="detail-line"><span>性别 / 年龄</span><strong>${escapeHtml(`${payload.gender} / ${payload.age}`)}</strong></div>
        <div class="detail-line"><span>联系电话</span><strong>${escapeHtml(payload.phone)}</strong></div>
        <div class="detail-line"><span>最近就诊</span><strong>${escapeHtml(payload.lastVisit || "-")}</strong></div>
        <div class="detail-line"><span>当前诊断</span><strong>${escapeHtml(payload.diagnosis || "-")}</strong></div>
        <div class="detail-line"><span>居住地址</span><strong>${escapeHtml(payload.address || "-")}</strong></div>
        <div class="detail-line"><span>既往病史</span><strong>${escapeHtml(payload.history || "-")}</strong></div>
      </div>`;
    return;
  }

  const formTitleMap = {
    patient: payload ? "编辑病人" : "新增病人",
    schedule: payload ? "编辑排班" : "新增排班",
    followup: payload ? "编辑随访" : "新增随访",
    profile: "编辑个人信息",
    appointment: payload ? "编辑预约" : "新增预约",
    "doctor-appointment": payload ? "编辑预约" : "代病人新增预约",
    "doctor-report": payload ? "编辑报告" : "发送报告",
    manual: payload ? "编辑文章" : "发布文章",
    report: payload ? "编辑报告" : "新增报告",
  };
  modalTitle.textContent = formTitleMap[type];

  if (type === "patient") {
    modalBody.innerHTML = `<form class="modal-form" id="modalForm"><div class="form-grid"><label><span>姓名</span><input name="name" value="${escapeHtml(payload?.name || "")}" required></label><label><span>性别</span><select name="gender"><option value="男" ${payload?.gender === "男" ? "selected" : ""}>男</option><option value="女" ${payload?.gender === "女" ? "selected" : ""}>女</option></select></label><label><span>年龄</span><input name="age" type="number" min="0" value="${escapeHtml(payload?.age || "")}" required></label><label><span>联系电话</span><input name="phone" value="${escapeHtml(payload?.phone || "")}" required></label><label><span>最近就诊</span><input name="lastVisit" type="date" value="${escapeHtml(payload?.lastVisit || "")}"></label><label><span>状态</span><select name="status">${["已建档", "待复诊", "治疗中", "稳定"].map((item) => `<option value="${item}" ${payload?.status === item ? "selected" : ""}>${item}</option>`).join("")}</select></label><label class="wide"><span>居住地址</span><input name="address" value="${escapeHtml(payload?.address || "")}"></label><label class="wide"><span>既往病史</span><textarea name="history">${escapeHtml(payload?.history || "")}</textarea></label><label class="wide"><span>紧急联系人</span><input name="emergency" value="${escapeHtml(payload?.emergency || "")}"></label><label class="wide"><span>诊断说明</span><textarea name="diagnosis">${escapeHtml(payload?.diagnosis || "")}</textarea></label></div><div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">取消</button><button class="primary-action" type="submit">${payload ? "保存修改" : "新增病人"}</button></div></form>`;
    return;
  }

  if (type === "schedule") {
    modalBody.innerHTML = `<form class="modal-form" id="modalForm"><div class="form-grid"><label><span>日期</span><input name="date" type="date" value="${escapeHtml(payload?.date || getTodayString())}" required></label><label><span>时段</span><select name="period">${["上午", "下午", "夜间"].map((item) => `<option value="${item}" ${payload?.period === item ? "selected" : ""}>${item}</option>`).join("")}</select></label><label class="wide"><span>门诊诊室</span><input name="clinic" value="${escapeHtml(payload?.clinic || "")}" required></label><label><span>总号源</span><input name="capacity" type="number" min="1" value="${escapeHtml(payload?.capacity || 20)}" required></label><label><span>已预约</span><input name="booked" type="number" min="0" value="${escapeHtml(payload?.booked || 0)}" required></label></div><div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">取消</button><button class="primary-action" type="submit">${payload ? "保存修改" : "新增排班"}</button></div></form>`;
    return;
  }

  if (type === "followup") {
    modalBody.innerHTML = `<form class="modal-form" id="modalForm"><div class="form-grid"><label class="wide"><span>病人</span><select name="patientId">${appData.patients.map((item) => `<option value="${item.id}" ${payload?.patientId === item.id ? "selected" : ""}>${escapeHtml(`${item.name} (${item.id})`)}</option>`).join("")}</select></label><label><span>随访日期</span><input name="dueDate" type="date" value="${escapeHtml(payload?.dueDate || getTodayString())}" required></label><label><span>方式</span><select name="method">${["电话", "复诊", "短信"].map((item) => `<option value="${item}" ${payload?.method === item ? "selected" : ""}>${item}</option>`).join("")}</select></label><label><span>状态</span><select name="status">${["待随访", "已完成"].map((item) => `<option value="${item}" ${payload?.status === item ? "selected" : ""}>${item}</option>`).join("")}</select></label><label class="wide"><span>备注</span><textarea name="note">${escapeHtml(payload?.note || "")}</textarea></label></div><div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">取消</button><button class="primary-action" type="submit">${payload ? "保存修改" : "新增随访"}</button></div></form>`;
    return;
  }

  if (type === "profile") {
    modalBody.innerHTML = `<form class="modal-form" id="modalForm"><div class="form-grid"><label><span>姓名</span><input name="name" value="${escapeHtml(payload?.name || "")}" required></label><label><span>性别</span><select name="gender"><option value="男" ${payload?.gender === "男" ? "selected" : ""}>男</option><option value="女" ${payload?.gender === "女" ? "selected" : ""}>女</option></select></label><label><span>年龄</span><input name="age" type="number" min="0" value="${escapeHtml(payload?.age || "")}" required></label><label><span>联系电话</span><input name="phone" value="${escapeHtml(payload?.phone || "")}" required></label><label class="wide"><span>居住地址</span><input name="address" value="${escapeHtml(payload?.address || "")}"></label><label class="wide"><span>既往病史</span><textarea name="history">${escapeHtml(payload?.history || "")}</textarea></label><label class="wide"><span>紧急联系人</span><input name="emergency" value="${escapeHtml(payload?.emergency || "")}"></label><label class="wide"><span>当前诊断</span><textarea name="diagnosis">${escapeHtml(payload?.diagnosis || "")}</textarea></label></div><div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">取消</button><button class="primary-action" type="submit">保存信息</button></div></form>`;
    return;
  }

  if (type === "appointment") {
    modalBody.innerHTML = `<form class="modal-form" id="modalForm"><div class="form-grid"><label><span>预约时间</span><input name="date" value="${escapeHtml(payload?.date || "")}" placeholder="例如 2026-03-20 10:00" required></label><label><span>科室</span><input name="department" value="${escapeHtml(payload?.department || "")}" required></label><label><span>诊室</span><input name="room" value="${escapeHtml(payload?.room || "")}" required></label><label><span>状态</span><select name="status">${["已预约", "已取消"].map((item) => `<option value="${item}" ${payload?.status === item ? "selected" : ""}>${item}</option>`).join("")}</select></label></div><div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">取消</button><button class="primary-action" type="submit">${payload ? "保存预约" : "新增预约"}</button></div></form>`;
    return;
  }

  if (type === "doctor-appointment") {
    modalBody.innerHTML = `<form class="modal-form" id="modalForm"><div class="form-grid"><label class="wide"><span>病人</span><select name="patientId">${appData.patients.map((item) => `<option value="${item.id}" ${payload?.patientId === item.id ? "selected" : ""}>${escapeHtml(`${item.name} (${item.id})`)}</option>`).join("")}</select></label><label><span>预约时间</span><input name="date" value="${escapeHtml(payload?.date || "")}" placeholder="例如 2026-03-20 10:00" required></label><label><span>科室</span><input name="department" value="${escapeHtml(payload?.department || "")}" required></label><label><span>诊室</span><input name="room" value="${escapeHtml(payload?.room || "")}" required></label><label><span>状态</span><select name="status">${["已预约", "已接诊", "已取消"].map((item) => `<option value="${item}" ${payload?.status === item ? "selected" : ""}>${item}</option>`).join("")}</select></label></div><div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">取消</button><button class="primary-action" type="submit">${payload ? "保存预约" : "新增预约"}</button></div></form>`;
    return;
  }

  if (type === "doctor-report") {
    modalBody.innerHTML = `<form class="modal-form" id="modalForm"><div class="form-grid"><label class="wide"><span>病人</span><select name="patientId">${appData.patients.map((item) => `<option value="${item.id}" ${payload?.patientId === item.id ? "selected" : ""}>${escapeHtml(`${item.name} (${item.id})`)}</option>`).join("")}</select></label><label class="wide"><span>报告名称</span><input name="name" value="${escapeHtml(payload?.name || "")}" required></label><label><span>报告日期</span><input name="date" type="date" value="${escapeHtml(payload?.date || getTodayString())}" required></label><label><span>结果</span><select name="result">${["正常", "待复查", "异常"].map((item) => `<option value="${item}" ${payload?.result === item ? "selected" : ""}>${item}</option>`).join("")}</select></label><label class="wide"><span>摘要</span><textarea name="summary">${escapeHtml(payload?.summary || "")}</textarea></label></div><div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">取消</button><button class="primary-action" type="submit">${payload ? "保存并同步" : "发送给病人"}</button></div></form>`;
    return;
  }

  if (type === "manual") {
    const draft = modalState?.draft || createManualDraft(payload);
    modalBody.innerHTML = `<form class="modal-form" id="modalForm">
      <div class="form-grid">
        <label class="wide"><span>文章标题</span><input name="title" value="${escapeHtml(payload?.title || "")}" required></label>
        <label><span>分类</span><input name="category" value="${escapeHtml(payload?.category || "健康科普")}" placeholder="例如 饮食保养、慢病管理"></label>
        <label class="wide"><span>摘要</span><textarea name="summary">${escapeHtml(payload?.summary || "")}</textarea></label>
        <label class="wide"><span>标签</span><input name="tags" value="${escapeHtml(Array.isArray(payload?.tags) ? payload.tags.join("、") : "")}" placeholder="例如 肠胃健康、春季保养、复诊提醒"></label>
        <label class="wide"><span>正文内容</span><textarea name="content" rows="10" required>${escapeHtml(payload?.content || "")}</textarea></label>
        <label class="wide ai-switch-line"><input name="pinned" type="checkbox" ${payload?.pinned ? "checked" : ""}><span>设为置顶推荐。置顶文章会优先展示给病人端。</span></label>
      </div>

      <div class="manual-editor-panel">
        <div class="manual-editor-head">
          <div>
            <strong>封面与插图</strong>
            <span>支持 JPG、PNG、JPEG。上传后会自动插入到文章展示中。</span>
          </div>
          <div class="card-actions">
            <button class="secondary-button" type="button" data-action="trigger-manual-cover-upload">${draft.uploading ? "上传中..." : "上传封面"}</button>
            <button class="secondary-button" type="button" data-action="trigger-manual-gallery-upload">${draft.uploading ? "上传中..." : "插入图片"}</button>
          </div>
        </div>
        <input id="manualCoverInput" type="file" hidden accept="image/*">
        <input id="manualGalleryInput" type="file" hidden accept="image/*" multiple>
        <div class="manual-editor-cover">${draft.coverImage ? `<img src="${escapeHtml(draft.coverImage)}" alt="封面图">` : `<div class="manual-upload-empty">当前未设置封面，上传后会作为文章首图展示。</div>`}${draft.coverImage ? `<button type="button" class="manual-cover-remove" data-action="remove-manual-cover">移除封面</button>` : ""}</div>
        ${renderManualDraftImages()}
      </div>

      <div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">取消</button><button class="primary-action" type="submit">${payload ? "保存文章" : "发布文章"}</button></div>
    </form>`;
    return;
  }

  modalBody.innerHTML = `<form class="modal-form" id="modalForm"><div class="form-grid"><label class="wide"><span>报告名称</span><input name="name" value="${escapeHtml(payload?.name || "")}" required></label><label><span>报告日期</span><input name="date" type="date" value="${escapeHtml(payload?.date || getTodayString())}" required></label><label><span>结果</span><select name="result">${["正常", "待复查", "异常"].map((item) => `<option value="${item}" ${payload?.result === item ? "selected" : ""}>${item}</option>`).join("")}</select></label><label class="wide"><span>摘要</span><textarea name="summary">${escapeHtml(payload?.summary || "")}</textarea></label></div><div class="modal-actions"><button class="secondary-button" type="button" id="cancelModal">取消</button><button class="primary-action" type="submit">${payload ? "保存报告" : "新增报告"}</button></div></form>`;
}

function refreshAndPersist(message, type = "success") {
  saveAppData();
  renderApp();
  if (message) {
    setAppNotice(message, type);
  }
}

function handleModalSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  if (modalState.type === "patient") {
    const payload = {
      name: formData.get("name")?.trim(),
      gender: formData.get("gender"),
      age: Number(formData.get("age")),
      phone: formData.get("phone")?.trim(),
      lastVisit: formData.get("lastVisit"),
      status: formData.get("status"),
      address: formData.get("address")?.trim(),
      history: formData.get("history")?.trim(),
      emergency: formData.get("emergency")?.trim(),
      diagnosis: formData.get("diagnosis")?.trim(),
    };
    appData.patients = modalState.payload
      ? appData.patients.map((item) => (item.id === modalState.payload.id ? { ...item, ...payload } : item))
      : [normalizePatient({ id: createId("MR"), createdAt: getTodayString(), alerts: ["新建档案"], appointments: [], reports: [], ...payload }), ...appData.patients];
    refreshAndPersist(modalState.payload ? "病人信息已更新。" : "病人已新增。");
    closeModal();
    return;
  }

  if (modalState.type === "schedule") {
    const payload = { date: formData.get("date"), period: formData.get("period"), clinic: formData.get("clinic")?.trim(), capacity: Number(formData.get("capacity")), booked: Number(formData.get("booked")) };
    appData.schedules = modalState.payload ? appData.schedules.map((item) => (item.id === modalState.payload.id ? { ...item, ...payload } : item)) : [{ id: createId("SCH"), ...payload }, ...appData.schedules];
    refreshAndPersist(modalState.payload ? "排班已更新。" : "排班已新增。");
    closeModal();
    return;
  }

  if (modalState.type === "followup") {
    const patient = findPatientById(formData.get("patientId"));
    const payload = { patientId: formData.get("patientId"), patientName: patient?.name || "未知病人", dueDate: formData.get("dueDate"), method: formData.get("method"), status: formData.get("status"), note: formData.get("note")?.trim() };
    appData.followups = modalState.payload ? appData.followups.map((item) => (item.id === modalState.payload.id ? { ...item, ...payload } : item)) : [{ id: createId("FU"), ...payload }, ...appData.followups];
    refreshAndPersist(modalState.payload ? "随访记录已更新。" : "随访记录已新增。");
    closeModal();
    return;
  }

  if (modalState.type === "profile") {
    appData.patients = appData.patients.map((item) => item.username === currentUsername ? { ...item, name: formData.get("name")?.trim(), gender: formData.get("gender"), age: Number(formData.get("age")), phone: formData.get("phone")?.trim(), address: formData.get("address")?.trim(), history: formData.get("history")?.trim(), emergency: formData.get("emergency")?.trim(), diagnosis: formData.get("diagnosis")?.trim() } : item);
    refreshAndPersist("个人信息已更新。");
    renderChrome(currentRole);
    closeModal();
    return;
  }

  if (modalState.type === "appointment") {
    appData.patients = appData.patients.map((item) => {
      if (item.username !== currentUsername) return item;
      const payload = { id: modalState.payload?.id || createId("APT"), date: formData.get("date")?.trim(), department: formData.get("department")?.trim(), room: formData.get("room")?.trim(), status: formData.get("status") };
      return { ...item, appointments: modalState.payload ? item.appointments.map((appointment) => (appointment.id === modalState.payload.id ? payload : appointment)) : [payload, ...item.appointments] };
    });
    refreshAndPersist(modalState.payload ? "预约已更新。" : "预约已新增。");
    closeModal();
    return;
  }

  if (modalState.type === "doctor-appointment") {
    const selectedPatientId = formData.get("patientId");
    appData.patients = appData.patients.map((item) => {
      if (item.id !== selectedPatientId && !(modalState.payload && item.id === modalState.payload.patientId)) return item;
      if (modalState.payload && item.id === modalState.payload.patientId && item.id !== selectedPatientId) return { ...item, appointments: item.appointments.filter((appointment) => appointment.id !== modalState.payload.id) };
      if (item.id !== selectedPatientId) return item;
      const payload = {
        ...(modalState.payload || {}),
        id: modalState.payload?.id || createId("APT"),
        date: formData.get("date")?.trim(),
        department: formData.get("department")?.trim(),
        room: formData.get("room")?.trim(),
        status: formData.get("status"),
      };
      return { ...item, appointments: modalState.payload ? item.appointments.some((appointment) => appointment.id === modalState.payload.id) ? item.appointments.map((appointment) => (appointment.id === modalState.payload.id ? payload : appointment)) : [payload, ...item.appointments] : [payload, ...item.appointments] };
    });
    refreshAndPersist(modalState.payload ? "预约已更新。" : "预约已新增。");
    closeModal();
    return;
  }

  if (modalState.type === "doctor-report") {
    const selectedPatientId = formData.get("patientId");
    const payload = {
      id: modalState.payload?.id || createId("REP"),
      name: formData.get("name")?.trim(),
      date: formData.get("date"),
      result: formData.get("result"),
      summary: formData.get("summary")?.trim(),
      sharedAt: new Date().toISOString(),
      sharedBy: currentUserName,
    };

    appData.patients = appData.patients.map((item) => {
      if (item.id !== selectedPatientId && !(modalState.payload && item.id === modalState.payload.patientId)) return item;
      if (modalState.payload && item.id === modalState.payload.patientId && item.id !== selectedPatientId) {
        return { ...item, reports: item.reports.filter((report) => report.id !== modalState.payload.id) };
      }
      if (item.id !== selectedPatientId) return item;

      const nextReports = modalState.payload
        ? item.reports.some((report) => report.id === modalState.payload.id)
          ? item.reports.map((report) => (report.id === modalState.payload.id ? { ...report, ...payload } : report))
          : [payload, ...item.reports]
        : [payload, ...item.reports];

      return { ...item, reports: nextReports };
    });

    refreshAndPersist(modalState.payload ? "报告已更新并同步给病人。" : "报告已发送给病人。");
    closeModal();
    return;
  }

  if (modalState.type === "manual") {
    const now = new Date().toISOString();
    const draft = modalState?.draft || createManualDraft(modalState.payload);
    const payload = {
      id: modalState.payload?.id || createId("MAN"),
      title: formData.get("title")?.trim(),
      category: formData.get("category")?.trim() || "健康科普",
      coverImage: draft.coverImage || "",
      images: draft.images || [],
      pinned: formData.get("pinned") === "on",
      summary: formData.get("summary")?.trim(),
      content: formData.get("content")?.trim(),
      tags: String(formData.get("tags") || "")
        .split(/[、,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
      author: currentUserName,
      publishedAt: modalState.payload?.publishedAt || now,
      updatedAt: now,
    };

    appData.healthManuals = modalState.payload
      ? appData.healthManuals.map((item) => (item.id === modalState.payload.id ? { ...item, ...payload } : item))
      : [payload, ...appData.healthManuals];

    refreshAndPersist(modalState.payload ? "健康手册文章已更新。" : "健康手册文章已发布。");
    closeModal();
    return;
  }

  appData.patients = appData.patients.map((item) => {
    if (item.username !== currentUsername) return item;
    const payload = { id: modalState.payload?.id || createId("REP"), name: formData.get("name")?.trim(), date: formData.get("date"), result: formData.get("result"), summary: formData.get("summary")?.trim() };
    return { ...item, reports: modalState.payload ? item.reports.map((report) => (report.id === modalState.payload.id ? payload : report)) : [payload, ...item.reports] };
  });
  refreshAndPersist(modalState.payload ? "报告已更新。" : "报告已新增。");
  closeModal();
}

function getPageActionHandler() {
  if (activeModuleKey === "patients") return () => openModal("patient");
  if (activeModuleKey === "doctorAppointments") return () => openModal("doctor-appointment");
  if (activeModuleKey === "doctorReports") return () => openModal("doctor-report");
  if (activeModuleKey === "radiotherapyDecision") {
    return () => {
      window.open(`/radiotherapy-demo.html?v=${RADIOTHERAPY_DEMO_VERSION}`, "_blank", "noopener,noreferrer");
    };
  }
  if (activeModuleKey === "healthManuals") return () => (currentRole === "doctor" ? openModal("manual") : setAppNotice("健康手册由医生端发布，病人端仅可阅读。", "error"));
  if (activeModuleKey === "aiConfig") return () => document.getElementById("aiConfigForm")?.requestSubmit();
  if (activeModuleKey === "schedule") return () => openModal("schedule");
  if (activeModuleKey === "followups") return () => openModal("followup");
  if (activeModuleKey === "aiChat") return () => createAiConversation(aiState.activeMode);
  if (activeModuleKey === "profile") return () => openModal("profile", getCurrentPatient());
  if (activeModuleKey === "appointments") return () => openModal("appointment");
  return () => openModal("report");
}

async function requestLogin(role, username, password, persistent = false) {
  return requestJson("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, username, password, persistent }),
    skipAuthRedirect: true,
  });
}

function clearAiState() {
  aiState.config = { ...DEFAULT_AI_CONFIG };
  aiState.configLoaded = false;
  aiState.configSaving = false;
  aiState.pendingAttachments = [];
  aiState.activeConversationId = "";
  aiState.activeMode = "health";
  aiState.historyDrawerOpen = false;
  aiState.conversations = [];
  aiState.conversationsLoaded = false;
  aiState.conversationsLoading = false;
  aiState.sending = false;
  aiState.uploading = false;
}

async function loadAiConfig(force = false) {
  if (aiState.configLoaded && !force) {
    return aiState.config;
  }
  const payload = await requestJson("/api/ai/config");
  aiState.config = { ...DEFAULT_AI_CONFIG, ...payload.config };
  aiState.configLoaded = true;
  return aiState.config;
}

async function loadRadiotherapyModuleData(force = false) {
  if (radiotherapyState.loading) {
    return radiotherapyState.summary;
  }
  if (radiotherapyState.loaded && !force) {
    return radiotherapyState.summary;
  }

  radiotherapyState.loading = true;
  radiotherapyState.error = "";
  try {
    const payload = await requestJson("/api/radiotherapy-decision/examples");
    radiotherapyState.examples = Array.isArray(payload.examples) ? payload.examples : [];
    radiotherapyState.summary = {
      total: Number(payload.summary?.total || radiotherapyState.examples.length || 0),
      ccrtCount: Number(payload.summary?.ccrtCount || 0),
      rtCount: Number(payload.summary?.rtCount || 0),
      observeCount: Number(payload.summary?.observeCount || 0),
    };
    radiotherapyState.loaded = true;
    return radiotherapyState.summary;
  } catch (error) {
    radiotherapyState.error = error.message || "读取放疗模块数据失败。";
    return radiotherapyState.summary;
  } finally {
    radiotherapyState.loading = false;
    if (activeModuleKey === "radiotherapyDecision") {
      renderApp();
    }
  }
}

async function loadRadiomicsPrognosisData(force = false) {
  if (radiomicsPrognosisState.loading) {
    return radiomicsPrognosisState.summary;
  }
  if (radiomicsPrognosisState.loaded && !force) {
    return radiomicsPrognosisState.summary;
  }

  radiomicsPrognosisState.loading = true;
  radiomicsPrognosisState.error = "";
  try {
    const payload = await requestJson("/api/radiomics-prognosis");
    radiomicsPrognosisState.summary = {
      total: Number(payload.summary?.total || 0),
      featureCount: Number(payload.summary?.featureCount || 6),
      highRiskCount: Number(payload.summary?.highRiskCount || 0),
      threshold: Number(payload.summary?.threshold || 0.5),
    };
    radiomicsPrognosisState.features = Array.isArray(payload.features) ? payload.features : [];
    radiomicsPrognosisState.cases = Array.isArray(payload.cases) ? payload.cases : [];
    if (!radiomicsPrognosisState.selectedCaseId || !radiomicsPrognosisState.cases.some((item) => item.caseId === radiomicsPrognosisState.selectedCaseId)) {
      radiomicsPrognosisState.selectedCaseId = radiomicsPrognosisState.cases[0]?.caseId || "";
    }
    radiomicsPrognosisState.loaded = true;
    return radiomicsPrognosisState.summary;
  } catch (error) {
    radiomicsPrognosisState.error = error.message || "影像组学预后评分数据读取失败。";
    return radiomicsPrognosisState.summary;
  } finally {
    radiomicsPrognosisState.loading = false;
    if (activeModuleKey === "radiomicsPrognosis") {
      renderApp();
    }
  }
}

async function saveAiConfig(payload) {
  aiState.configSaving = true;
  renderApp();
  try {
    const response = await requestJson("/api/ai/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    aiState.config = { ...DEFAULT_AI_CONFIG, ...response.config };
    aiState.configLoaded = true;
    setAppNotice("AI 配置已保存。", "success");
  } finally {
    aiState.configSaving = false;
    renderApp();
  }
}

async function loadAiConversations(force = false, silent = false) {
  if (aiState.conversationsLoading) {
    return aiState.conversations;
  }
  if (aiState.conversationsLoaded && !force) {
    return aiState.conversations;
  }

  aiState.conversationsLoading = true;
  try {
    const payload = await requestJson(`/api/ai/conversations?username=${encodeURIComponent(currentUsername)}`);
    aiState.conversations = Array.isArray(payload.conversations) ? payload.conversations : [];
    aiState.conversationsLoaded = true;
    if (!aiState.activeConversationId || !aiState.conversations.some((item) => item.id === aiState.activeConversationId)) {
      aiState.activeConversationId = aiState.conversations[0]?.id || "";
    }
    if (activeModuleKey === "aiChat") {
      renderApp();
    }
    return aiState.conversations;
  } catch (error) {
    if (!silent) {
      setAppNotice(error.message || "读取问诊对话失败。", "error");
    }
    throw error;
  } finally {
    aiState.conversationsLoading = false;
  }
}

async function createAiConversation(mode = "health") {
  try {
    const payload = await requestJson("/api/ai/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUsername, mode }),
    });
    aiState.conversations = Array.isArray(payload.conversations) ? payload.conversations : [];
    aiState.conversationsLoaded = true;
    aiState.activeConversationId = payload.conversation?.id || aiState.conversations[0]?.id || "";
    aiState.activeMode = mode;
    aiState.historyDrawerOpen = false;
    renderApp();
    queueMicrotask(() => document.getElementById("aiComposerInput")?.focus());
  } catch (error) {
    setAppNotice(error.message || "新建对话失败。", "error");
  }
}

async function deleteAiConversation(conversationId) {
  try {
    const payload = await requestJson("/api/ai/conversations/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUsername, conversationId }),
    });
    aiState.conversations = Array.isArray(payload.conversations) ? payload.conversations : [];
    aiState.activeConversationId = aiState.conversations[0]?.id || "";
    if (!aiState.conversations.length) {
      aiState.historyDrawerOpen = false;
    }
    renderApp();
  } catch (error) {
    setAppNotice(error.message || "删除对话失败。", "error");
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createManualDraft(payload = null) {
  return {
    coverImage: payload?.coverImage || "",
    images: Array.isArray(payload?.images) ? [...payload.images] : [],
    uploading: false,
  };
}

async function uploadFilesToServer(fileList) {
  const files = await Promise.all(
    fileList.map(async (file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      base64: await readFileAsBase64(file),
    })),
  );

  const payload = await requestJson("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files }),
  });

  return Array.isArray(payload.files) ? payload.files : [];
}

async function uploadAiFiles(fileList) {
  if (!fileList.length) {
    return;
  }
  aiState.uploading = true;
  renderApp();
  try {
    const uploadedFiles = await uploadFilesToServer(fileList);
    aiState.pendingAttachments = [...aiState.pendingAttachments, ...uploadedFiles];
    setAppNotice(`已上传 ${uploadedFiles.length || 0} 个附件。`, "success");
  } catch (error) {
    setAppNotice(error.message || "附件上传失败。", "error");
  } finally {
    aiState.uploading = false;
    renderApp();
  }
}

async function uploadManualImages(fileList, kind = "gallery") {
  if (!fileList.length || modalState?.type !== "manual") {
    return;
  }

  modalState.draft = modalState.draft || createManualDraft(modalState.payload);
  modalState.draft.uploading = true;
  renderModal();
  modalOverlay.hidden = false;

  try {
    const uploadedFiles = (await uploadFilesToServer(fileList)).filter((item) => String(item.mimeType || "").startsWith("image/"));
    if (!uploadedFiles.length) {
      setAppNotice("仅支持上传图片文件。", "error");
      return;
    }

    if (kind === "cover") {
      modalState.draft.coverImage = uploadedFiles[0].url;
      setAppNotice("封面图已上传。", "success");
    } else {
      modalState.draft.images = [...(modalState.draft.images || []), ...uploadedFiles];
      setAppNotice(`已插入 ${uploadedFiles.length} 张图片。`, "success");
    }
  } catch (error) {
    setAppNotice(error.message || "文章图片上传失败。", "error");
  } finally {
    if (modalState?.draft) {
      modalState.draft.uploading = false;
    }
    renderModal();
    modalOverlay.hidden = false;
  }
}

function applyOptimisticAiMessage(message, attachments) {
  const now = new Date().toISOString();
  const activeConversation = getActiveConversation();
  const fallbackText = message || (attachments.length ? `已发送 ${attachments.length} 个附件` : "");

  if (activeConversation) {
    aiState.conversations = aiState.conversations.map((item) =>
      item.id === activeConversation.id
        ? {
            ...item,
            title: item.title || fallbackText.slice(0, 24) || getModeLabel(aiState.activeMode),
            updatedAt: now,
            messages: [
              ...(Array.isArray(item.messages) ? item.messages : []),
              {
                id: createId("MSG"),
                role: "user",
                text: fallbackText,
                attachments: Array.isArray(attachments) ? attachments : [],
                createdAt: now,
              },
            ],
          }
        : item,
    );
    return;
  }

  const localConversationId = createId("CHAT-LOCAL");
  aiState.activeConversationId = localConversationId;
  aiState.conversations = [
    {
      id: localConversationId,
      username: currentUsername,
      mode: aiState.activeMode,
      title: fallbackText.slice(0, 24) || getModeLabel(aiState.activeMode),
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: createId("MSG"),
          role: "user",
          text: fallbackText,
          attachments: Array.isArray(attachments) ? attachments : [],
          createdAt: now,
        },
      ],
    },
    ...aiState.conversations,
  ];
}

async function sendAiMessage(message) {
  const text = String(message || "").trim();
  if (!text && !aiState.pendingAttachments.length) {
    setAppNotice("请输入问题或上传附件后再发送。", "error");
    return;
  }

  const attachments = [...aiState.pendingAttachments];
  aiState.pendingAttachments = [];
  aiState.sending = true;
  aiState.historyDrawerOpen = false;
  applyOptimisticAiMessage(text, attachments);
  renderApp();
  queueMicrotask(scrollAiThreadToBottom);
  try {
    const payload = await requestJson("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: currentUsername,
        conversationId: aiState.activeConversationId?.startsWith("CHAT-LOCAL") ? undefined : aiState.activeConversationId || undefined,
        mode: aiState.activeMode,
        message: text,
        attachments,
      }),
    });
    aiState.pendingAttachments = [];
    aiState.conversations = Array.isArray(payload.conversations) ? payload.conversations : aiState.conversations;
    aiState.conversationsLoaded = true;
    aiState.activeConversationId = payload.conversation?.id || aiState.activeConversationId;
    renderApp();
  } catch (error) {
    aiState.pendingAttachments = attachments;
    setAppNotice(error.message || "AI 问诊发送失败。", "error");
  } finally {
    aiState.sending = false;
    renderApp();
    queueMicrotask(scrollAiThreadToBottom);
  }
}

function scrollAiThreadToBottom() {
  const thread = document.getElementById("aiThread");
  if (thread) {
    thread.scrollTop = thread.scrollHeight;
  }
}

async function ensureModuleReady(moduleKey, force = false) {
  if (moduleKey === "aiConfig" && currentRole === "doctor") {
    await loadAiConfig(force);
    return;
  }
  if (moduleKey === "radiotherapyDecision" && currentRole === "doctor") {
    await Promise.all([
      loadAiConfig(force).catch(() => {
        aiState.config = { ...DEFAULT_AI_CONFIG };
      }),
      loadRadiotherapyModuleData(force),
    ]);
    return;
  }
  if (moduleKey === "radiomicsPrognosis" && currentRole === "doctor") {
    await loadRadiomicsPrognosisData(force);
    return;
  }
  if (moduleKey === "aiChat" && currentRole === "patient") {
    await loadAiConfig(force).catch(() => {
      aiState.config = { ...DEFAULT_AI_CONFIG };
    });
    await loadAiConversations(force, true);
  }
}

async function enterSystem(role, username, options = {}) {
  currentRole = role;
  currentUsername = username;
  currentUserName = options.name || accounts[role].name;
  if (!getModulesForRole(role).some((item) => item.key === activeModuleKey)) {
    resetActiveModule(role);
  }
  renderRole(role);
  loginView.hidden = true;
  appShell.hidden = false;
  body.classList.add("app-mode");
  if (role !== "patient") {
    clearAiState();
  }
  renderApp();
  if (options.persist !== false) {
    saveAuth(role, username, rememberLogin.checked);
  }
  clearMessage();
  startSyncPolling();
  await ensureModuleReady(activeModuleKey);
  renderApp();
}

async function leaveSystem() {
  clearSavedAuth();
  stopSyncPolling();
  clearAiState();
  try {
    await requestLogout();
  } catch (error) {
    // Ignore logout sync failures and still return to login.
  }
  showLoginView(currentRole);
  setMessage("已退出登录。", "success");
}

async function restoreSystem() {
  const savedAuth = getSavedAuth();
  rememberLogin.checked = Boolean(localStorage.getItem(AUTH_STORAGE_KEY));
  if (!savedAuth) {
    showLoginView(currentRole);
    return;
  }

  try {
    const session = await requestSession();
    await pullAppDataFromServer({ rerender: false, silent: false });
    resetActiveModule(session.role);
    await enterSystem(session.role, session.username, { persist: false, name: session.name });
  } catch (error) {
    clearSavedAuth();
    showLoginView(savedAuth.role);
  }
}

async function switchModule(moduleKey, force = false) {
  activeModuleKey = moduleKey;
  clearAppNotice();
  renderApp();
  await ensureModuleReady(moduleKey, force);
  renderApp();
}

roleTabs.forEach((tab) => {
  tab.addEventListener("click", () => renderRole(tab.dataset.role));
});

logoutButton.addEventListener("click", leaveSystem);

pageActionButton.addEventListener("click", async () => {
  const handler = getPageActionHandler();
  await handler();
});

menuList.addEventListener("click", async (event) => {
  const button = event.target.closest(".menu-item");
  if (!button) {
    return;
  }
  await switchModule(button.dataset.moduleKey);
});

moduleContent.addEventListener("input", (event) => {
  if (event.target.id === "patientSearch") {
    doctorSearchKeyword = event.target.value;
    renderModuleContent();
    return;
  }

  if (event.target.id === "manualSearch") {
    manualSearchKeyword = event.target.value;
    renderModuleContent();
  }
});

moduleContent.addEventListener("change", async (event) => {
  if (event.target.id === "aiFileInput" || event.target.id === "aiImageInput") {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    await uploadAiFiles(files);
  }
});

moduleContent.addEventListener("keydown", (event) => {
  const activatableCard = event.target.closest('[data-keyboard-activate="true"][data-action]');
  if (activatableCard && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    activatableCard.click();
    return;
  }

  if (event.target.id === "aiComposerInput" && event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    event.target.form?.requestSubmit();
  }
});

moduleContent.addEventListener("submit", async (event) => {
  if (event.target.id === "aiConfigForm") {
    event.preventDefault();
    const formData = new FormData(event.target);
    await saveAiConfig({
      providerName: formData.get("providerName")?.trim(),
      apiBaseUrl: formData.get("apiBaseUrl")?.trim(),
      model: formData.get("model")?.trim(),
      apiKey: formData.get("apiKey")?.trim(),
      enableWebSearch: formData.get("enableWebSearch") === "on",
      maxWebResults: Number(formData.get("maxWebResults")),
      systemPrompt: formData.get("systemPrompt")?.trim(),
    });
    return;
  }

  if (event.target.id === "aiComposerForm") {
    event.preventDefault();
    const formData = new FormData(event.target);
    await sendAiMessage(formData.get("message"));
    event.target.reset();
  }
});

moduleContent.addEventListener("click", async (event) => {
  const moduleButton = event.target.closest("[data-module-key]");
  if (moduleButton) {
    await switchModule(moduleButton.dataset.moduleKey);
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const { action, id } = button.dataset;

  if (action === "open-radiotherapy-demo") {
    window.open(`/radiotherapy-demo.html?v=${RADIOTHERAPY_DEMO_VERSION}`, "_blank", "noopener,noreferrer");
    return;
  }
  if (action === "reload-radiotherapy") {
    await switchModule("radiotherapyDecision", true);
    return;
  }
  if (action === "view-patient") return openModal("patient-detail", findPatientById(id));
  if (action === "edit-patient") return openModal("patient", findPatientById(id));
  if (action === "delete-patient") {
    const patient = findPatientById(id);
    if (patient?.username) return setAppNotice("绑定登录账号的病人记录不能直接删除。", "error");
    appData.patients = appData.patients.filter((item) => item.id !== id);
    appData.followups = appData.followups.filter((item) => item.patientId !== id);
    return refreshAndPersist("病人已删除。");
  }
  if (action === "edit-schedule") return openModal("schedule", appData.schedules.find((item) => item.id === id));
  if (action === "delete-schedule") {
    appData.schedules = appData.schedules.filter((item) => item.id !== id);
    return refreshAndPersist("排班已删除。");
  }
  if (action === "edit-followup") return openModal("followup", appData.followups.find((item) => item.id === id));
  if (action === "toggle-followup") {
    appData.followups = appData.followups.map((item) => item.id === id ? { ...item, status: item.status === "已完成" ? "待随访" : "已完成" } : item);
    return refreshAndPersist("随访状态已更新。");
  }
  if (action === "delete-followup") {
    appData.followups = appData.followups.filter((item) => item.id !== id);
    return refreshAndPersist("随访记录已删除。");
  }
  if (action === "edit-appointment") return openModal("appointment", getCurrentPatient().appointments.find((item) => item.id === id));
  if (action === "toggle-appointment") {
    const target = getCurrentPatient().appointments.find((item) => item.id === id);
    if (target?.status === "已接诊") return setAppNotice("该预约已由医生处理为已接诊，病人端不能再取消或修改。", "error");
    appData.patients = appData.patients.map((item) => item.username === currentUsername ? { ...item, appointments: item.appointments.map((appointment) => appointment.id === id ? { ...appointment, status: appointment.status === "已取消" ? "已预约" : "已取消" } : appointment) } : item);
    return refreshAndPersist("预约状态已更新。");
  }
  if (action === "delete-appointment") {
    appData.patients = appData.patients.map((item) => item.username === currentUsername ? { ...item, appointments: item.appointments.filter((appointment) => appointment.id !== id) } : item);
    return refreshAndPersist("预约已删除。");
  }
  if (action === "edit-doctor-appointment") {
    const patient = findPatientById(button.dataset.patientId);
    const appointment = patient?.appointments.find((item) => item.id === id);
    if (patient && appointment) return openModal("doctor-appointment", { patientId: patient.id, ...appointment });
  }
  if (action === "edit-doctor-report") {
    const patient = findPatientById(button.dataset.patientId);
    const report = patient?.reports.find((item) => item.id === id);
    if (patient && report) return openModal("doctor-report", { patientId: patient.id, ...report });
  }
  if (action === "view-manual") {
    const manual = appData.healthManuals.find((item) => item.id === id);
    if (manual) return openModal("manual-detail", manual);
  }
  if (action === "set-manual-category") {
    manualCategoryFilter = button.dataset.category || "全部";
    return renderModuleContent();
  }
  if (action === "clear-manual-filters") {
    manualSearchKeyword = "";
    manualCategoryFilter = "全部";
    return renderModuleContent();
  }
  if (action === "edit-manual") {
    const manual = appData.healthManuals.find((item) => item.id === id);
    if (manual) return openModal("manual", manual);
  }
  if (action === "toggle-manual-pinned") {
    appData.healthManuals = appData.healthManuals.map((item) => (item.id === id ? { ...item, pinned: !item.pinned, updatedAt: new Date().toISOString() } : item));
    return refreshAndPersist("健康手册置顶状态已更新。");
  }
  if (action === "delete-manual") {
    appData.healthManuals = appData.healthManuals.filter((item) => item.id !== id);
    return refreshAndPersist("健康手册文章已删除。");
  }
  if (action === "resend-doctor-report") {
    const patientId = button.dataset.patientId;
    appData.patients = appData.patients.map((item) =>
      item.id === patientId
        ? {
            ...item,
            reports: item.reports.map((report) =>
              report.id === id
                ? { ...report, sharedAt: new Date().toISOString(), sharedBy: currentUserName }
                : report,
            ),
          }
        : item,
    );
    return refreshAndPersist("报告已重新发送给病人。");
  }
  if (action === "delete-doctor-report") {
    const patientId = button.dataset.patientId;
    appData.patients = appData.patients.map((item) =>
      item.id === patientId ? { ...item, reports: item.reports.filter((report) => report.id !== id) } : item,
    );
    return refreshAndPersist("报告已删除。");
  }
  if (action === "toggle-doctor-appointment") {
    const patientId = button.dataset.patientId;
    appData.patients = appData.patients.map((item) => item.id === patientId ? { ...item, appointments: item.appointments.map((appointment) => appointment.id === id ? { ...appointment, status: appointment.status === "已接诊" ? "已预约" : "已接诊" } : appointment) } : item);
    return refreshAndPersist("预约状态已由医生端更新。");
  }
  if (action === "delete-doctor-appointment") {
    const patientId = button.dataset.patientId;
    const patient = findPatientById(patientId);
    const removedAppointment = patient?.appointments.find((appointment) => appointment.id === id);
    appData.patients = appData.patients.map((item) => item.id === patientId ? { ...item, appointments: item.appointments.filter((appointment) => appointment.id !== id) } : item);
    if (removedAppointment?.scheduleId) {
      appData.schedules = appData.schedules.map((schedule) =>
        schedule.id === removedAppointment.scheduleId
          ? { ...schedule, booked: Math.max(0, Number(schedule.booked || 0) - 1) }
          : schedule,
      );
    }
    return refreshAndPersist("预约已删除。");
  }
  if (action === "edit-report") return openModal("report", getCurrentPatient().reports.find((item) => item.id === id));
  if (action === "delete-report") {
    appData.patients = appData.patients.map((item) => item.username === currentUsername ? { ...item, reports: item.reports.filter((report) => report.id !== id) } : item);
    return refreshAndPersist("报告已删除。");
  }
  if (action === "reload-ai-config") {
    await loadAiConfig(true);
    renderApp();
    return setAppNotice("已重新读取 AI 配置。", "success");
  }
  if (action === "switch-ai-mode") {
    aiState.activeMode = button.dataset.mode;
    aiState.historyDrawerOpen = false;
    if (getActiveConversation()?.messages?.length) {
      aiState.activeConversationId = "";
      aiState.pendingAttachments = [];
    }
    return renderApp();
  }
  if (action === "toggle-ai-history") {
    aiState.historyDrawerOpen = !aiState.historyDrawerOpen;
    return renderApp();
  }
  if (action === "new-ai-conversation") return createAiConversation(aiState.activeMode);
  if (action === "select-ai-conversation") {
    aiState.activeConversationId = id;
    aiState.historyDrawerOpen = false;
    const selected = aiState.conversations.find((item) => item.id === id);
    if (selected?.mode) aiState.activeMode = selected.mode;
    return renderApp();
  }
  if (action === "delete-ai-conversation") return deleteAiConversation(id);
  if (action === "remove-pending-attachment") {
    aiState.pendingAttachments = aiState.pendingAttachments.filter((attachment) => attachment.id !== id);
    return renderApp();
  }
  if (action === "trigger-ai-image-upload") return document.getElementById("aiImageInput")?.click();
  if (action === "trigger-ai-file-upload") return document.getElementById("aiFileInput")?.click();
  if (action === "fill-ai-prompt") {
    const input = document.getElementById("aiComposerInput");
    if (input) {
      input.value = button.dataset.text || "";
      input.focus();
    }
  }
});

const baseRenderModal = renderModal;
const baseHandleModalSubmit = handleModalSubmit;

renderPatientProfileModule = function () {
  const patient = getSafeCurrentPatient();
  const alerts = (patient.alerts.length ? patient.alerts : ["个人档案已开通"]).map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  return `
    <div class="panel-head"><div><h2>个人信息</h2><p>病人端仅用于查看，基础资料需由医生端统一维护。</p></div></div>
    <div class="panel-grid patient-grid">
      <section class="panel-card">
        <div class="patient-summary"><div class="patient-avatar">患</div><div><h3>${escapeHtml(patient.name)}</h3><p>病人编号 ${escapeHtml(patient.id)}</p></div></div>
        <div class="profile-tags">${alerts}</div>
        <div class="info-grid">
          <div class="info-box"><span>姓名</span><strong>${escapeHtml(patient.name)}</strong></div>
          <div class="info-box"><span>性别</span><strong>${escapeHtml(patient.gender)}</strong></div>
          <div class="info-box"><span>年龄</span><strong>${escapeHtml(`${patient.age} 岁`)}</strong></div>
          <div class="info-box"><span>联系电话</span><strong>${escapeHtml(patient.phone)}</strong></div>
          <div class="info-box wide"><span>居住地址</span><strong>${escapeHtml(patient.address)}</strong></div>
          <div class="info-box wide"><span>既往病史</span><strong>${escapeHtml(patient.history)}</strong></div>
          <div class="info-box wide"><span>紧急联系人</span><strong>${escapeHtml(patient.emergency)}</strong></div>
          <div class="info-box wide"><span>当前诊断</span><strong>${escapeHtml(patient.diagnosis)}</strong></div>
        </div>
      </section>
      <aside class="panel-card">
        <div class="section-head section-head-compact"><div><h3>健康摘要</h3><p>来自最近就诊、预约与报告记录。</p></div></div>
        <div class="summary-list">
          <article class="summary-item"><span>最近就诊</span><strong>${escapeHtml(patient.lastVisit || "-")}</strong><p>${escapeHtml(patient.diagnosis || "暂无诊断信息")}</p></article>
          <article class="summary-item"><span>下次预约</span><strong>${escapeHtml(getUpcomingAppointment(patient)?.date || "暂无预约")}</strong><p>${escapeHtml(getUpcomingAppointment(patient)?.department ? `${getUpcomingAppointment(patient).department} / ${formatRoomLabel(getUpcomingAppointment(patient).room)}` : "可在预约模块中提交新的复诊申请")}</p></article>
          <article class="summary-item"><span>最近报告</span><strong>${escapeHtml(patient.reports[0]?.name || "暂无报告")}</strong><p>${escapeHtml(patient.reports[0]?.summary || "当前没有新的检查结果。")}</p></article>
        </div>
      </aside>
    </div>`;
};

renderPatientAppointmentsModule = function () {
  const patient = getSafeCurrentPatient();
  const items = patient.appointments.length
    ? patient.appointments
        .map((item) => `
          <article class="appointment-card">
            <span>${escapeHtml(item.date)}</span>
            <strong>${escapeHtml(item.department)}</strong>
            <p>${escapeHtml(formatRoomLabel(item.room))}</p>
            <div class="card-meta"><span>状态 <b>${escapeHtml(item.status)}</b></span></div>
            <p>预约提交后由医生端统一确认与调整状态，病人端仅可查看。</p>
          </article>`)
        .join("")
    : `<div class="empty-state"><strong>暂无预约记录</strong><p>可通过右上角提交新的预约申请，医生端会同步处理。</p></div>`;
  return `<div class="panel-head"><div><h2>我的预约</h2><p>病人端只负责提交预约申请，预约状态仅能由医生端调整。</p></div></div><div class="appointment-list">${items}</div>`;
};

getPageActionHandler = function () {
  if (activeModuleKey === "patients") return () => openModal("patient");
  if (activeModuleKey === "doctorAppointments") return () => openModal("doctor-appointment");
  if (activeModuleKey === "doctorReports") return () => openModal("doctor-report");
  if (activeModuleKey === "healthManuals") return () => (currentRole === "doctor" ? openModal("manual") : setAppNotice("健康手册由医生端发布，病人端仅可阅读。", "error"));
  if (activeModuleKey === "aiConfig") return () => document.getElementById("aiConfigForm")?.requestSubmit();
  if (activeModuleKey === "schedule") return () => openModal("schedule");
  if (activeModuleKey === "followups") return () => openModal("followup");
  if (activeModuleKey === "aiChat") return () => createAiConversation(aiState.activeMode);
  if (activeModuleKey === "profile") return () => setAppNotice("个人信息由医生端维护，病人端仅可查看。", "error");
  if (activeModuleKey === "appointments") return () => openModal("appointment");
  return () => setAppNotice("检查报告由医生端统一发送，病人端仅可查看。", "error");
};

renderModal = function () {
  baseRenderModal();
  if (!modalState || modalState.type !== "appointment") {
    return;
  }

  modalTitle.textContent = modalState.payload ? "编辑预约" : "提交预约";
  const statusField = modalBody.querySelector('select[name="status"]')?.closest("label");
  if (statusField) {
    statusField.outerHTML = `<label class="wide"><span>说明</span><p class="modal-help">预约提交后由医生端确认并调整状态，病人端不能直接修改预约状态。</p></label>`;
  }

  const submitButton = modalBody.querySelector('.primary-action[type="submit"]');
  if (submitButton && !modalState.payload) {
    submitButton.textContent = "提交预约";
  }
};

openModal = function (type, payload = null) {
  if (currentRole === "patient" && type === "profile") {
    setAppNotice("个人信息需由医生端维护，病人端仅可查看。", "error");
    return;
  }

  if (currentRole === "patient" && type === "report") {
    setAppNotice("检查报告由医生端统一发送，病人端仅可查看。", "error");
    return;
  }

  if (currentRole === "patient" && type === "manual") {
    setAppNotice("健康手册由医生端发布，病人端仅可阅读。", "error");
    return;
  }

  if (currentRole === "patient" && type === "appointment" && payload) {
    setAppNotice("病人端只能提交预约，不能修改已有预约。", "error");
    return;
  }

  modalState = { type, payload };
  renderModal();
  modalOverlay.hidden = false;
};

handleModalSubmit = function (event) {
  if (modalState?.type === "profile" && currentRole === "patient") {
    event.preventDefault();
    setAppNotice("个人信息需由医生端维护，病人端不能修改。", "error");
    closeModal();
    return;
  }

  if (modalState?.type === "report" && currentRole === "patient") {
    event.preventDefault();
    setAppNotice("检查报告只能由医生端录入和修改。", "error");
    closeModal();
    return;
  }

  if (modalState?.type === "manual" && currentRole === "patient") {
    event.preventDefault();
    setAppNotice("健康手册只能由医生端发布和修改。", "error");
    closeModal();
    return;
  }

  if (modalState?.type === "appointment" && currentRole === "patient") {
    event.preventDefault();
    if (modalState.payload) {
      setAppNotice("病人端只能提交预约，已有预约需由医生端处理。", "error");
      closeModal();
      return;
    }

    const formData = new FormData(event.target);
    appData.patients = appData.patients.map((item) => {
      if (item.username !== currentUsername) return item;
      const payload = {
        id: createId("APT"),
        date: formData.get("date")?.trim(),
        department: formData.get("department")?.trim(),
        room: formData.get("room")?.trim(),
        status: "已预约",
      };
      return { ...item, appointments: [payload, ...item.appointments] };
    });
    refreshAndPersist("预约申请已提交，等待医生端处理。");
    closeModal();
    return;
  }

  baseHandleModalSubmit(event);
};

moduleContent.addEventListener(
  "click",
  (event) => {
    if (currentRole !== "patient") {
      return;
    }

    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    if (!["edit-appointment", "toggle-appointment", "delete-appointment"].includes(button.dataset.action)) {
      if (["edit-report", "delete-report"].includes(button.dataset.action)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setAppNotice("检查报告只能由医生端录入和修改，病人端仅可查看。", "error");
      }
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    setAppNotice("病人端只能提交预约，预约状态和修改由医生端处理。", "error");
  },
  true
);

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) closeModal();
});
modalBody.addEventListener("click", (event) => {
  if (event.target.id === "cancelModal") closeModal();
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  if (button.dataset.action === "trigger-manual-cover-upload") {
    document.getElementById("manualCoverInput")?.click();
  }

  if (button.dataset.action === "trigger-manual-gallery-upload") {
    document.getElementById("manualGalleryInput")?.click();
  }

  if (button.dataset.action === "remove-manual-cover" && modalState?.draft) {
    modalState.draft.coverImage = "";
    renderModal();
    modalOverlay.hidden = false;
  }

  if (button.dataset.action === "remove-manual-image" && modalState?.draft) {
    const index = Number(button.dataset.index);
    modalState.draft.images = (modalState.draft.images || []).filter((_, itemIndex) => itemIndex !== index);
    renderModal();
    modalOverlay.hidden = false;
  }
});
modalBody.addEventListener("change", async (event) => {
  if (event.target.id === "manualCoverInput") {
    const files = Array.from(event.target.files || []).slice(0, 1);
    event.target.value = "";
    await uploadManualImages(files, "cover");
  }

  if (event.target.id === "manualGalleryInput") {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    await uploadManualImages(files, "gallery");
  }
});
modalBody.addEventListener("submit", (event) => {
  if (event.target.id === "modalForm") handleModalSubmit(event);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) return setMessage("请输入完整的账号和密码。", "error");

  try {
    const payload = await requestLogin(currentRole, username, password, rememberLogin.checked);
    await pullAppDataFromServer({ rerender: false, silent: false });
    resetActiveModule(payload.role);
    await enterSystem(payload.role, payload.username, { name: payload.name });
  } catch (error) {
    setMessage(error.message || "登录失败，请重试。", "error");
  }
});

function renderAiUiIcon(name) {
  const icons = {
    deep: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M7 12h10M9 17h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    health: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5h8l3 3V18a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18V7a1.5 1.5 0 0 1 1.5-1.5h1.5Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 11h6M9 14.5h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    report: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5h11v11h-11z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9.5 9.5h5M9.5 12h5M9.5 14.5h3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    medication: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7.5a3.5 3.5 0 1 1 4.95 4.95l-4.24 4.24a3.5 3.5 0 0 1-4.95-4.95L8 7.5Zm4.24 0 4.24 4.24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="10" r="1.4" fill="currentColor"/><path d="m7 16 3.2-3.2a1 1 0 0 1 1.42 0L13 14.2l1.8-1.8a1 1 0 0 1 1.42 0L18 14.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4.5h6l4 4V18a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 18V6a1.5 1.5 0 0 1 1-1.41Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 4.5V9h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12 19 5l-4 14-3.5-4.5L5 12Z" fill="currentColor"/></svg>',
    voice: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 14h2.5l4 3V7l-4 3H5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M16 9.5a4.5 4.5 0 0 1 0 5M18.5 7a8 8 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    retry: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8V4l-3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 8a7 7 0 1 0 1.3 8.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="8" width="10" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    like: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11V19H5.5A1.5 1.5 0 0 1 4 17.5v-5A1.5 1.5 0 0 1 5.5 11H8Zm3.5 8H16a3 3 0 0 0 2.87-2.11l1.05-3.48A2 2 0 0 0 18 11h-3V7.5a2.5 2.5 0 0 0-2.5-2.5L11.5 11Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    dislike: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 13V5h2.5A1.5 1.5 0 0 1 20 6.5v5a1.5 1.5 0 0 1-1.5 1.5H16Zm-3.5-8H8A3 3 0 0 0 5.13 7.11L4.08 10.6A2 2 0 0 0 6 13h3v3.5a2.5 2.5 0 0 0 2.5 2.5l1-5.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  };
  return icons[name] || icons.health;
}

function encodeDataText(value) {
  return encodeURIComponent(String(value || ""));
}

function decodeDataText(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (error) {
    return String(value || "");
  }
}

function getConversationDisplayTitle(conversation) {
  if (!conversation) {
    return getModeLabel(aiState.activeMode);
  }

  if (conversation.title) {
    return conversation.title;
  }

  const userMessage = [...(conversation.messages || [])].reverse().find((item) => item.role === "user" && item.text);
  return userMessage?.text || getModeLabel(conversation.mode || aiState.activeMode);
}

function getPreviousUserPrompt(conversation, index) {
  if (!conversation || !Array.isArray(conversation.messages)) {
    return "";
  }

  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const candidate = conversation.messages[cursor];
    if (candidate?.role === "user" && candidate.text) {
      return candidate.text;
    }
  }

  return "";
}

getModeLabel = function (mode) {
  const modeMap = {
    deep: "深度搜索",
    health: "健康问答",
    report: "报告解读",
    medication: "药盒识别",
  };
  return modeMap[mode] || "AI 问诊";
};

getModeDescription = function (mode) {
  const descriptions = {
    deep: "适合检索指南、公开文献和最新公开资料。",
    health: "适合日常健康咨询、症状梳理和就医建议。",
    report: "适合解读检验、影像和体检报告。",
    medication: "适合识别药盒、核对用途和注意事项。",
  };
  return descriptions[mode] || "请输入你的问题，系统会结合当前模式给出回答。";
};

getModePlaceholder = function (mode) {
  const placeholders = {
    deep: "请输入你想检索的医学问题或文献方向",
    health: "请输入你的健康问题",
    report: "请输入你的解读要求",
    medication: "请输入你的识药需求",
  };
  return placeholders[mode] || "请输入症状、问题或你上传的图片/文件说明。Shift + Enter 换行，Enter 发送。";
};

getAiModeMeta = function (mode) {
  const modeMap = {
    deep: {
      label: "深度搜索",
      icon: renderAiUiIcon("deep"),
      badge: "循证",
      tabHint: "查指南与公开文献",
      intro: "聚焦临床决策，专业文献循证",
      footnote: "适合查指南、看公开文献和检索最新公开资料",
      guideItems: ["检索指南、共识和公开文献", "快速梳理治疗路径与复查建议", "适合需要出处和公开资料对照的问题"],
      starterPrompts: [
        "请检索幽门螺杆菌阳性的常见诊疗路径和复查建议。",
        "请总结慢性胃炎近期公开指南中的饮食建议。",
        "请查一下胃镜检查后常见复查周期和注意事项。",
      ],
      quickPrompt: "请帮我检索幽门螺杆菌阳性的常见诊疗路径和复查建议。",
    },
    health: {
      label: "健康问答",
      icon: renderAiUiIcon("health"),
      badge: "常用",
      tabHint: "症状咨询与科普解答",
      intro: "健康问题尽管问，大众科普解答",
      footnote: "可以直接描述症状、时长、部位和严重程度",
      guideItems: ["先描述症状、时长、部位和严重程度", "补充年龄、既往史、是否已用药或就诊", "适合先做分诊判断和检查准备"],
      starterPrompts: [
        "我最近胃胀、反酸三天了，需要先做什么检查？",
        "嗓子疼两天伴低烧，需要先观察还是去医院？",
        "体检发现转氨酶偏高，平时饮食上要注意什么？",
      ],
      quickPrompt: "我最近胃胀、反酸三天了，需要先做什么检查？",
    },
    report: {
      label: "报告解读",
      icon: renderAiUiIcon("report"),
      badge: "上传",
      tabHint: "看异常项与复查建议",
      intro: "点击或拖拽报告图片/文件，支持 JPG、PNG、PDF、Word",
      footnote: "上传后再说明你最想关注的异常项或复查诉求",
      guideItems: ["支持报告图片、PDF、Word 等文件上传", "可补充你最担心的指标、症状或复查目标", "回答仅供参考，最终仍需医生结合面诊判断"],
      starterPrompts: [
        "请帮我解读这份报告，重点看异常指标和复查建议。",
        "请看看这份体检报告里哪些项目最需要关注。",
        "这份影像报告提示轻度异常，我下一步通常要做什么？",
      ],
      quickPrompt: "请帮我解读这份报告，重点看异常指标和复查建议。",
    },
    medication: {
      label: "药盒识别",
      icon: renderAiUiIcon("medication"),
      badge: "识别",
      tabHint: "识别用途与注意事项",
      intro: "点击或拖拽药盒图片，支持 JPG、PNG、JPEG",
      footnote: "可继续补充用途、剂量、禁忌或你担心的相互作用",
      guideItems: ["上传药盒、药板或药品正反面图片", "可继续追问用途、禁忌、服用时间和常见副作用", "药物相互作用和剂量问题仍需医生或药师确认"],
      starterPrompts: [
        "请识别这张药盒图片，并说明常见用途和注意事项。",
        "这盒药一般饭前还是饭后吃？有哪些常见副作用？",
        "如果正在吃其他胃药，这个药通常需要注意什么？",
      ],
      quickPrompt: "请识别这张药盒图片，并说明常见用途和注意事项。",
    },
  };
  return modeMap[mode] || modeMap.health;
};

const AI_PROJECT_MODE_META = {
  deep: {
    label: "深度搜索",
    icon: renderAiUiIcon("deep"),
    badge: "专业",
    tabHint: "指南与公开文献",
    intro: "聚焦头颈部肿瘤放疗决策，辅助检索指南、共识与公开文献。",
    footnote: "适合查询适应证、剂量分割、不良反应管理和随访建议。",
    guideItems: [
      "可检索头颈放疗相关指南、共识和公开文献",
      "适合快速梳理治疗路径、复查周期和护理建议",
      "结果仅作信息参考，具体方案仍需医生结合病情判断",
    ],
    starterPrompts: [
      "请总结头颈部肿瘤放疗后口腔黏膜炎的常见处理建议。",
      "请整理头颈放疗患者常见复查项目和随访周期。",
      "请检索放疗后吞咽功能康复的公开建议和训练方向。",
    ],
    quickPrompt: "请整理头颈放疗患者常见复查项目和随访周期。",
  },
  health: {
    label: "放疗问答",
    icon: renderAiUiIcon("health"),
    badge: "常用",
    tabHint: "头颈放疗常见问题",
    intro: "围绕放疗期、复诊期和康复期常见问题，提供分诊参考与护理建议。",
    footnote: "可直接补充症状部位、放疗阶段、治疗次数和已用药情况。",
    guideItems: [
      "先描述疼痛、口干、吞咽困难、皮肤反应等症状",
      "补充当前放疗阶段、治疗次数、是否同步用药或复诊",
      "适合先做分诊判断、复诊准备和注意事项梳理",
    ],
    starterPrompts: [
      "放疗第 3 周出现口腔溃疡和吞咽痛，现在应该怎么护理？",
      "颈部放疗后皮肤发红发热，还能继续涂普通护肤品吗？",
      "放疗结束后多久复查影像和甲状腺功能比较合适？",
    ],
    quickPrompt: "放疗第 3 周出现口腔溃疡和吞咽痛，现在应该怎么护理？",
  },
  report: {
    label: "报告解读",
    icon: renderAiUiIcon("report"),
    badge: "上传",
    tabHint: "看异常项与复查建议",
    intro: "上传影像、病理、检验或放疗相关报告，辅助梳理重点异常与复查建议。",
    footnote: "上传后可补充当前治疗阶段、主要症状和最想了解的问题。",
    guideItems: [
      "支持上传检查报告图片、PDF、Word 等文件",
      "可补充本次放疗阶段、症状变化和最关注的异常项",
      "回答仅供参考，最终仍需医生结合面诊和检查判断",
    ],
    starterPrompts: [
      "请帮我解读这份鼻咽癌放疗后复查报告，重点看是否需要尽快复诊。",
      "请帮我看这份甲状腺功能结果，放疗后哪些指标需要重点关注？",
      "这份颈部 MRI 报告提示淋巴结变化，下一步一般需要关注什么？",
    ],
    quickPrompt: "请帮我解读这份鼻咽癌放疗后复查报告，重点看是否需要尽快复诊。",
  },
  medication: {
    label: "药盒识别",
    icon: renderAiUiIcon("medication"),
    badge: "识别",
    tabHint: "识别用法与注意事项",
    intro: "上传治疗期常用药盒或处方照片，辅助识别用途与常见注意事项。",
    footnote: "可继续补充服用时间、是否合并其他药物和当前不适症状。",
    guideItems: [
      "上传药盒、药板或药品正反面图片",
      "可追问用途、禁忌、服用时间和常见副作用",
      "药物相互作用和剂量问题仍需医生或药师确认",
    ],
    starterPrompts: [
      "请识别这盒漱口液，放疗期口腔黏膜炎一般怎么用？",
      "这盒止痛药通常什么时候用，放疗期要注意什么？",
      "如果同时在用营养补充剂和口服药，这盒药常见要注意什么？",
    ],
    quickPrompt: "请识别这盒漱口液，放疗期口腔黏膜炎一般怎么用？",
  },
};

getModeLabel = function (mode) {
  return AI_PROJECT_MODE_META[mode]?.label || "AI 问诊";
};

getModeDescription = function (mode) {
  return AI_PROJECT_MODE_META[mode]?.intro || "请输入你的问题，系统会结合当前模式给出回答。";
};

getModePlaceholder = function (mode) {
  const placeholders = {
    deep: "请输入你想检索的头颈放疗问题或文献方向",
    health: "请输入放疗期症状、复诊问题或康复疑问",
    report: "请输入你希望重点解读的报告内容",
    medication: "请输入你想确认的药物用途或注意事项",
  };
  return placeholders[mode] || "请输入症状、问题，或说明你上传的图片与文件。Shift + Enter 换行，Enter 发送。";
};

getAiModeMeta = function (mode) {
  return AI_PROJECT_MODE_META[mode] || AI_PROJECT_MODE_META.health;
};

renderAiBrandMark = function () {
  return `
    <svg viewBox="0 0 260 260" class="ai-brand-mark-svg" aria-hidden="true">
      <defs>
        <linearGradient id="aiBrandRingBlue" x1="12%" y1="10%" x2="92%" y2="88%">
          <stop offset="0%" stop-color="#f6f9ff"></stop>
          <stop offset="28%" stop-color="#bdd2f4"></stop>
          <stop offset="64%" stop-color="#6f9fe8"></stop>
          <stop offset="100%" stop-color="#3d66ab"></stop>
        </linearGradient>
        <linearGradient id="aiBrandPanelBlue" x1="14%" y1="10%" x2="86%" y2="90%">
          <stop offset="0%" stop-color="#ffffff"></stop>
          <stop offset="56%" stop-color="#f7faff"></stop>
          <stop offset="100%" stop-color="#edf3fc"></stop>
        </linearGradient>
        <linearGradient id="aiHairBlue" x1="28%" y1="18%" x2="80%" y2="88%">
          <stop offset="0%" stop-color="#e3edff"></stop>
          <stop offset="22%" stop-color="#a8c0ef"></stop>
          <stop offset="58%" stop-color="#4c77c3"></stop>
          <stop offset="100%" stop-color="#284b86"></stop>
        </radialGradient>
        <radialGradient id="aiBrandGlowBlue" cx="48%" cy="42%" r="62%">
          <stop offset="0%" stop-color="#e4efff" stop-opacity="0.92"></stop>
          <stop offset="100%" stop-color="#e4efff" stop-opacity="0"></stop>
        </radialGradient>
        <filter id="aiBrandShadowBlue" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="12" flood-color="#4c77c3" flood-opacity="0.22"></feDropShadow>
        </filter>
      </defs>
      <rect x="22" y="22" width="216" height="216" rx="56" fill="url(#aiBrandPanelBlue)" stroke="#d9e4f6"></rect>
      <circle cx="132" cy="128" r="92" fill="url(#aiBrandGlowBlue)"></circle>
      <path d="M64 56c-22 18-36 46-36 78 0 31 13 60 35 79 17 14 38 23 61 25" fill="none" stroke="url(#aiBrandRingBlue)" stroke-width="6" stroke-linecap="round" opacity="0.46"></path>
      <path d="M76 48c-30 18-50 48-54 83-6 47 20 91 63 111" fill="none" stroke="url(#aiBrandRingBlue)" stroke-width="13" stroke-linecap="round" filter="url(#aiBrandShadowBlue)"></path>
      <path d="M166 44c31 10 56 33 66 62 10 30 4 63-14 88" fill="none" stroke="url(#aiBrandRingBlue)" stroke-width="13" stroke-linecap="round"></path>
      <path d="M78 54c26-8 54-8 77 2 15 7 26 17 35 30 10 16 14 35 10 55-5 31-25 56-56 72-7 4-16 7-26 10 12-16 20-37 22-60 4-35-4-66-22-91-10-13-23-23-40-29z" fill="url(#aiHairBlue)" opacity="0.98"></path>
      <path d="M82 61c-6 6-11 13-14 22-4 12-3 25 3 36 5 11 14 19 25 25 9 5 20 8 31 10-17 2-33 0-46-8-13-8-23-21-27-37-5-18-2-38 8-54 5-8 11-15 20-21z" fill="url(#aiBrandPanelBlue)" stroke="#385477" stroke-width="2.6" stroke-linejoin="round"></path>
      <path d="M99 65c19 2 37 10 51 24 12 12 20 27 24 44-13-16-31-28-52-36-11-4-23-7-36-8 4-10 8-17 13-24z" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.9"></path>
      <path d="M110 98c24 3 46 14 62 31" fill="none" stroke="#bcd2f4" stroke-width="5" stroke-linecap="round" opacity="0.95"></path>
      <path d="M116 126c18 4 34 13 47 27" fill="none" stroke="#e4efff" stroke-width="4" stroke-linecap="round" opacity="0.92"></path>
      <g fill="#8fb4ee" opacity="0.9">
        <circle cx="136" cy="88" r="2.8"></circle>
        <circle cx="146" cy="96" r="2.2"></circle>
        <circle cx="154" cy="107" r="2.5"></circle>
        <circle cx="142" cy="111" r="2"></circle>
        <circle cx="162" cy="121" r="2.4"></circle>
        <circle cx="150" cy="126" r="2.1"></circle>
      </g>
      <path d="M146 88l8 19 18 3-14 10 4 17-16-10-14 10 4-17-13-10 17-3z" fill="#ffffff" opacity="0.95"></path>
      <path d="M206 94c10 7 19 17 26 29M204 146c8 6 14 12 19 20" fill="none" stroke="#bcd2f4" stroke-width="3.5" stroke-linecap="round" opacity="0.7"></path>
    </svg>`;
};

renderMessageAttachments = function (attachments) {
  if (!Array.isArray(attachments) || !attachments.length) {
    return "";
  }

  return `<div class="chat-attachments">${attachments
    .map((attachment) =>
      String(attachment.mimeType || "").startsWith("image/")
        ? `<a class="chat-attachment image" href="${escapeHtml(attachment.url)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(attachment.url)}" alt="${escapeHtml(attachment.originalName)}"><span>${escapeHtml(attachment.originalName)}</span></a>`
        : `<a class="chat-attachment file" href="${escapeHtml(attachment.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(attachment.originalName)}</strong><span>${escapeHtml(attachment.mimeType || "文件附件")}</span></a>`,
    )
    .join("")}</div>`;
};

renderMessageSources = function (sources) {
  if (!Array.isArray(sources) || !sources.length) {
    return "";
  }

  return `<div class="chat-sources"><div class="chat-source-title">联网参考</div>${sources
    .map((item) => `<a class="chat-source-card" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.snippet || "暂无摘要")}</span></a>`)
    .join("")}</div>`;
};

renderAiModeTabs = function () {
  return ["deep", "health", "report", "medication"]
    .map((key) => {
      const mode = getAiModeMeta(key);
      return `<button class="ai-mode-tab${aiState.activeMode === key ? " active" : ""}" type="button" data-action="switch-ai-mode" data-mode="${key}">
        <span class="ai-mode-tab-mark">${mode.icon}</span>
        <span class="ai-mode-tab-copy">
          <strong>${escapeHtml(mode.label)}</strong>
          <em>${escapeHtml(mode.tabHint || "")}</em>
        </span>
      </button>`;
    })
    .join("");
};

function renderAiModeStarters(meta) {
  return (meta.starterPrompts || [])
    .map(
      (prompt, index) =>
        `<button class="ai-starter-card" type="button" data-action="fill-ai-prompt" data-text="${escapeHtml(prompt)}">
          <span>示例问题 ${index + 1}</span>
          <strong>${escapeHtml(prompt)}</strong>
        </button>`,
    )
    .join("");
}

renderAiHistoryDrawer = function () {
  return `
    <div class="ai-history-drawer${aiState.historyDrawerOpen ? " open" : ""}">
      <button class="ai-history-backdrop" type="button" data-action="toggle-ai-history" aria-label="关闭对话记录"></button>
      <aside class="ai-history-panel">
        <div class="ai-history-head">
          <div>
            <span class="ai-history-kicker">问诊记录</span>
            <h3>历史对话</h3>
            <p>按当前病人账号自动保存，刷新后不会丢失。</p>
          </div>
          <button class="secondary-button" type="button" data-action="new-ai-conversation">新对话</button>
        </div>
        <div class="ai-history-list">${aiState.conversations.length
          ? aiState.conversations
              .map((item) => {
                const lastMessage = item.messages?.length ? item.messages[item.messages.length - 1] : null;
                const preview = lastMessage?.text ? `${String(lastMessage.text).slice(0, 40)}${String(lastMessage.text).length > 40 ? "..." : ""}` : "点击继续对话";
                return `<article class="ai-history-item${aiState.activeConversationId === item.id ? " active" : ""}"><button type="button" data-action="select-ai-conversation" data-id="${item.id}"><strong>${escapeHtml(item.title || "新对话")}</strong><span>${escapeHtml(getModeLabel(item.mode))}</span><p>${escapeHtml(preview)}</p><em>${escapeHtml(formatDateTimeLabel(item.updatedAt))}</em></button><button class="delete-session" type="button" data-action="delete-ai-conversation" data-id="${item.id}">删</button></article>`;
              })
              .join("")
          : `<div class="empty-state compact"><strong>暂无对话</strong><p>点击右上角“新对话”开始第一次问诊。</p></div>`}</div>
      </aside>
    </div>`;
};

renderAiUploadTiles = function () {
  return `<div class="ai-upload-grid">${aiState.pendingAttachments
    .map((attachment) =>
      String(attachment.mimeType || "").startsWith("image/")
        ? `<article class="ai-upload-card"><img src="${escapeHtml(attachment.url)}" alt="${escapeHtml(attachment.originalName)}"><div><strong>${escapeHtml(attachment.originalName)}</strong><span>图片附件</span></div><button type="button" data-action="remove-pending-attachment" data-id="${attachment.id}">移除</button></article>`
        : `<article class="ai-upload-card file"><div class="ai-upload-file-mark">${renderAiUiIcon("file")}</div><div><strong>${escapeHtml(attachment.originalName)}</strong><span>${escapeHtml(attachment.mimeType || "文件附件")}</span></div><button type="button" data-action="remove-pending-attachment" data-id="${attachment.id}">移除</button></article>`,
    )
    .join("")}</div>`;
};

renderAiUploadActions = function (mode) {
  const imageLabel = aiState.uploading ? "上传中..." : mode === "medication" ? "上传药盒图片" : "上传图片";
  const fileLabel = aiState.uploading ? "上传中..." : mode === "report" ? "上传报告文件" : "上传文件";
  if (mode === "medication") {
    return `<div class="ai-upload-actions"><button class="af-upload-button image" type="button" data-action="trigger-ai-image-upload" ${aiState.uploading ? "disabled" : ""}><span class="af-button-icon">${renderAiUiIcon("image")}</span><span class="af-button-text">${imageLabel}</span></button></div>`;
  }
  return `<div class="ai-upload-actions"><button class="af-upload-button image" type="button" data-action="trigger-ai-image-upload" ${aiState.uploading ? "disabled" : ""}><span class="af-button-icon">${renderAiUiIcon("image")}</span><span class="af-button-text">${imageLabel}</span></button><button class="af-upload-button file" type="button" data-action="trigger-ai-file-upload" ${aiState.uploading ? "disabled" : ""}><span class="af-button-icon">${renderAiUiIcon("file")}</span><span class="af-button-text">${fileLabel}</span></button></div>`;
};

renderAiLandingCanvas = function (mode) {
  const meta = getAiModeMeta(mode);
  const uploadMode = isAiUploadMode(mode);
  const uploadHint = uploadMode
    ? aiState.pendingAttachments.length
      ? renderAiUploadTiles()
      : `<div class="ai-upload-empty"><span>上传后的图片或文件会先保存到本地服务，点击“发送问诊”时会和本次文字一起提交给 AI。</span></div>`
    : "";

  return `
    <div class="ai-mode-canvas${uploadMode ? " upload-mode" : ""}">
      <div class="ai-mode-canvas-head">
        <div class="ai-mode-canvas-copy-block">
          <span class="ai-mode-kicker">当前模式</span>
          <div class="ai-mode-title-row">
            <h3>${escapeHtml(meta.label)}</h3>
            <span class="ai-mode-badge">${escapeHtml(meta.badge || "模式")}</span>
          </div>
          <p class="ai-mode-canvas-copy">${escapeHtml(meta.intro)}</p>
        </div>
        ${mode === "health"
          ? `<button class="ai-think-pill" type="button" data-action="fill-ai-prompt" data-text="${escapeHtml(meta.quickPrompt)}"><span class="ai-think-pill-icon">${renderAiUiIcon("deep")}</span><span>智能思考</span></button>`
          : uploadMode
            ? `<div class="ai-mode-canvas-tools">${renderAiUploadActions(mode)}</div>`
            : ""}
      </div>
      <div class="ai-mode-guide-grid">${(meta.guideItems || [])
        .map(
          (item, index) =>
            `<article class="ai-mode-guide-card"><strong>0${index + 1}</strong><span>${escapeHtml(item)}</span></article>`,
        )
        .join("")}</div>
      ${uploadMode ? `<div class="ai-upload-panel">${uploadHint}</div>` : ""}
      ${(meta.starterPrompts || []).length ? `<div class="ai-starter-row">${renderAiModeStarters(meta)}</div>` : ""}
    </div>`;
};

renderConversationMessages = function (conversation) {
  if (!conversation || !Array.isArray(conversation.messages) || !conversation.messages.length) {
    return "";
  }

  const items = conversation.messages
    .map((message, index) => {
      if (message.role === "user") {
        return `<article class="ai-chat-card user"><div class="chat-bubble"><div class="chat-message-body">${formatText(message.text || "")}</div></div></article>`;
      }

      const retryPrompt = getPreviousUserPrompt(conversation, index);
      return `
        <article class="ai-chat-card assistant">
          <div class="chat-bubble">
            <div class="chat-message-body">${formatAiText(message.text || "")}</div>
            ${renderMessageAttachments(message.attachments)}
            ${renderMessageSources(message.sources)}
            <div class="chat-message-caption">内容由 AI 生成，仅供参考，持续不适请及时就医。</div>
            <div class="chat-message-actions">
              <button class="chat-action-button" type="button" data-ai-utility="voice" title="语音播报">${renderAiUiIcon("voice")}</button>
              <button class="chat-action-button" type="button" data-ai-utility="retry" data-text="${escapeHtml(encodeDataText(retryPrompt))}" title="重新生成"${retryPrompt ? "" : " disabled"}>${renderAiUiIcon("retry")}</button>
              <button class="chat-action-button" type="button" data-ai-utility="copy" data-text="${escapeHtml(encodeDataText(stripAiDecorators(message.text || "")))}" title="复制回答">${renderAiUiIcon("copy")}</button>
              <button class="chat-action-button" type="button" data-ai-utility="rate" data-value="up" title="有帮助">${renderAiUiIcon("like")}</button>
              <button class="chat-action-button" type="button" data-ai-utility="rate" data-value="down" title="没帮助">${renderAiUiIcon("dislike")}</button>
            </div>
          </div>
        </article>`;
    })
    .join("");

  const thinking = aiState.sending
    ? `<article class="ai-chat-card assistant thinking"><div class="chat-bubble"><div class="chat-message-body">正在整理回答，请稍候…</div><div class="chat-thinking-dots"><span></span><span></span><span></span></div></div></article>`
    : "";

  return `
    <div class="ai-chat-stream">
      <div class="ai-chat-title">${escapeHtml(getConversationDisplayTitle(conversation))}</div>
      <div class="ai-chat-stream-inner">${items}${thinking}</div>
    </div>`;
};

renderPendingAttachments = function () {
  if (!aiState.pendingAttachments.length) {
    return "";
  }

  return `<div class="composer-attachments">${aiState.pendingAttachments
    .map(
      (attachment) => `<div class="composer-attachment">
        <div class="composer-attachment-copy">
          <strong>${escapeHtml(attachment.originalName)}</strong>
          <span>${escapeHtml(attachment.mimeType || "文件附件")}</span>
        </div>
        <button type="button" data-action="remove-pending-attachment" data-id="${attachment.id}" aria-label="移除附件">×</button>
      </div>`,
    )
    .join("")}</div>`;
};

renderPatientProfileModule = function () {
  const patient = getSafeCurrentPatient();
  const alerts = (patient.alerts.length ? patient.alerts : ["个人档案已开通"]).map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  return `
    <div class="panel-head"><div><h2>个人信息</h2><p>病人端仅用于查看，基础资料需由医生端统一维护。</p></div></div>
    <div class="panel-grid patient-grid">
      <section class="panel-card">
        <div class="patient-summary"><div class="patient-avatar">患</div><div><h3>${escapeHtml(patient.name)}</h3><p>病人编号 ${escapeHtml(patient.id)}</p></div></div>
        <div class="profile-tags">${alerts}</div>
        <div class="info-grid">
          <div class="info-box"><span>姓名</span><strong>${escapeHtml(patient.name)}</strong></div>
          <div class="info-box"><span>性别</span><strong>${escapeHtml(patient.gender)}</strong></div>
          <div class="info-box"><span>年龄</span><strong>${escapeHtml(`${patient.age} 岁`)}</strong></div>
          <div class="info-box"><span>联系电话</span><strong>${escapeHtml(patient.phone)}</strong></div>
          <div class="info-box wide"><span>居住地址</span><strong>${escapeHtml(patient.address)}</strong></div>
          <div class="info-box wide"><span>既往病史</span><strong>${escapeHtml(patient.history)}</strong></div>
          <div class="info-box wide"><span>紧急联系人</span><strong>${escapeHtml(patient.emergency)}</strong></div>
          <div class="info-box wide"><span>当前诊断</span><strong>${escapeHtml(patient.diagnosis)}</strong></div>
        </div>
      </section>
      <aside class="panel-card">
        <div class="section-head section-head-compact"><div><h3>健康摘要</h3><p>来自最近就诊、预约与报告记录。</p></div></div>
        <div class="summary-list">
          <article class="summary-item"><span>最近就诊</span><strong>${escapeHtml(patient.lastVisit || "-")}</strong><p>${escapeHtml(patient.diagnosis || "暂无诊断信息")}</p></article>
          <article class="summary-item"><span>下次预约</span><strong>${escapeHtml(getUpcomingAppointment(patient)?.date || "暂无预约")}</strong><p>${escapeHtml(getUpcomingAppointment(patient)?.department ? `${getUpcomingAppointment(patient).department} / ${formatRoomLabel(getUpcomingAppointment(patient).room)}` : "可在预约模块中提交新的复诊申请")}</p></article>
          <article class="summary-item"><span>最近报告</span><strong>${escapeHtml(patient.reports[0]?.name || "暂无报告")}</strong><p>${escapeHtml(patient.reports[0]?.summary || "当前没有新的检查结果。")}</p></article>
        </div>
      </aside>
    </div>`;
};

renderPatientAppointmentsModule = function () {
  const patient = getSafeCurrentPatient();
  const items = patient.appointments.length
    ? patient.appointments
        .map((item) => `
          <article class="appointment-card">
            <span>${escapeHtml(item.date)}</span>
            <strong>${escapeHtml(item.department)}</strong>
            <p>${escapeHtml(formatRoomLabel(item.room))}</p>
            <div class="card-meta"><span>状态 <b>${escapeHtml(item.status)}</b></span></div>
            <p>预约提交后由医生端统一确认与调整状态，病人端仅可查看。</p>
          </article>`)
        .join("")
    : `<div class="empty-state"><strong>暂无预约记录</strong><p>可通过右上角提交新的预约申请，医生端会同步处理。</p></div>`;
  return `<div class="panel-head"><div><h2>我的预约</h2><p>病人端只负责提交预约申请，预约状态仅能由医生端调整。</p></div></div><div class="appointment-list">${items}</div>`;
};

getPageActionHandler = function () {
  if (activeModuleKey === "patients") return () => openModal("patient");
  if (activeModuleKey === "doctorAppointments") return () => openModal("doctor-appointment");
  if (activeModuleKey === "doctorReports") return () => openModal("doctor-report");
  if (activeModuleKey === "healthManuals") return () => (currentRole === "doctor" ? openModal("manual") : setAppNotice("健康手册由医生端发布，病人端仅可阅读。", "error"));
  if (activeModuleKey === "aiConfig") return () => document.getElementById("aiConfigForm")?.requestSubmit();
  if (activeModuleKey === "schedule") return () => openModal("schedule");
  if (activeModuleKey === "followups") return () => openModal("followup");
  if (activeModuleKey === "aiChat") return () => createAiConversation(aiState.activeMode);
  if (activeModuleKey === "profile") return () => setAppNotice("个人信息由医生端维护，病人端仅可查看。", "error");
  if (activeModuleKey === "appointments") return () => openModal("appointment");
  return () => setAppNotice("检查报告由医生端统一发送，病人端仅可查看。", "error");
};

renderModal = function () {
  baseRenderModal();
  if (!modalState || modalState.type !== "appointment") {
    return;
  }

  modalTitle.textContent = modalState.payload ? "编辑预约" : "提交预约";
  const statusField = modalBody.querySelector('select[name="status"]')?.closest("label");
  if (statusField) {
    statusField.outerHTML = `<label class="wide"><span>说明</span><p class="modal-help">预约提交后由医生端确认并调整状态，病人端不能直接修改预约状态。</p></label>`;
  }

  const submitButton = modalBody.querySelector('.primary-action[type="submit"]');
  if (submitButton && !modalState.payload) {
    submitButton.textContent = "提交预约";
  }
};

openModal = function (type, payload = null) {
  if (currentRole === "patient" && type === "profile") {
    setAppNotice("个人信息需由医生端维护，病人端仅可查看。", "error");
    return;
  }

  if (currentRole === "patient" && type === "report") {
    setAppNotice("检查报告由医生端统一发送，病人端仅可查看。", "error");
    return;
  }

  if (currentRole === "patient" && type === "manual") {
    setAppNotice("健康手册由医生端发布，病人端仅可阅读。", "error");
    return;
  }

  if (currentRole === "patient" && type === "appointment" && payload) {
    setAppNotice("病人端只能提交预约，不能修改已有预约。", "error");
    return;
  }

  modalState = type === "manual" ? { type, payload, draft: createManualDraft(payload) } : { type, payload };
  renderModal();
  modalOverlay.hidden = false;
};

handleModalSubmit = function (event) {
  if (modalState?.type === "profile" && currentRole === "patient") {
    event.preventDefault();
    setAppNotice("个人信息需由医生端维护，病人端不能修改。", "error");
    closeModal();
    return;
  }

  if (modalState?.type === "report" && currentRole === "patient") {
    event.preventDefault();
    setAppNotice("检查报告只能由医生端录入和修改。", "error");
    closeModal();
    return;
  }

  if (modalState?.type === "manual" && currentRole === "patient") {
    event.preventDefault();
    setAppNotice("健康手册只能由医生端发布和修改。", "error");
    closeModal();
    return;
  }

  if (modalState?.type === "appointment" && currentRole === "patient") {
    event.preventDefault();
    if (modalState.payload) {
      setAppNotice("病人端只能提交预约，已有预约需由医生端处理。", "error");
      closeModal();
      return;
    }

    const formData = new FormData(event.target);
    appData.patients = appData.patients.map((item) => {
      if (item.username !== currentUsername) return item;
      const payload = {
        id: createId("APT"),
        date: formData.get("date")?.trim(),
        department: formData.get("department")?.trim(),
        room: formData.get("room")?.trim(),
        status: "已预约",
      };
      return { ...item, appointments: [payload, ...item.appointments] };
    });
    refreshAndPersist("预约申请已提交，等待医生端处理。");
    closeModal();
    return;
  }

  baseHandleModalSubmit(event);
};

renderPatientAiChatModule = function () {
  const conversation = getActiveConversation();
  const hasMessages = Boolean(conversation?.messages?.length);
  const configuredState = aiState.config.isConfigured ? "模型已连接" : "模型未配置";
  const modeMeta = getAiModeMeta(aiState.activeMode);
  const uploadMode = isAiUploadMode(aiState.activeMode);
  const showAttachmentList = !uploadMode || hasMessages;
  const pendingAttachmentCount = aiState.pendingAttachments.length;

  return `
    <div class="ai-af-page ${hasMessages ? "ai-chat-state" : "ai-landing-state"}">
      ${renderAiHistoryDrawer()}

      ${hasMessages
        ? `<div class="ai-chat-toolbar">
            <div class="ai-chat-toolbar-copy">
              <strong>${escapeHtml(getConversationDisplayTitle(conversation))}</strong>
              <span>${escapeHtml(configuredState)}${aiState.config.enableWebSearch ? " · 联网搜索开启" : ""}</span>
            </div>
            <div class="ai-chat-toolbar-actions">
              <button class="ai-ghost-pill" type="button" data-action="toggle-ai-history">对话记录${aiState.conversations.length ? ` ${aiState.conversations.length}` : ""}</button>
              <button class="ai-ghost-pill" type="button" data-action="new-ai-conversation">新对话</button>
            </div>
          </div>
          <section class="ai-chat-stage">
            <div class="ai-thread-wrap"><div class="ai-thread" id="aiThread">${renderConversationMessages(conversation)}</div></div>
          </section>`
        : `<section class="ai-brand-hero">
            <div class="ai-brand-mark">${renderAiBrandMark()}</div>
            <div class="ai-brand-copy">
              <h2>我是<span>GBM-DeepNeuro-TregAI助手</span><br>你的放疗医生朋友</h2>
              <p>放疗决策・解读报告・预后评估，都来问GBM-DeepNeuro-Treg吧～</p>
            </div>
          </section>`}

      <section class="ai-console-shell${hasMessages ? " is-chatting" : ""}">
        <div class="ai-console-tabs">${renderAiModeTabs()}</div>
        <div class="ai-console-surface${hasMessages ? " is-chatting" : ""}">
          ${hasMessages ? "" : renderAiLandingCanvas(aiState.activeMode)}
          <form class="ai-composer af-composer" id="aiComposerForm">
            <div class="af-composer-frame">
              ${showAttachmentList ? renderPendingAttachments() : ""}
              <div class="af-composer-topline">
                <div class="af-composer-topline-left">
                  <span class="af-mode-chip">${escapeHtml(modeMeta.label)}</span>
                  <span class="af-upload-state">${pendingAttachmentCount ? `已添加 ${pendingAttachmentCount} 个附件，发送时会和文字一起提交给 AI` : "支持上传图片、PDF、Word、TXT、CSV 等文件"}</span>
                </div>
                <span class="af-shortcut-tip">Enter 发送，Shift + Enter 换行</span>
              </div>
              <textarea id="aiComposerInput" name="message" rows="${hasMessages ? 3 : 4}" placeholder="${escapeHtml(getModePlaceholder(aiState.activeMode))}"></textarea>
              <div class="af-composer-note-row">
                <span class="af-composer-note">${escapeHtml(modeMeta.footnote)}</span>
              </div>
              <div class="af-composer-foot">
                <div class="af-composer-right">
                  <button class="af-upload-button image" type="button" data-action="trigger-ai-image-upload" ${aiState.uploading ? "disabled" : ""}><span class="af-button-icon">${renderAiUiIcon("image")}</span><span class="af-button-text">${aiState.uploading ? "上传中..." : "上传图片"}</span></button>
                  <button class="af-upload-button file" type="button" data-action="trigger-ai-file-upload" ${aiState.uploading ? "disabled" : ""}><span class="af-button-icon">${renderAiUiIcon("file")}</span><span class="af-button-text">${aiState.uploading ? "上传中..." : "上传文件"}</span></button>
                  <input id="aiImageInput" type="file" multiple hidden accept="image/*">
                  <input id="aiFileInput" type="file" multiple hidden accept=".txt,.md,.json,.csv,.pdf,.doc,.docx">
                </div>
                <div class="af-composer-send">
                  <button class="ai-send-button" type="submit" ${aiState.sending || !aiState.config.isConfigured ? "disabled" : ""}><span class="af-button-icon send">${renderAiUiIcon("send")}</span><span class="af-button-text">${aiState.sending ? "发送中" : "发送问诊"}</span></button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>`;
};

moduleContent.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-ai-utility]");
  if (!button) {
    return;
  }

  const action = button.dataset.aiUtility;

  if (action === "copy") {
    const text = decodeDataText(button.dataset.text);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setAppNotice("回答内容已复制。", "success");
    } catch (error) {
      setAppNotice("复制失败，请重试。", "error");
    }
    return;
  }

  if (action === "retry") {
    const prompt = decodeDataText(button.dataset.text);
    if (!prompt) {
      return setAppNotice("没有可重新生成的上一条问题。", "info");
    }
    return sendAiMessage(prompt);
  }

  if (action === "voice") {
    return setAppNotice("语音播报入口已预留，当前版本暂未接入。", "info");
  }

  if (action === "rate") {
    return setAppNotice(button.dataset.value === "up" ? "已记录“有帮助”。" : "已记录“没帮助”。", "success");
  }
});

Object.assign(DEFAULT_AI_CONFIG, {
  providerName: "OpenAI 兼容接口",
  systemPrompt:
    "你是GBM-DeepNeuro-Treg AI 助手。你的回答只能作为线上分诊和健康信息参考，不能替代执业医生的面诊、检查、化验、影像和处方。面对不确定信息必须明确说明，对急危重症征象必须优先提示立即线下就医或急诊处理，不得编造检查结果、药物剂量或医学结论。",
});

accounts.patient.title = "病人账号";
accounts.patient.placeholder = "请输入病人账号";
accounts.patient.name = "陈丽";
accounts.doctor.title = "医生账号";
accounts.doctor.placeholder = "请输入医生账号";
accounts.doctor.name = "张明炜";

Object.assign(appViews.doctor, {
  roleLabel: "医生端",
  avatar: "医",
  defaultName: "张明炜",
  headerMeta: "角色：医生端",
  subtitle: "医生管理端 / AI 问诊配置",
  modules: [
    { key: "patients", icon: "病", title: "病人信息管理", desc: "病历与基础档案", actionText: "新增病人" },
    { key: "doctorAppointments", icon: "约", title: "预约管理", desc: "查看病人预约申请", actionText: "代病人预约" },
    { key: "escortManagement", icon: "陪", title: "陪诊管理", desc: "处理病人陪诊申请", actionText: "新增陪诊" },
    { key: "doctorReports", icon: "报", title: "报告管理", desc: "录入并发送检查报告", actionText: "发送报告" },
    { key: "targetContouring", icon: "靶", title: "靶区勾画", desc: "调用本地勾画工作台与 NIfTI 上传推理", actionText: "打开工作台" },
    { key: "radiotherapyDecision", icon: "疗", title: "放疗适应证决策", desc: "头颈部鳞癌术后出院小结判读", actionText: "打开模块" },
    { key: "radiomicsPrognosis", icon: "组", title: "影像组学预后评分", desc: "六项特征与Treg预测概率", actionText: "刷新数据" },
    { key: "healthManuals", icon: "册", title: "健康手册", desc: "发布头颈放疗护理文章", actionText: "发布文章" },
    { key: "healthMall", icon: "购", title: "健康商城", desc: "营养与护理用品商城", actionText: "管理商品" },
    { key: "aiConfig", icon: "智", title: "AI 问诊配置", desc: "模型与联网搜索设置", actionText: "保存配置" },
    { key: "schedule", icon: "排", title: "门诊排班", desc: "查看当日坐诊安排", actionText: "新增排班" },
    { key: "followups", icon: "访", title: "随访记录", desc: "术后与慢病随访", actionText: "新增随访" },
  ],
});


Object.assign(appViews.patient, {
  roleLabel: "病人端",
  avatar: "患",
  defaultName: "陈丽",
  headerMeta: "角色：病人端",
  subtitle: "病人服务端 / 智能问诊中心",
  modules: [
    { key: "aiChat", icon: "问", title: "AI 问诊", desc: "在线问答与报告解读", actionText: "新建对话" },
    { key: "healthManuals", icon: "册", title: "健康手册", desc: "查看头颈放疗护理文章", actionText: "查看文章" },
    { key: "profile", icon: "档", title: "个人信息", desc: "基础资料与联系方式", actionText: "编辑信息" },
    { key: "appointments", icon: "约", title: "我的预约", desc: "查看预约与复诊安排", actionText: "新增预约" },
    { key: "escortService", icon: "陪", title: "陪诊服务", desc: "申请陪诊与查看状态", actionText: "申请陪诊" },
    { key: "reports", icon: "报", title: "检查报告", desc: "医生发送的检验与影像结果", actionText: "查看报告" },
  ],
});

const APPOINTMENT_DEPARTMENT_OPTIONS = [
  { key: "hnrt", label: "头颈放疗门诊", summary: "放疗复查、疗程评估与复诊安排" },
  { key: "nutrition", label: "营养支持门诊", summary: "体重下降、进食困难与营养支持" },
  { key: "swallow", label: "吞咽康复门诊", summary: "吞咽训练、康复评估与饮食指导" },
  { key: "symptom", label: "症状管理门诊", summary: "口腔、皮肤、疼痛和不适症状处理" },
];

const ESCORT_REQUEST_TYPE_OPTIONS = ["门诊陪诊", "检查陪同", "取药协助", "住院接送"];
const ESCORT_STATUS_OPTIONS = ["待确认", "已安排", "已完成", "已取消"];

function hasPendingAppointmentRecord(patient) {
  return Array.isArray(patient?.appointments) && patient.appointments.some((item) => item.status === "已预约");
}

function getAppointmentDepartmentOption(value = "") {
  return APPOINTMENT_DEPARTMENT_OPTIONS.find((item) => item.key === value || item.label === value) || null;
}

function getClinicDepartmentLabel(clinic) {
  return String(clinic || "")
    .trim()
    .replace(/诊室\s*[A-Za-z0-9-]+$/u, "")
    .replace(/(?:^|\s)\d{3,}[A-Za-z0-9-]*$/u, "")
    .trim() || "复诊门诊";
}

function getScheduleRemainCount(schedule) {
  return Math.max(0, Number(schedule?.capacity || 0) - Number(schedule?.booked || 0));
}

function getSchedulePeriodRank(period) {
  return ({ 上午: 1, 下午: 2, 夜间: 3 }[String(period || "").trim()] || 9);
}

function getDepartmentNextSchedule(option) {
  if (!option) {
    return null;
  }

  return (Array.isArray(appData?.schedules) ? appData.schedules : [])
    .filter((item) => String(item?.date || "") >= getTodayString())
    .filter((item) => getClinicDepartmentLabel(item.clinic) === option.label)
    .filter((item) => getScheduleRemainCount(item) > 0)
    .sort((left, right) => {
      const dateCompare = String(left.date || "").localeCompare(String(right.date || ""));
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return getSchedulePeriodRank(left.period) - getSchedulePeriodRank(right.period);
    })[0] || null;
}

function formatDepartmentNextSlot(option) {
  const nextSchedule = getDepartmentNextSchedule(option);
  if (!nextSchedule) {
    return "暂无未来号源，点击后会自动补最近门诊";
  }

  return `${nextSchedule.date} ${nextSchedule.period} · ${formatRoomLabel(nextSchedule.clinic)} · 余号 ${getScheduleRemainCount(nextSchedule)}`;
}

function renderDepartmentQuickCards(patientId = "", disabled = false, action = "quick-followup") {
  return `<div class="appointment-department-grid">${APPOINTMENT_DEPARTMENT_OPTIONS
    .map((option) => `
      <article class="appointment-department-card">
        <strong>${escapeHtml(option.label)}</strong>
        <p>${escapeHtml(option.summary)}</p>
        <div class="card-meta"><span>最近可约 <b>${escapeHtml(formatDepartmentNextSlot(option))}</b></span></div>
        <button class="primary-action" type="button" data-action="${action}" data-id="${escapeHtml(patientId)}" data-department-key="${escapeHtml(option.key)}" ${disabled ? "disabled" : ""}>${disabled ? "已有待就诊预约" : "一键预约"}</button>
      </article>`)
    .join("")}</div>`;
}

async function requestQuickFollowup(patientId = "", departmentKey = "", scheduleId = "") {
  try {
    const payload = await requestJson("/api/appointments/quick-followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(patientId ? { patientId } : {}),
        ...(departmentKey ? { departmentKey } : {}),
        ...(scheduleId ? { scheduleId } : {}),
      }),
    });
    applyServerAppData(payload, { rerender: true });
    setAppNotice(payload.message || "已完成一键预约复诊。", "success");
    return true;
  } catch (error) {
    setAppNotice(error.message || "一键预约复诊失败。", "error");
    return false;
  }
}

function getEscortRequestsForCurrentView() {
  const list = Array.isArray(appData?.escortRequests) ? [...appData.escortRequests] : [];
  return list.sort((left, right) => String(right.updatedAt || right.createdAt || "").localeCompare(String(left.updatedAt || left.createdAt || "")));
}

function getPatientEscortRequests(patient = getSafeCurrentPatient()) {
  return getEscortRequestsForCurrentView().filter((item) => item.patientId === patient.id || item.patientUsername === patient.username);
}

function getEscortRequestById(id) {
  return getEscortRequestsForCurrentView().find((item) => item.id === id) || null;
}

function getEscortAppointmentOptions(patient) {
  const appointments = Array.isArray(patient?.appointments) ? patient.appointments : [];
  return appointments.filter((item) => item.status !== "已取消");
}

function buildEscortAppointmentOptionsMarkup(patient, selectedId = "") {
  const options = getEscortAppointmentOptions(patient);
  if (!options.length) {
    return `<option value="">不关联预约，手动填写陪诊信息</option>`;
  }

  return [`<option value="">不关联预约，手动填写陪诊信息</option>`, ...options.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedId ? "selected" : ""}>${escapeHtml(`${item.date} / ${item.department} / ${formatRoomLabel(item.room)}`)}</option>`)].join("");
}

function getEscortModalPatient(payload = null, form = null) {
  if (currentRole === "doctor") {
    const selectedPatientId = form?.elements?.patientId?.value?.trim() || payload?.patientId || appData.patients?.[0]?.id || "";
    return findPatientById(selectedPatientId) || null;
  }
  return getSafeCurrentPatient();
}

function syncEscortModalForm(form, { updateContact = false, updateSchedule = false } = {}) {
  if (!form || modalState?.type !== "escort-request") {
    return;
  }

  const patient = getEscortModalPatient(modalState.payload || null, form);
  const appointmentSelect = form.elements.appointmentId;
  const selectedAppointmentId = appointmentSelect?.value?.trim() || "";
  const nextOptions = buildEscortAppointmentOptionsMarkup(patient, selectedAppointmentId);

  if (appointmentSelect && appointmentSelect.innerHTML !== nextOptions) {
    appointmentSelect.innerHTML = nextOptions;
    const matchingOption = Array.from(appointmentSelect.options).some((item) => item.value === selectedAppointmentId);
    appointmentSelect.value = matchingOption ? selectedAppointmentId : "";
  }

  if (patient) {
    const currentContactName = form.elements.contactName?.value?.trim() || "";
    const currentContactPhone = form.elements.contactPhone?.value?.trim() || "";
    if (updateContact || !currentContactName) {
      form.elements.contactName.value = patient.name || "";
    }
    if (updateContact || !currentContactPhone) {
      form.elements.contactPhone.value = patient.phone || "";
    }
  }

  const linkedAppointment = patient ? getPatientAppointmentById(patient, form.elements.appointmentId?.value?.trim()) : null;
  if (linkedAppointment && (updateSchedule || !form.elements.serviceDate?.value?.trim())) {
    form.elements.serviceDate.value = linkedAppointment.date || "";
  }
  if (linkedAppointment && (updateSchedule || !form.elements.department?.value?.trim())) {
    form.elements.department.value = linkedAppointment.department || "";
  }
  if (linkedAppointment && (updateSchedule || !form.elements.room?.value?.trim())) {
    form.elements.room.value = linkedAppointment.room || "";
  }
}

async function requestEscortSave(payload) {
  try {
    const response = await requestJson("/api/escort-requests/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const nextData = normalizeAppData(response.data || appData);
    const nextSnapshot = JSON.stringify(nextData);
    appData = nextData;
    dataSnapshot = nextSnapshot;
    localStorage.setItem(DATA_STORAGE_VERSION_KEY, CURRENT_DATA_VERSION);
    localStorage.setItem(DATA_STORAGE_KEY, nextSnapshot);
    renderApp();
    setAppNotice(response.message || "陪诊单已保存。", "success");
    return true;
  } catch (error) {
    setAppNotice(error.message || "陪诊单保存失败。", "error");
    return false;
  }
}

async function requestEscortStatus(id, status, extraPayload = {}) {
  try {
    const response = await requestJson("/api/escort-requests/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, ...extraPayload }),
    });
    const nextData = normalizeAppData(response.data || appData);
    const nextSnapshot = JSON.stringify(nextData);
    appData = nextData;
    dataSnapshot = nextSnapshot;
    localStorage.setItem(DATA_STORAGE_VERSION_KEY, CURRENT_DATA_VERSION);
    localStorage.setItem(DATA_STORAGE_KEY, nextSnapshot);
    renderApp();
    setAppNotice(response.message || "陪诊单状态已更新。", "success");
    return true;
  } catch (error) {
    setAppNotice(error.message || "陪诊单状态更新失败。", "error");
    return false;
  }
}

function renderDoctorEscortModule() {
  const items = getEscortRequestsForCurrentView().length
    ? getEscortRequestsForCurrentView()
        .map((item) => `
          <article class="escort-request-card">
            <span>${escapeHtml(item.serviceDate || "-")}</span>
            <strong>${escapeHtml(`${item.patientName} · ${item.requestType}`)}</strong>
            <p>${escapeHtml(`${item.department} / ${formatRoomLabel(item.room)} / 集合点：${item.meetingPoint || "门诊大厅"}`)}</p>
            <div class="card-meta">
              <span>状态 <b>${escapeHtml(item.status)}</b></span>
              <span>联系人 <b>${escapeHtml(`${item.contactName || item.patientName} / ${item.contactPhone || "-"}`)}</b></span>
            </div>
            <div class="card-meta">
              <span>陪诊人员 <b>${escapeHtml(item.assignedStaff || "待安排")}</b></span>
              <span>备注 <b>${escapeHtml(item.note || "无")}</b></span>
            </div>
            <div class="card-actions">
              <button class="secondary-button" type="button" data-action="edit-escort-request" data-id="${item.id}">安排 / 编辑</button>
              <button class="secondary-button" type="button" data-action="escort-status" data-id="${item.id}" data-status="已完成" ${item.status === "已完成" || item.status === "已取消" ? "disabled" : ""}>标记完成</button>
              <button class="danger-button" type="button" data-action="escort-status" data-id="${item.id}" data-status="已取消" ${item.status === "已完成" || item.status === "已取消" ? "disabled" : ""}>取消</button>
            </div>
          </article>`)
        .join("")
    : `<div class="empty-state"><strong>暂无陪诊单</strong><p>病人端提交陪诊申请后，这里会集中显示并支持安排处理。</p></div>`;

  return `<div class="panel-head"><div><h2>陪诊管理</h2><p>统一处理病人发起的陪诊申请，可安排陪诊人员、更新状态并同步回病人端。</p></div></div><div class="appointment-list escort-request-list">${items}</div>`;
}

function renderPatientEscortModule() {
  const patient = getSafeCurrentPatient();
  const items = getPatientEscortRequests(patient).length
    ? getPatientEscortRequests(patient)
        .map((item) => `
          <article class="escort-request-card">
            <span>${escapeHtml(item.serviceDate || "-")}</span>
            <strong>${escapeHtml(`${item.requestType} · ${item.department}`)}</strong>
            <p>${escapeHtml(`${formatRoomLabel(item.room)} / 集合点：${item.meetingPoint || "门诊大厅"}`)}</p>
            <div class="card-meta">
              <span>状态 <b>${escapeHtml(item.status)}</b></span>
              <span>陪诊人员 <b>${escapeHtml(item.assignedStaff || "待安排")}</b></span>
            </div>
            <div class="card-meta">
              <span>联系人 <b>${escapeHtml(item.contactPhone || patient.phone || "-")}</b></span>
              <span>备注 <b>${escapeHtml(item.note || "无")}</b></span>
            </div>
            <div class="card-actions">
              <button class="secondary-button" type="button" data-action="edit-escort-request" data-id="${item.id}">查看详情</button>
              <button class="danger-button" type="button" data-action="escort-status" data-id="${item.id}" data-status="已取消" ${item.status === "已完成" || item.status === "已取消" ? "disabled" : ""}>取消申请</button>
            </div>
          </article>`)
        .join("")
    : `<div class="empty-state"><strong>暂无陪诊申请</strong><p>可点击右上角“申请陪诊”，提交门诊陪同、检查陪同或取药协助需求。</p></div>`;

  return `
    <div class="panel-head">
      <div>
        <h2>陪诊服务</h2>
        <p>适用于门诊复诊、检查、取药或住院接送场景。提交后医生端会统一安排并同步状态。</p>
      </div>
    </div>
    <section class="panel-card escort-service-intro">
      <div class="info-stack">
        <article class="info-item"><span>门诊陪诊</span><strong>复诊当天有人陪同到科室</strong><p>适合首次复诊、路线不熟或需要院内引导的患者。</p></article>
        <article class="info-item"><span>检查陪同</span><strong>影像、抽血、复查流程协助</strong><p>适合需要跨楼层检查或流程较多的复查场景。</p></article>
        <article class="info-item"><span>取药协助</span><strong>开药、缴费、取药一站式协助</strong><p>适合治疗后恢复期行动不便或流程不熟悉的患者。</p></article>
      </div>
    </section>
    <div class="appointment-list escort-request-list">${items}</div>`;
}

const baseRenderChromeFollowup = renderChrome;
renderChrome = function (role) {
  baseRenderChromeFollowup(role);
  const isFlatPatientAppointments = role === "patient" && activeModuleKey === "appointments";

  pageActionButton.disabled = false;
  pageActionButton.hidden = isFlatPatientAppointments;
  pageCrumbCard.hidden = isFlatPatientAppointments || pageCrumbCard.hidden;
  pageSummaryRow.hidden = isFlatPatientAppointments || pageSummaryRow.hidden;
  appMain.classList.toggle("flat-appointments-page", isFlatPatientAppointments);
  moduleContent.classList.toggle("flat-appointments-panel", isFlatPatientAppointments);
};

renderPatientAppointmentsModule = function () {
  const patient = getSafeCurrentPatient();
  const hasPending = hasPendingAppointmentRecord(patient);
  const items = patient.appointments.length
    ? patient.appointments
        .map((item) => `
          <article class="appointment-card">
            <span>${escapeHtml(item.date)}</span>
            <strong>${escapeHtml(item.department)}</strong>
            <p>${escapeHtml(`${formatRoomLabel(item.room)} / ${item.visitType || "复诊"} / 状态：${item.status}`)}</p>
            <div class="card-meta">
              <span>预约方式 <b>${escapeHtml(item.source === "quickFollowup" ? "一键复诊" : "常规预约")}</b></span>
            </div>
          </article>`)
        .join("")
    : `<div class="empty-state"><strong>暂无预约记录</strong><p>选择下方对应科室后即可一键预约，系统会自动占用该科室最近可用号源并同步给医生端。</p></div>`;

  return `
    <div class="panel-head">
      <div>
        <h2>我的预约</h2>
        <p>${hasPending ? "你当前已有待就诊预约，先完成这次复诊后再继续预约。" : "这里只保留和头颈放疗复诊直接相关的科室。点一下就能预约。 "}</p>
      </div>
    </div>
    <section class="panel-card appointment-department-panel">
      <div class="section-head section-head-compact">
        <div>
          <h3>相关科室</h3>
          <p>按头颈放疗复诊常用科室直接预约。</p>
        </div>
      </div>
      ${renderDepartmentQuickCards("", hasPending, "quick-followup")}
    </section>
    <div class="appointment-list">${items}</div>`;
};

renderPatientAppointmentsModule = function () {
  const patient = getSafeCurrentPatient();
  const hasPending = hasPendingAppointmentRecord(patient);
  const items = patient.appointments.length
    ? patient.appointments
        .map((item) => `
          <article class="appointment-card">
            <span>${escapeHtml(item.date)}</span>
            <strong>${escapeHtml(item.department)}</strong>
            <p>${escapeHtml(`${formatRoomLabel(item.room)} / ${item.visitType || "复诊"} / 状态：${item.status}`)}</p>
            <div class="card-meta">
              <span>预约方式 <b>${escapeHtml(item.source === "quickFollowup" ? "一键复诊" : "常规预约")}</b></span>
            </div>
          </article>`)
        .join("")
    : `<div class="empty-state"><strong>暂无预约记录</strong><p>下方只保留头颈放疗复诊直接相关科室，点卡片即可一键预约。</p></div>`;

  return `
    <section class="appointment-flat-layout">
      <div class="appointment-inline-note">
        <strong>相关科室预约</strong>
        <span>${hasPending ? "你当前已有待就诊预约，先完成本次复诊后再继续预约。" : "只保留和头颈放疗复诊直接相关的科室，点卡片即可一键预约。"}</span>
      </div>
      <div class="appointment-flat-cards">
        ${renderDepartmentQuickCards("", hasPending, "quick-followup")}
      </div>
      <div class="appointment-history-head">
        <strong>预约记录</strong>
        <span>医生端和病人端看到的是同一份预约数据。</span>
      </div>
      <div class="appointment-list">${items}</div>
    </section>`;
};

const baseGetPageActionHandlerFollowup = getPageActionHandler;
getPageActionHandler = function () {
  if (activeModuleKey === "escortManagement") {
    return () => openModal("escort-request");
  }
  if (activeModuleKey === "escortService") {
    return () => openModal("escort-request");
  }
  if (currentRole === "patient" && activeModuleKey === "appointments") {
    return () => setAppNotice("请直接点击下方对应科室卡片完成一键预约。", "info");
  }
  return baseGetPageActionHandlerFollowup();
};

moduleContent.addEventListener("click", async (event) => {
  const escortEditButton = event.target.closest('[data-action="edit-escort-request"]');
  if (escortEditButton) {
    event.preventDefault();
    const request = getEscortRequestById(escortEditButton.dataset.id || "");
    if (request) {
      openModal("escort-request", request);
    }
    return;
  }

  const escortStatusButton = event.target.closest('[data-action="escort-status"]');
  if (escortStatusButton) {
    event.preventDefault();
    if (escortStatusButton.disabled) {
      return;
    }
    await requestEscortStatus(escortStatusButton.dataset.id || "", escortStatusButton.dataset.status || "已取消");
    return;
  }

  const pickerButton = event.target.closest('[data-action="open-quick-followup"]');
  if (pickerButton) {
    event.preventDefault();
    if (pickerButton.disabled) {
      return;
    }
    const patient = findPatientById(pickerButton.dataset.id || "");
    if (patient) {
      appointmentBookingState.picker.departmentKey = APPOINTMENT_DEPARTMENT_OPTIONS[0]?.key || "";
      appointmentBookingState.picker.dateByDepartment = {};
      openModal("quick-followup-picker", patient);
    }
    return;
  }

  const button = event.target.closest('[data-action="quick-followup"]');
  if (!button) {
    return;
  }

  event.preventDefault();
  if (button.disabled) {
    return;
  }

  await requestQuickFollowup(button.dataset.id || "", button.dataset.departmentKey || "");
});

const baseRenderModalFollowupPicker = renderModal;
renderModal = function () {
  baseRenderModalFollowupPicker();
  if (!modalState || modalState.type !== "quick-followup-picker") {
    return;
  }

  const patient = modalState.payload || {};
  const hasPending = hasPendingAppointmentRecord(patient);
  modalTitle.textContent = "预约复诊";
  modalBody.innerHTML = `
    <div class="quick-followup-picker">
      <p class="modal-help">为 <strong>${escapeHtml(patient.name || "当前病人")}</strong> 选择预约科室。点击后会立即占用对应科室最近可用号源，并同步到病人端。</p>
      ${renderDepartmentQuickCards(patient.id || "", hasPending, "confirm-quick-followup")}
    </div>`;
};

modalBody.addEventListener("click", async (event) => {
  const button = event.target.closest('[data-action="confirm-quick-followup"]');
  if (!button) {
    return;
  }

  event.preventDefault();
  if (button.disabled) {
    return;
  }

  const success = await requestQuickFollowup(button.dataset.id || "", button.dataset.departmentKey || "");
  if (success) {
    closeModal();
  }
});

const baseRenderModalEscort = renderModal;
renderModal = function () {
  baseRenderModalEscort();
  if (!modalState || modalState.type !== "escort-request") {
    return;
  }

  const payload = modalState.payload || null;
  const patient = getEscortModalPatient(payload);
  const isReadOnlyPatientView = currentRole === "patient" && Boolean(payload?.id);
  const appointmentOptions = buildEscortAppointmentOptionsMarkup(patient, payload?.appointmentId || "");
  modalTitle.textContent = payload ? "陪诊单详情" : currentRole === "doctor" ? "新增陪诊" : "申请陪诊";
  modalBody.innerHTML = `
    <form class="modal-form" id="modalForm">
      <div class="form-grid">
        ${currentRole === "doctor"
          ? `<label class="wide"><span>病人</span><select name="patientId" required ${isReadOnlyPatientView ? "disabled" : ""}>${appData.patients.map((item) => `<option value="${item.id}" ${(payload?.patientId ? payload.patientId === item.id : patient?.id === item.id) ? "selected" : ""}>${escapeHtml(`${item.name} (${item.id})`)}</option>`).join("")}</select></label>`
          : ""}
        <label><span>陪诊类型</span><select name="requestType" ${isReadOnlyPatientView ? "disabled" : ""}>${ESCORT_REQUEST_TYPE_OPTIONS.map((item) => `<option value="${item}" ${payload?.requestType === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
        <label><span>关联预约</span><select name="appointmentId" ${isReadOnlyPatientView ? "disabled" : ""}>${appointmentOptions}</select></label>
        <label><span>陪诊时间</span><input name="serviceDate" value="${escapeHtml(payload?.serviceDate || "")}" placeholder="例如 2026-04-13 09:00" required ${isReadOnlyPatientView ? "disabled" : ""}></label>
        <label><span>陪诊科室</span><input name="department" value="${escapeHtml(payload?.department || "")}" placeholder="例如 头颈放疗门诊" required ${isReadOnlyPatientView ? "disabled" : ""}></label>
        <label><span>诊室</span><input name="room" value="${escapeHtml(payload?.room || "")}" placeholder="例如 诊室 301" required ${isReadOnlyPatientView ? "disabled" : ""}></label>
        <label><span>集合点</span><input name="meetingPoint" value="${escapeHtml(payload?.meetingPoint || "门诊大厅服务台")}" required ${isReadOnlyPatientView ? "disabled" : ""}></label>
        <label><span>联系人</span><input name="contactName" value="${escapeHtml(payload?.contactName || patient?.name || "")}" required ${isReadOnlyPatientView ? "disabled" : ""}></label>
        <label><span>联系电话</span><input name="contactPhone" value="${escapeHtml(payload?.contactPhone || patient?.phone || "")}" required ${isReadOnlyPatientView ? "disabled" : ""}></label>
        ${currentRole === "doctor"
          ? `<label><span>状态</span><select name="status">${ESCORT_STATUS_OPTIONS.map((item) => `<option value="${item}" ${payload?.status === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
             <label><span>陪诊人员</span><input name="assignedStaff" value="${escapeHtml(payload?.assignedStaff || "")}" placeholder="例如 李护士 / 陪诊员王敏"></label>`
          : ""}
        <label class="wide"><span>备注说明</span><textarea name="note" ${isReadOnlyPatientView ? "disabled" : ""}>${escapeHtml(payload?.note || "")}</textarea></label>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" id="cancelModal">${isReadOnlyPatientView ? "关闭" : "取消"}</button>
        ${isReadOnlyPatientView ? "" : `<button class="primary-action" type="submit">${payload ? "保存陪诊单" : "提交申请"}</button>`}
      </div>
    </form>`;

  const form = modalBody.querySelector("#modalForm");
  if (form && !payload) {
    syncEscortModalForm(form, { updateContact: true });
  }
};

const baseHandleModalSubmitEscort = handleModalSubmit;
handleModalSubmit = async function (event) {
  if (modalState?.type === "escort-request") {
    event.preventDefault();
    const formData = new FormData(event.target);
    const success = await requestEscortSave({
      ...(modalState.payload?.id ? { id: modalState.payload.id } : {}),
      ...(currentRole === "doctor" ? { patientId: formData.get("patientId")?.trim() } : {}),
      requestType: formData.get("requestType")?.trim(),
      appointmentId: formData.get("appointmentId")?.trim(),
      serviceDate: formData.get("serviceDate")?.trim(),
      department: formData.get("department")?.trim(),
      room: formData.get("room")?.trim(),
      meetingPoint: formData.get("meetingPoint")?.trim(),
      contactName: formData.get("contactName")?.trim(),
      contactPhone: formData.get("contactPhone")?.trim(),
      note: formData.get("note")?.trim(),
      ...(currentRole === "doctor" ? {
        status: formData.get("status")?.trim(),
        assignedStaff: formData.get("assignedStaff")?.trim(),
      } : {}),
    });
    if (success) {
      closeModal();
    }
    return;
  }

  return baseHandleModalSubmitEscort(event);
};

modalBody.addEventListener("change", (event) => {
  if (modalState?.type !== "escort-request") {
    return;
  }

  const form = event.target.closest("#modalForm");
  if (!form) {
    return;
  }

  if (event.target.name === "patientId") {
    syncEscortModalForm(form, { updateContact: true, updateSchedule: true });
  }

  if (event.target.name === "appointmentId") {
    syncEscortModalForm(form, { updateSchedule: true });
  }
});

const ESCORT_WORKFLOW_STATUS_OPTIONS = ["待确认", "已安排", "进行中", "已到达", "已完成", "已取消"];
const ESCORT_WORKFLOW_FEE_STATUS_OPTIONS = ["待确认", "待支付", "已支付", "已减免"];
const ESCORT_WORKFLOW_STAFF_ROLE_OPTIONS = ["护士", "陪诊员", "导诊员", "志愿者"];
const ESCORT_WORKFLOW_PERIOD_OPTIONS = ["上午", "下午", "晚间"];
const ESCORT_WORKFLOW_STAFF_STATUS_OPTIONS = ["已排班", "停用"];
const ESCORT_WORKFLOW_FEE_SUGGESTIONS = {
  门诊陪诊: 80,
  检查陪同: 120,
  取药协助: 50,
  住院接送: 180,
};
const ESCORT_SERVICE_CATALOG = [
  {
    id: "escort-group-01",
    serviceMode: "班组服务",
    badge: "班组",
    theme: "review",
    title: "班组制照护服务1",
    team: "头颈放疗班组",
    requestType: "门诊陪诊",
    department: "头颈放疗门诊",
    room: "诊室 305",
    meetingPoint: "门诊一楼导诊台",
    price: 30,
    priceUnit: "元/天",
    coverNote: "适合复诊当天的基础签到、带诊和候诊协同",
    description: "面向头颈放疗门诊复诊患者，提供班组式基础陪诊和导诊支持。",
    highlights: ["签到引导", "带诊协同", "候诊支持"],
    note: "需要协助签到、路线引导和复诊后取药。",
  },
  {
    id: "escort-group-02",
    serviceMode: "班组服务",
    badge: "班组",
    theme: "review",
    title: "班组制照护服务2",
    team: "放疗复诊班组",
    requestType: "门诊陪诊",
    department: "放疗复诊门诊",
    room: "诊室 306",
    meetingPoint: "门诊导诊台",
    price: 60,
    priceUnit: "元/天",
    coverNote: "适合常规复诊、开单和基础流程衔接",
    description: "适用于常规复诊日的班组式陪诊和分流支持。",
    highlights: ["基础陪同", "开单协助", "复诊衔接"],
    note: "需要班组陪同完成常规复诊和开单流程。",
  },
  {
    id: "escort-group-03",
    serviceMode: "班组服务",
    badge: "班组",
    theme: "oral",
    title: "班组制照护服务3",
    team: "护理支持班组",
    requestType: "门诊陪诊",
    department: "口腔护理门诊",
    room: "诊室 318",
    meetingPoint: "口腔护理门诊服务台",
    price: 115,
    priceUnit: "元/天",
    coverNote: "适合护理门诊和处置前后的班组陪同",
    description: "面向口腔护理处置和随访复诊场景，减少病人门诊切换负担。",
    highlights: ["护理陪同", "处置衔接", "取药提醒"],
    note: "需要陪同前往口腔护理门诊并协助处置后取药。",
  },
  {
    id: "escort-group-04",
    serviceMode: "班组服务",
    badge: "班组",
    theme: "imaging",
    title: "班组制照护服务4",
    team: "检查协同班组",
    requestType: "检查陪同",
    department: "影像复查中心",
    room: "CT 室 2",
    meetingPoint: "影像中心服务台",
    price: 145,
    priceUnit: "元/天",
    coverNote: "MRI、CT、抽血等复查项目的班组陪同",
    description: "适合检查项目较多、当天复查流程较长的头颈放疗患者。",
    highlights: ["影像签到", "抽血协助", "跨楼层引导"],
    note: "需要协助完成 MRI、抽血和复查流程引导。",
  },
  {
    id: "escort-single-01",
    serviceMode: "一陪一",
    badge: "专人",
    theme: "review",
    title: "专人一级照护服务",
    team: "专人陪诊组",
    requestType: "门诊陪诊",
    department: "头颈放疗门诊",
    room: "诊室 305",
    meetingPoint: "门诊一楼导诊台",
    price: 220,
    priceUnit: "元/天",
    coverNote: "一对一陪同完成复诊、签到和门诊流程",
    description: "适合需要单独陪同、希望全程更顺畅的头颈放疗患者。",
    highlights: ["一对一陪同", "路线引导", "候诊衔接"],
    note: "需要一对一陪同完成复诊当天流程。",
  },
  {
    id: "escort-single-02",
    serviceMode: "一陪一",
    badge: "专人",
    theme: "review",
    title: "专人二级照护服务（一对一）",
    team: "专人陪诊组",
    requestType: "门诊陪诊",
    department: "放疗复诊门诊",
    room: "诊室 306",
    meetingPoint: "门诊一楼导诊台",
    price: 200,
    priceUnit: "元/天",
    coverNote: "适合复诊、开单、缴费和药房衔接较多的场景",
    description: "适合一对一陪同完成门诊复诊与收尾流程的患者。",
    highlights: ["专人陪同", "诊间衔接", "缴费取药"],
    note: "需要一对一陪同完成复诊、缴费和取药流程。",
  },
  {
    id: "escort-single-03",
    serviceMode: "一陪一",
    badge: "专人",
    theme: "imaging",
    title: "专人特级照护服务1",
    team: "高级陪诊组",
    requestType: "检查陪同",
    department: "影像复查中心",
    room: "MRI 室 1",
    meetingPoint: "影像中心服务台",
    price: 250,
    priceUnit: "元/天",
    coverNote: "适合影像、抽血、跨楼层检查较多的一对一全程陪同",
    description: "面向检查项目较多或需要更高强度流程支持的患者。",
    highlights: ["检查全程", "跨楼层引导", "结果回取"],
    note: "需要一对一全程陪同完成影像与抽血检查。",
  },
  {
    id: "escort-single-04",
    serviceMode: "一陪一",
    badge: "专人",
    theme: "oral",
    title: "专人特级照护服务2",
    team: "高级护理陪同组",
    requestType: "门诊陪诊",
    department: "口腔护理门诊",
    room: "诊室 318",
    meetingPoint: "口腔护理门诊服务台",
    price: 280,
    priceUnit: "元/天",
    coverNote: "适合护理处置、沟通和复诊都需要单独支持的患者",
    description: "用于重点护理支持场景，可覆盖护理门诊与处置后观察流程。",
    highlights: ["专人护理陪同", "处置观察", "流程回带"],
    note: "需要一对一护理陪同及处置后衔接支持。",
  },
  {
    id: "escort-other-01",
    serviceMode: "其他服务",
    badge: "基础",
    theme: "pharmacy",
    title: "基础照护服务",
    team: "门诊支持组",
    requestType: "取药协助",
    department: "门诊药房",
    room: "取药窗口",
    meetingPoint: "门诊药房前台",
    price: 9,
    priceUnit: "元/天",
    coverNote: "适合取药、缴费和基础收尾流程支持",
    description: "帮助处理缴费、排队取药和用药提醒等门诊收尾事务。",
    highlights: ["缴费协助", "窗口取药", "用药提醒"],
    note: "需要协助缴费、取药并核对用药提醒。",
  },
  {
    id: "escort-other-02",
    serviceMode: "其他服务",
    badge: "临时",
    theme: "transfer",
    title: "临时照护",
    team: "临时支持组",
    requestType: "住院接送",
    department: "住院服务中心",
    room: "住院登记处",
    meetingPoint: "住院楼大厅服务台",
    price: 20,
    priceUnit: "元/小时",
    coverNote: "适合短时接送、轮椅协助和临时住院引导",
    description: "面向短时陪同需求，可用于病区接送、资料交接和楼层引导。",
    highlights: ["临时接送", "轮椅协助", "楼层引导"],
    note: "需要短时接送和住院流程协助。",
  },
];

const ESCORT_SERVICE_IMAGE_MAP = {
  "班组服务": [
    "/uploads/escort-services/escort-group-01.jpg",
    "/uploads/escort-services/escort-group-02.jpg",
    "/uploads/escort-services/escort-group-03.jpg",
    "/uploads/escort-services/escort-group-04.jpg",
  ],
  一陪一: [
    "/uploads/escort-services/escort-one-01.jpg",
    "/uploads/escort-services/escort-one-02.jpg",
    "/uploads/escort-services/escort-one-03.jpg",
    "/uploads/escort-services/escort-one-04.jpg",
  ],
  其他服务: [
    "/uploads/escort-services/escort-other-01.jpg",
    "/uploads/escort-services/escort-other-02.webp",
  ],
};

const escortImageCursorByMode = {};
ESCORT_SERVICE_CATALOG.forEach((item) => {
  const imageList = ESCORT_SERVICE_IMAGE_MAP[item.serviceMode] || [];
  const nextIndex = escortImageCursorByMode[item.serviceMode] || 0;
  item.coverImage = imageList[nextIndex] || "";
  escortImageCursorByMode[item.serviceMode] = nextIndex + 1;
});

function applyServerEscortData(nextPayload) {
  applyServerAppData(nextPayload, { rerender: true });
}

function getEscortServiceDateKey(serviceDate) {
  const matched = String(serviceDate || "").match(/\d{4}-\d{2}-\d{2}/);
  return matched ? matched[0] : "";
}

function getEscortServicePeriod(serviceDate) {
  const matched = String(serviceDate || "").match(/(\d{2}):(\d{2})/);
  if (!matched) {
    return "上午";
  }
  const hour = Number(matched[1] || 0);
  if (hour >= 18) {
    return "晚间";
  }
  if (hour >= 13) {
    return "下午";
  }
  return "上午";
}

function formatEscortFee(amount) {
  return `¥${Number(amount || 0).toFixed(2)}`;
}

function getEscortCatalogCategories() {
  return [...new Set(ESCORT_SERVICE_CATALOG.map((item) => item.serviceMode).filter(Boolean))];
}

function getFilteredEscortCatalog() {
  const categories = getEscortCatalogCategories();
  const activeCategory = categories.includes(escortCatalogCategoryFilter)
    ? escortCatalogCategoryFilter
    : (categories[0] || "");
  escortCatalogCategoryFilter = activeCategory;
  return activeCategory
    ? ESCORT_SERVICE_CATALOG.filter((item) => item.serviceMode === activeCategory)
    : [];
}

function getEscortCatalogItemById(id) {
  return ESCORT_SERVICE_CATALOG.find((item) => item.id === id) || null;
}

function buildEscortRequestDraftFromCatalog(service, patient = getSafeCurrentPatient()) {
  const upcomingAppointment = getUpcomingAppointment(patient);
  const linkedAppointment = service.requestType === "门诊陪诊" ? upcomingAppointment : null;
  return {
    requestType: service.requestType,
    appointmentId: linkedAppointment?.id || "",
    serviceDate: linkedAppointment?.date || upcomingAppointment?.date || `${getTodayString()} 09:00`,
    department: linkedAppointment?.department || service.department || "",
    room: linkedAppointment?.room || service.room || "",
    meetingPoint: service.meetingPoint || "门诊大厅服务台",
    contactName: patient?.name || "",
    contactPhone: patient?.phone || "",
    note: service.note || "",
  };
}

function renderEscortServiceIcon(theme) {
  const common = 'viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"';
  if (theme === "imaging") {
    return `<svg ${common} aria-hidden="true"><rect x="10" y="12" width="44" height="30" rx="8" stroke="currentColor" stroke-width="3.2"/><path d="M18 33h8l5-9 7 14 4-7h4" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 50h16" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M32 42v8" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>`;
  }
  if (theme === "oral") {
    return `<svg ${common} aria-hidden="true"><path d="M22 18c-5 0-9 4-9 9 0 13 9 21 19 21s19-8 19-21c0-5-4-9-9-9-4 0-7 3-10 3s-6-3-10-3Z" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round"/><path d="M41 42l9 9" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><circle cx="49" cy="51" r="5" stroke="currentColor" stroke-width="3.2"/></svg>`;
  }
  if (theme === "pharmacy") {
    return `<svg ${common} aria-hidden="true"><path d="M24 11h16v10l6 6v22a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V27l6-6V11Z" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round"/><path d="M24 21h16" stroke="currentColor" stroke-width="3.2"/><path d="M32 29v14" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M25 36h14" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>`;
  }
  if (theme === "transfer") {
    return `<svg ${common} aria-hidden="true"><circle cx="20" cy="48" r="5" stroke="currentColor" stroke-width="3.2"/><circle cx="44" cy="48" r="5" stroke="currentColor" stroke-width="3.2"/><path d="M15 48H9V29a5 5 0 0 1 5-5h28l7 10v14h-5" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 48h16" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M42 24V14H20" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>`;
  }
  return `<svg ${common} aria-hidden="true"><path d="M13 29c0-10.5 8.5-19 19-19 7.5 0 13.4 3 17.8 8.4" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M15 33c0 10 7.8 18 17 18 4.8 0 9.4-1.8 12.7-5.1" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><circle cx="32" cy="31" r="9" stroke="currentColor" stroke-width="3.2"/><path d="M32 26v10" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M27 31h10" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>`;
}

function getEscortThemeByRequestType(requestType) {
  if (requestType === "检查陪同") return "imaging";
  if (requestType === "取药协助") return "pharmacy";
  if (requestType === "住院接送") return "transfer";
  if (String(requestType || "").includes("口腔")) return "oral";
  return "review";
}

function renderEscortCatalogCard(service, patient) {
  return `
    <article class="escort-service-card escort-service-card-minimal">
      <button class="escort-service-card-trigger" type="button" data-action="open-escort-service-detail" data-template-id="${escapeHtml(service.id)}" aria-label="${escapeHtml(service.title)}">
        <div class="escort-service-cover escort-theme-${escapeHtml(service.theme)} escort-service-cover-minimal">
          <div class="escort-service-icon">${renderEscortServiceIcon(service.theme)}</div>
        </div>
        <div class="escort-service-meta">
          <strong>${escapeHtml(service.title)}</strong>
          <div class="escort-service-price"><strong>${escapeHtml(`¥${service.price}`)}</strong><span>${escapeHtml(service.priceUnit)}</span></div>
        </div>
      </button>
    </article>`;
}

function renderEscortServiceDetail(service, patient = getSafeCurrentPatient()) {
  const draft = buildEscortRequestDraftFromCatalog(service, patient);
  return `
    <div class="escort-service-detail">
      <div class="escort-service-cover escort-theme-${escapeHtml(service.theme)} escort-service-cover-detail">
        <div class="escort-service-cover-top">
          <span class="escort-service-badge">${escapeHtml(service.badge)}</span>
          <span class="escort-service-team">${escapeHtml(service.team)}</span>
        </div>
        <div class="escort-service-icon">${renderEscortServiceIcon(service.theme)}</div>
        <p class="escort-service-note">${escapeHtml(service.coverNote)}</p>
      </div>
      <div class="escort-service-detail-main">
        <div class="escort-service-detail-top">
          <strong>${escapeHtml(service.title)}</strong>
          <div class="escort-service-price"><strong>${escapeHtml(`¥${service.price}`)}</strong><span>${escapeHtml(service.priceUnit)}</span></div>
        </div>
        <p class="escort-service-detail-text">${escapeHtml(service.description)}</p>
        <div class="escort-service-points">${(service.highlights || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
        <div class="escort-service-detail-grid">
          <article><span>陪护类型</span><strong>${escapeHtml(service.serviceMode || "其他服务")}</strong></article>
          <article><span>服务类型</span><strong>${escapeHtml(service.requestType)}</strong></article>
          <article><span>默认科室</span><strong>${escapeHtml(service.department)}</strong></article>
          <article><span>集合点</span><strong>${escapeHtml(service.meetingPoint)}</strong></article>
          <article><span>默认地点</span><strong>${escapeHtml(formatRoomLabel(service.room))}</strong></article>
          <article><span>联系人</span><strong>${escapeHtml(`${patient?.name || ""} / ${patient?.phone || ""}`)}</strong></article>
          <article><span>建议时间</span><strong>${escapeHtml(draft.serviceDate)}</strong></article>
        </div>
        <div class="modal-actions escort-service-detail-actions">
          <button class="secondary-button" type="button" id="cancelModal">关闭</button>
          <button class="primary-action" type="button" data-action="apply-escort-template" data-template-id="${escapeHtml(service.id)}">申请服务</button>
        </div>
      </div>
    </div>`;
}

function getEscortTimelineEntries(request) {
  return [...(Array.isArray(request?.timeline) ? request.timeline : [])]
    .sort((left, right) => String(left.at || "").localeCompare(String(right.at || "")));
}

function getEscortTimelineStage(request, stageName) {
  return getEscortTimelineEntries(request).find((item) => item.stage === stageName) || null;
}

function getEscortFollowupRecord(request) {
  return (appData.followups || []).find((item) => item.id === request.followupId || item.sourceEscortRequestId === request.id) || null;
}

function getEscortStaffSchedulesSorted() {
  return [...(appData.escortStaffSchedules || [])].sort((left, right) => {
    const leftKey = `${left.date || ""}-${left.period || ""}-${left.staffName || ""}`;
    const rightKey = `${right.date || ""}-${right.period || ""}-${right.staffName || ""}`;
    return leftKey.localeCompare(rightKey);
  });
}

function getEscortStaffAssignedCount(schedule, excludingRequestId = "") {
  return (appData.escortRequests || []).filter((item) =>
    item.id !== excludingRequestId
    && item.assignedStaff === schedule.staffName
    && getEscortServiceDateKey(item.serviceDate) === schedule.date
    && item.status !== "已取消").length;
}

function getEscortStaffRemainCount(schedule, excludingRequestId = "") {
  return Math.max(Number(schedule.capacity || 0) - getEscortStaffAssignedCount(schedule, excludingRequestId), 0);
}

function getEscortStaffOptions(serviceDate, department = "") {
  const dateKey = getEscortServiceDateKey(serviceDate);
  if (!dateKey) {
    return [];
  }
  const departmentText = String(department || "").trim();
  const exactMatches = getEscortStaffSchedulesSorted().filter((item) =>
    item.status !== "停用"
    && item.date === dateKey
    && (!departmentText || item.department === departmentText));
  if (exactMatches.length) {
    return exactMatches;
  }
  return getEscortStaffSchedulesSorted().filter((item) => item.status !== "停用" && item.date === dateKey);
}

function buildEscortStaffOptionsMarkup(serviceDate, department = "", selectedStaff = "", requestId = "") {
  const options = getEscortStaffOptions(serviceDate, department);
  if (!options.length && !selectedStaff) {
    return `<option value="">当前日期暂无可分配排班，请先新增陪诊排班</option>`;
  }

  const optionMarkup = options.map((item) => {
    const remainCount = getEscortStaffRemainCount(item, requestId);
    const label = `${item.staffName} / ${item.role} / ${item.period} / ${item.department} / 余量 ${remainCount}`;
    return `<option value="${escapeHtml(item.staffName)}" ${selectedStaff === item.staffName ? "selected" : ""}>${escapeHtml(label)}</option>`;
  });

  if (selectedStaff && !options.some((item) => item.staffName === selectedStaff)) {
    optionMarkup.unshift(`<option value="${escapeHtml(selectedStaff)}" selected>${escapeHtml(`${selectedStaff} / 当前记录`)}</option>`);
  }

  return [`<option value="">暂不安排陪诊人员</option>`, ...optionMarkup].join("");
}

function renderEscortTimeline(request) {
  const items = getEscortTimelineEntries(request);
  if (!items.length) {
    return `<div class="escort-timeline-empty">暂无时间轴记录</div>`;
  }
  return `<ol class="escort-timeline">${items.map((item) => `
    <li class="escort-timeline-item">
      <div class="escort-timeline-dot"></div>
      <div class="escort-timeline-content">
        <strong>${escapeHtml(item.label || item.stage || "-")}</strong>
        <span>${escapeHtml(item.at ? formatDateTimeLabel(item.at) : "-")}</span>
        <p>${escapeHtml([item.by, item.note].filter(Boolean).join(" / ") || "已记录")}</p>
      </div>
    </li>`).join("")}</ol>`;
}

function renderEscortFinanceSummary(request) {
  const amount = Number(request.feeAmount || 0);
  const amountLabel = amount > 0 ? formatEscortFee(amount) : "待确认";
  const confirmationText = request.confirmationCode
    ? `${request.confirmationCode} / ${request.confirmationStatus || "待确认"}`
    : "保存后自动生成";
  return `
    <div class="escort-meta-grid">
      <article class="escort-meta-card">
        <span>陪诊费用</span>
        <strong>${escapeHtml(amountLabel)}</strong>
        <p>${escapeHtml(request.feeStatus || "待确认")}${request.feeNote ? ` · ${request.feeNote}` : ""}</p>
      </article>
      <article class="escort-meta-card">
        <span>确认单</span>
        <strong>${escapeHtml(confirmationText)}</strong>
        <p>${escapeHtml(request.confirmedAt ? `确认时间 ${formatDateTimeLabel(request.confirmedAt)}` : "病人端可在陪诊完成后确认服务单")}</p>
      </article>
    </div>`;
}

function renderEscortFollowupSummary(request) {
  const followupRecord = getEscortFollowupRecord(request);
  return `
    <article class="escort-meta-card escort-followup-card">
      <span>复诊提醒</span>
      <strong>${escapeHtml(followupRecord ? `${followupRecord.dueDate} / ${followupRecord.status}` : "尚未转入")}</strong>
      <p>${escapeHtml(followupRecord ? followupRecord.note : "医生端可一键把当前陪诊单转成复诊提醒。")}</p>
    </article>`;
}

function renderEscortRequestDetail(request) {
  return `
    <div class="escort-request-detail-panel">
      <div class="detail-grid">
        <div class="detail-line"><span>Service</span><strong>${escapeHtml(`${request.requestType || "-"} / ${request.department || "-"}`)}</strong></div>
        <div class="detail-line"><span>Time</span><strong>${escapeHtml(request.serviceDate || "-")}</strong></div>
        <div class="detail-line"><span>Room</span><strong>${escapeHtml(formatRoomLabel(request.room) || "-")}</strong></div>
        <div class="detail-line"><span>Meeting Point</span><strong>${escapeHtml(request.meetingPoint || "-")}</strong></div>
        <div class="detail-line"><span>Escort Staff</span><strong>${escapeHtml(request.assignedStaff || "Pending")}</strong></div>
        <div class="detail-line"><span>Phone</span><strong>${escapeHtml(request.contactPhone || "-")}</strong></div>
        <div class="detail-line"><span>Fee</span><strong>${escapeHtml(request.feeAmount ? formatEscortFee(request.feeAmount) : "Pending")}</strong></div>
        <div class="detail-line"><span>Confirmation</span><strong>${escapeHtml(request.confirmationCode || "Pending")}</strong></div>
      </div>
      ${request.note ? `<section class="escort-modal-section"><h3>Note</h3><p>${escapeHtml(request.note)}</p></section>` : ""}
      <section class="escort-modal-section"><h3>Finance</h3>${renderEscortFinanceSummary(request)}${renderEscortFollowupSummary(request)}</section>
      <section class="escort-modal-section"><h3>Timeline</h3>${renderEscortTimeline(request)}</section>
    </div>`;
}

function renderEscortRosterCards() {
  const items = getEscortStaffSchedulesSorted().length
    ? getEscortStaffSchedulesSorted().map((item) => {
        const assignedCount = getEscortStaffAssignedCount(item);
        return `
          <article class="escort-roster-card">
            <span>${escapeHtml(`${item.date} ${item.period}`)}</span>
            <strong>${escapeHtml(item.staffName)}</strong>
            <p>${escapeHtml(`${item.role} / ${item.department}`)}</p>
            <div class="card-meta">
              <span>联系电话 <b>${escapeHtml(item.phone || "-")}</b></span>
              <span>排班容量 <b>${escapeHtml(`${assignedCount}/${item.capacity}`)}</b></span>
            </div>
            <div class="card-meta">
              <span>状态 <b>${escapeHtml(item.status)}</b></span>
              <span>备注 <b>${escapeHtml(item.note || "无")}</b></span>
            </div>
            <div class="card-actions">
              <button class="secondary-button" type="button" data-action="edit-escort-schedule" data-id="${escapeHtml(item.id)}">编辑排班</button>
            </div>
          </article>`;
      }).join("")
    : `<div class="empty-state"><strong>暂无陪诊排班</strong><p>先新增陪诊人员排班，医生端安排陪诊时才能直接选择人员。</p></div>`;

  return `
    <section class="panel-card escort-roster-panel">
      <div class="section-head section-head-compact">
        <div>
          <h3>陪诊人员排班</h3>
          <p>排班会联动到陪诊单分配，容量满额后会阻止继续安排。</p>
        </div>
        <div class="section-actions">
          <button class="secondary-button" type="button" data-action="open-escort-schedule-modal">新增排班</button>
        </div>
      </div>
      <div class="escort-roster-grid">${items}</div>
    </section>`;
}

function renderDoctorEscortRequestCard(request) {
  const canProcess = !["已完成", "已取消"].includes(request.status);
  const canStart = ["已安排", "进行中"].includes(request.status) && Boolean(request.assignedStaff);
  const canArrive = ["已安排", "进行中"].includes(request.status) && Boolean(request.assignedStaff);
  const canComplete = ["已安排", "进行中", "已到达"].includes(request.status) && Boolean(request.assignedStaff);
  const followupRecord = getEscortFollowupRecord(request);
  return `
    <article class="escort-request-card escort-request-card-doctor">
      <span>${escapeHtml(request.serviceDate || "-")}</span>
      <strong>${escapeHtml(`${request.patientName} · ${request.requestType}`)}</strong>
      <p>${escapeHtml(`${request.department} / ${formatRoomLabel(request.room)} / 集合点：${request.meetingPoint || "门诊大厅服务台"}`)}</p>
      <div class="card-meta">
        <span>状态 <b>${escapeHtml(request.status)}</b></span>
        <span>陪诊人员 <b>${escapeHtml(request.assignedStaff || "待安排")}</b></span>
      </div>
      <div class="card-meta">
        <span>联系人 <b>${escapeHtml(`${request.contactName || request.patientName} / ${request.contactPhone || "-"}`)}</b></span>
        <span>费用 <b>${escapeHtml(request.feeAmount ? `${formatEscortFee(request.feeAmount)} / ${request.feeStatus}` : `待确认 / ${request.feeStatus}`)}</b></span>
      </div>
      ${renderEscortFinanceSummary(request)}
      ${renderEscortFollowupSummary(request)}
      <div class="escort-inline-timeline">${renderEscortTimeline(request)}</div>
      <div class="card-actions">
        <button class="secondary-button" type="button" data-action="edit-escort-request" data-id="${escapeHtml(request.id)}">安排 / 编辑</button>
        <button class="secondary-button" type="button" data-action="escort-status" data-id="${escapeHtml(request.id)}" data-status="进行中" ${canStart ? "" : "disabled"}>开始陪诊</button>
        <button class="secondary-button" type="button" data-action="escort-status" data-id="${escapeHtml(request.id)}" data-status="已到达" ${canArrive ? "" : "disabled"}>确认到达</button>
        <button class="secondary-button" type="button" data-action="escort-status" data-id="${escapeHtml(request.id)}" data-status="已完成" ${canComplete ? "" : "disabled"}>完成陪诊</button>
        <button class="secondary-button" type="button" data-action="escort-convert-followup" data-id="${escapeHtml(request.id)}" ${request.status === "已取消" ? "disabled" : ""}>转复诊提醒</button>
        <button class="danger-button" type="button" data-action="escort-status" data-id="${escapeHtml(request.id)}" data-status="已取消" ${canProcess ? "" : "disabled"}>取消</button>
      </div>
      ${followupRecord ? `<div class="escort-card-footnote">已关联复诊提醒：${escapeHtml(`${followupRecord.dueDate} / ${followupRecord.status}`)}</div>` : ""}
    </article>`;
}

function renderPatientEscortRequestCard(request, patient) {
  const allowConfirm = request.status === "已完成" && request.confirmationStatus !== "已确认";
  const allowCancel = !["已完成", "已取消"].includes(request.status);
  const theme = getEscortThemeByRequestType(request.requestType);
  return `
    <article class="escort-request-card escort-request-card-patient">
      <div class="escort-request-top">
        <div class="escort-request-mark escort-theme-${escapeHtml(theme)}">${renderEscortServiceIcon(theme)}</div>
        <div class="escort-request-copy">
          <span class="escort-request-time">${escapeHtml(request.serviceDate || "-")}</span>
          <strong class="escort-request-title">${escapeHtml(`${request.requestType} · ${request.department}`)}</strong>
          <p class="escort-request-subline">${escapeHtml(`${formatRoomLabel(request.room)} / 集合点：${request.meetingPoint || "门诊大厅服务台"}`)}</p>
        </div>
        <span class="escort-status-pill" data-status="${escapeHtml(request.status || "待确认")}">${escapeHtml(request.status || "待确认")}</span>
      </div>
      <div class="escort-request-divider"></div>
      <div class="escort-request-facts escort-request-facts-compact">
        <article>
          <span>陪诊员</span>
          <strong>${escapeHtml(request.assignedStaff || "待安排")}</strong>
        </article>
        <article>
          <span>费用</span>
          <strong>${escapeHtml(request.feeAmount ? formatEscortFee(request.feeAmount) : "待确认")}</strong>
        </article>
        <article class="escort-request-fact-serial">
          <span>确认单</span>
          <strong class="escort-request-serial">${escapeHtml(request.confirmationCode || "待生成")}</strong>
        </article>
      </div>
      <div class="card-actions escort-request-actions">
        <button class="secondary-button" type="button" data-action="open-escort-request-detail" data-id="${escapeHtml(request.id)}">查看详情</button>
        <button class="secondary-button" type="button" data-action="escort-confirm" data-id="${escapeHtml(request.id)}" ${allowConfirm ? "" : "disabled"}>确认服务单</button>
        <button class="danger-button" type="button" data-action="escort-status" data-id="${escapeHtml(request.id)}" data-status="已取消" ${allowCancel ? "" : "disabled"}>取消申请</button>
      </div>
    </article>`;
}

async function requestEscortSave(payload) {
  try {
    const response = await requestJson("/api/escort-requests/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    applyServerEscortData(response);
    setAppNotice(response.message || "陪诊单已保存。", "success");
    return true;
  } catch (error) {
    setAppNotice(error.message || "陪诊单保存失败。", "error");
    return false;
  }
}

async function requestEscortStatus(id, status, extraPayload = {}) {
  try {
    const response = await requestJson("/api/escort-requests/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, ...extraPayload }),
    });
    applyServerEscortData(response);
    setAppNotice(response.message || "陪诊状态已更新。", "success");
    return true;
  } catch (error) {
    setAppNotice(error.message || "陪诊状态更新失败。", "error");
    return false;
  }
}

async function requestEscortStaffScheduleSave(payload) {
  try {
    const response = await requestJson("/api/escort-staff-schedules/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    applyServerEscortData(response);
    setAppNotice(response.message || "陪诊排班已保存。", "success");
    return true;
  } catch (error) {
    setAppNotice(error.message || "陪诊排班保存失败。", "error");
    return false;
  }
}

async function requestEscortConfirm(id) {
  try {
    const response = await requestJson("/api/escort-requests/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    applyServerEscortData(response);
    setAppNotice(response.message || "服务确认单已提交。", "success");
    return true;
  } catch (error) {
    setAppNotice(error.message || "服务确认单提交失败。", "error");
    return false;
  }
}

async function requestEscortConvertFollowup(id) {
  try {
    const response = await requestJson("/api/escort-requests/convert-followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    applyServerEscortData(response);
    setAppNotice(response.message || "已转成复诊提醒。", "success");
    return true;
  } catch (error) {
    setAppNotice(error.message || "转复诊提醒失败。", "error");
    return false;
  }
}

function syncEscortModalForm(form, { updateContact = false, updateSchedule = false } = {}) {
  if (!form || modalState?.type !== "escort-request") {
    return;
  }

  const patient = getEscortModalPatient(modalState.payload || null, form);
  const appointmentSelect = form.elements.appointmentId;
  const selectedAppointmentId = appointmentSelect?.value?.trim() || "";
  const nextAppointmentOptions = buildEscortAppointmentOptionsMarkup(patient, selectedAppointmentId);

  if (appointmentSelect && appointmentSelect.innerHTML !== nextAppointmentOptions) {
    appointmentSelect.innerHTML = nextAppointmentOptions;
    const matchingOption = Array.from(appointmentSelect.options).some((item) => item.value === selectedAppointmentId);
    appointmentSelect.value = matchingOption ? selectedAppointmentId : "";
  }

  if (patient) {
    const currentContactName = form.elements.contactName?.value?.trim() || "";
    const currentContactPhone = form.elements.contactPhone?.value?.trim() || "";
    if (updateContact || !currentContactName) {
      form.elements.contactName.value = patient.name || "";
    }
    if (updateContact || !currentContactPhone) {
      form.elements.contactPhone.value = patient.phone || "";
    }
  }

  const linkedAppointment = patient ? getPatientAppointmentById(patient, form.elements.appointmentId?.value?.trim()) : null;
  if (linkedAppointment && (updateSchedule || !form.elements.serviceDate?.value?.trim())) {
    form.elements.serviceDate.value = linkedAppointment.date || "";
  }
  if (linkedAppointment && (updateSchedule || !form.elements.department?.value?.trim())) {
    form.elements.department.value = linkedAppointment.department || "";
  }
  if (linkedAppointment && (updateSchedule || !form.elements.room?.value?.trim())) {
    form.elements.room.value = linkedAppointment.room || "";
  }

  if (form.elements.assignedStaff) {
    const currentStaff = form.elements.assignedStaff.value?.trim() || modalState.payload?.assignedStaff || "";
    const nextStaffOptions = buildEscortStaffOptionsMarkup(
      form.elements.serviceDate?.value?.trim(),
      form.elements.department?.value?.trim(),
      currentStaff,
      modalState.payload?.id || "",
    );
    if (form.elements.assignedStaff.innerHTML !== nextStaffOptions) {
      form.elements.assignedStaff.innerHTML = nextStaffOptions;
      const matched = Array.from(form.elements.assignedStaff.options).some((item) => item.value === currentStaff);
      form.elements.assignedStaff.value = matched ? currentStaff : "";
    }
  }

  if (form.elements.feeAmount && !String(form.elements.feeAmount.value || "").trim()) {
    const suggest = ESCORT_WORKFLOW_FEE_SUGGESTIONS[form.elements.requestType?.value || "门诊陪诊"] || 0;
    form.elements.feeAmount.value = String(suggest);
  }
}

renderDoctorEscortModule = function () {
  const items = getEscortRequestsForCurrentView().length
    ? getEscortRequestsForCurrentView().map((item) => renderDoctorEscortRequestCard(item)).join("")
    : `<div class="empty-state"><strong>暂无陪诊单</strong><p>病人端提交陪诊申请后，这里会集中显示；医生端也可以主动新增陪诊服务单。</p></div>`;

  return `
    <div class="panel-head panel-head-actions">
      <div>
        <h2>陪诊管理</h2>
        <p>覆盖陪诊人员排班、服务流程时间轴、费用确认单和转复诊提醒，医生端能直接完成安排与跟踪。</p>
      </div>
      <div class="section-actions">
        <button class="secondary-button" type="button" data-action="open-escort-schedule-modal">新增排班</button>
        <button class="primary-action" type="button" data-action="open-escort-request">新增陪诊单</button>
      </div>
    </div>
    ${renderEscortRosterCards()}
    <section class="panel-card escort-request-panel">
      <div class="section-head section-head-compact">
        <div>
          <h3>陪诊服务单</h3>
          <p>病人提交后可直接安排陪诊人员、推进服务时间轴，并一键转成复诊提醒。</p>
        </div>
      </div>
      <div class="escort-request-list">${items}</div>
    </section>`;
};

renderPatientEscortModule = function () {
  const patient = getSafeCurrentPatient();
  const categories = getEscortCatalogCategories();
  const serviceCards = getFilteredEscortCatalog().map((item) => renderEscortCatalogCard(item, patient)).join("");
  const items = getPatientEscortRequests(patient).length
    ? getPatientEscortRequests(patient).map((item) => renderPatientEscortRequestCard(item, patient)).join("")
    : `<div class="empty-state"><strong>暂无陪诊申请</strong><p>可点击下方服务卡片直接发起申请，医生端会同步安排陪诊人员与流程。</p></div>`;

  return `
    <section class="escort-directory-shell">
      <div class="escort-directory-strip">
        <strong>陪诊服务</strong>
      </div>
      <div class="escort-catalog-tabs escort-catalog-tabs-flat">
        ${categories.map((category) => `<button class="escort-catalog-tab${escortCatalogCategoryFilter === category ? " active" : ""}" type="button" data-action="set-escort-catalog-category" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("")}
      </div>
      <div class="escort-service-catalog-grid">${serviceCards}</div>
      <div class="escort-directory-strip escort-directory-strip-secondary">
        <strong>我的服务单</strong>
      </div>
      <div class="escort-request-list escort-request-list-patient-compact">${items}</div>
    </section>`;
};

const baseRenderModalEscortWorkflow = renderModal;
renderModal = function () {
  baseRenderModalEscortWorkflow();
  if (!modalState) {
    return;
  }

  if (modalState.type === "escort-staff-schedule") {
    const payload = modalState.payload || null;
    modalTitle.textContent = payload ? "编辑陪诊排班" : "新增陪诊排班";
    modalBody.innerHTML = `
      <form class="modal-form" id="modalForm">
        <div class="form-grid">
          <label><span>陪诊人员</span><input name="staffName" value="${escapeHtml(payload?.staffName || "")}" required></label>
          <label><span>角色</span><select name="role">${ESCORT_WORKFLOW_STAFF_ROLE_OPTIONS.map((item) => `<option value="${item}" ${payload?.role === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
          <label><span>联系电话</span><input name="phone" value="${escapeHtml(payload?.phone || "")}" required></label>
          <label><span>排班日期</span><input name="date" type="date" value="${escapeHtml(payload?.date || getTodayString())}" required></label>
          <label><span>时段</span><select name="period">${ESCORT_WORKFLOW_PERIOD_OPTIONS.map((item) => `<option value="${item}" ${payload?.period === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
          <label><span>负责科室</span><input name="department" value="${escapeHtml(payload?.department || "头颈放疗门诊")}" required></label>
          <label><span>容量</span><input name="capacity" type="number" min="1" step="1" value="${escapeHtml(String(payload?.capacity || 1))}" required></label>
          <label><span>排班状态</span><select name="status">${ESCORT_WORKFLOW_STAFF_STATUS_OPTIONS.map((item) => `<option value="${item}" ${payload?.status === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
          <label class="wide"><span>备注</span><textarea name="note">${escapeHtml(payload?.note || "")}</textarea></label>
        </div>
        <div class="modal-actions">
          <button class="secondary-button" type="button" id="cancelModal">取消</button>
          <button class="primary-action" type="submit">${payload ? "保存排班" : "新增排班"}</button>
        </div>
      </form>`;
    return;
  }

  if (modalState.type === "escort-service-detail") {
    const service = modalState.payload || null;
    if (!service) {
      closeModal();
      return;
    }
    modalTitle.textContent = service.title || "服务详情";
    modalBody.innerHTML = renderEscortServiceDetail(service);
    return;
  }

  if (modalState.type === "escort-request-detail") {
    const request = modalState.payload || null;
    if (!request) {
      closeModal();
      return;
    }
    modalTitle.textContent = "服务详情";
    modalBody.innerHTML = renderEscortRequestDetail(request);
    return;
  }

  if (modalState.type !== "escort-request") {
    return;
  }

  const payload = modalState.payload || null;
  const isExistingEscortRequest = Boolean(payload?.id);
  const patient = getEscortModalPatient(payload);
  const isReadOnlyPatientView = currentRole === "patient" && Boolean(payload?.id);
  const appointmentOptions = buildEscortAppointmentOptionsMarkup(patient, payload?.appointmentId || "");
  const assignedStaffOptions = buildEscortStaffOptionsMarkup(payload?.serviceDate || "", payload?.department || "", payload?.assignedStaff || "", payload?.id || "");
  modalTitle.textContent = isExistingEscortRequest ? "陪诊单详情" : currentRole === "doctor" ? "新增陪诊单" : "申请陪诊";
  modalBody.innerHTML = `
    <form class="modal-form" id="modalForm">
      <div class="form-grid">
        ${currentRole === "doctor"
          ? `<label class="wide"><span>病人</span><select name="patientId" required>${(appData.patients || []).map((item) => `<option value="${item.id}" ${(payload?.patientId ? payload.patientId === item.id : patient?.id === item.id) ? "selected" : ""}>${escapeHtml(`${item.name} (${item.id})`)}</option>`).join("")}</select></label>`
          : ""}
        <label><span>陪诊类型</span><select name="requestType" ${isReadOnlyPatientView ? "disabled" : ""}>${ESCORT_REQUEST_TYPE_OPTIONS.map((item) => `<option value="${item}" ${(payload?.requestType || "门诊陪诊") === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
        <label><span>关联预约</span><select name="appointmentId" ${isReadOnlyPatientView ? "disabled" : ""}>${appointmentOptions}</select></label>
        <label><span>陪诊时间</span><input name="serviceDate" value="${escapeHtml(payload?.serviceDate || "")}" placeholder="例如 2026-04-13 09:00" required ${isReadOnlyPatientView ? "disabled" : ""}></label>
        <label><span>陪诊科室</span><input name="department" value="${escapeHtml(payload?.department || "")}" placeholder="例如 头颈放疗门诊" required ${isReadOnlyPatientView ? "disabled" : ""}></label>
        <label><span>诊室</span><input name="room" value="${escapeHtml(payload?.room || "")}" placeholder="例如 诊室 301" required ${isReadOnlyPatientView ? "disabled" : ""}></label>
        <label><span>集合点</span><input name="meetingPoint" value="${escapeHtml(payload?.meetingPoint || "门诊大厅服务台")}" required ${isReadOnlyPatientView ? "disabled" : ""}></label>
        <label><span>联系人</span><input name="contactName" value="${escapeHtml(payload?.contactName || patient?.name || "")}" required ${isReadOnlyPatientView ? "disabled" : ""}></label>
        <label><span>联系电话</span><input name="contactPhone" value="${escapeHtml(payload?.contactPhone || patient?.phone || "")}" required ${isReadOnlyPatientView ? "disabled" : ""}></label>
        ${currentRole === "doctor"
          ? `
            <label><span>陪诊人员</span><select name="assignedStaff">${assignedStaffOptions}</select></label>
            <label><span>状态</span><select name="status">${ESCORT_WORKFLOW_STATUS_OPTIONS.map((item) => `<option value="${item}" ${(payload?.status || "待确认") === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
            <label><span>费用金额</span><input name="feeAmount" type="number" min="0" step="0.01" value="${escapeHtml(String((payload?.feeAmount ?? ESCORT_WORKFLOW_FEE_SUGGESTIONS[payload?.requestType || '门诊陪诊']) || 0))}"></label>
            <label><span>费用状态</span><select name="feeStatus">${ESCORT_WORKFLOW_FEE_STATUS_OPTIONS.map((item) => `<option value="${item}" ${(payload?.feeStatus || "待确认") === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
            <label class="wide"><span>费用说明</span><input name="feeNote" value="${escapeHtml(payload?.feeNote || "")}" placeholder="例如 陪诊完成后门诊服务台统一结算"></label>`
          : ""}
        <label class="wide"><span>备注说明</span><textarea name="note" ${isReadOnlyPatientView ? "disabled" : ""}>${escapeHtml(payload?.note || "")}</textarea></label>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" id="cancelModal">${isReadOnlyPatientView ? "关闭" : "取消"}</button>
        ${isReadOnlyPatientView ? "" : `<button class="primary-action" type="submit">${isExistingEscortRequest ? "保存陪诊单" : "提交申请"}</button>`}
      </div>
    </form>
    ${isExistingEscortRequest ? `<section class="escort-modal-section"><h3>确认单与费用</h3>${renderEscortFinanceSummary(payload)}${renderEscortFollowupSummary(payload)}</section><section class="escort-modal-section"><h3>服务时间轴</h3>${renderEscortTimeline(payload)}</section>` : ""}`;

  const form = modalBody.querySelector("#modalForm");
  if (form) {
    syncEscortModalForm(form, { updateContact: true, updateSchedule: true });
  }
};

const baseHandleModalSubmitEscortWorkflow = handleModalSubmit;
handleModalSubmit = async function (event) {
  if (modalState?.type === "escort-staff-schedule") {
    event.preventDefault();
    const formData = new FormData(event.target);
    const success = await requestEscortStaffScheduleSave({
      ...(modalState.payload?.id ? { id: modalState.payload.id } : {}),
      staffName: formData.get("staffName")?.trim(),
      role: formData.get("role")?.trim(),
      phone: formData.get("phone")?.trim(),
      date: formData.get("date")?.trim(),
      period: formData.get("period")?.trim(),
      department: formData.get("department")?.trim(),
      capacity: Number(formData.get("capacity") || 1),
      status: formData.get("status")?.trim(),
      note: formData.get("note")?.trim(),
    });
    if (success) {
      closeModal();
    }
    return;
  }

  if (modalState?.type === "escort-request") {
    event.preventDefault();
    const formData = new FormData(event.target);
    const success = await requestEscortSave({
      ...(modalState.payload?.id ? { id: modalState.payload.id } : {}),
      ...(currentRole === "doctor" ? { patientId: formData.get("patientId")?.trim() } : {}),
      requestType: formData.get("requestType")?.trim(),
      appointmentId: formData.get("appointmentId")?.trim(),
      serviceDate: formData.get("serviceDate")?.trim(),
      department: formData.get("department")?.trim(),
      room: formData.get("room")?.trim(),
      meetingPoint: formData.get("meetingPoint")?.trim(),
      contactName: formData.get("contactName")?.trim(),
      contactPhone: formData.get("contactPhone")?.trim(),
      note: formData.get("note")?.trim(),
      ...(currentRole === "doctor" ? {
        assignedStaff: formData.get("assignedStaff")?.trim(),
        status: formData.get("status")?.trim(),
        feeAmount: formData.get("feeAmount")?.trim(),
        feeStatus: formData.get("feeStatus")?.trim(),
        feeNote: formData.get("feeNote")?.trim(),
      } : {}),
    });
    if (success) {
      closeModal();
    }
    return;
  }

  return baseHandleModalSubmitEscortWorkflow(event);
};

moduleContent.addEventListener("click", async (event) => {
  const escortCategoryButton = event.target.closest('[data-action="set-escort-catalog-category"]');
  if (escortCategoryButton) {
    event.preventDefault();
    escortCatalogCategoryFilter = escortCategoryButton.dataset.category || (getEscortCatalogCategories()[0] || "");
    renderModuleContent();
    return;
  }

  const escortRequestDetailButton = event.target.closest('[data-action="edit-escort-request"]');
  if (escortRequestDetailButton) {
    event.preventDefault();
    const request = getEscortRequestById(escortRequestDetailButton.dataset.id || "");
    if (request) {
      openModal(currentRole === "patient" ? "escort-request-detail" : "escort-request", request);
    }
    return;
  }

  const escortRequestReadButton = event.target.closest('[data-action="open-escort-request-detail"]');
  if (escortRequestReadButton) {
    event.preventDefault();
    const request = getEscortRequestById(escortRequestReadButton.dataset.id || "");
    if (request) {
      openModal("escort-request-detail", request);
    }
    return;
  }

  const escortTemplateButton = event.target.closest('[data-action="open-escort-service-detail"]');
  if (escortTemplateButton) {
    event.preventDefault();
    const template = getEscortCatalogItemById(escortTemplateButton.dataset.templateId || "");
    if (template) {
      openModal("escort-service-detail", template);
    }
    return;
  }

  const createEscortButton = event.target.closest('[data-action="open-escort-request"]');
  if (createEscortButton) {
    event.preventDefault();
    openModal("escort-request");
    return;
  }

  const scheduleCreateButton = event.target.closest('[data-action="open-escort-schedule-modal"]');
  if (scheduleCreateButton) {
    event.preventDefault();
    openModal("escort-staff-schedule");
    return;
  }

  const scheduleEditButton = event.target.closest('[data-action="edit-escort-schedule"]');
  if (scheduleEditButton) {
    event.preventDefault();
    const schedule = (appData.escortStaffSchedules || []).find((item) => item.id === scheduleEditButton.dataset.id);
    if (schedule) {
      openModal("escort-staff-schedule", schedule);
    }
    return;
  }

  const escortFollowupButton = event.target.closest('[data-action="escort-convert-followup"]');
  if (escortFollowupButton) {
    event.preventDefault();
    if (!escortFollowupButton.disabled) {
      await requestEscortConvertFollowup(escortFollowupButton.dataset.id || "");
    }
    return;
  }

  const escortConfirmButton = event.target.closest('[data-action="escort-confirm"]');
  if (escortConfirmButton) {
    event.preventDefault();
    if (!escortConfirmButton.disabled) {
      await requestEscortConfirm(escortConfirmButton.dataset.id || "");
    }
  }
});

modalBody.addEventListener("change", (event) => {
  if (modalState?.type !== "escort-request") {
    return;
  }

  const form = event.target.closest("#modalForm");
  if (!form) {
    return;
  }

  if (["patientId", "appointmentId", "serviceDate", "department", "requestType"].includes(event.target.name)) {
    syncEscortModalForm(form, {
      updateContact: ["patientId"].includes(event.target.name),
      updateSchedule: ["patientId", "appointmentId"].includes(event.target.name),
    });
  }
});

modalBody.addEventListener("click", (event) => {
  const applyTemplateButton = event.target.closest('[data-action="apply-escort-template"]');
  if (!applyTemplateButton) {
    return;
  }

  event.preventDefault();
  const template = getEscortCatalogItemById(applyTemplateButton.dataset.templateId || "");
  if (!template) {
    return;
  }
  openModal("escort-request", buildEscortRequestDraftFromCatalog(template));
});

function renderEscortServiceVisual(service, detail = false) {
  if (service.coverImage) {
    return `<img class="escort-service-photo${detail ? " escort-service-photo-detail" : ""}" src="${escapeHtml(service.coverImage)}" alt="${escapeHtml(service.title)}">`;
  }
  return `<div class="escort-service-icon">${renderEscortServiceIcon(service.theme)}</div>`;
}

function renderEscortCatalogCard(service, patient) {
  return `
    <article class="escort-service-card escort-service-card-minimal">
      <button class="escort-service-card-trigger" type="button" data-action="open-escort-service-detail" data-template-id="${escapeHtml(service.id)}" aria-label="${escapeHtml(service.title)}">
        <div class="escort-service-cover escort-theme-${escapeHtml(service.theme)} escort-service-cover-minimal">
          ${renderEscortServiceVisual(service)}
        </div>
        <div class="escort-service-meta">
          <strong>${escapeHtml(service.title)}</strong>
          <div class="escort-service-price"><strong>${escapeHtml(`¥${service.price}`)}</strong><span>${escapeHtml(service.priceUnit)}</span></div>
        </div>
      </button>
    </article>`;
}

function renderEscortServiceDetail(service, patient = getSafeCurrentPatient()) {
  const draft = buildEscortRequestDraftFromCatalog(service, patient);
  return `
    <div class="escort-service-detail">
      <div class="escort-service-cover escort-theme-${escapeHtml(service.theme)} escort-service-cover-detail">
        <div class="escort-service-cover-top">
          <span class="escort-service-badge">${escapeHtml(service.badge)}</span>
          <span class="escort-service-team">${escapeHtml(service.team)}</span>
        </div>
        ${renderEscortServiceVisual(service, true)}
        <p class="escort-service-note">${escapeHtml(service.coverNote)}</p>
      </div>
      <div class="escort-service-detail-main">
        <div class="escort-service-detail-top">
          <strong>${escapeHtml(service.title)}</strong>
          <div class="escort-service-price"><strong>${escapeHtml(`¥${service.price}`)}</strong><span>${escapeHtml(service.priceUnit)}</span></div>
        </div>
        <p class="escort-service-detail-text">${escapeHtml(service.description)}</p>
        <div class="escort-service-points">${(service.highlights || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
        <div class="escort-service-detail-grid">
          <article><span>陪护类型</span><strong>${escapeHtml(service.serviceMode || "其他服务")}</strong></article>
          <article><span>服务类型</span><strong>${escapeHtml(service.requestType)}</strong></article>
          <article><span>默认科室</span><strong>${escapeHtml(service.department)}</strong></article>
          <article><span>集合点</span><strong>${escapeHtml(service.meetingPoint)}</strong></article>
          <article><span>默认地点</span><strong>${escapeHtml(formatRoomLabel(service.room))}</strong></article>
          <article><span>联系人</span><strong>${escapeHtml(`${patient?.name || ""} / ${patient?.phone || ""}`)}</strong></article>
          <article><span>建议时间</span><strong>${escapeHtml(draft.serviceDate)}</strong></article>
        </div>
        <div class="modal-actions escort-service-detail-actions">
          <button class="secondary-button" type="button" id="cancelModal">关闭</button>
          <button class="primary-action" type="button" data-action="apply-escort-template" data-template-id="${escapeHtml(service.id)}">申请服务</button>
        </div>
      </div>
    </div>`;
}

const APPOINTMENT_TIME_RANGE_MAP = {
  上午: "09:00 ~ 12:00",
  下午: "14:30 ~ 17:30",
  夜间: "19:00 ~ 21:00",
};

const appointmentBookingState = {
  page: {
    departmentKey: APPOINTMENT_DEPARTMENT_OPTIONS[0]?.key || "",
    dateByDepartment: {},
  },
  picker: {
    departmentKey: APPOINTMENT_DEPARTMENT_OPTIONS[0]?.key || "",
    dateByDepartment: {},
  },
};

function getAppointmentBookingStore(scope = "page") {
  return scope === "picker" ? appointmentBookingState.picker : appointmentBookingState.page;
}

function getAppointmentDepartmentSchedules(departmentKey = "") {
  const option = getAppointmentDepartmentOption(departmentKey) || APPOINTMENT_DEPARTMENT_OPTIONS[0] || null;
  if (!option) {
    return [];
  }

  return (Array.isArray(appData?.schedules) ? appData.schedules : [])
    .filter((item) => String(item?.date || "") >= getTodayString())
    .filter((item) => getClinicDepartmentLabel(item.clinic) === option.label)
    .sort((left, right) => {
      const dateCompare = String(left.date || "").localeCompare(String(right.date || ""));
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return getSchedulePeriodRank(left.period) - getSchedulePeriodRank(right.period);
    });
}

function getAppointmentRangeDate(offset = 0) {
  const baseDate = new Date(`${getTodayString()}T08:00:00`);
  if (Number.isNaN(baseDate.getTime())) {
    return getTodayString();
  }
  baseDate.setDate(baseDate.getDate() + offset);
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, "0");
  const day = String(baseDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAppointmentDateOptions(departmentKey = "") {
  const availableDates = new Set(
    getAppointmentDepartmentSchedules(departmentKey)
      .map((item) => String(item.date || "").trim())
      .filter(Boolean),
  );

  return Array.from({ length: 7 }, (_, index) => getAppointmentRangeDate(index)).filter((dateText) => availableDates.has(dateText));
}

function ensureAppointmentBookingSelection(scope = "page", preferredDepartment = "") {
  const store = getAppointmentBookingStore(scope);
  const fallbackDepartment = preferredDepartment || store.departmentKey || APPOINTMENT_DEPARTMENT_OPTIONS[0]?.key || "";
  const option = getAppointmentDepartmentOption(fallbackDepartment) || APPOINTMENT_DEPARTMENT_OPTIONS[0] || null;
  const departmentKey = option?.key || "";
  store.departmentKey = departmentKey;

  const dateOptions = getAppointmentDateOptions(departmentKey);
  const currentDate = store.dateByDepartment[departmentKey];
  if (!dateOptions.length) {
    store.dateByDepartment[departmentKey] = "";
  } else if (!currentDate || !dateOptions.includes(currentDate)) {
    store.dateByDepartment[departmentKey] = dateOptions[0];
  }

  return {
    option,
    departmentKey,
    dateOptions,
    activeDate: store.dateByDepartment[departmentKey] || "",
  };
}

function formatAppointmentWeekday(dateText = "") {
  const date = new Date(`${dateText}T08:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()] || "";
}

function formatAppointmentDateShort(dateText = "") {
  const parts = String(dateText || "").split("-");
  if (parts.length !== 3) {
    return dateText;
  }
  return `${parts[1]}/${parts[2]}`;
}

function getAppointmentDaySchedules(departmentKey = "", dateText = "") {
  return getAppointmentDepartmentSchedules(departmentKey).filter((item) => String(item.date || "").trim() === String(dateText || "").trim());
}

function getAppointmentTimeRange(schedule) {
  return APPOINTMENT_TIME_RANGE_MAP[String(schedule?.period || "").trim()] || String(schedule?.period || "").trim();
}

function getPendingAppointmentForPatient(patient) {
  return (Array.isArray(patient?.appointments) ? patient.appointments : []).find((item) => item.status === "已预约") || null;
}

function renderAppointmentDepartmentTabs(scope = "page") {
  const { departmentKey } = ensureAppointmentBookingSelection(scope);
  return `<div class="appointment-department-tabs">${APPOINTMENT_DEPARTMENT_OPTIONS.map((item) => `
    <button class="appointment-department-tab${departmentKey === item.key ? " active" : ""}" type="button" data-action="set-appointment-department" data-scope="${escapeHtml(scope)}" data-department-key="${escapeHtml(item.key)}">
      <span>${escapeHtml(item.label)}</span>
    </button>`).join("")}</div>`;
}

function renderAppointmentDateTabs(scope = "page") {
  const { dateOptions, activeDate } = ensureAppointmentBookingSelection(scope);
  if (!dateOptions.length) {
    return `<div class="empty-state compact"><strong>暂未开放日期</strong><p>当前科室暂无未来号源，请稍后再试。</p></div>`;
  }

  return `<div class="appointment-date-tabs">${dateOptions.map((dateText) => `
    <button class="appointment-date-tab${activeDate === dateText ? " active" : ""}" type="button" data-action="set-appointment-date" data-scope="${escapeHtml(scope)}" data-date="${escapeHtml(dateText)}">
      <span>${escapeHtml(formatAppointmentWeekday(dateText))}</span>
      <strong>${escapeHtml(formatAppointmentDateShort(dateText))}</strong>
    </button>`).join("")}</div>`;
}

function renderAppointmentTimeSlots(scope = "page", patientId = "", disabled = false) {
  const { departmentKey, activeDate } = ensureAppointmentBookingSelection(scope);
  const schedules = getAppointmentDaySchedules(departmentKey, activeDate);
  if (!schedules.length) {
    return `<div class="empty-state compact"><strong>当天暂无时段</strong><p>可以切换其他日期或相关科室查看。</p></div>`;
  }

  return `<div class="appointment-slot-grid">${schedules.map((schedule) => {
    const remainCount = getScheduleRemainCount(schedule);
    const slotDisabled = disabled || remainCount <= 0;
    return `
      <button class="appointment-slot-card${slotDisabled ? " disabled" : ""}" type="button" data-action="book-appointment-slot" data-scope="${escapeHtml(scope)}" data-id="${escapeHtml(patientId)}" data-department-key="${escapeHtml(departmentKey)}" data-schedule-id="${escapeHtml(schedule.id)}" ${slotDisabled ? "disabled" : ""}>
        <strong>${escapeHtml(getAppointmentTimeRange(schedule))}</strong>
        <span>${escapeHtml(formatRoomLabel(schedule.clinic))}</span>
        <em>${escapeHtml(slotDisabled ? (disabled ? "已有待诊预约" : "当前已满") : `剩余 ${remainCount} 号`)}</em>
      </button>`;
  }).join("")}</div>`;
}

function renderAppointmentBookingPanel(scope = "page", patient = getSafeCurrentPatient(), disabled = false) {
  const { option } = ensureAppointmentBookingSelection(scope);
  const pendingAppointment = getPendingAppointmentForPatient(patient);
  const nextSchedule = option ? getDepartmentNextSchedule(option) : null;

  return `
    <section class="appointment-booking-shell">
      <div class="appointment-booking-hero">
        <div>
          <span class="appointment-booking-eyebrow">复诊预约</span>
          <h2>${escapeHtml(option?.label || "相关科室预约")}</h2>
          <p>${escapeHtml(option?.summary || "围绕头颈放疗复诊和康复随访，选择日期后直接预约具体时段。")}</p>
        </div>
        <div class="appointment-booking-pills">
          <span>${escapeHtml(nextSchedule ? `最近可约 ${nextSchedule.date} ${nextSchedule.period}` : "当前无可预约号源")}</span>
          <span>号源与医生端实时同步</span>
        </div>
      </div>
      ${pendingAppointment ? `<div class="appointment-active-card"><strong>当前已有待就诊预约</strong><span>${escapeHtml(`${pendingAppointment.date} / ${pendingAppointment.department} / ${pendingAppointment.room}`)}</span></div>` : ""}
      ${renderAppointmentDepartmentTabs(scope)}
      <div class="appointment-booking-section">
        <div class="appointment-section-head"><strong>选择日期</strong><span>最多展示近 7 天可预约日期</span></div>
        ${renderAppointmentDateTabs(scope)}
      </div>
      <div class="appointment-booking-section">
        <div class="appointment-section-head"><strong>选择时段</strong><span>${disabled ? "当前已有待就诊预约，暂不可重复预约" : "点击可直接预约该时段"}</span></div>
        ${renderAppointmentTimeSlots(scope, patient?.id || "", disabled)}
      </div>
    </section>`;
}

function renderPatientAppointmentHistoryCard(item) {
  return `
    <article class="appointment-card appointment-history-card">
      <div class="appointment-history-top">
        <span>${escapeHtml(item.date || "-")}</span>
        <strong>${escapeHtml(item.status || "待确认")}</strong>
      </div>
      <h3>${escapeHtml(item.department || "-")}</h3>
      <p>${escapeHtml(`${formatRoomLabel(item.room)} / ${item.visitType || "复诊"}`)}</p>
      <div class="card-meta">
        <span>预约方式 <b>${escapeHtml(item.source === "quickFollowup" ? "复诊预约" : "常规预约")}</b></span>
      </div>
    </article>`;
}

renderPatientAppointmentsModule = function () {
  const patient = getSafeCurrentPatient();
  const hasPending = hasPendingAppointmentRecord(patient);
  const items = patient.appointments.length
    ? patient.appointments.map((item) => renderPatientAppointmentHistoryCard(item)).join("")
    : `<div class="empty-state"><strong>暂无预约记录</strong><p>请选择上方相关科室、日期和时段后完成预约。</p></div>`;

  return `
    <section class="appointment-scheduler-layout">
      ${renderAppointmentBookingPanel("page", patient, hasPending)}
      <div class="appointment-history-head appointment-history-head-modern">
        <strong>预约记录</strong>
        <span>当前预约会同步到医生端的预约管理模块</span>
      </div>
      <div class="appointment-list appointment-history-grid">${items}</div>
    </section>`;
};

const baseRenderModalAppointmentExperience = renderModal;
renderModal = function () {
  baseRenderModalAppointmentExperience();
  if (!modalState || modalState.type !== "quick-followup-picker") {
    return;
  }

  const patient = modalState.payload || {};
  const hasPending = hasPendingAppointmentRecord(patient);
  modalTitle.textContent = "预约复诊";
  modalBody.innerHTML = `
    <div class="quick-followup-picker quick-followup-picker-modern">
      <p class="modal-help">为 <strong>${escapeHtml(patient.name || "当前病人")}</strong> 选择具体科室、日期和时段，预约后会直接写入共享号源。</p>
      ${renderAppointmentBookingPanel("picker", patient, hasPending)}
    </div>`;
};

moduleContent.addEventListener("click", async (event) => {
  const departmentButton = event.target.closest('[data-action="set-appointment-department"][data-scope="page"]');
  if (departmentButton) {
    event.preventDefault();
    getAppointmentBookingStore("page").departmentKey = departmentButton.dataset.departmentKey || APPOINTMENT_DEPARTMENT_OPTIONS[0]?.key || "";
    renderModuleContent();
    return;
  }

  const dateButton = event.target.closest('[data-action="set-appointment-date"][data-scope="page"]');
  if (dateButton) {
    event.preventDefault();
    const { departmentKey } = ensureAppointmentBookingSelection("page");
    getAppointmentBookingStore("page").dateByDepartment[departmentKey] = dateButton.dataset.date || "";
    renderModuleContent();
    return;
  }

  const slotButton = event.target.closest('[data-action="book-appointment-slot"][data-scope="page"]');
  if (slotButton) {
    event.preventDefault();
    if (!slotButton.disabled) {
      await requestQuickFollowup(slotButton.dataset.id || "", slotButton.dataset.departmentKey || "", slotButton.dataset.scheduleId || "");
    }
  }
});

modalBody.addEventListener("click", async (event) => {
  if (modalState?.type !== "quick-followup-picker") {
    return;
  }

  const departmentButton = event.target.closest('[data-action="set-appointment-department"][data-scope="picker"]');
  if (departmentButton) {
    event.preventDefault();
    getAppointmentBookingStore("picker").departmentKey = departmentButton.dataset.departmentKey || APPOINTMENT_DEPARTMENT_OPTIONS[0]?.key || "";
    renderModal();
    return;
  }

  const dateButton = event.target.closest('[data-action="set-appointment-date"][data-scope="picker"]');
  if (dateButton) {
    event.preventDefault();
    const { departmentKey } = ensureAppointmentBookingSelection("picker");
    getAppointmentBookingStore("picker").dateByDepartment[departmentKey] = dateButton.dataset.date || "";
    renderModal();
    return;
  }

  const slotButton = event.target.closest('[data-action="book-appointment-slot"][data-scope="picker"]');
  if (slotButton) {
    event.preventDefault();
    if (slotButton.disabled) {
      return;
    }
    const success = await requestQuickFollowup(slotButton.dataset.id || "", slotButton.dataset.departmentKey || "", slotButton.dataset.scheduleId || "");
    if (success) {
      closeModal();
    }
  }
});

getAppointmentDateOptions = function (departmentKey = "") {
  const availableDates = new Set(
    getAppointmentDepartmentSchedules(departmentKey)
      .map((item) => String(item.date || "").trim())
      .filter(Boolean),
  );

  return Array.from({ length: 7 }, (_, index) => getAppointmentRangeDate(index)).filter((dateText) => availableDates.has(dateText));
};

renderAppointmentBookingPanel = function (scope = "page", patient = getSafeCurrentPatient(), disabled = false) {
  const { option, departmentKey } = ensureAppointmentBookingSelection(scope);
  const pendingAppointment = getPendingAppointmentForPatient(patient);
  const nextSchedule = option ? getDepartmentNextSchedule(option) : null;
  const helperText = pendingAppointment
    ? `${pendingAppointment.date} / ${pendingAppointment.department} / ${pendingAppointment.room}`
    : nextSchedule
      ? `${nextSchedule.date} ${getAppointmentTimeRange(nextSchedule)} / ${formatRoomLabel(nextSchedule.clinic)} / 余号 ${getScheduleRemainCount(nextSchedule)}`
      : "当前没有可直接预约的时段";

  return `
    <section class="appointment-booking-shell appointment-booking-shell-flat">
      <div class="appointment-booking-toolbar">
        <div class="appointment-booking-title">
          <strong>${escapeHtml(option?.label || "相关科室预约")}</strong>
          <span>${escapeHtml(disabled ? "当前已有待就诊预约，暂不支持重复预约" : "日期只显示今天起往后 7 天")}</span>
        </div>
        <button class="primary-action appointment-quick-action" type="button" data-action="quick-book-appointment" data-scope="${escapeHtml(scope)}" data-id="${escapeHtml(patient?.id || "")}" data-department-key="${escapeHtml(departmentKey)}" ${disabled ? "disabled" : ""}>
          一键预约
        </button>
      </div>
      <div class="appointment-inline-note${disabled ? " disabled" : ""}">
        <strong>${escapeHtml(disabled ? "当前预约" : "最近可约")}</strong>
        <span>${escapeHtml(helperText)}</span>
      </div>
      ${renderAppointmentDepartmentTabs(scope)}
      <div class="appointment-booking-section">
        <div class="appointment-section-head"><strong>选择日期</strong><span>今天起往后 7 天</span></div>
        ${renderAppointmentDateTabs(scope)}
      </div>
      <div class="appointment-booking-section">
        <div class="appointment-section-head"><strong>选择时段</strong><span>${disabled ? "已有预约时段，暂不支持重复预约" : "也可以直接点右上角一键预约"}</span></div>
        ${renderAppointmentTimeSlots(scope, patient?.id || "", disabled)}
      </div>
    </section>`;
};

moduleContent.addEventListener("click", async (event) => {
  const quickBookButton = event.target.closest('[data-action="quick-book-appointment"][data-scope="page"]');
  if (!quickBookButton) {
    return;
  }

  event.preventDefault();
  if (quickBookButton.disabled) {
    return;
  }

  await requestQuickFollowup(quickBookButton.dataset.id || "", quickBookButton.dataset.departmentKey || "");
});

modalBody.addEventListener("click", async (event) => {
  if (modalState?.type !== "quick-followup-picker") {
    return;
  }

  const quickBookButton = event.target.closest('[data-action="quick-book-appointment"][data-scope="picker"]');
  if (!quickBookButton) {
    return;
  }

  event.preventDefault();
  if (quickBookButton.disabled) {
    return;
  }

  const success = await requestQuickFollowup(quickBookButton.dataset.id || "", quickBookButton.dataset.departmentKey || "");
  if (success) {
    closeModal();
  }
});

renderAppointmentBookingPanel = function (scope = "page", patient = getSafeCurrentPatient(), disabled = false) {
  const { departmentKey } = ensureAppointmentBookingSelection(scope);
  const quickLabel = disabled ? "已有预约" : "一键预约";

  return `
    <section class="appointment-booking-shell appointment-booking-shell-compact">
      <div class="appointment-compact-head">
        ${renderAppointmentDepartmentTabs(scope)}
        <button class="primary-action appointment-quick-action compact" type="button" data-action="quick-book-appointment" data-scope="${escapeHtml(scope)}" data-id="${escapeHtml(patient?.id || "")}" data-department-key="${escapeHtml(departmentKey)}" ${disabled ? "disabled" : ""}>
          ${quickLabel}
        </button>
      </div>
      <div class="appointment-booking-section compact">
        ${renderAppointmentDateTabs(scope)}
      </div>
      <div class="appointment-booking-section compact">
        ${renderAppointmentTimeSlots(scope, patient?.id || "", disabled)}
      </div>
    </section>`;
};

renderPatientAppointmentsModule = function () {
  const patient = getSafeCurrentPatient();
  const hasPending = hasPendingAppointmentRecord(patient);
  const items = patient.appointments.length
    ? patient.appointments.map((item) => renderPatientAppointmentHistoryCard(item)).join("")
    : `<div class="empty-state"><strong>暂无预约记录</strong><p>请选择上方科室、日期和时段完成预约。</p></div>`;

  return `
    <section class="appointment-scheduler-layout appointment-scheduler-layout-compact">
      ${renderAppointmentBookingPanel("page", patient, hasPending)}
      <div class="appointment-history-title">预约记录</div>
      <div class="appointment-list appointment-history-grid">${items}</div>
    </section>`;
};

const baseRenderChromeEscortDirectory = renderChrome;
renderChrome = function (role) {
  baseRenderChromeEscortDirectory(role);
  const isEscortDirectoryView = role === "patient" && activeModuleKey === "escortService";
  const isDoctorManualSimpleView = role === "doctor" && activeModuleKey === "healthManuals";
  pageActionButton.hidden = isEscortDirectoryView || pageActionButton.hidden;
  pageSummaryRow.hidden = isEscortDirectoryView || pageSummaryRow.hidden;
  pageCrumbCard.hidden = isEscortDirectoryView || pageCrumbCard.hidden;
  appMain.classList.toggle("escort-directory-page", isEscortDirectoryView);
  appMain.classList.toggle("manual-simple-page", isDoctorManualSimpleView);
  moduleContent.classList.toggle("escort-directory-panel", isEscortDirectoryView);
  moduleContent.classList.toggle("manual-simple-panel", isDoctorManualSimpleView);
};

function getEscortCompactCounts() {
  const requests = getEscortRequestsForCurrentView();
  return {
    total: requests.length,
    waiting: requests.filter((item) => item.status === "待确认").length,
    active: requests.filter((item) => ["已安排", "进行中", "已到达"].includes(item.status)).length,
    done: requests.filter((item) => item.status === "已完成").length,
    roster: getEscortStaffSchedulesSorted().filter((item) => item.status !== "停用").length,
  };
}

function renderEscortCompactStat(label, value) {
  return `<span class="escort-ops-stat"><b>${escapeHtml(String(value))}</b>${escapeHtml(label)}</span>`;
}

function renderEscortCompactSteps(request) {
  const status = request.status || "待确认";
  if (status === "已取消") {
    return `<div class="escort-compact-steps"><span class="cancelled">已取消</span></div>`;
  }

  const steps = ["待确认", "已安排", "进行中", "已到达", "已完成"];
  const currentIndex = Math.max(0, steps.indexOf(status));
  return `
    <div class="escort-compact-steps">
      ${steps.map((step, index) => {
        const stateClass = index < currentIndex ? "done" : index === currentIndex ? "active" : "";
        return `<span class="${stateClass}">${escapeHtml(step)}</span>`;
      }).join("")}
    </div>`;
}

function getEscortNextAction(request) {
  if (!request.assignedStaff || ["已完成", "已取消"].includes(request.status)) {
    return null;
  }
  if (request.status === "已安排") {
    return { status: "进行中", label: "开始陪诊" };
  }
  if (request.status === "进行中") {
    return { status: "已到达", label: "确认到达" };
  }
  if (request.status === "已到达") {
    return { status: "已完成", label: "完成陪诊" };
  }
  return null;
}

renderEscortRosterCards = function () {
  const schedules = getEscortStaffSchedulesSorted();
  const items = schedules.length
    ? schedules.map((item) => {
        const assignedCount = getEscortStaffAssignedCount(item);
        return `
          <article class="escort-roster-card escort-roster-card-compact">
            <div>
              <span class="escort-muted">${escapeHtml(`${item.date} ${item.period}`)}</span>
              <strong>${escapeHtml(item.staffName)}</strong>
            </div>
            <div>
              <span class="escort-muted">${escapeHtml(item.department || "-")}</span>
              <b>${escapeHtml(`${assignedCount}/${item.capacity}`)}</b>
            </div>
            <span class="escort-status-pill" data-status="${escapeHtml(item.status || "可用")}">${escapeHtml(item.status || "可用")}</span>
            <button class="secondary-button" type="button" data-action="edit-escort-schedule" data-id="${escapeHtml(item.id)}">编辑</button>
          </article>`;
      }).join("")
    : `<div class="empty-state compact"><strong>暂无排班</strong></div>`;

  return `
    <section class="panel-card escort-roster-panel escort-roster-panel-compact">
      <div class="escort-section-toolbar">
        <h3>人员排班</h3>
        <button class="secondary-button" type="button" data-action="open-escort-schedule-modal">新增排班</button>
      </div>
      <div class="escort-roster-grid escort-roster-grid-compact">${items}</div>
    </section>`;
};

renderDoctorEscortRequestCard = function (request) {
  const canProcess = !["已完成", "已取消"].includes(request.status);
  const followupRecord = getEscortFollowupRecord(request);
  const nextAction = getEscortNextAction(request);
  const feeLabel = request.feeAmount ? `${formatEscortFee(request.feeAmount)} / ${request.feeStatus || "待确认"}` : `待确认 / ${request.feeStatus || "待确认"}`;
  const confirmationLabel = request.confirmationCode || "待生成";
  const followupLabel = followupRecord ? `${followupRecord.dueDate} / ${followupRecord.status}` : "未转入";

  return `
    <article class="escort-request-card escort-request-card-doctor escort-request-card-compact">
      <div class="escort-card-head">
        <div>
          <span class="escort-muted">${escapeHtml(request.serviceDate || "-")}</span>
          <strong>${escapeHtml(`${request.patientName || "-"} · ${request.requestType || "-"}`)}</strong>
          <p>${escapeHtml(`${request.department || "-"} / ${formatRoomLabel(request.room)} / ${request.meetingPoint || "门诊大厅服务台"}`)}</p>
        </div>
        <span class="escort-status-pill" data-status="${escapeHtml(request.status || "待确认")}">${escapeHtml(request.status || "待确认")}</span>
      </div>

      <div class="escort-compact-facts">
        <span><em>陪诊员</em><b>${escapeHtml(request.assignedStaff || "待安排")}</b></span>
        <span><em>联系人</em><b>${escapeHtml(`${request.contactName || request.patientName || "-"} / ${request.contactPhone || "-"}`)}</b></span>
        <span><em>费用</em><b>${escapeHtml(feeLabel)}</b></span>
        <span><em>确认单</em><b>${escapeHtml(confirmationLabel)}</b></span>
        <span><em>复诊提醒</em><b>${escapeHtml(followupLabel)}</b></span>
      </div>

      ${renderEscortCompactSteps(request)}

      <div class="card-actions escort-compact-actions">
        <button class="secondary-button" type="button" data-action="edit-escort-request" data-id="${escapeHtml(request.id)}">安排 / 编辑</button>
        ${nextAction ? `<button class="primary-action" type="button" data-action="escort-status" data-id="${escapeHtml(request.id)}" data-status="${escapeHtml(nextAction.status)}">${escapeHtml(nextAction.label)}</button>` : ""}
        <button class="secondary-button" type="button" data-action="escort-convert-followup" data-id="${escapeHtml(request.id)}" ${request.status === "已取消" || followupRecord ? "disabled" : ""}>转复诊</button>
        <button class="danger-button" type="button" data-action="escort-status" data-id="${escapeHtml(request.id)}" data-status="已取消" ${canProcess ? "" : "disabled"}>取消</button>
      </div>
    </article>`;
};

renderDoctorEscortModule = function () {
  const counts = getEscortCompactCounts();
  const items = getEscortRequestsForCurrentView().length
    ? getEscortRequestsForCurrentView().map((item) => renderDoctorEscortRequestCard(item)).join("")
    : `<div class="empty-state compact"><strong>暂无陪诊单</strong></div>`;

  return `
    <section class="escort-ops-toolbar">
      <div>
        <h2>陪诊管理</h2>
        <div class="escort-ops-stats">
          ${renderEscortCompactStat("总单", counts.total)}
          ${renderEscortCompactStat("待确认", counts.waiting)}
          ${renderEscortCompactStat("进行中", counts.active)}
          ${renderEscortCompactStat("已完成", counts.done)}
          ${renderEscortCompactStat("排班", counts.roster)}
        </div>
      </div>
      <div class="section-actions">
        <button class="secondary-button" type="button" data-action="open-escort-schedule-modal">新增排班</button>
        <button class="primary-action" type="button" data-action="open-escort-request">新增陪诊单</button>
      </div>
    </section>
    ${renderEscortRosterCards()}
    <section class="panel-card escort-request-panel escort-request-panel-compact">
      <div class="escort-section-toolbar">
        <h3>陪诊服务单</h3>
      </div>
      <div class="escort-request-list escort-request-list-compact">${items}</div>
    </section>`;
};

const baseRenderChromeEscortOpsCompact = renderChrome;
renderChrome = function (role) {
  baseRenderChromeEscortOpsCompact(role);
  const isDoctorEscortCompactView = role === "doctor" && activeModuleKey === "escortManagement";
  if (isDoctorEscortCompactView) {
    pageActionButton.hidden = true;
    pageSummaryRow.hidden = true;
    pageCrumbCard.hidden = true;
  }
  appMain.classList.toggle("escort-ops-page", isDoctorEscortCompactView);
  moduleContent.classList.toggle("escort-ops-panel", isDoctorEscortCompactView);
};

renderManualToolbar = function (totalCount, role) {
  return `
    <section class="manual-toolbar-flat">
      <div class="manual-toolbar-inline">
        <div class="manual-toolbar-caption">
          <strong>${role === "doctor" ? "内容管理" : "阅读筛选"}</strong>
          <span>当前 ${totalCount} 篇文章</span>
        </div>
        ${renderManualCategoryFilters()}
        <div class="manual-toolbar-actions compact">
          <input id="manualSearch" class="search-input" type="text" value="${escapeHtml(manualSearchKeyword)}" placeholder="搜索标题或关键词">
          <button class="secondary-button" type="button" data-action="clear-manual-filters">清空筛选</button>
        </div>
      </div>
    </section>`;
};

function renderManualSimpleCover(item) {
  const image = String(item.coverImage || "").trim();
  const title = String(item.title || "文章").trim();
  return `<div class="manual-simple-cover${image ? " has-image" : ""}">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}">` : `<span>${escapeHtml(title.slice(0, 1) || "文")}</span>`}</div>`;
}

renderDoctorHealthManualsModule = function () {
  const manuals = getSortedHealthManuals();
  const items = manuals.length
    ? manuals
        .map(
          (item) => `
          <article class="manual-card manual-card-simple">
            ${renderManualSimpleCover(item)}
            <div class="manual-card-simple-body">
              <h3>${escapeHtml(item.title || "未命名文章")}</h3>
              <button class="secondary-button manual-edit-button" type="button" data-action="edit-manual" data-id="${escapeHtml(item.id || "")}">编辑</button>
            </div>
          </article>`,
        )
        .join("")
    : `<div class="empty-state"><strong>暂无文章</strong></div>`;

  return `<div class="manual-grid manual-grid-simple">${items}</div>`;
};

const baseGetPageActionHandlerTreg = getPageActionHandler;
getPageActionHandler = function () {
  if (currentRole === "doctor" && activeModuleKey === "radiomicsPrognosis") {
    return async () => {
      await loadRadiomicsPrognosisData(true);
      renderApp();
      setAppNotice("影像组学预后评分数据已刷新。", "success");
    };
  }
  if (currentRole === "doctor" && activeModuleKey === "tregPrognosis") {
    return () => {
      const firstInput = moduleContent.querySelector("[data-treg-input]");
      if (firstInput) {
        firstInput.focus();
      }
      updateTregResult(calculateTregRisk(readTregFormInputs()));
      setAppNotice("Treg预后分层已生成。", "success");
    };
  }
  return baseGetPageActionHandlerTreg();
};

moduleContent.addEventListener("click", (event) => {
  const button = event.target.closest('[data-action^="treg-"]');
  if (!button || activeModuleKey !== "tregPrognosis") {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  const { action } = button.dataset;

  if (action === "treg-calculate") {
    updateTregResult(calculateTregRisk(readTregFormInputs()));
    setAppNotice("Treg预后分层已生成。", "success");
    return;
  }

  if (action === "treg-fill-demo") {
    writeTregFormInputs(TREG_DEMO_VALUES);
    updateTregResult(calculateTregRisk(TREG_DEMO_VALUES));
    setAppNotice("已填入Treg示例指标。", "success");
    return;
  }

  if (action === "treg-reset") {
    tregPrognosisState = { inputs: { ...TREG_EMPTY_VALUES }, result: null, empty: true };
    moduleContent.querySelectorAll("[data-treg-input]").forEach((input) => {
      input.value = "";
    });
    const resultNode = moduleContent.querySelector("[data-treg-result]");
    if (resultNode) {
      resultNode.innerHTML = `<div class="empty-state"><strong>等待生成分层</strong><p>录入Treg相关指标后点击生成分层。</p></div>`;
    }
    setAppNotice("Treg录入指标已清空。", "info");
  }
}, true);

moduleContent.addEventListener("input", handleTregInputState, true);
moduleContent.addEventListener("change", handleTregInputState, true);

function exportRadiomicsReport() {
  const selected = getSelectedRadiomicsCase();
  if (!selected) {
    setAppNotice("当前没有可导出的影像组学结果。", "error");
    return;
  }
  const lines = [
    "影像组学预后评分报告",
    `病例编号：${selected.caseId}`,
    `Treg预测概率：${formatRadiomicsProbability(selected.tregProbability)}`,
    `判断阈值：0.50`,
    `风险结论：${getRadiomicsProbabilityLabel(selected.tregProbability)}`,
    "",
    "六项影像组学特征：",
    ...(selected.featureValues || []).map((feature) => `${feature.label}: ${feature.value}，z-score ${Number(feature.zScore || 0).toFixed(2)}`),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${selected.caseId}_radiomics_treg_report.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setAppNotice("影像组学预后评分报告已导出。", "success");
}

moduleContent.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || activeModuleKey !== "radiomicsPrognosis") {
    return;
  }

  const { action, id } = button.dataset;
  if (action === "select-radiomics-case") {
    radiomicsPrognosisState.selectedCaseId = id || "";
    renderModuleContent();
    return;
  }

  if (action === "refresh-radiomics-prognosis") {
    await loadRadiomicsPrognosisData(true);
    renderApp();
    setAppNotice("影像组学预后评分数据已刷新。", "success");
    return;
  }

  if (action === "export-radiomics-report") {
    exportRadiomicsReport();
    return;
  }

  if (action === "view-radiomics-features") {
    moduleContent.querySelector(".radiomics-feature-chart, .radiomics-zscore-image")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

const baseRenderChromeRadiomicsWorkbench = renderChrome;
renderChrome = function (role) {
  baseRenderChromeRadiomicsWorkbench(role);
  const isRadiomicsWorkbench = role === "doctor" && activeModuleKey === "radiomicsPrognosis";
  if (isRadiomicsWorkbench) {
    pageActionButton.hidden = true;
    pageSummaryRow.hidden = true;
    pageCrumbCard.hidden = true;
  }
  appMain.classList.toggle("radiomics-workbench-page", isRadiomicsWorkbench);
  moduleContent.classList.toggle("radiomics-workbench-panel", isRadiomicsWorkbench);
};

currentUserName = accounts.doctor.name;
if (!aiState.config.providerName) {
  aiState.config.providerName = DEFAULT_AI_CONFIG.providerName;
}
if (!aiState.config.systemPrompt) {
  aiState.config.systemPrompt = DEFAULT_AI_CONFIG.systemPrompt;
}

if (false) form.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if (!username || !password) {
      setMessage("请输入完整的账号和密码。", "error");
      return;
    }

    try {
      const payload = await requestLogin(currentRole, username, password, rememberLogin.checked);
      await pullAppDataFromServer({ rerender: false, silent: false });
      resetActiveModule(payload.role);
      await enterSystem(payload.role, payload.username, { name: payload.name });
    } catch (error) {
      setMessage(error.message || "登录失败，请重试。", "error");
    }
  },
  true
);

async function initializeApp() {
  renderRole(currentRole);
  await restoreSystem();
}

initializeApp();
