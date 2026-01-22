
import { NavLink } from 'react-router-dom';
import '../styles/components/navbar.css' // change

export default function Navbar() {
  

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
  
    </div>
  );
}

