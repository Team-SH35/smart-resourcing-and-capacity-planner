import { useState, useEffect } from "react";
import ProjectCard from "./ProjectCard";
import AddUnitCard from "./AddUnitCard";
import EmptyStateCard from "./EmptyStateCard";
import { useNavigate } from "react-router-dom";
import {getJobs,getEmployees,getForecastEntries,} from "../../api/client";
import type { Employee, JobCode, ForecastEntry } from "../data/types";

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

export default function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProjects() {
      try {
        const [jobs, employees, forecast] = await Promise.all([
          getJobs(),
          getEmployees(),
          getForecastEntries(),
        ]);

        // Group forecast by jobCode
        const forecastByJob: Record<string, ForecastEntry[]> = {};
        forecast.forEach((entry: ForecastEntry) => {
          if (!forecastByJob[entry.jobCode]) {
            forecastByJob[entry.jobCode] = [];
          }
          forecastByJob[entry.jobCode].push(entry);
        });

        const today = new Date();

        const mappedProjects: Project[] = jobs.map((job: JobCode) => {
          const entries = forecastByJob[job.jobCode] || [];

          // Dates
          const startDate = new Date(job.startDate);
          const finishDate = job.finishDate
            ? new Date(job.finishDate)
            : null;

          // Total duration
          const totalDuration =
            finishDate && startDate
              ? Math.max(
                  1,
                  Math.ceil(
                    (finishDate.getTime() - startDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : 1;

          // Days left
          const daysLeft =
            finishDate
              ? Math.max(
                  0,
                  Math.ceil(
                    (finishDate.getTime() - today.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : 0;

          // Time-based progress
          const elapsed =
            finishDate && startDate
              ? Math.max(
                  0,
                  Math.ceil(
                    (today.getTime() - startDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : 0;

          const progress = Math.min(
            100,
            Math.round((elapsed / totalDuration) * 100)
          );

          // Employees assigned via forecast
          const jobEmployees: Employee[] = entries
            .map((entry) =>
              employees.find((e: Employee) => e.name === entry.employeeName)
            )
            .filter((e): e is Employee => Boolean(e));

          return {
            jobCode: job.jobCode,
            name: job.description,
            department: job.businessUnit,
            client: job.customerName,
            daysLeft,
            budget: `£${job.budgetCost ?? 0}`,
            progress,
            avatars: generateAvatars(jobEmployees),
          };
        });

        setProjects(mappedProjects);
      } catch (err) {
        console.error("Failed to load projects", err);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
          Projects
        </h2>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading projects...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <EmptyStateCard />
          ) : (
            projects.map((project) => (
              <ProjectCard
                key={project.jobCode}
                {...project}
                onClick={() => navigate(`/project/${project.jobCode}`)}
                onSave={(updated) => {
                  setProjects((prev) =>
                    prev.map((p) =>
                      p.jobCode === project.jobCode
                        ? { ...p, ...updated }
                        : p
                    )
                  );
                }}
              />
            ))
          )}

          <AddUnitCard onClick={() => console.log("Add project")} />
        </div>
      )}
    </section>
  );
}

// 🔹 Avatar generator
function generateAvatars(employees: Employee[]) {
  return employees.slice(0, 4).map((emp) => ({
    initials: emp.name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase(),
    color: "bg-indigo-400",
  }));
}
