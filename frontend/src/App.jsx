import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Navbar from './components/Navbar'
import MapPage from './pages/MapPage'
import SavingsPage from './pages/SavingsPage'
import './App.css'

function App() {
  return (
    <Router>
       <nav
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
          padding: "15px",
          backgroundColor: "#4CAF50",
          color: "white",
          fontWeight: "bold",
        }}>
          <Link to="/" style={{color:"white", textDecoration: "none" }}>
          Map
          </Link>
          <Link to="/savings" style={{ color: "white", textDecoration: "none" }}>
          CO₂ Tracker
          </Link>
      </nav>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/savings" element={<SavingsPage />} />
      </Routes>
    </Router>
  )
}

export default App
