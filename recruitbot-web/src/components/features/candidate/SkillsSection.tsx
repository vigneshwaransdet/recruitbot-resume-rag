interface SkillsSectionProps {
  skills?: string[];
}

/**
 * SkillsSection — flex-wrap cloud of skill chips. Hidden if empty.
 */
export function SkillsSection({ skills }: SkillsSectionProps) {
  if (!skills || skills.length === 0) return null;

  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-text-muted">
        Skills
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <span
            key={skill}
            className="rounded bg-indigo-500/10 px-2 py-1 text-xs text-indigo-300"
          >
            {skill}
          </span>
        ))}
      </div>
    </section>
  );
}
