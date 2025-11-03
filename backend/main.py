from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os, requests

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RouteRequest(BaseModel):
    origin: str
    destination: str
    mode: str = "driving"

@app.get("/")
def root():
    return {"message": "Smart Travel Recommender is running"}

@app.post("/api/calculate-route")
def calculate_route(request: RouteRequest):
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return {"error": "Google Maps API key missing"}
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": request.origin,
        "destination": request.destination,
        "mode": request.mode,
        "key": api_key
    }
    res = requests.get(url, params=params)
    data = res.json()

    if data.get("status") != "OK":
        return {"error": data.get("status", "Failed to get route")}

    leg = data["routes"][0]["legs"][0]
    route_info = {
        "origin": leg["start_address"],
        "destination": leg["end_address"],
        "mode": request.mode,
        "distance": leg["distance"]["text"],
        "duration": leg["duration"]["text"],
        "polyline": data["routes"][0]["overview_polyline"]["points"]
    }
    return route_info

# 🟩 Serve the Maps JS URL safely
@app.get("/api/maps-key")
def get_maps_key():
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return {"error": "Missing API key"}
    return {"url": f"https://maps.googleapis.com/maps/api/js?key={api_key}&libraries=places"}
