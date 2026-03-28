import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/survey', label: 'Survey' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tips', label: 'Tips' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-base-900/80 backdrop-blur-md border-b border-base-600">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold text-gradient">
            Burnout Map
          </Link>

          {/* Desktop links */}
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

          <div className="flex items-center gap-2">
            <Link to="/survey" className="btn-primary py-2 px-5 text-sm hidden md:inline-flex">
              Take Survey
            </Link>
            {/* Burger button */}
            <button
              onClick={() => setOpen(o => !o)}
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-lg hover:bg-base-700 transition-colors"
              aria-label="Toggle menu"
            >
              <motion.span
                animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="block w-5 h-0.5 bg-text-primary rounded-full origin-center"
              />
              <motion.span
                animate={open ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="block w-5 h-0.5 bg-text-primary rounded-full"
              />
              <motion.span
                animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="block w-5 h-0.5 bg-text-primary rounded-full origin-center"
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 right-0 bottom-0 z-40 w-64 bg-base-900 border-l border-base-600 flex flex-col pt-20 pb-8 px-4 md:hidden"
            >
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-colors duration-200
                      ${pathname === link.to
                        ? 'text-accent bg-accent-light'
                        : 'text-text-secondary hover:text-text-primary hover:bg-base-700'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="mt-auto">
                <Link to="/survey" onClick={() => setOpen(false)} className="btn-primary w-full py-3 text-center block">
                  Take Survey
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
