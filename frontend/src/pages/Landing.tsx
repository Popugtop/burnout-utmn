import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import AnimatedCounter from '../components/AnimatedCounter';
import ScrollReveal from '../components/ScrollReveal';

const HOW_IT_WORKS = [
  { icon: '📋', step: '01', title: 'Take the Survey', desc: 'Answer 12 anonymous questions about your academic life, sleep, and emotional state.' },
  { icon: '📊', step: '02', title: 'Get Your Score', desc: 'Receive a personal Burnout Score with interpretation and actionable tips.' },
  { icon: '🗺️', step: '03', title: 'See the Map', desc: 'Explore aggregated data across courses, departments, and time periods.' },
];

const STATS = [
  { value: 64, suffix: '%', label: 'of students report symptoms of academic burnout' },
  { value: 12, suffix: '%', label: 'only seek help or talk about it' },
  { value: 3, suffix: 'x', label: 'higher dropout risk for students with severe burnout' },
];

export default function Landing() {
  const { data } = useApi<{ count: number }>('/api/stats/count');

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-6">
        {/* Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            className="w-[600px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(213,91,52,0.12) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative z-10 text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-6xl md:text-8xl font-bold mb-6 text-gradient leading-none">
              Burnout Map
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-text-secondary text-xl md:text-2xl mb-8 leading-relaxed max-w-2xl mx-auto"
          >
            Anonymous burnout research across UTMN. Take the survey. See the data. Help yourself and others.
          </motion.p>

          {data && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-text-muted text-sm mb-10 font-mono"
            >
              <AnimatedCounter target={data.count} className="text-accent font-bold text-lg" /> students surveyed
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/survey" className="btn-primary text-lg px-10 py-4">
              Take the Survey
            </Link>
            <Link to="/dashboard" className="btn-secondary text-lg px-10 py-4">
              View Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <ScrollReveal>
          <h2 className="font-display text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-text-secondary text-center mb-16">Three simple steps to understand your burnout level</p>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((item, i) => (
            <ScrollReveal key={item.step} delay={i * 0.1}>
              <motion.div
                className="card p-8 hover:border-accent/30 transition-all duration-300 cursor-default"
                whileHover={{ y: -4, boxShadow: '0 0 30px rgba(213,91,52,0.1)' }}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-accent font-mono text-sm mb-2">{item.step}</div>
                <h3 className="font-display text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Why This Matters */}
      <section className="bg-base-800 border-y border-base-600">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <ScrollReveal>
            <h2 className="font-display text-4xl font-bold text-center mb-16">Why This Matters</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {STATS.map((stat, i) => (
              <ScrollReveal key={i} delay={i * 0.15}>
                <div className="text-center">
                  <p className="font-display text-6xl font-bold text-accent mb-3">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-text-secondary leading-relaxed">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <ScrollReveal>
          <h2 className="font-display text-3xl font-bold mb-4">Ready to find out where you stand?</h2>
          <p className="text-text-secondary mb-8">The survey takes about 3 minutes. No account needed. Fully anonymous.</p>
          <Link to="/survey" className="btn-primary text-lg px-12 py-4">
            Start the Survey
          </Link>
        </ScrollReveal>
      </section>
    </div>
  );
}
