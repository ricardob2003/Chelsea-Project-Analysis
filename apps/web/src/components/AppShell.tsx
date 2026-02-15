import { Link, Outlet } from "react-router-dom";

export function AppShell() {
  return (
    <main className="app-shell">
      <h1>Chelsea Recruitment Analytics</h1>
      <nav className="nav">
        <Link to="/benchmark">Chelsea vs Benchmark</Link>
        <Link to="/pitch-weakness">Pitch Weakness Map</Link>
        <Link to="/recruitment-board">Recruitment Priority Board</Link>
        <Link to="/u22-fit">U-22 Fit Filter</Link>
      </nav>
      <Outlet />
    </main>
  );
}
