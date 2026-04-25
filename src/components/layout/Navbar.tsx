import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { token, logout, email } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="nav" id="navbar">
      <Link to="/" className="nav-logo">
        <div className="nav-mark">GS</div>
        <span className="nav-name">Grid<span>Sense</span> AI</span>
      </Link>
      {token ? (
        <>
          <ul className="nav-links">
            <li><Link to="/dashboard" id="nav-demo">Dashboard</Link></li>
            <li><span id="nav-user" className="text-white/70">{email}</span></li>
          </ul>
          <div className="nav-end">
            <button
              onClick={handleLogout}
              className="btn btn-green btn-sm"
              id="nav-logout"
            >
              Logout
            </button>
          </div>
        </>
      ) : (
        <>
          <ul className="nav-links">
            <li><a href="#demo" id="nav-demo">Live Demo</a></li>
            <li><a href="#problem" id="nav-problem">Platform</a></li>
            <li><a href="#metrics" id="nav-metrics">Metrics</a></li>
            <li><a href="#roi" id="nav-roi">ROI</a></li>
            <li><a href="#usecases" id="nav-cases">Use Cases</a></li>
          </ul>
          <div className="nav-end">
            <Link to="/login?mode=login" className="btn btn-outline btn-sm" id="nav-login">
              Login
            </Link>
            <Link to="/login?mode=signup" className="btn btn-green btn-sm" id="nav-signup">
              Sign Up
            </Link>
          </div>
        </>
      )}
    </nav>
  );
}
