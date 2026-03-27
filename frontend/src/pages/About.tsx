import { motion } from 'framer-motion';
import ScrollReveal from '../components/ScrollReveal';

const SOURCES = [
  { author: 'Maslach, C., & Leiter, M. P.', year: 1997, title: 'The Truth About Burnout', pub: 'Jossey-Bass.' },
  { author: 'Walker, M.', year: 2017, title: 'Why We Sleep', pub: 'Scribner.' },
  { author: 'Ratey, J. J.', year: 2008, title: 'Spark: The Revolutionary New Science of Exercise and the Brain', pub: 'Little, Brown.' },
  { author: 'Holt-Lunstad, J. et al.', year: 2015, title: 'Loneliness and Social Isolation as Risk Factors for Mortality', pub: 'Perspectives on Psychological Science, 10(2), 227-237.' },
  { author: 'Chang, A. M. et al.', year: 2015, title: 'Evening use of light-emitting eReaders negatively affects sleep', pub: 'PNAS, 112(4), 1232-1237.' },
  { author: 'Pennebaker, J. W.', year: 1997, title: 'Writing about emotional experiences as a therapeutic process', pub: 'Psychological Science, 8(3), 162-166.' },
  { author: 'Hunt, M. G. et al.', year: 2018, title: 'No More FOMO: Limiting Social Media Decreases Loneliness and Depression', pub: 'Journal of Social and Clinical Psychology, 37(10).' },
];

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-5xl font-bold mb-2">About</h1>
        <p className="text-text-secondary mb-12">Research project at Tyumen State University</p>

        <div className="space-y-10">
          <ScrollReveal>
            <div className="card p-8">
              <h2 className="font-display text-2xl font-semibold mb-4">About the Project</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Burnout Map is an anonymous student wellbeing research initiative at UTMN. Our goal is to visualize the distribution and patterns of academic burnout across different institutes, year groups, and semester periods — and to give each student a personalized understanding of their own burnout risk.
              </p>
              <p className="text-text-secondary leading-relaxed">
                All data is collected anonymously. No personally identifiable information is stored. Survey responses are aggregated and displayed only as statistical summaries.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="card p-8">
              <h2 className="font-display text-2xl font-semibold mb-4">Methodology</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                The Burnout Score is calculated from 12 questions across four dimensions: Academic Load, Sleep & Energy, Emotional State, and Social & Lifestyle. Each answer is normalized to a 0-100 scale (0 = no burnout, 100 = maximum burnout). Category scores are averaged to produce the total score.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {[
                  { label: 'Academic Load', desc: 'Workload, perceived reward, overwhelm' },
                  { label: 'Sleep & Energy', desc: 'Sleep duration, fatigue, academic worry at night' },
                  { label: 'Emotional State', desc: 'Emotional exhaustion, cynicism, anxiety' },
                  { label: 'Social & Lifestyle', desc: 'Social sacrifice, hobbies, overall wellbeing' },
                ].map(d => (
                  <div key={d.label} className="bg-base-700 rounded-xl p-4">
                    <p className="font-medium text-accent text-sm mb-1">{d.label}</p>
                    <p className="text-text-muted text-sm">{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="card p-8">
              <h2 className="font-display text-2xl font-semibold mb-6">Sources</h2>
              <div className="space-y-4">
                {SOURCES.map((s, i) => (
                  <div key={i} className="border-l-2 border-accent/40 pl-4">
                    <p className="text-text-secondary text-sm">
                      <span className="text-text-primary font-medium">{s.author}</span> ({s.year}).{' '}
                      <em>{s.title}</em>. {s.pub}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </motion.div>
    </div>
  );
}
