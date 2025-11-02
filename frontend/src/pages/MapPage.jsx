import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { useState, useEffect } from "react";
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


  // Ask for user location once on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          console.log("User location:", latitude, longitude);
        },
        (error) => {
          console.warn("Location services denied or unavailable:", error.message);
          // fallback: Madison
          setPosition([43.0731, -89.4012]);
        }
      );
    } else {
      console.warn("Geolocation not supported by this browser.");
      setPosition([43.0731, -89.4012]);
    }
  }, []);

  // Call backend
  const calculateRoute = async () => {
    if (!origin || !destination) {
      alert("Please enter both origin and destination!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/calculate-route`,
        { origin, destination, mode }
      );

      setRouteData(response.data);

      if (response.data.polyline) {
        const decoded = polyline.decode(response.data.polyline);
        setRouteCoords(decoded.map(([lat, lng]) => ({ lat, lng })));
      } else {
        console.warn("No polyline returned for this route.");
        setRouteCoords([]);
      }

    } catch (error) {
      console.error("Error getting route:", error);
      alert("Could not connect to backend.");
    }
    setLoading(false);
  };

  function FitBounds({routeCoords}){
    const map = useMap();

    useEffect(() => {
        if(routeCoords.length > 0){
            const bounds = routeCoords.map((coord) => [coord.lat, coord.lng]);
            map.fitBounds(bounds, {padding: [50, 50]});
        }
    }, [routeCoords, map]);
    return null
  }

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      {/*Input controls*/}
      <div
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
        <input
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Origin"
          style={{ padding: "6px 8px" }}
        />
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Destination"
          style={{ padding: "6px 8px" }}
        />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{ padding: "6px 8px" }}
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

      {/* Map renders only after position is set */}
      {position && (
        <MapContainer center={position} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={position}>
            <Popup>Your current location 🌍</Popup>
          </Marker>
            {routeCoords.length > 0 && (
                <>
                <Polyline positions={routeCoords} color="blue" weight={5}/>
                <FitBounds routeCoords={routeCoords} />
                </>

            )}

        </MapContainer>
      )}

      {/* Backend response */}
      {routeData && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "white",
            padding: "15px",
            borderRadius: "10px",
            zIndex: 1000,
            boxShadow: "0px 2px 10px rgba(0,0,0,0.2)",
            textAlign: "center"
          }}
        >
        <h4>Result:</h4>
        <p>
            Distance: <b>{routeData.distance}</b><br />
            Duration: <b>{routeData.duration}</b>
        </p>
        <button 
            onClick={() =>
                navigate("/savings", { state: {distance: routeData.distance}})
            }
            style={{
                marginTop: "10px",
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
            }}
        >
            View Co2 Savings 
        </button>
        </div>
      )}
    </div>
  );
};

export default MapPage;
