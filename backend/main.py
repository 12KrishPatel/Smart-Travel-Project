from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import requests

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
    return{"message": "Smart Travel Recommender is running"}

@app.post("/api/calculate-route")
def calculate_route(request: RouteRequest):
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return {"error": "Google maps api key not found"}
    
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": request.origin,
        "destination": request.destination,
        "mode": request.mode,
        "key": api_key
    }
    
    res = requests.get(url, params=params)
    data = res.json()

    # Error Handling

    if data.get("status") != "OK":
        return {"error": "Failed to retrieve route", "details": data.get("status", "Unknown error")}

    # Get route details 
    leg = data["routes"][0]["legs"][0]
    overview_polyline = data["routes"][0]["overview_polyline"]["points"]
    route_info = {
        "origin": leg["start_address"],
        "destination": leg["end_address"],
        "mode": request.mode,
        "distance": leg["distance"]["text"],
        "duration": leg["duration"]["text"],
        "polyline": overview_polyline
    }

    return route_info

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host ="0.0.0.0", port = 8000)
