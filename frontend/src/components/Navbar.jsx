import { Link } from "react-router-dom";
import "./Navbar.css"; 

const Navbar = () => {
  const navItems = [
    { name: "Map", path: "/" },
    { name: "CO₂ Savings", path: "/savings" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {navItems.map((item) => (
          <Link key={item.name} to={item.path} className="nav-link">
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
