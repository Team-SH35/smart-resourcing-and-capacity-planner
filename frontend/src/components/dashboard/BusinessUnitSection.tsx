import BusinessUnitCard from './BusinessUnitCard';
import AddUnitCard from './AddUnitCard';

interface BusinessUnit {
  name: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  avatars: { initials: string; color: string }[];
}

const businessUnits: BusinessUnit[] = [
  {
    name: 'Developers',
    icon: 'category',
    iconBgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
    iconColor: 'text-indigo-500',
    avatars: [
      { initials: 'KA', color: 'bg-amber-400' },
      { initials: 'RR', color: 'bg-purple-500' },
      { initials: 'EL', color: 'bg-green-500' },
      { initials: '+3', color: 'bg-slate-100 dark:bg-slate-700 text-slate-400' },
    ],
  },
  {
    name: 'Analytics',
    icon: 'analytics',
    iconBgColor: 'bg-pink-50 dark:bg-pink-900/30',
    iconColor: 'text-pink-500',
    avatars: [
      { initials: 'AF', color: 'bg-sky-400' },
      { initials: 'KA', color: 'bg-amber-400' },
    ],
  },
];

export default function BusinessUnitSection() {
  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Business Unit</h2>
        <button className="text-slate-400 hover:text-slate-600">
          <span className="material-icons-outlined">more_horiz</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {businessUnits.map((unit, index) => (
          <BusinessUnitCard key={index} {...unit} />
        ))}
        <AddUnitCard />
      </div>
    </section>
  );
}
