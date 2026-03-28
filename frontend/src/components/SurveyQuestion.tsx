import { motion } from 'framer-motion';
import { SurveyQuestion as SQ } from '../types';

interface Props {
  question: SQ;
  current: number;
  total: number;
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function SurveyQuestionUI({ question, current, total, value, onChange, onNext, onPrev }: Props) {
  const choices: string[] = question.choices_json ? JSON.parse(question.choices_json) : [];

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-text-muted text-sm mb-2">
          <span>Question {current} of {total}</span>
          <span>{Math.round((current / total) * 100)}%</span>
        </div>
        <div className="h-1 bg-base-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            animate={{ width: `${(current / total) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="font-display text-2xl font-semibold text-text-primary mb-8 leading-snug">
        {question.question_text}
      </h2>

      {/* Answers */}
      {question.question_type === 'scale_1_5' && (
        <div className="mb-8">
          <div className="flex gap-3 mb-3">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => onChange(String(n))}
                className={`flex-1 aspect-square rounded-xl border-2 flex items-center justify-center font-mono text-lg font-semibold transition-all duration-200
                  ${value === String(n)
                    ? 'border-accent bg-accent-light text-accent scale-105'
                    : 'border-base-600 bg-base-800 text-text-muted hover:border-accent/50 hover:text-text-primary'
                  }`}
              >
                {n}
              </button>
            ))}
          </div>
          {(question.scale_label_low || question.scale_label_high) && (
            <div className="flex justify-between text-xs text-text-muted px-1">
              <span>{question.scale_label_low}</span>
              <span>{question.scale_label_high}</span>
            </div>
          )}
        </div>
      )}

      {question.question_type === 'choice' && (
        <div className="space-y-3 mb-8">
          {choices.map(choice => (
            <button
              key={choice}
              onClick={() => onChange(choice)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left
                ${value === choice
                  ? 'border-accent bg-accent-light text-text-primary'
                  : 'border-base-600 bg-base-800 text-text-secondary hover:border-accent/50 hover:bg-base-700'
                }`}
            >
              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0
                ${value === choice ? 'border-accent bg-accent' : 'border-base-600'}`} />
              <span className="text-sm">{choice}</span>
            </button>
          ))}
        </div>
      )}

      {/* Nav */}
      <div className="flex justify-between">
        <button onClick={onPrev} disabled={current === 1}
          className="btn-secondary disabled:opacity-30">
          Back
        </button>
        <button onClick={onNext} disabled={!value}
          className="btn-primary disabled:opacity-40">
          {current === total ? 'Submit' : 'Next'}
        </button>
      </div>
    </motion.div>
  );
}
