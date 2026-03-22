import { useState } from "react";
import BusinessUnitSection from "../components/dashboard/BusinessUnitSection";
import ProjectsSection from "../components/dashboard/ProjectsSection";

export default function Dashboard() {
  const [filters, setFilters] = useState({
    client: "",
    activeOnly: false,
    businessUnit: "",
  });

  const [tempFilters, setTempFilters] = useState(filters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const openFilters = () => {
    setTempFilters(filters); // copy current filters
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    const empty = { client: "", activeOnly: false, businessUnit: "" };
    setTempFilters(empty);
    setFilters(empty);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-10">
        <h1 className="text-2xl font-bold mb-1">
          Hi SH35,{" "}
          <span className="text-slate-400 font-normal">
            here's the current projects
          </span>
        </h1>
      </div>

      <BusinessUnitSection />

      {/* 🔥 FILTER BUTTON */}
      <div className="mb-8">
        <button
          onClick={openFilters}
          className="px-4 py-2 bg-card-light dark:bg-card-dark rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-icons-outlined text-sm">
            filter_alt
          </span>
          Filters
        </button>
      </div>

      <ProjectsSection filters={filters} />

      {/* 🔥 FILTER MODAL */}
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

            {/* Client */}
            <div>
              <label className="text-sm font-medium">Client</label>
              <input
                placeholder="Filter by client"
                className="border rounded w-full px-3 py-2 mt-1"
                value={tempFilters.client}
                onChange={(e) =>
                  setTempFilters({
                    ...tempFilters,
                    client: e.target.value,
                  })
                }
              />
            </div>

            {/* Business Unit */}
            <div>
              <label className="text-sm font-medium">
                Business Unit
              </label>
              <input
                placeholder="Filter by business unit"
                className="border rounded w-full px-3 py-2 mt-1"
                value={tempFilters.businessUnit}
                onChange={(e) =>
                  setTempFilters({
                    ...tempFilters,
                    businessUnit: e.target.value,
                  })
                }
              />
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={tempFilters.activeOnly}
                onChange={(e) =>
                  setTempFilters({
                    ...tempFilters,
                    activeOnly: e.target.checked,
                  })
                }
              />
              Active only
            </label>

            {/* ACTIONS */}
            <div className="flex justify-between pt-4">
              <button
                onClick={clearFilters}
                className="text-sm text-slate-500"
              >
                Clear
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="border rounded px-3 py-1"
                >
                  Cancel
                </button>
                <button
                  onClick={applyFilters}
                  className="bg-emerald-500 text-white rounded px-3 py-1"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


