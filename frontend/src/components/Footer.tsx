import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-base-600 bg-base-900 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-text-muted text-sm">
          A research project — UTMN, 2026
        </p>
        <div className="flex gap-6 text-sm">
          <Link to="/survey" className="text-text-secondary hover:text-accent transition-colors">Survey</Link>
          <Link to="/dashboard" className="text-text-secondary hover:text-accent transition-colors">Dashboard</Link>
          <Link to="/tips" className="text-text-secondary hover:text-accent transition-colors">Tips</Link>
          <Link to="/about" className="text-text-secondary hover:text-accent transition-colors">Sources</Link>
        </div>
      </div>
    </footer>
  );
}
