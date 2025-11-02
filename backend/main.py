from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os

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
def read_root():
    return {"message": "Smart Travel Recommender API"}

@app.post("/api/calculate-route")
def calculate_route(request: RouteRequest):
    return {
        "origin": request.origin,
        "destination": request.destination,
        "mode": request.mode,
        "status": "Backend is working!",
        "message": "Route calculation will be added with Google Maps API"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)