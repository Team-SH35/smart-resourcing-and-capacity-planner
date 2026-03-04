import { useState } from "react";
import { useParams } from "react-router-dom";
import EmployeeByBUCard from "../components/businessUnit/EmployeeByBUCard";
import { employees } from "../components/data/employees";
import { jobCodes } from "../components/data/jobCodes";
import { forecastEntries } from "../components/data/forecastEntries";

type SortOption = "name-asc" | "name-desc" | "alloc-asc" | "alloc-desc";

// Allocation filter type
type AllocationFilter = "under" | "correct" | "over" | "";

export default function BusinessUnit() {
  const { unit } = useParams<{ unit: string }>();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filters & Sort state
  const [filterName, setFilterName] = useState("");
  const [filterSpecialism, setFilterSpecialism] = useState("");
  const [filterAllocation, setFilterAllocation] = useState<AllocationFilter>("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  if (!unit) return <div>No business unit selected.</div>;

  // --- Employees in this business unit via jobCodes + forecastEntries ---
  const unitJobCodes = jobCodes
    .filter((job) => job.businessUnit === unit)
    .map((job) => job.jobCode);

  const unitEmployeeNames = new Set(
    unitJobCodes.flatMap((code) =>
      forecastEntries.filter((entry) => entry.jobCode === code).map((entry) => entry.employeeName)
    )
  );

  const unitEmployees = employees.filter((emp) => unitEmployeeNames.has(emp.name));

  const specialismOptions = Array.from(new Set(unitEmployees.flatMap((e) => e.specialisms)));

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">{unit}</h1>

          <div className="flex gap-3 items-center">
            {/* Filter overlay button */}
            <button
              onClick={() => setFiltersOpen(true)}
              className="font-medium text-slate-400 border rounded px-3 py-1"
            >
              Filters
            </button>

            {/* Sort By dropdown */}
            <select
              value={sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSortBy(e.target.value as SortOption)
              }
              className="border rounded px-3 py-1 flex items-center gap-2"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="alloc-desc">Allocation (high-low)</option>
              <option value="alloc-asc">Allocation (low-high)</option>
            </select>
          </div>
        </div>

        {/* Filters Overlay */}
        {filtersOpen && (
          <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
            onClick={() => setFiltersOpen(false)}
          >
            <div
              className="bg-white rounded-xl p-6 w-96 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-semibold text-lg">Filters</h2>

              {/* Name Filter */}
              <input
                placeholder="Name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="border rounded w-full px-3 py-2"
              />

              {/* Specialism Filter */}
              <select
                value={filterSpecialism}
                onChange={(e) => setFilterSpecialism(e.target.value)}
                className="border rounded w-full px-3 py-2"
              >
                <option value="">All Specialisms</option>
                {specialismOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Allocation Filter */}
              <select
                value={filterAllocation}
                onChange={(e) =>
                  setFilterAllocation(e.target.value as AllocationFilter)
                }
                className="border rounded w-full px-3 py-2"
              >
                <option value="">All Allocations</option>
                <option value="under">Underallocated (&lt;80%)</option>
                <option value="correct">Correctly allocated (80–100%)</option>
                <option value="over">Overallocated (&gt;100%)</option>
              </select>

              {/* Close button */}
              <div className="flex justify-end pt-4">
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

        {/* Employee Cards */}
        <EmployeeByBUCard
          businessUnit={unit}
          filterName={filterName}
          filterSpecialism={filterSpecialism}
          filterAllocation={filterAllocation}
          sortBy={sortBy}
        />
      </div>
    </div>
  );
}