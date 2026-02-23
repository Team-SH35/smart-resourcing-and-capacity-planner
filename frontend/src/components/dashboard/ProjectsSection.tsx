import ProjectCard from './ProjectCard';
import AddUnitCard from './AddUnitCard';

interface Project {
  name: string;
  department: string;
  client: string;
  daysLeft: number;
  budget: string;
  progress: number;
  avatars: { initials: string; color: string }[];
}

const projects: Project[] = [
  {
    name: 'Project A',
    department: 'Developers',
    client: 'Client Name',
    daysLeft: 30,
    budget: '£1',
    progress: 85,
    avatars: [
      { initials: 'KA', color: 'bg-amber-400' },
      { initials: 'RR', color: 'bg-purple-500' },
      { initials: '+3', color: 'bg-slate-100 dark:bg-slate-700 text-slate-400' },
    ],
  },
  {
    name: 'Marketing Push',
    department: 'Analytics',
    client: 'Client Name',
    daysLeft: 1,
    budget: '£1',
    progress: 75,
    avatars: [{ initials: 'RR', color: 'bg-purple-500' }],
  },
  {
    name: 'System Audit',
    department: 'Developers',
    client: 'Client Name',
    daysLeft: 8,
    budget: '£1',
    progress: 65,
    avatars: [{ initials: 'T', color: 'bg-pink-400' }],
  },
  {
    name: 'API Integrations',
    department: 'Analytics',
    client: 'Client Name',
    daysLeft: 10,
    budget: '£1',
    progress: 30,
    avatars: [],
  },
  {
    name: 'Cloud Migration',
    department: 'Analytics',
    client: 'Client Name',
    daysLeft: 14,
    budget: '£1',
    progress: 20,
    avatars: [],
  },
];

export default function ProjectsSection() {
  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Projects</h2>
        <button className="text-slate-400 hover:text-slate-600">
          <span className="material-icons-outlined">more_horiz</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <ProjectCard key={index} {...project} />
        ))}
        <AddUnitCard onClick={() => console.log('Add project')} />
      </div>
    </section>
  );
}
