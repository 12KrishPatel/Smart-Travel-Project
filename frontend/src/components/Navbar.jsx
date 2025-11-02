import { Link } from 'react-router-dom'

function Navbar() {
    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            padding: '15px',
            backgroundColor: '#1a1a1a',
            color: 'white'
        }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>🗺️ Map</Link>
            <Link to="/savings" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>🌱 CO₂ Tracker</Link>
        </nav>
    )
}

export default Navbar