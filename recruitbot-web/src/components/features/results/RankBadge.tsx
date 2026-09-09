interface RankBadgeProps {
  rank: number;
}

/**
 * RankBadge — #1/#2/#3 etc. Top 3 get a gradient fill, the rest muted.
 */
export function RankBadge({ rank }: RankBadgeProps) {
  const topThree = rank <= 3;
  return (
    <span
      className={[
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        topThree
          ? 'bg-gradient-to-br from-primary to-accent text-white'
          : 'bg-white/[0.08] text-text-muted',
      ].join(' ')}
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </span>
  );
}
