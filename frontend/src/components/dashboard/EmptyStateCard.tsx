export default function EmptyStateCard() {
  return (
    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-slate-400">
      <span className="material-icons-outlined text-3xl mb-2">
        inventory_2
      </span>
      <p className="font-semibold">No data available</p>
      <p className="text-sm">
        Upload a resource plan in settings to get started
      </p>
    </div>
  );
}