interface Avatar {
  initials: string;
  color: string;
}

interface BusinessUnitCardProps {
  name: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  avatars: Avatar[];
}

export default function BusinessUnitCard({
  name,
  icon,
  iconBgColor,
  iconColor,
  avatars,
}: BusinessUnitCardProps) {
  return (
    <div className="bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${iconBgColor} flex items-center justify-center`}>
            <span className={`material-icons-outlined ${iconColor}`}>{icon}</span>
          </div>
          <span className="font-bold text-lg">{name}</span>
        </div>
        <button className="text-slate-400">
          <span className="material-icons-outlined text-xl">more_horiz</span>
        </button>
      </div>
      <div className="flex items-center">
        {avatars.map((avatar, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded-full ${avatar.color} flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800`}
            style={{ marginLeft: index > 0 ? '-0.5rem' : '0' }}
          >
            {avatar.initials}
          </div>
        ))}
      </div>
    </div>
  );
}
