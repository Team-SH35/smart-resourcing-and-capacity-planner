import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import EmployeeByBUCard from "../components/businessUnit/EmployeeByBUCard";
import { getEmployees, getJobs, getForecastEntries } from "../api/client";
import type { Employee, JobCode, ForecastEntry } from "../components/data/types";

type SortOption = "name-asc" | "name-desc" | "alloc-asc" | "alloc-desc";
type AllocationFilter = "under" | "correct" | "over" | "";

export default function BusinessUnit() {
  const { unit } = useParams<{ unit: string }>();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobCodes, setJobCodes] = useState<JobCode[]>([]);
  const [forecastEntries, setForecastEntries] = useState<ForecastEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterSpecialism, setFilterSpecialism] = useState("");
  const [filterAllocation, setFilterAllocation] = useState<AllocationFilter>("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  useEffect(() => {
    async function fetchData() {
      try {
        const [emp, jobs, forecast] = await Promise.all([
          getEmployees(),
          getJobs(),
          getForecastEntries(),
        ]);

        setEmployees(emp);
        setJobCodes(jobs);
        setForecastEntries(forecast);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!unit) return <div>No business unit selected.</div>;

  const normalize = (str: string) => str.toLowerCase().trim();

  const unitJobCodes = jobCodes
    .filter((job) => normalize(job.businessUnit) === normalize(unit))
    .map((job) => job.jobCode);

  const unitEmployeeNames = new Set(
    forecastEntries
      .filter((entry) => unitJobCodes.includes(entry.jobCode))
      .map((entry) => normalize(entry.employeeName))
  );

  const unitEmployees = employees.filter((emp) =>
    unitEmployeeNames.has(normalize(emp.name))
  );

  const specialismOptions = Array.from(
    new Set(unitEmployees.flatMap((e) => e.specialisms))
  );

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">{unit}</h1>

          <div className="flex gap-3 items-center">
            <button
              onClick={() => setFiltersOpen(true)}
              className="font-medium text-slate-400 border rounded px-3 py-1"
            >
            <div className="flex gap-2">
              <span className="material-icons-outlined text">
                filter_alt
              </span>
              Filters
            </div>
            </button>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as SortOption)
              }
              className="border rounded px-3 py-1"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="alloc-desc">Allocation (high-low)</option>
              <option value="alloc-asc">Allocation (low-high)</option>
            </select>
          </div>
        </div>

        {/* Filters */}
        {filtersOpen && (
          <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
            onClick={() => setFiltersOpen(false)}
          >
            <div
              className="bg-white rounded-xl p-6 w-96 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex gap-2">
              <span className="material-icons-outlined text">
                filter_alt
              </span>
              <h2 className="font-semibold text-lg">Filters</h2>
            </div>

              <input
                placeholder="Name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="border rounded w-full px-3 py-2"
              />

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

              <select
                value={filterAllocation}
                onChange={(e) =>
                  setFilterAllocation(e.target.value as AllocationFilter)
                }
                className="border rounded w-full px-3 py-2"
              >
                <option value="">All Allocations</option>
                <option value="under">Underallocated (&lt;80%)</option>
                <option value="correct">80–100%</option>
                <option value="over">Overallocated (&gt;100%)</option>
              </select>

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

        {/* ✅ Pass already-filtered employees */}
        <EmployeeByBUCard
          employees={unitEmployees}
          forecastEntries={forecastEntries}
          filterName={filterName}
          filterSpecialism={filterSpecialism}
          filterAllocation={filterAllocation}
          sortBy={sortBy}
        />
      </div>
    </div>
  );
}