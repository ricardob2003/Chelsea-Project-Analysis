import { ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type Season, transfersBySeason } from '@/data/transferData';

interface TransferActivityProps {
  season: Season;
}

const TransferActivity = ({ season }: TransferActivityProps) => {
  const data = transfersBySeason.find(s => s.season === season);
  if (!data) return null;

  const ins = data.transfers.filter(t => t.type === 'in');
  const outs = data.transfers.filter(t => t.type === 'out');

  return (
    <div className="stat-gradient rounded-lg border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Receipt className="w-4 h-4 text-chelsea-gold" />
          Transfer Activity — {season}
        </h3>
        <div className="flex gap-3">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase">Spent</p>
            <p className="text-sm font-mono font-bold text-destructive">£{data.totalSpent}M</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase">Received</p>
            <p className="text-sm font-mono font-bold text-chelsea-gold">£{data.totalReceived}M</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase">Net</p>
            <p className={`text-sm font-mono font-bold ${data.totalSpent - data.totalReceived > 0 ? 'text-destructive' : 'text-chelsea-gold'}`}>
              {data.totalSpent - data.totalReceived > 0 ? '-' : '+'}£{Math.abs(data.totalSpent - data.totalReceived)}M
            </p>
          </div>
        </div>
      </div>

      {/* Arrivals */}
      {ins.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft className="w-3.5 h-3.5 text-chelsea-gold" />
            <span className="text-xs font-semibold text-chelsea-gold uppercase tracking-wider">Arrivals ({ins.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ins.map((t) => (
              <div key={t.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <img
                  src={t.imageUrl}
                  alt={t.name}
                  className="w-9 h-9 rounded-full border-2 border-chelsea-blue/40 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">from {t.from}</p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-chelsea-blue/10 text-chelsea-blue border-chelsea-blue/20 shrink-0">
                  {t.position}
                </Badge>
                <span className="text-xs font-mono font-semibold text-foreground shrink-0">{t.fee}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Departures */}
      {outs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs font-semibold text-destructive uppercase tracking-wider">Departures ({outs.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {outs.map((t) => (
              <div key={t.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <img
                  src={t.imageUrl}
                  alt={t.name}
                  className="w-9 h-9 rounded-full border-2 border-destructive/40 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">to {t.to}</p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 shrink-0">
                  {t.position}
                </Badge>
                <span className="text-xs font-mono font-semibold text-foreground shrink-0">{t.fee}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferActivity;
