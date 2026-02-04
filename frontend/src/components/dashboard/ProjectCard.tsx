interface ProjectCardProps {
  name: string;
  department: string;
  client: string;
  daysLeft: number;
  budget: string;
  progress: number;
  avatars: { initials: string; color: string }[];
}

export default function ProjectCard({
  name,
  department,
  client,
  daysLeft,
  budget,
  progress,
  avatars,
}: ProjectCardProps) {
  const getDaysColor = () => {
    if (daysLeft <= 1) return 'bg-red-50 dark:bg-red-900/20 text-red-500';
    if (daysLeft <= 8) return 'bg-orange-50 dark:bg-orange-900/20 text-orange-500';
    return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
  };

  return (
    <div className="bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg">{name}</h3>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            {department} · {client}
          </p>
        </div>
        <button className="text-slate-400">
          <span className="material-icons-outlined text-xl">more_horiz</span>
        </button>
      </div>
      <div className="mt-4 mb-6">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 ${getDaysColor()} rounded-full text-xs font-medium`}
        >
          <span className="material-icons-outlined text-[14px]">schedule</span>
          {daysLeft} days left
        </span>
      </div>
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-xs font-bold">
          <span>Budget: {budget}</span>
          <span className="text-slate-400">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      {avatars.length > 0 && (
        <div className="flex items-center">
          {avatars.map((avatar, index) => (
            <div
              key={index}
              className={`w-8 h-8 rounded-full ${avatar.color} flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800 ${
                index > 0 ? '-ml-2' : ''
              }`}
            >
              {avatar.initials}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
