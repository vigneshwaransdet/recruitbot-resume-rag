import { Sparkles, Type, Layers } from 'lucide-react';

/**
 * WelcomeMessage — intro content rendered inside a bot bubble on first load
 * (and after clearing the chat). Explains the three search modes.
 */
export function WelcomeMessage() {
  const modes = [
    { icon: Sparkles, name: 'Vector', desc: 'semantic similarity' },
    { icon: Type, name: 'BM25', desc: 'keyword matching' },
    { icon: Layers, name: 'Hybrid', desc: 'both combined' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-primary">
        👋 Hi, I&apos;m RecruitBot. Describe the candidate you&apos;re looking for and
        I&apos;ll search the resume database.
      </p>
      <ul className="space-y-1.5">
        {modes.map(({ icon: Icon, name, desc }) => (
          <li key={name} className="flex items-center gap-2 text-xs text-text-muted">
            <Icon size={14} className="text-primary" />
            <span className="font-medium text-text-primary">{name}</span> — {desc}
          </li>
        ))}
      </ul>
      <p className="text-xs text-text-muted">
        Pick a mode in the sidebar, then try one of the suggestions below.
      </p>
    </div>
  );
}
