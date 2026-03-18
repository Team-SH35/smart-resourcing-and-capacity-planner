import { useState } from "react";
import BusinessUnitCard from "./BusinessUnitCard";
import AddUnitCard from "./AddUnitCard";
import type { Employee } from "../data/types";

// Define your business unit type with employees
interface BusinessUnit {
  id: string;
  name: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  avatars: { initials: string; color: string }[];
  employees: Employee[];
}

// Dummy data using your existing files
const INITIAL_UNITS: BusinessUnit[] = [
  {
    id: "developers",
    name: "Developers",
    icon: "category",
    iconBgColor: "bg-indigo-50 dark:bg-indigo-900/30",
    iconColor: "text-indigo-500",
    avatars: [
      { initials: "KA", color: "bg-amber-400" },
      { initials: "RR", color: "bg-purple-500" },
      { initials: "EL", color: "bg-green-500" },
      { initials: "+3", color: "bg-slate-100 dark:bg-slate-700 text-slate-400" },
    ],
    employees: [
      { name: "Declan", specialisms: ["Frontend Developer"], excludedFromAI: false },
      { name: "Dorcas", specialisms: ["Backend Developer"], excludedFromAI: false },
    ],
  },
  {
    id: "analytics",
    name: "Analytics",
    icon: "analytics",
    iconBgColor: "bg-pink-50 dark:bg-pink-900/30",
    iconColor: "text-pink-500",
    avatars: [
      { initials: "AF", color: "bg-sky-400" },
      { initials: "KA", color: "bg-amber-400" },
    ],
    employees: [
      { name: "Charlotte", specialisms: ["Analytics Integrator"], excludedFromAI: false },
      { name: "Aidan", specialisms: ["Analytics Integrator"], excludedFromAI: false },
    ],
  },
];

export default function BusinessUnitSection() {
  const [units, setUnits] = useState(INITIAL_UNITS);

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
          Business Unit
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {units.map((unit) => (
          <BusinessUnitCard
            key={unit.id}
            {...unit}
            onSave={(updatedUnit) => {
              setUnits((prev) =>
                prev.map((u) => (u.id === unit.id ? { ...u, ...updatedUnit } : u))
              );
            }}
          />
        ))}

        <AddUnitCard />
      </div>
    </section>
  );
}
