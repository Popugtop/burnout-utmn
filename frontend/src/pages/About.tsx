import { motion } from 'framer-motion';
import ScrollReveal from '../components/ScrollReveal';
import { useApi } from '../hooks/useApi';

interface Section {
  section_key: string;
  title: string;
  body: string;
  meta_json: string | null;
}

interface Source {
  id: string;
  author: string;
  year: number;
  title: string;
  publication: string;
}

interface AboutData {
  sections: Section[];
  sources: Source[];
}

export default function About() {
  const { data, loading } = useApi<AboutData>('/api/content/about');

  const pageMeta = data?.sections.find(s => s.section_key === 'page_meta');
  const pageTitle = pageMeta?.title || 'About';
  const pageSubtitle = pageMeta?.body ? (() => { try { return JSON.parse(pageMeta.body).subtitle; } catch { return 'Research project at Tyumen State University'; } })() : 'Research project at Tyumen State University';

  const projectSection = data?.sections.find(s => s.section_key === 'project');
  const methodologySection = data?.sections.find(s => s.section_key === 'methodology');

  const dimensions: Array<{ label: string; desc: string }> = methodologySection?.meta_json
    ? (() => { try { return JSON.parse(methodologySection.meta_json).dimensions || []; } catch { return []; } })()
    : [];

  const sources = data?.sources || [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-5xl font-bold mb-2">{pageTitle}</h1>
        <p className="text-text-secondary mb-12">{pageSubtitle}</p>

        {loading && <div className="text-text-muted animate-pulse">Loading...</div>}

        {data && (
          <div className="space-y-10">
            {projectSection && (
              <ScrollReveal>
                <div className="card p-8">
                  <h2 className="font-display text-2xl font-semibold mb-4">{projectSection.title}</h2>
                  {projectSection.body.split('\n\n').map((para, i) => (
                    <p key={i} className="text-text-secondary leading-relaxed mb-4 last:mb-0">{para}</p>
                  ))}
                </div>
              </ScrollReveal>
            )}

            {methodologySection && (
              <ScrollReveal delay={0.1}>
                <div className="card p-8">
                  <h2 className="font-display text-2xl font-semibold mb-4">{methodologySection.title}</h2>
                  {methodologySection.body.split('\n\n').map((para, i) => (
                    <p key={i} className="text-text-secondary leading-relaxed mb-4">{para}</p>
                  ))}
                  {dimensions.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                      {dimensions.map(d => (
                        <div key={d.label} className="bg-base-700 rounded-xl p-4">
                          <p className="font-medium text-accent text-sm mb-1">{d.label}</p>
                          <p className="text-text-muted text-sm">{d.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            )}

            {sources.length > 0 && (
              <ScrollReveal delay={0.2}>
                <div className="card p-8">
                  <h2 className="font-display text-2xl font-semibold mb-6">Sources</h2>
                  <div className="space-y-4">
                    {sources.map((s) => (
                      <div key={s.id} className="border-l-2 border-accent/40 pl-4">
                        <p className="text-text-secondary text-sm">
                          <span className="text-text-primary font-medium">{s.author}</span>
                          {s.year ? ` (${s.year})` : ''}. <em>{s.title}</em>
                          {s.publication ? `. ${s.publication}` : '.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
