import { recruitmentTargets } from '@/data/chelseaData';
import { AlertTriangle, ArrowUp, Minus } from 'lucide-react';

const priorityConfig = {
  critical: { icon: AlertTriangle, className: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  high: { icon: ArrowUp, className: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  medium: { icon: Minus, className: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
  low: { icon: Minus, className: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
};

const RecruitmentMatrix = () => {
  return (
    <div className="stat-gradient rounded-lg border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
        Recruitment Priority Matrix
      </h3>
      <div className="space-y-3">
        {recruitmentTargets.map((target, i) => {
          const config = priorityConfig[target.priority];
          const Icon = config.icon;
          return (
            <div
              key={target.position}
              className={`rounded-md border ${config.border} ${config.bg} p-4 animate-slide-up`}
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${config.className}`} />
                  <span className="font-semibold text-sm text-foreground">{target.position}</span>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${config.bg} ${config.className} border ${config.border}`}>
                    {target.priority}
                  </span>
                </div>
                <span className="text-xs font-mono text-chelsea-gold font-semibold">{target.estimatedCost}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{target.rationale}</p>
              <div className="bg-background/50 rounded px-3 py-2 mb-2">
                <p className="text-[11px] font-mono text-secondary-foreground">{target.kpiDeficit}</p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                <span className="text-accent font-medium">Profile: </span>
                {target.suggestedProfile}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecruitmentMatrix;
