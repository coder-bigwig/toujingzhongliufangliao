"""Local dose service reconstructed from the public HTTP contract.

This source bundle has no trained checkpoint or patient volumes. A response is
never presented as a prediction unless an actual model has been integrated.
"""

import os
from pathlib import Path

from flask import Flask, jsonify, render_template


ROOT = Path(__file__).resolve().parent
app = Flask(__name__, template_folder=str(ROOT / "templates"), static_folder=str(ROOT / "static"))


def model_unavailable():
    return jsonify({
        "ok": False,
        "code": "MODEL_UNAVAILABLE",
        "detail": "剂量预测模型权重和病例体数据未包含在当前源码包中；无法生成真实剂量预测。",
    }), 503


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/meta")
def meta():
    return jsonify({
        "patients_by_split": {"train": [], "validation": [], "test": [], "upload": []},
        "counts": {"train": 0, "validation": 0, "test": 0, "upload": 0},
        "checkpoint_options": [],
        "upload_required_files": [],
        "upload_optional_files": [],
        "status": "model_unavailable",
    })


@app.post("/api/run-inference")
@app.post("/api/run-upload-inference")
@app.post("/run-inference")
def run_inference():
    return model_unavailable()


@app.get("/api/jobs/<job_id>")
@app.get("/result/<result_name>")
def missing_result(job_id=None, result_name=None):
    return jsonify({"detail": "本地没有这个剂量预测任务或结果。"}), 404


@app.get("/openapi.json")
def reference_openapi():
    return app.response_class((ROOT / "openapi.reference.json").read_bytes(), mimetype="application/json")


if __name__ == "__main__":
    app.run(
        host=os.environ.get("DOSE_PRED_HOST", "127.0.0.1"),
        port=int(os.environ.get("DOSE_PRED_PORT", "8021")),
        use_reloader=False,
    )
