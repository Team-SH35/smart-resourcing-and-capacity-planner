import { useState, useEffect } from "react";
import BusinessUnitCard from "./BusinessUnitCard";
import AddUnitCard from "./AddUnitCard";
import EmptyStateCard from "./EmptyStateCard";

import type { Employee, JobCode, ForecastEntry } from "../data/types";

import {
  getBusinessUnits,
  getEmployees,
  getJobs,
  getForecastEntries,
  createJob,
} from "../../api/client";

interface BusinessUnit {
  id: string;
  name: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  avatars: { initials: string; color: string }[];
  employees: Employee[];
}

export default function BusinessUnitSection() {
  const [units, setUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const loadUnits = async () => {
    try {
      const [businessUnits, employees, jobs, forecast] = await Promise.all([
        getBusinessUnits(),
        getEmployees(),
        getJobs(),
        getForecastEntries(),
      ]);

      const jobToUnit: Record<string, string> = {};

      jobs.forEach((job: JobCode) => {
        if (job.jobCode && job.businessUnit) {
          jobToUnit[job.jobCode] = job.businessUnit;
        }
      });

      const unitEmployeeMap: Record<string, Employee[]> = {};

      forecast.forEach((entry: ForecastEntry) => {
        const unit = jobToUnit[entry.jobCode];
        if (!unit) return;

        if (!unitEmployeeMap[unit]) {
          unitEmployeeMap[unit] = [];
        }

        const employee = employees.find(
          (e: Employee) => e.name === entry.employeeName
        );

        if (
          employee &&
          !unitEmployeeMap[unit].some((e) => e.name === employee.name)
        ) {
          unitEmployeeMap[unit].push(employee);
        }
      });

      const mappedUnits: BusinessUnit[] = businessUnits.map(
        (name: string): BusinessUnit => {
          const unitEmployees = unitEmployeeMap[name] || [];

          return {
            id: name.toLowerCase().replace(/\s+/g, "-"),
            name,
            icon: "category",
            iconBgColor: "bg-indigo-50 dark:bg-indigo-900/30",
            iconColor: "text-indigo-500",
            avatars: generateAvatars(unitEmployees),
            employees: unitEmployees,
          };
        }
      );

      setUnits(mappedUnits);
    } catch (err: unknown) {
      console.error("Failed to load business units", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
          Business Unit
        </h2>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading business units...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {units.length === 0 ? (
            <EmptyStateCard />
          ) : (
            units.map((unit: BusinessUnit) => (
              <BusinessUnitCard
                key={unit.id}
                {...unit}
                onSave={async () => {
                  await loadUnits();
                }}
              />
            ))
          )}

          <AddUnitCard onClick={() => setShowAddModal(true)} />
        </div>
      )}

      {showAddModal && (
        <AddBusinessUnitModal
          onClose={() => setShowAddModal(false)}
          onCreated={async () => {
            setShowAddModal(false);
            await loadUnits(); 
            window.location.reload();
          }}
        />
      )}
    </section>
  );
}

/* ================= MODAL ================= */

function AddBusinessUnitModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState<string>("");

  const generateJobCode = () => `BU-${Date.now()}`;

  const handleCreate = async () => {
    try {
      if (!name.trim()) {
        alert("Business unit name is required");
        return;
      }

      await createJob({
        jobCode: generateJobCode(),
        businessUnit: name.trim(),
        workspaceID: 1,
      });

      await onCreated();
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to create business unit");
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
        <h2 className="font-semibold text-lg">
          Add Business Unit
        </h2>

        <input
          placeholder="Business Unit Name"
          className="border rounded w-full px-3 py-2"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
        />

        <div className="flex justify-end gap-2 pt-4">
          <button
            className="border rounded px-3 py-1"
            onClick={onClose}
          >
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

/* ================= HELPERS ================= */

function generateAvatars(employees: Employee[]) {
  return employees.slice(0, 4).map((emp: Employee) => ({
    initials: emp.name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase(),
    color: "bg-indigo-400",
  }));
}

