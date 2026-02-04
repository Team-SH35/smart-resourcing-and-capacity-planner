interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function SearchBar({ value = '', onChange }: SearchBarProps) {
  return (
    <div className="relative mb-10">
      <span className="material-icons-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full pl-14 pr-6 py-4 rounded-full border-none bg-card-light dark:bg-card-dark shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary outline-none text-lg transition-all"
        placeholder="Search for team, project, client, business department ..."
      />
    </div>
  );
}
