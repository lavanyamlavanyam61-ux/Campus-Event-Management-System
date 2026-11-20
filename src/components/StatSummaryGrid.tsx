export interface StatCardItem {
  label: string;
  value: string | number;
  detail: string;
}

interface StatSummaryGridProps {
  items: StatCardItem[];
}

export function StatSummaryGrid({ items }: StatSummaryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
        >
          <div className="text-xs font-medium text-slate-500">{item.label}</div>
          <div className="font-display text-2xl font-semibold text-slate-900 tabular-nums mt-2">
            {item.value}
          </div>
          <div className="text-xs text-slate-500 mt-2">{item.detail}</div>
        </div>
      ))}
    </div>
  );
}
