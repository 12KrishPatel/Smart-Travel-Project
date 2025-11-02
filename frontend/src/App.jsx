import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";  // <-- Import the navbar
import MapPage from "./pages/MapPage";
import SavingsPage from "./pages/SavingsPage";
import "./App.css";

function App() {
  return (
    <Router>
      {/* Navbar shows on every page */}
      <Navbar />

      {/* Main content switches between pages */}
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/savings" element={<SavingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
