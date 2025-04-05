from flask import Flask, jsonify, send_from_directory
import os
from dotenv import load_dotenv
from flask import request

load_dotenv()

app = Flask(__name__, static_folder='../public', static_url_path='')

@app.route("/")
def index():
    return send_from_directory('../public', 'toll_model.html')

@app.route("/api/maps_api_key")
def maps_api_key():
    return jsonify({"key": os.getenv("GOOGLE_API_KEY")})

@app.route("/api/realtime_tolls")
def realtime_tolls():
    from toll_model import load_model_and_predict
    from tomtom import fetch_realtime_entry_scores, fetch_crz_global_score

    global_congestion = fetch_crz_global_score()
    raw_scores = fetch_realtime_entry_scores()  # e.g., {"Brooklyn Bridge": 0.21, ...}
    entry_points = [
        {"name": name, "congestion": score}
        for name, score in raw_scores.items()
    ]

    model = load_model_and_predict()

    enriched = []
    for entry in entry_points:
        local = entry["congestion"]
        toll = model(local, global_congestion)
        enriched.append({
            "name": entry["name"],
            "local_congestion": local,
            "toll": toll,
        })

    return jsonify({
        "global_congestion": global_congestion,
        "entry_points": enriched
    })

@app.route("/api/test_model", methods=["POST"])
def test_model():
    from toll_model import load_model_and_predict
    data = request.get_json()
    global_cong = float(data["global_congestion"])
    results = []

    model = load_model_and_predict()

    for entry in data["local_congestion"]:
        name = entry["name"]
        local = float(entry["value"])
        toll = model(local, global_cong)
        results.append({
            "name": name,
            "local_congestion": local,
            "toll": toll,
        })

    return jsonify({"results": results})


if __name__ == "__main__":
    app.run(debug=True)