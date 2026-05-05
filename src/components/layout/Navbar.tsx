import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const sectionLinks = [
    { href: '#problem', label: 'Problem' },
    { href: '#features', label: 'Platform' },
    { href: '#how', label: 'Workflow' },
    { href: '#demo', label: 'Live Demo' },
    { href: '#metrics', label: 'Impact' },
    { href: '#cta', label: 'Get Started' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="nav" id="navbar">
      <Link to="/" className="nav-logo">
        <div className="nav-mark">GS</div>
        <span className="nav-name">Grid<span>Sense</span> AI</span>
      </Link>
      <ul className="nav-links">
        {sectionLinks.map((item) => (
          <li key={item.href}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>
      <div className="nav-end">
        {token ? (
          <>
            <Link to="/dashboard" className="btn btn-outline btn-sm" id="nav-dashboard">
              Dashboard
            </Link>
            <button
              onClick={() => { void handleLogout(); }}
              className="btn btn-green btn-sm"
              id="nav-logout"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login?mode=login" className="btn btn-outline btn-sm" id="nav-login">
              Login
            </Link>
            <Link to="/login?mode=signup" className="btn btn-green btn-sm" id="nav-signup">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
