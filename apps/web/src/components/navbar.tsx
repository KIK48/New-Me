
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import '../styles/components/navbar.css' // change

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className='Nav focus-glow container' tabIndex={0}>

        <NavLink
          to="/"
          end
          className={({ isActive }) => `navItem letters ${isActive ? "active" : ""}`}
        >
          Home
        </NavLink>
        <NavLink
          to="/weekly"
          className={({ isActive }) => `navItem letters ${isActive ? "active" : ""}`}
        >
          Weekly
        </NavLink>
        <NavLink
          to="/weeklyT"
          className={({ isActive }) => `navItem letters ${isActive ? "active" : ""}`}
        >
          WeeklyT
        </NavLink>

        {/* Logout sits at the bottom of the nav via margin-top: auto in CSS */}
        <button className="navItem letters nav-logout" onClick={handleLogout}>
          Log out
        </button>

    </div>
  );
}

