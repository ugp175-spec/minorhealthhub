# app.py
import json, os, re
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)                     # allow the JS to call /api/posts

DB_FILE = "data.json"


# ------------------- DB helpers -------------------
def load_db():
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_db(data):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ------------------- API -------------------
@app.route("/api/posts", methods=["GET", "POST"])
def posts():
    db = load_db()

    if request.method == "POST":
        payload = request.get_json()
        required = ["title", "description", "tags"]
        if not all(k in payload for k in required):
            return jsonify({"error": "missing fields"}), 400

        post = {
            "title": payload["title"][:200],
            "description": payload["description"][:2000],
            "tags": payload["tags"][:200]
        }
        db.append(post)
        save_db(db)
        return jsonify({"message": "added"}), 201

    # GET – optional search
    q = request.args.get("search", "").lower()
    if q:
        def matches(text):
            return bool(re.search(re.escape(q), text, re.I))
        result = [p for p in db if any(matches(p[k]) for k in p)]
    else:
        result = db
    return jsonify(result)


# ------------------- Serve front-end -------------------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_static(path):
    """Serve index.html for any unknown route (SPA) and real files otherwise."""
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


# ------------------- Seed data (first run only) -------------------
# ------------------- Seed data (first run only) -------------------
if __name__ == "__main__":
    if not os.path.exists(DB_FILE):
        seed = [
            {"title":"Fast cold relief","description":"Hot lemon-honey water + rest. Symptoms gone in 2 days.","tags":"cold, cough, remedy"},
            {"title":"Seasonal allergy tip","description":"Local honey every morning reduced sneezing dramatically.","tags":"allergies, pollen, honey"},
            {"title":"Minor burn care","description":"Rinsed with cool water, then aloe gel. No blister.","tags":"burn, first-aid, aloe"},
            {"title":"Mild stomach upset","description":"Plain rice + banana + ginger tea settled everything.","tags":"digestion, stomach, home-remedy"}
        ]
        save_db(seed)
        print("Seed data created.")

    # Production: Listen on all interfaces and dynamic port
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)