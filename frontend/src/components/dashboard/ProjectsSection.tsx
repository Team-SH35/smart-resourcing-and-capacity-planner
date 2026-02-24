import ProjectCard from './ProjectCard';
import AddUnitCard from './AddUnitCard';

interface Project {
  jobCode: string;
  name: string;
  department: string;
  client: string;
  daysLeft: number;
  budget: string;
  progress: number;
  avatars: { initials: string; color: string }[];
}

const projects: Project[] = [ // Example jobCodes for demonstration; replace with real jobCodes if available
  {
    jobCode: 'C341-CWPUK-28-7-4',
    name: 'Comwrap Website Project',
    department: 'Developers',
    client: 'Comwrap Reply',
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
    jobCode: 'A102-ANALYTICS-01',
    name: 'Marketing Push',
    department: 'Analytics',
    client: 'Client Name',
    daysLeft: 1,
    budget: '£1',
    progress: 75,
    avatars: [{ initials: 'RR', color: 'bg-purple-500' }],
  },
  {
    jobCode: 'A109-ANALYTICS-03',
    name: 'System Audit',
    department: 'Developers',
    client: 'Client Name',
    daysLeft: 8,
    budget: '£1',
    progress: 65,
    avatars: [{ initials: 'T', color: 'bg-pink-400' }],
  },
  {
    jobCode: 'A111-ANALYTICS-02',
    name: 'API Integrations',
    department: 'Analytics',
    client: 'Client Name',
    daysLeft: 10,
    budget: '£1',
    progress: 30,
    avatars: [],
  },
  {
    jobCode: 'A112-ANALYTICS-04',
    name: 'Cloud Migration',
    department: 'Analytics',
    client: 'Client Name',
    daysLeft: 14,
    budget: '£1',
    progress: 20,
    avatars: [],
  },
];

import { useNavigate } from 'react-router-dom';

export default function ProjectsSection() {
  const navigate = useNavigate();
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
          <ProjectCard
            key={index}
            {...project}
            onClick={() => navigate(`/project/${project.jobCode}`)}
          />
        ))}
        <AddUnitCard onClick={() => console.log('Add project')} />
      </div>
    </section>
  );
}
