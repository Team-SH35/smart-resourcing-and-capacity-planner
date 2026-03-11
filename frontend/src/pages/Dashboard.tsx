
import BusinessUnitSection from '../components/dashboard/BusinessUnitSection';
import ProjectsSection from '../components/dashboard/ProjectsSection';
import DarkModeToggle from '../components/dashboard/DarkModeToggle';

export default function Dashboard() {
  return (
    <>
      <div className="max-w-[1200px] mx-auto px-6 py-8">

        <div className="mb-10">
          <h1 className="text-2xl font-bold mb-1">
            Hi SH35, <span className="text-slate-400 font-normal">here's the current projects</span>
          </h1>
        </div>

        <BusinessUnitSection />

        <div className="mb-8">
          <button className="px-4 py-2 bg-card-light dark:bg-card-dark rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span className="material-icons-outlined text-sm">filter_alt</span>
            Filter
          </button>
        </div>

        <ProjectsSection />
      </div>

      <DarkModeToggle />
    </>
  );
}
