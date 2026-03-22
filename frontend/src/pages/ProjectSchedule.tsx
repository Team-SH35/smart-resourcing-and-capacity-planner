import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProjectCalendar from "../components/projectSchedule/ProjectCalendar";
import { getBusinessUnits, createJob } from "../api/client";

type CalendarView = "week" | "fortnight" | "month";

export default function ProjectSchedule() {
const [view, setView] = useState<CalendarView>("fortnight");
const [filtersOpen, setFiltersOpen] = useState(false);
const [addProjectOpen, setAddProjectOpen] = useState(false);

const [businessUnits, setBusinessUnits] = useState<string[]>([]);
const [businessUnitsLoading, setBusinessUnitsLoading] = useState(true);

const [searchParams] = useSearchParams();
const clientFromUrl = searchParams.get("client") || "";

const [clientFilter, setClientFilter] = useState(clientFromUrl);
const [activeOnly, setActiveOnly] = useState(false);
const [teamFilter, setTeamFilter] = useState<string[]>([]);

const [viewDropdownOpen, setViewDropdownOpen] = useState(false);

const viewOptions: { value: CalendarView; label: string }[] = [
{ value: "week", label: "Week" },
{ value: "fortnight", label: "Fortnight" },
{ value: "month", label: "Month" },
];

/* ================= SYNC URL ================= */
useEffect(() => {
setClientFilter(clientFromUrl);
}, [clientFromUrl]);

/* ================= CLOSE DROPDOWN ================= */
useEffect(() => {
const onClick = (e: MouseEvent) => {
if (!(e.target as HTMLElement).closest("#viewDropdown")) {
setViewDropdownOpen(false);
}
};


document.addEventListener("mousedown", onClick);
return () => document.removeEventListener("mousedown", onClick);


}, []);

/* ================= LOAD BUSINESS UNITS ================= */
useEffect(() => {
async function loadBusinessUnits() {
try {
setBusinessUnitsLoading(true);
const units = await getBusinessUnits();
setBusinessUnits(units);
} catch (err) {
console.error("Failed to load business units", err);
setBusinessUnits([]);
} finally {
setBusinessUnitsLoading(false);
}
}


loadBusinessUnits();


}, []);

return ( <div className="p-6 space-y-4">


  {/* HEADER */}
  <div className="flex items-center justify-between">
    <h1 className="text-xl font-semibold">Projects</h1>

    <div className="flex items-center gap-2">

      {/* ➕ ADD PROJECT */}
      <button
        onClick={() => setAddProjectOpen(true)}
        className="bg-blue-600 text-white px-3 py-1 rounded font-medium hover:bg-blue-700"
      >
        + Add Project
      </button>

      {/* VIEW DROPDOWN */}
      <div id="viewDropdown" className="relative">
        <button
          onClick={() => setViewDropdownOpen(o => !o)}
          className="border rounded px-3 py-1 flex items-center gap-2"
        >
          <span className="font-medium text-slate-400">View By:</span>
          <span className="font-semibold">{view}</span>
          <span>▾</span>
        </button>

        {viewDropdownOpen && (
          <div className="absolute mt-2 bg-white border rounded shadow-lg w-40 z-40">
            {viewOptions.map(opt => (
              <div
                key={opt.value}
                className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                onClick={() => {
                  setView(opt.value);
                  setViewDropdownOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FILTER BUTTON */}
      <button
        onClick={() => setFiltersOpen(true)}
        className="font-medium text-slate-400 border rounded px-3 py-1"
      >
        Filters
      </button>
    </div>
  </div>

  {/* CALENDAR */}
  <ProjectCalendar
    view={view}
    activeOnly={activeOnly}
    teamFilter={teamFilter}
    clientFilter={clientFilter}
  />

  {/* ================= FILTER MODAL ================= */}
  {filtersOpen && (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl p-6 w-96 space-y-4">
        <h2 className="font-semibold text-lg">Filters</h2>

        <input
          placeholder="Client name"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="border rounded w-full px-3 py-2"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Only active projects
        </label>

        <div className="space-y-2">
          <div className="font-medium text-sm">Business units</div>

          {businessUnitsLoading ? (
            <div className="text-sm text-slate-400">Loading...</div>
          ) : (
            businessUnits.map(unit => (
              <label key={unit} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={teamFilter.includes(unit)}
                  onChange={(e) =>
                    setTeamFilter(prev =>
                      e.target.checked
                        ? [...prev, unit]
                        : prev.filter(x => x !== unit)
                    )
                  }
                />
                {unit}
              </label>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={() => setFiltersOpen(false)}
            className="border rounded px-3 py-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}

  {/* ================= ADD PROJECT MODAL ================= */}
  {addProjectOpen && (
    <AddProjectModal
      onClose={() => setAddProjectOpen(false)}
      onCreated={async () => {
        window.location.reload();
      }}
    />
  )}
</div>


);
}

/* ================= ADD PROJECT MODAL ================= */
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
monetaryBudget: form.budget ? Number(form.budget) : undefined,
workspaceID: 1,
});


  await onCreated();
  onClose();
} catch (err) {
  console.error(err);
  alert("Failed to create project");
}


};

return ( <div
   className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999]"
   onClick={onClose}
 >
<div
className="bg-white rounded-xl p-6 w-96 space-y-4"
onClick={(e: React.MouseEvent<HTMLDivElement>) =>
e.stopPropagation()
}
> <h2 className="font-semibold text-lg">Add Project</h2>

```
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

