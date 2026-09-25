"""Local contouring service reconstructed from the public HTTP contract.

The original trained model and case volumes are not part of this source bundle.
Prediction endpoints therefore fail explicitly until a validated engine is added.
"""

import os
import json
import gzip
from pathlib import Path

from flask import Flask, jsonify, render_template, send_from_directory


ROOT = Path(__file__).resolve().parent
ARCHIVED_RESULT = json.loads((ROOT / "archived-result.json").read_text(encoding="utf-8"))
ARCHIVED_DIR = ROOT / "outputs" / "web" / ARCHIVED_RESULT["result_name"]
ARCHIVED_SLICE_DIR = ROOT / "archived-slices" / ARCHIVED_RESULT["result_name"]
ARCHIVED_CASES_FILE = ROOT / "archived-cases.json"
app = Flask(__name__, template_folder=str(ROOT / "templates"), static_folder=str(ROOT / "static"))


def model_unavailable():
    return jsonify({
        "ok": False,
        "code": "MODEL_UNAVAILABLE",
        "detail": "靶区勾画模型和病例影像未包含在当前源码包中；无法生成真实勾画结果。",
    }), 503


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/meta")
def meta():
    archive_summary = None
    if (ARCHIVED_DIR / "overlay.png").is_file():
        archive_summary = {
            **ARCHIVED_RESULT,
            "archive_slices_available": (ARCHIVED_SLICE_DIR / "meta.json").is_file(),
        }
    archived_case_ids = []
    if ARCHIVED_CASES_FILE.is_file():
        archived_case_ids = json.loads(ARCHIVED_CASES_FILE.read_text(encoding="utf-8")).get("case_ids", [])
    return jsonify({
        "case_count": 0,
        "cases": [],
        "profiles": [],
        "recommended_profile_id": "",
        "model_count": 0,
        "latest_result_summary": archive_summary,
        "archived_case_ids": archived_case_ids,
        "status": "model_unavailable",
    })


@app.post("/api/run-case")
@app.post("/api/run-upload")
@app.post("/run-case")
@app.post("/run-upload")
def run_inference():
    return model_unavailable()


@app.get("/api/results/<result_name>")
def missing_result(result_name, z=None):
    return jsonify({"detail": "本地没有这个勾画结果。"}), 404


@app.get("/api/revision/<result_name>")
def archived_revision(result_name):
    meta_file = ARCHIVED_SLICE_DIR / "meta.json"
    if result_name != ARCHIVED_RESULT["result_name"] or not meta_file.is_file():
        return jsonify({"detail": "本地没有这个勾画结果。"}), 404
    return jsonify(json.loads(meta_file.read_text(encoding="utf-8")))


@app.get("/api/revision/<result_name>/slice/<int:z>")
def archived_revision_slice(result_name, z):
    slice_file = ARCHIVED_SLICE_DIR / f"slice-{z}.json.gz"
    if result_name != ARCHIVED_RESULT["result_name"] or not slice_file.is_file():
        return jsonify({"detail": "本地没有这个勾画结果。"}), 404
    with gzip.open(slice_file, "rt", encoding="utf-8") as stream:
        return jsonify(json.load(stream))


@app.get("/result/<result_name>")
def result_page(result_name):
    if result_name != ARCHIVED_RESULT["result_name"] or not (ARCHIVED_DIR / "overlay.png").is_file():
        return jsonify({"detail": "本地没有这个勾画结果。"}), 404
    return render_template("result.html")


@app.get("/outputs/web/<result_name>/<filename>")
def archived_file(result_name, filename):
    if result_name != ARCHIVED_RESULT["result_name"] or filename not in {
        "overlay.png", "prediction.nii.gz", "probability.nii.gz"
    }:
        return jsonify({"detail": "本地没有这个结果文件。"}), 404
    if not (ARCHIVED_DIR / filename).is_file():
        return jsonify({"detail": "本地没有这个结果文件。"}), 404
    return send_from_directory(ARCHIVED_DIR, filename)


@app.post("/api/revision/<result_name>/save")
def save_revision(result_name):
    return jsonify({"detail": "本地没有可编辑的勾画结果。"}), 404


@app.get("/openapi.json")
def reference_openapi():
    return app.response_class((ROOT / "openapi.reference.json").read_bytes(), mimetype="application/json")


if __name__ == "__main__":
    app.run(
        host=os.environ.get("BRAIN_GTV_HOST", "127.0.0.1"),
        port=int(os.environ.get("BRAIN_GTV_PORT", "8011")),
        use_reloader=False,
    )
