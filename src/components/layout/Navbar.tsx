export default function Navbar() {
  return (
    <nav className="nav" id="navbar">
      <a className="nav-logo" href="#" id="nav-home">
        <div className="nav-mark">GS</div>
        <span className="nav-name">Grid<span>Sense</span> AI</span>
      </a>
      <ul className="nav-links">
        <li><a href="#demo"     id="nav-demo">Live Demo</a></li>
        <li><a href="#problem"  id="nav-problem">Platform</a></li>
        <li><a href="#metrics"  id="nav-metrics">Metrics</a></li>
        <li><a href="#roi"      id="nav-roi">ROI</a></li>
        <li><a href="#usecases" id="nav-cases">Use Cases</a></li>
      </ul>
      <div className="nav-end">
        <a className="btn btn-outline btn-sm" href="#how" id="nav-how">How It Works</a>
        <a className="btn btn-green  btn-sm" href="#cta" id="nav-cta">Request Demo</a>
      </div>
    </nav>
  )
}
