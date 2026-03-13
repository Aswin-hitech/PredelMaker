from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

from backend.predictor import predict_delay
from backend.risk_engine import calculate_risk
from backend.eta_engine import update_eta
from backend.llm_engine import generate_explanation, driver_suggestion
from backend.vector_store import store_delay_context
from backend.geo_utils import calculate_distance, get_coordinates
from backend.apis.weather_api import get_weather_condition
from backend.apis.traffic_engine import estimate_traffic
from backend.apis.gps_utils import coordinates_to_address
from backend.apis.gps_engine import calculate_speed, calculate_stop_duration
from backend.auto_feature_engine import generate_auto_features
from backend.apis.route_api import get_route
import datetime

app = Flask(
    __name__,
    template_folder="../templates",
    static_folder="../templates/static"
)

CORS(app)


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/driver")
def driver():
    return render_template("driver.html")

@app.route("/customer")
def customer():
    return render_template("customer.html")

@app.route("/admin")
def admin():
    return render_template("admin.html")

from backend.apis.distance_engine import calculate_corrected_distance
from backend.apis.terrain_detector import detect_terrain

@app.route("/auto-features", methods=["POST"])
def auto_features():
    data = request.json
    dest_address = data.get("destination")
    lat = data.get("lat")
    lon = data.get("lon")
    
    # Telemetry data
    prev_lat = data.get("prev_lat")
    prev_lon = data.get("prev_lon")
    time_diff = data.get("time_diff", 5) # seconds
    current_stop = data.get("stop_duration", 0)
    
    if not dest_address or lat is None or lon is None:
        return jsonify({"error": "Missing destination or coordinates"}), 400
        
    # 1. Base auto features (Weather, Traffic, Address)
    features = generate_auto_features(lat, lon, dest_address)

    # distance_remaining calculation (Geodesic x 1.32 as per requirement)
    current_addr = coordinates_to_address(lat, lon)
    distance_remaining = calculate_distance(current_addr, dest_address)
        
    features["distance_remaining"] = distance_remaining
    features["current_address"] = current_addr

    # 2. Telemetry (Speed, Stop)
    speed = 0
    stop_duration = current_stop
    
    if prev_lat is not None and prev_lon is not None:
        speed = calculate_speed(prev_lat, prev_lon, lat, lon, time_diff)
        stop_duration = calculate_stop_duration(speed, current_stop, time_diff)

    features.update({
        "speed": speed,
        "stop_duration": round(stop_duration, 2)
    })

    return jsonify(features)

@app.route("/predict-delay", methods=["POST"])
def predict():
    data = request.json
    print(f"[DEBUG] Incoming prediction request: {data}")

    required_fields = [
        "vehicle_type", "route_type", "speed", "speed_drop",
        "distance_remaining", "traffic_level", "weather_condition",
        "stop_duration", "time_of_day", "origin_address", "destination_address"
    ]

    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    try:
        # Distance is already provided by frontend (calculated via geodesic * 1.32)
        # But we double check and ensure terrain is detected
        origin_coords = get_coordinates(data["origin_address"])
        dest_coords = get_coordinates(data["destination_address"])

        if origin_coords and dest_coords:
            data["terrain_type"] = detect_terrain(
                origin_coords[0], origin_coords[1], dest_coords[0], dest_coords[1]
            )
        else:
            data["terrain_type"] = "plain"
            
        prediction = predict_delay(data)
    except Exception as e:
        print(f"[ERROR] Prediction failed: {str(e)}")
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

    risk = calculate_risk(prediction["delay_probability"])
    
    traffic_delay = 10 if data["traffic_level"] == 2 else (5 if data["traffic_level"] == 1 else 0)
    weather_delay = 15 if data["weather_condition"] == 2 else (7 if data["weather_condition"] == 1 else 0)
    stop_delay = data.get("stop_duration", 0)
    
    eta_update = update_eta(
        distance_km=data["distance_remaining"],
        speed_kmh=data["speed"],
        traffic_delay=traffic_delay,
        stop_delay=stop_delay,
        weather_delay=weather_delay,
        terrain_type=data.get("terrain_type", "plain")
    )

    # LLM POLICY: Strictly on Predict button AND probability > 0.4
    explanation = "Risk is minimal. Delivery proceeding normally."
    suggestion = "Maintain current speed and follow the planned route."
    
    if data.get("trigger_llm") and prediction["delay_probability"] > 0.4:
        explanation = generate_explanation(prediction["delay_probability"], data)
        suggestion = driver_suggestion(data)

    if prediction["delay_prediction"] == 1:
        store_delay_context({
            "traffic_level": data["traffic_level"],
            "weather_condition": data["weather_condition"],
            "stop_duration": data["stop_duration"],
            "reason": explanation
        })

    notifications = []
    if prediction['delay_probability'] > 0.6:
        notifications.append("🚨 Delivery delay likely. High traffic or weather issues detected.")
    if data.get('traffic_level') == 2:
        notifications.append("🔴 Heavy traffic detected on your route.")
    if data.get('weather_condition') == 2:
        notifications.append("⛈️ Storm conditions detected. Please drive safely.")

    return jsonify({
        "prediction": prediction,
        "risk": risk,
        "eta_update": eta_update,
        "explanation": explanation,
        "suggestion": suggestion,
        "notifications": notifications,
        "terrain_type": data.get("terrain_type", "plain")
    })


@app.route("/route", methods=["POST"])
def route():
    data = request.json
    origin_lat = data.get("origin_lat")
    origin_lon = data.get("origin_lon")
    dest_lat = data.get("dest_lat")
    dest_lon = data.get("dest_lon")

    if None in [origin_lat, origin_lon, dest_lat, dest_lon]:
        return jsonify({"error": "Missing coordinates"}), 400

    route_data = get_route(origin_lat, origin_lon, dest_lat, dest_lon)
    
    if not route_data:
        return jsonify({"error": "Failed to fetch route"}), 500

    return jsonify(route_data)


@app.route("/distance", methods=["POST"])
def distance():

    data = request.json

    origin = data["origin"]
    destination = data["destination"]

    distance = calculate_distance(origin, destination)

    return jsonify({"distance_km": distance})


if __name__ == "__main__":
    app.run(debug=True)