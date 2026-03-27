import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/survey', label: 'Survey' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tips', label: 'Tips' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-base-900/80 backdrop-blur-md border-b border-base-600">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-bold text-gradient">
          Burnout Map
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${pathname === link.to
                  ? 'text-accent bg-accent-light'
                  : 'text-text-secondary hover:text-text-primary hover:bg-base-700'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <Link to="/survey" className="btn-primary py-2 px-5 text-sm">
          Take Survey
        </Link>
      </div>
    </nav>
  );
}
