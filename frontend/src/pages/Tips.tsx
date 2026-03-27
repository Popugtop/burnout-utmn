import { motion } from 'framer-motion';
import { useState } from 'react';
import { TIPS, Tip } from '../data/tips';
import TipCard from '../components/TipCard';
import ScrollReveal from '../components/ScrollReveal';

const CATEGORIES: Array<{ key: Tip['category'] | 'all'; label: string }> = [
  { key: 'all', label: 'All Tips' },
  { key: 'academic', label: 'Academic Load' },
  { key: 'sleep', label: 'Sleep & Energy' },
  { key: 'emotional', label: 'Emotional State' },
  { key: 'social', label: 'Social & Lifestyle' },
];

export default function Tips() {
  const [filter, setFilter] = useState<Tip['category'] | 'all'>('all');
  const filtered = filter === 'all' ? TIPS : TIPS.filter(t => t.category === filter);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-5xl font-bold mb-2">Tips & Resources</h1>
        <p className="text-text-secondary mb-10">Evidence-based strategies to reduce academic burnout</p>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${filter === cat.key
                  ? 'bg-accent text-white'
                  : 'bg-base-800 border border-base-600 text-text-secondary hover:border-accent/50'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tip, i) => (
            <ScrollReveal key={tip.id} delay={i * 0.05}>
              <TipCard tip={tip} />
            </ScrollReveal>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
