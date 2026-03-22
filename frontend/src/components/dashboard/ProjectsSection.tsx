import { useState, useEffect } from "react";
import ProjectCard from "./ProjectCard";
import AddUnitCard from "./AddUnitCard";
import EmptyStateCard from "./EmptyStateCard";
import {
  getJobs,
  getEmployees,
  getForecastEntries,
  createJob,
} from "../../api/client";
import type {
  Employee,
  JobCode,
  ForecastEntry,
} from "../data/types";

interface Project {
  jobCode: string;
  name: string;
  department: string;
  client: string;
  daysLeft: number;
  budget: string;
  progress: number;
  avatars: { initials: string; color: string; name: string }[];
}

type Filters = {
  client: string;
  businessUnit: string;
  activeOnly: boolean;
};

function generateAvatars(employees: Employee[]) {
  return employees.slice(0, 4).map((emp: Employee) => ({
    initials: emp.name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase(),
    color: "bg-indigo-400",
    name: emp.name,
  }));
}

type JobWithBudget = JobCode & {
  budgetCost?: number | null;
};

export default function ProjectsSection({
  filters,
}: {
  filters: Filters;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const loadProjects = async () => {
    try {
      const [jobs, employees, forecast] = await Promise.all([
        getJobs(),
        getEmployees(),
        getForecastEntries(),
      ]);

      const forecastByJob: Record<string, ForecastEntry[]> = {};

      forecast.forEach((entry: ForecastEntry) => {
        if (!forecastByJob[entry.jobCode]) {
          forecastByJob[entry.jobCode] = [];
        }
        forecastByJob[entry.jobCode].push(entry);
      });

      const today = new Date();

      const mappedProjects: Project[] = jobs
        .filter(
          (job: JobWithBudget) =>
            typeof job.description === "string" &&
            job.description.trim().length > 0
        )
        .map((job: JobWithBudget): Project => {
          const entries = forecastByJob[job.jobCode] || [];

          const startDate = job.startDate
            ? new Date(job.startDate)
            : null;

          const finishDate = job.finishDate
            ? new Date(job.finishDate)
            : null;

          const totalDuration =
            startDate && finishDate
              ? Math.max(
                  1,
                  Math.ceil(
                    (finishDate.getTime() - startDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : 1;

          const daysLeft =
            finishDate !== null
              ? Math.max(
                  0,
                  Math.ceil(
                    (finishDate.getTime() - today.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : 0;

          const elapsed =
            startDate && finishDate
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

          const jobEmployees: Employee[] = Array.from(
            new Map(
              entries
                .map((entry: ForecastEntry) =>
                  employees.find(
                    (e: Employee) => e.name === entry.employeeName
                  )
                )
                .filter((e): e is Employee => Boolean(e))
                .map((e: Employee) => [e.name, e])
            ).values()
          );

          return {
            jobCode: job.jobCode,
            name: job.description ?? "",
            department: job.businessUnit ?? "",
            client: job.customerName ?? "",
            daysLeft,
            budget: `£${job.budgetCost ?? 0}`,
            progress,
            avatars: generateAvatars(jobEmployees),
          };
        });

      const filteredProjects = mappedProjects.filter((project) => {
        const matchesClient =
          !filters.client ||
          project.client
            .toLowerCase()
            .includes(filters.client.toLowerCase());

        const matchesBusinessUnit =
          !filters.businessUnit ||
          project.department
            .toLowerCase()
            .includes(filters.businessUnit.toLowerCase());

        const isActive = project.daysLeft > 0;

        const matchesActive =
          !filters.activeOnly || isActive;

        return (
          matchesClient &&
          matchesBusinessUnit &&
          matchesActive
        );
      });

      setProjects(filteredProjects);
    } catch (err: unknown) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [filters]); 

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
          Projects
        </h2>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">
          Loading projects...
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <EmptyStateCard />
          ) : (
            projects.map((project: Project) => (
              <ProjectCard
                key={project.jobCode}
                {...project}
                onSave={async () => {
                  await loadProjects();
                }}
              />
            ))
          )}

          <AddUnitCard onClick={() => setShowAddModal(true)} />
        </div>
      )}

      {showAddModal && (
        <AddProjectModal
          onClose={() => setShowAddModal(false)}
          onCreated={async () => {
            setShowAddModal(false);
            await loadProjects();
          }}
        />
      )}
    </section>
  );
}

/* ================= MODAL ================= */

function AddProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    jobCode: "",
    description: "",
    businessUnit: "",
    customer: "",
    startDate: "",
    finishDate: "",
    budget: "",
  });

  const handleChange =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [field]: e.target.value });
    };

  const handleCreate = async () => {
    try {
      await createJob({
        jobCode: form.jobCode,
        description: form.description,
        businessUnit: form.businessUnit,
        customer: form.customer,
        startDate: form.startDate || undefined,
        finishDate: form.finishDate || undefined,
        monetaryBudget: form.budget
          ? Number(form.budget)
          : undefined,
        workspaceID: 1,
      });

      await onCreated();
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to create project");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 w-96 space-y-4"
        onClick={(e: React.MouseEvent<HTMLDivElement>) =>
          e.stopPropagation()
        }
      >
        <h2 className="font-semibold text-lg">Add Project</h2>

        <input
          placeholder="Job Code"
          className="border rounded w-full px-3 py-2"
          value={form.jobCode}
          onChange={handleChange("jobCode")}
        />

        <input
          placeholder="Description"
          className="border rounded w-full px-3 py-2"
          value={form.description}
          onChange={handleChange("description")}
        />

        <input
          placeholder="Business Unit"
          className="border rounded w-full px-3 py-2"
          value={form.businessUnit}
          onChange={handleChange("businessUnit")}
        />

        <input
          placeholder="Client"
          className="border rounded w-full px-3 py-2"
          value={form.customer}
          onChange={handleChange("customer")}
        />

        <input
          type="date"
          className="border rounded w-full px-3 py-2"
          value={form.startDate}
          onChange={handleChange("startDate")}
        />

        <input
          type="date"
          className="border rounded w-full px-3 py-2"
          value={form.finishDate}
          onChange={handleChange("finishDate")}
        />

        <input
          type="number"
          placeholder="Budget"
          className="border rounded w-full px-3 py-2"
          value={form.budget}
          onChange={handleChange("budget")}
        />

        <div className="flex justify-end gap-2 pt-4">
          <button className="border rounded px-3 py-1" onClick={onClose}>
            Cancel
          </button>
          <button
            className="bg-emerald-500 text-white rounded px-3 py-1"
            onClick={handleCreate}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}




