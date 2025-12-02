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
  const originValueRef = useRef("");
  const destValueRef = useRef("");
  const originAutocompleteRef = useRef(null);
  const destAutocompleteRef = useRef(null);

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
    // Check if refs are available
    if (!originHostRef.current || !destHostRef.current) {
      console.log("[Maps] Refs not ready yet");
      return;
    }
  
    console.log("[Maps] Initializing autocomplete…");
  
    try {
      const { Autocomplete } = await google.maps.importLibrary("places");
      
      // Create regular input elements
      const originInput = document.createElement('input');
      originInput.type = 'text';
      originInput.placeholder = 'Enter origin';
      originInput.style.cssText = 'width: 100%; height: 100%; padding: 8px; border: 1px solid #ccc; borderRadius: 4px; boxSizing: border-box;';
      
      const destInput = document.createElement('input');
      destInput.type = 'text';
      destInput.placeholder = 'Enter destination';
      destInput.style.cssText = 'width: 100%; height: 100%; padding: 8px; border: 1px solid #ccc; borderRadius: 4px; boxSizing: border-box;';
      
      // Clear and add inputs
      originHostRef.current.innerHTML = "";
      originHostRef.current.appendChild(originInput);
      destHostRef.current.innerHTML = "";
      destHostRef.current.appendChild(destInput);
      
      // Create autocomplete instances
      const originAutocomplete = new Autocomplete(originInput);
      const destAutocomplete = new Autocomplete(destInput);
      
      // Store references for cleanup
      originAutocompleteRef.current = originAutocomplete;
      destAutocompleteRef.current = destAutocomplete;
      
      // Listen for place selection
      originAutocomplete.addListener('place_changed', () => {
        const place = originAutocomplete.getPlace();
        console.log("✓ Origin place selected:", place);
        if (place.formatted_address) {
          originValueRef.current = place.formatted_address;
          setOrigin(place.formatted_address);
          console.log("✓ Origin stored:", place.formatted_address);
        }
      });
      
      destAutocomplete.addListener('place_changed', () => {
        const place = destAutocomplete.getPlace();
        console.log("✓ Dest place selected:", place);
        if (place.formatted_address) {
          destValueRef.current = place.formatted_address;
          setDestination(place.formatted_address);
          console.log("✓ Dest stored:", place.formatted_address);
        }
      });
      
      console.log("Classic autocomplete setup complete");
    } catch (err) {
      console.error("[Maps] initAutocomplete failed:", err);
    }
  };

  // Load the Google Maps script and initialize autocomplete
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("[Maps] Missing API key! Check .env file");
      return;
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    
    const initializeAutocomplete = async () => {
      // Wait a bit for refs to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (window.google?.maps?.places) {
        initAutocomplete();
      } else {
        console.log("[Maps] Google Maps API not ready yet");
      }
    };
    
    if (existingScript) {
      console.log("[Maps] Script already in DOM");
      // Script exists, check if API is ready
      if (window.google?.maps?.places) {
        initializeAutocomplete();
      } else {
        // Wait for the script to finish loading
        const checkInterval = setInterval(() => {
          if (window.google?.maps?.places) {
            clearInterval(checkInterval);
            initializeAutocomplete();
          }
        }, 100);
        
        // Cleanup interval after 5 seconds if still not loaded
        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    } else {
      // Script doesn't exist, create it
      if (window.__mapsLoading) {
        console.log("[Maps] Already loading — waiting");
        return;
      }

      window.__mapsLoading = true;
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("[Maps] Script loaded successfully");
        window.__mapsInitialized = true;
        window.__mapsLoading = false;
        initializeAutocomplete();
      };
      script.onerror = () => {
        console.error("[Maps] Script failed to load");
        window.__mapsLoading = false;
      };
      document.head.appendChild(script);
    }

    // Cleanup function - clear autocomplete refs when component unmounts
    return () => {
      originAutocompleteRef.current = null;
      destAutocompleteRef.current = null;
    };
  }, []);


  // Backend route calc
  const calculateRoute = async () => {
    // Use the ref values that were set by the autocomplete listeners
    const originValue = originValueRef.current || origin;
    const destValue = destValueRef.current || destination;

    // Input validation
    if (!originValue || !destValue) {
      alert("Please select both origin and destination from the autocomplete!");
      return;
    }

    if (originValue.trim().length === 0 || destValue.trim().length === 0) {
      alert("Origin and destination cannot be empty!");
      return;
    }

    if (originValue.length > 500 || destValue.length > 500) {
      alert("Location string is too long. Please use a shorter address.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/calculate-route`,
        {
          origin: originValue,
          destination: destValue,
          mode,
        },
        {
          timeout: 15000, // 15 second timeout
        }
      );

      const data = res.data;
      setRouteData(data);

      if (data.polyline) {
        const decoded = polyline.decode(data.polyline);
        setRouteCoords(decoded.map(([lat, lng]) => ({ lat, lng })));
      }
    } catch (err) {
      console.error("[Route] Error:", err);

      // Handle different error types
      if (err.response) {
        // Backend returned an error response
        const errorMsg = err.response.data?.detail || "Failed to calculate route";
        alert(`Error: ${errorMsg}`);
      } else if (err.request) {
        // Request was made but no response received
        alert("Could not reach backend server. Please make sure it's running on " + import.meta.env.VITE_API_URL);
      } else if (err.code === 'ECONNABORTED') {
        // Request timeout
        alert("Request timed out. Please try again.");
      } else {
        // Something else happened
        alert("An unexpected error occurred: " + err.message);
      }
    } finally {
      setLoading(false);
    }
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
          <option value="driving">🚗 Driving</option>
          <option value="walking">🚶 Walking</option>
          <option value="bicycling">🚴 Bicycling</option>
          <option value="transit">🚌 Transit</option>
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
