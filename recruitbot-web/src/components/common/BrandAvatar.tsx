import { StatusDot } from './StatusDot';

/**
 * BrandAvatar — RecruitBot gradient avatar + name + online status.
 */
export function BrandAvatar() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
        RB
      </span>
      <div>
        <p className="text-sm font-semibold text-text-primary">RecruitBot</p>
        <p className="flex items-center gap-1.5 text-xs text-text-muted">
          <StatusDot />
          Online
        </p>
      </div>
    </div>
  );
}
