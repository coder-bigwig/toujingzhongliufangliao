# 头颈部肿瘤放疗决策与预后管理系统

这是从现有本地源码和网站公开资源整理的可部署版本。主服务是 Node.js，医生端靶区勾画及剂量预测使用两个 Python Flask 子服务。

## 启动

先安装 Python 依赖：

```bash
python -m pip install -r brain_gtv_system/requirements.txt
python -m pip install -r dose_prediction_system/requirements.txt
```

Windows 在应用目录运行 `start-local.ps1`。Linux 在应用目录运行：

```bash
MED_HOST=0.0.0.0 MED_PORT=8080 node server.js
```

默认演示账号：医生 `doctor001`、病人 `patient001`，密码均为 `123456`。部署前可用 `MED_DOCTOR_PASSWORD` 和 `MED_PATIENT_PASSWORD` 设置新密码。业务数据保存在运行时生成的 `app-data.json` 中；公开的商品和健康手册目录由 `catalog-seed.json` 初始化。

公开仓库不含病人业务数据、AI 密钥、聊天记录、上传的临床文件、原站模型权重和影像结果。医生工具页面和接口可启动；因缺少模型，新的靶区勾画和剂量预测请求会返回 `MODEL_UNAVAILABLE`。本地工作目录中恢复的一份历史勾画影像结果没有加入公开仓库。

详情见[恢复说明](头颈部肿瘤放疗决策与预后管理系统/恢复说明.md)。
