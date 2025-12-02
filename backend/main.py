from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv
import os
import requests
from typing import Literal

load_dotenv()
app = FastAPI()

# Security: Restrict CORS to specific origins
# Set ALLOWED_ORIGINS in .env (comma-separated list)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
allowed_origins = [origin.strip() for origin in allowed_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

class RouteRequest(BaseModel):
    origin: str
    destination: str
    mode: Literal["driving", "walking", "bicycling", "transit"] = "driving"

    @field_validator('origin', 'destination')
    @classmethod
    def validate_location(cls, v: str) -> str:
        if not v or len(v.strip()) == 0:
            raise ValueError("Location cannot be empty")
        if len(v) > 500:
            raise ValueError("Location string too long")
        return v.strip()

@app.get("/")
def root():
    return {"message": "Smart Travel Recommender is running"}

@app.post("/api/calculate-route")
def calculate_route(request: RouteRequest):
    """
    Calculate route between origin and destination using Google Maps Directions API.

    Security: API key is kept server-side and never exposed to clients.
    """
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Server configuration error: API key missing")

    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": request.origin,
        "destination": request.destination,
        "mode": request.mode,
        "key": api_key
    }

    try:
        # Set timeout to prevent hanging requests
        res = requests.get(url, params=params, timeout=10)
        res.raise_for_status()
        data = res.json()
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Request to Google Maps API timed out")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Failed to connect to Google Maps API: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=502, detail="Invalid response from Google Maps API")

    # Handle Google Maps API error responses
    status = data.get("status")
    if status != "OK":
        error_messages = {
            "ZERO_RESULTS": "No route found between the specified locations",
            "NOT_FOUND": "One or both locations could not be found",
            "INVALID_REQUEST": "Invalid request parameters",
            "OVER_QUERY_LIMIT": "API quota exceeded. Please try again later",
            "REQUEST_DENIED": "Request was denied by Google Maps API",
            "UNKNOWN_ERROR": "Server error from Google Maps. Please try again"
        }
        error_msg = error_messages.get(status, f"Route calculation failed: {status}")
        raise HTTPException(status_code=400, detail=error_msg)

    # Validate response structure to prevent crashes
    try:
        if not data.get("routes") or len(data["routes"]) == 0:
            raise HTTPException(status_code=404, detail="No route found")

        route = data["routes"][0]
        if not route.get("legs") or len(route["legs"]) == 0:
            raise HTTPException(status_code=404, detail="Invalid route data received")

        leg = route["legs"][0]

        # Validate all required fields exist
        required_fields = ["start_address", "end_address", "distance", "duration"]
        for field in required_fields:
            if field not in leg:
                raise HTTPException(status_code=502, detail=f"Incomplete route data: missing {field}")

        if "overview_polyline" not in route or "points" not in route["overview_polyline"]:
            raise HTTPException(status_code=502, detail="Route polyline data missing")

        # Build validated response
        route_info = {
            "origin": leg["start_address"],
            "destination": leg["end_address"],
            "mode": request.mode,
            "distance": leg["distance"]["text"],
            "duration": leg["duration"]["text"],
            "polyline": route["overview_polyline"]["points"]
        }
        return route_info

    except (KeyError, IndexError, TypeError) as e:
        raise HTTPException(status_code=502, detail=f"Invalid response structure from Google Maps API: {str(e)}")
