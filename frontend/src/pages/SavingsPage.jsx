import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const SavingsPage = () => {
  const location = useLocation();
  const passedDistance = location.state?.distance || "";

  const [distance, setDistance] = useState(passedDistance);
  const [mode, setMode] = useState("driving");
  const [results, setResults] = useState([]);

  // CO2 emissions in grams per km (avg across modes)
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

    const chosenCO2 = km * emissionRates[mode];

    const newResults = Object.entries(emissionRates)
      .filter(([m]) => m !== mode) //Exclude users mode of transport
      .map(([m, rate]) => {
        const diff = chosenCO2 - km * rate
        const saved = diff > 0 ? diff : 0; // no negatives
        return {mode :m, saved};
      })
    setResults(newResults);
  };

  // Automatically calculate when distance comes from MapPage
  useEffect(() => {
    if (passedDistance) {
      calculateSavings(passedDistance);
    }
  }, [passedDistance, mode]);

  return (
    <div style={{ padding: "30px", textAlign: "center" }}>
      <h2>CO₂ Savings Comparison</h2>

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
        <option value="driving">Driving</option>
        <option value="transit">Public Transit</option>
        <option value="bicycling">Bicycling</option>
        <option value="walking">Walking</option>
      </select>

      <button
        onClick={() => calculateSavings(distance)}
        style={{ padding: "10px 20px" }}
      >
        Calculate
      </button>

      {results.length > 0 && ( // Replaced single saving with all comparisons
        <div style={{ marginTop: "20px" }}>
          <h3>CO₂ Waste Compared to Other Modes:</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {results.map((r) => (
              <li key={r.mode} style={{ marginBottom: "10px" }}>
                <b>{r.mode.charAt(0).toUpperCase() + r.mode.slice(1)}</b>:{" "}
                {r.saved.toFixed(0)} g wasted
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SavingsPage;
