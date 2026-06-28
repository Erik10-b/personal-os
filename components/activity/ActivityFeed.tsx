import { ActivityEntry } from "@/lib/services/activity";
import { EmptyState } from "@/components/ui/Card";

export function ActivityFeed({ items }: { items: ActivityEntry[] }) {
  if (items.length === 0) {
    return <EmptyState>Noch keine Aktivität.</EmptyState>;
  }

  return (
    <div className="activity-feed">
      {items.map((item) => (
        <div key={item.id} className="activity-item">
          <div className={`activity-bullet ${item.bullet}`} />
          <div className="activity-content">
            <div className="activity-title">{item.title}</div>
            <div className="activity-meta">
              <span>{item.meta}</span>
            </div>
          </div>
          {item.amount && (
            <div className={`activity-amount ${item.amountTone ?? "neutral"}`}>{item.amount}</div>
          )}
        </div>
      ))}
    </div>
  );
}
