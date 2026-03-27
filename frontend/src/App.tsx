import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Survey from './pages/Survey';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import Tips from './pages/Tips';
import About from './pages/About';
import Admin from './pages/Admin';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout><Landing /></Layout>} />
        <Route path="/survey" element={<Layout><Survey /></Layout>} />
        <Route path="/results/:id" element={<Layout><Results /></Layout>} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/tips" element={<Layout><Tips /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={
          <Layout>
            <div className="flex items-center justify-center min-h-[60vh] text-center">
              <div>
                <p className="font-display text-6xl font-bold text-accent mb-4">404</p>
                <p className="text-text-secondary">Page not found</p>
              </div>
            </div>
          </Layout>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
