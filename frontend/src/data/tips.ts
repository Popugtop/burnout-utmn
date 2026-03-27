export interface Tip {
  id: string;
  category: 'academic' | 'sleep' | 'emotional' | 'social';
  title: string;
  body: string;
  source?: string;
}

export const TIPS: Tip[] = [
  {
    id: 't1', category: 'academic',
    title: 'Pomodoro Technique',
    body: 'Work in 25-minute focused sprints followed by a 5-minute break. After four sprints, take a longer 15-30 minute break. This prevents cognitive fatigue and maintains concentration.',
    source: 'Cirillo, F. (1992). The Pomodoro Technique.',
  },
  {
    id: 't2', category: 'academic',
    title: 'Eisenhower Matrix',
    body: 'Categorize tasks by urgency and importance. Focus on important-but-not-urgent tasks — they prevent crises and build long-term success. Say no to tasks that are neither important nor urgent.',
    source: 'Covey, S. R. (1989). The 7 Habits of Highly Effective People.',
  },
  {
    id: 't3', category: 'academic',
    title: 'Learn to Say No',
    body: 'Overcommitting is a leading cause of burnout. Practice politely declining extra assignments, clubs, or social invitations that exceed your current capacity.',
  },
  {
    id: 't4', category: 'sleep',
    title: 'Sleep Hygiene Basics',
    body: 'Keep a consistent sleep schedule — even on weekends. Avoid caffeine after 2 PM. Keep your bedroom cool and dark. These habits can improve sleep quality by up to 30%.',
    source: 'Walker, M. (2017). Why We Sleep. Scribner.',
  },
  {
    id: 't5', category: 'sleep',
    title: 'Screens Before Bed',
    body: 'Blue light from screens suppresses melatonin production by up to 50%. Stop using devices 30-60 minutes before bed, or use night mode / blue-light glasses.',
    source: 'Chang, A. M. et al. (2015). PNAS, 112(4), 1232-1237.',
  },
  {
    id: 't6', category: 'sleep',
    title: 'Strategic Napping',
    body: 'A 10-20 minute nap in the early afternoon can restore alertness and improve performance. Avoid naps longer than 30 minutes or after 3 PM to protect nighttime sleep.',
    source: 'Mednick, S. C. et al. (2003). Nature Neuroscience.',
  },
  {
    id: 't7', category: 'emotional',
    title: 'Journaling for Stress Relief',
    body: 'Writing about stressful events for 15-20 minutes per day reduces rumination and helps process emotions. It doesn\'t need structure — just let thoughts flow onto paper.',
    source: 'Pennebaker, J. W. (1997). Journal of Clinical Psychology.',
  },
  {
    id: 't8', category: 'emotional',
    title: '4-7-8 Breathing',
    body: 'Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. This activates the parasympathetic nervous system, reducing anxiety within minutes. Repeat 3-4 cycles.',
    source: 'Weil, A. (2015). Spontaneous Happiness. Little, Brown.',
  },
  {
    id: 't9', category: 'emotional',
    title: 'When to Seek Help',
    body: 'If burnout symptoms persist for more than two weeks — fatigue, apathy, anxiety, difficulty concentrating — consider speaking to a counselor or therapist. Seeking help is a sign of strength.',
  },
  {
    id: 't10', category: 'social',
    title: 'Schedule Social Time',
    body: 'Treat social activities like mandatory classes — put them in your calendar. Regular positive social interactions are one of the strongest predictors of wellbeing and academic resilience.',
    source: 'Holt-Lunstad, J. et al. (2015). Perspectives on Psychological Science.',
  },
  {
    id: 't11', category: 'social',
    title: 'Exercise as a Reset',
    body: 'Just 20-30 minutes of moderate aerobic exercise releases BDNF and endorphins, improving mood, focus, and stress resilience. It\'s more effective than many pharmaceutical interventions for mild anxiety.',
    source: 'Ratey, J. J. (2008). Spark. Little, Brown.',
  },
  {
    id: 't12', category: 'social',
    title: 'Digital Detox',
    body: 'Designate one hour per day as phone-free. Social media creates social comparison that amplifies burnout. Reducing passive scrolling is associated with significant improvements in mood.',
    source: 'Hunt, M. G. et al. (2018). Journal of Social and Clinical Psychology.',
  },
];
