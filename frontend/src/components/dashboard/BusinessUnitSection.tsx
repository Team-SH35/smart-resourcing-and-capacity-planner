import { useState, useEffect } from "react";
import BusinessUnitCard from "./BusinessUnitCard";
import AddUnitCard from "./AddUnitCard";
import EmptyStateCard from "./EmptyStateCard";

import type { Employee } from "../data/types";

import {
  getBusinessUnits,
  getEmployees,
  getJobs,
  getForecastEntries,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUnits() {
      try {
        const [businessUnits, employees, jobs, forecast] = await Promise.all([
          getBusinessUnits(),
          getEmployees(),
          getJobs(),
          getForecastEntries(),
        ]);

        // Map jobCode → businessUnit
        const jobToUnit: Record<string, string> = {};
        jobs.forEach((job: any) => {
          if (job.jobCode && job.businessUnit) {
            jobToUnit[job.jobCode] = job.businessUnit;
          }
        });

        // Map businessUnit → employees
        const unitEmployeeMap: Record<string, Employee[]> = {};

        forecast.forEach((entry: any) => {
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

        // Build final units
        const mappedUnits: BusinessUnit[] = businessUnits.map((name: string) => {
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
        });

        setUnits(mappedUnits);
      } catch (err) {
        console.error("Failed to load business units", err);
      } finally {
        setLoading(false);
      }
    }

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
            units.map((unit) => (
              <BusinessUnitCard
                key={unit.id}
                {...unit}
                onSave={(updatedUnit) => {
                  setUnits((prev) =>
                    prev.map((u) =>
                      u.id === unit.id ? { ...u, ...updatedUnit } : u
                    )
                  );
                }}
              />
            ))
          )}

          <AddUnitCard />
        </div>
      )}
    </section>
  );
}

// 🔹 Generate avatars from employees
function generateAvatars(employees: Employee[]) {
  return employees.slice(0, 4).map((emp) => ({
    initials: emp.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase(),
    color: "bg-indigo-400",
  }));
}
