import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const SavingsPage = () => {
  const location = useLocation();
  const passedDistance = location.state?.distance || "";

  const [distance, setDistance] = useState(passedDistance);
  const [mode, setMode] = useState("driving");
  const [savedCO2, setSavedCO2] = useState(null);

  // CO2 emissions in grams per km
  const emissionRates = {
    driving: 192,
    transit: 105,
    bicycling: 0,
    walking: 0,
  };

  const convertMilesToKm = (milesString) => {
    // Extract numeric part from something
    const miles = parseFloat(milesString);
    return isNaN(miles) ? 0 : miles * 1.60934;
  };

  const calculateSavings = (dist = distance) => {
    const km = convertMilesToKm(dist);
    if (isNaN(km) || km <= 0) return;

    const carCO2 = km * emissionRates.driving;
    const chosenCO2 = km * emissionRates[mode];
    const saved = carCO2 - chosenCO2;
    setSavedCO2(saved);
  };

  // Automatically calculate when distance comes from MapPage
  useEffect(() => {
    if (passedDistance) {
      calculateSavings(passedDistance);
    }
  }, [passedDistance, mode]);

  return (
    <div style={{ padding: "30px", textAlign: "center" }}>
      <h2>🌿 CO₂ Savings Tracker</h2>

      <input
        type="text"
        placeholder="Distance (km)"
        value={distance}
        onChange={(e) => setDistance(e.target.value)}
        style={{ padding: "10px", margin: "10px", width: "200px" }}
      />

      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        style={{ padding: "10px", margin: "10px" }}
      >
        <option value="driving">🚗 Driving</option>
        <option value="transit">🚌 Transit</option>
        <option value="bicycling">🚴 Bicycling</option>
        <option value="walking">🚶 Walking</option>
      </select>

      {savedCO2 !== null && (
        <div style={{ marginTop: "20px" }}>
          <h3>
            You saved <b>{savedCO2.toFixed(0)} g CO₂</b> compared to driving!
          </h3>
        </div>
      )}
    </div>
  );
};

export default SavingsPage;
