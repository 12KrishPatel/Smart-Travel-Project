import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import polyline from "polyline";
import { useNavigate } from "react-router-dom";

const MapPage = () => {
  const [position, setPosition] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [mode, setMode] = useState("driving");
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const originHostRef = useRef(null);
  const destHostRef = useRef(null);

  // Ask for user's current position once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => setPosition([43.0731, -89.4012]) // fallback: Madison
      );
    } else setPosition([43.0731, -89.4012]);
  }, []);

  // Initialize autocomplete boxes
  const initAutocomplete = async () => {
    console.log("[Maps] Initializing autocomplete…");

    try {
      const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");

      // Clear existing boxes to avoid duplicates
      if (originHostRef.current) originHostRef.current.innerHTML = "";
      if (destHostRef.current) destHostRef.current.innerHTML = "";

      // Create new autocomplete boxes
      const originEl = new PlaceAutocompleteElement();
      const destEl = new PlaceAutocompleteElement();

      // Listen for place selections
      originEl.addEventListener("gmpx-placechange", (e) => {
        const place = e.target.value;
        console.log("[Origin selected]", place);
        setOrigin(place?.formattedAddress || "");
      });

      destEl.addEventListener("gmpx-placechange", (e) => {
        const place = e.target.value;
        console.log("[Destination selected]", place);
        setDestination(place?.formattedAddress || "");
      });

      // Attach to container refs
      if (originHostRef.current) originHostRef.current.appendChild(originEl);
      if (destHostRef.current) destHostRef.current.appendChild(destEl);
    } catch (err) {
      console.error("[Maps] initAutocomplete failed:", err);
    }
  };

  // Load the Google Maps script once, verify key works
  useEffect(() => {
    if (window.__mapsInitialized) {
      console.log("[Maps] Already loaded, skipping reload");
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("[Maps] Missing API key! Check your .env file");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("[Maps] Script loaded successfully");
      window.__mapsInitialized = true;
      initAutocomplete();
    };

    script.onerror = () => {
      console.error("[Maps] Failed to load Maps JS API. Check API key restrictions.");
    };

    document.head.appendChild(script);
  }, []);

  // Backend route calculation
  const calculateRoute = async () => {
    if (!origin || !destination) {
      alert("Enter both origin and destination!");
      return;
    }

    setLoading(true);
    try {
      console.log("[Route] Requesting route for:", origin, "→", destination);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/calculate-route`, {
        origin,
        destination,
        mode,
      });

      const data = res.data;
      if (data.error) {
        alert("Backend error: " + data.error);
        console.error("[Route] Error:", data.details);
      }

      setRouteData(data);
      if (data.polyline) {
        const decoded = polyline.decode(data.polyline);
        setRouteCoords(decoded.map(([lat, lng]) => ({ lat, lng })));
      }
    } catch (err) {
      console.error("[Route] Connection error:", err);
      alert("Could not reach backend.");
    }
    setLoading(false);
  };

  // Auto-fit bounds for the route
  function FitBounds({ routeCoords }) {
    const map = useMap();
    useEffect(() => {
      if (routeCoords.length > 0) {
        const bounds = routeCoords.map((c) => [c.lat, c.lng]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [routeCoords, map]);
    return null;
  }

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      {/* Controls */}
      <div
        id="map-controls"
        style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "white",
          padding: "12px",
          borderRadius: "10px",
          zIndex: 1000,
          display: "flex",
          gap: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        }}
      >
        <div ref={originHostRef} style={{ width: 260, height: 40 }} />
        <div ref={destHostRef} style={{ width: 260, height: 40 }} />

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{
            padding: "6px 8px",
            backgroundColor: "#36454F",
            color: "#fff",
            border: "2px solid #007bff",
            borderRadius: "8px",
          }}
        >
          <option value="driving"> Driving</option>
          <option value="walking"> Walking</option>
          <option value="bicycling"> Bicycling</option>
          <option value="transit"> Transit</option>
        </select>

        <button onClick={calculateRoute} style={{ padding: "6px 10px" }}>
          {loading ? "Loading..." : "Calculate"}
        </button>
      </div>

      {/* Map display */}
      {position && (
        <MapContainer center={position} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={position}>
            <Popup>Your current location</Popup>
          </Marker>
          {routeCoords.length > 0 && (
            <>
              <Polyline positions={routeCoords} color="blue" weight={5} />
              <FitBounds routeCoords={routeCoords} />
            </>
          )}
        </MapContainer>
      )}

      {/* Route summary */}
      {routeData && (
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#36454F",
            color: "#fff",
            padding: "20px 25px",
            borderRadius: "12px",
            zIndex: 1000,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.6)",
            textAlign: "center",
            border: "1px solid #007bff",
          }}
        >
          <h4 style={{ color: "#007bff" }}>Result</h4>
          <p>Distance: <b style={{ color: "#ff0000" }}>{routeData.distance}</b></p>
          <p>Duration: <b style={{ color: "#ff0000" }}>{routeData.duration}</b></p>
          <button
            onClick={() => navigate("/savings", { state: { distance: routeData.distance } })}
            style={{
              marginTop: "12px",
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
            }}
          >
            View CO₂ Savings
          </button>
        </div>
      )}
    </div>
  );
};

export default MapPage;
