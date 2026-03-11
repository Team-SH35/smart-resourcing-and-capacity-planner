import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProjectCalendar from "../components/projectSchedule/ProjectCalendar";

type CalendarView = "week" | "fortnight" | "month";

export default function ProjectSchedule() {
  const [view, setView] = useState<CalendarView>("fortnight");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [searchParams] = useSearchParams();

  const [clientFilter, setClientFilter] = useState(
    searchParams.get("client") || ""
  );
  const [activeOnly, setActiveOnly] = useState(false);
  const [teamFilter, setTeamFilter] = useState<string[]>([]);

  const businessUnits = ["Developers", "Analytics"];

  // Dropdown options
  const viewOptions: { value: CalendarView; label: string }[] = [
    { value: "week", label: "Week" },
    { value: "fortnight", label: "Fortnight" },
    { value: "month", label: "Month" },
  ];

  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("#viewDropdown")) {
        setViewDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const client = searchParams.get("client");
    if (client) {
      setClientFilter(client);
    }
  }, [searchParams]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>

        <div className="flex items-center gap-2">
          {/* View By dropdown */}
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

          <button
            onClick={() => setFiltersOpen(true)}
            className="font-medium text-slate-400 border rounded px-3 py-1"
          >
            Filters
          </button>
        </div>
      </div>

      <ProjectCalendar
        view={view}
        clientFilter={clientFilter}
        activeOnly={activeOnly}
        teamFilter={teamFilter}
      />

      {/* Filters overlay */}
      {filtersOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 space-y-4">
            <h2 className="font-semibold text-lg">Filters</h2>

            <input
              placeholder="Client name"
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
              className="border rounded w-full px-3 py-2"
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={e => setActiveOnly(e.target.checked)}
              />
              Only active projects
            </label>

            <div className="space-y-2">
              <div className="font-medium text-sm">Business units</div>
              {businessUnits.map(unit => (
                <label key={unit} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={teamFilter.includes(unit)}
                    onChange={e =>
                      setTeamFilter(t =>
                        e.target.checked
                          ? [...t, unit]
                          : t.filter(x => x !== unit)
                      )
                    }
                  />
                  {unit}
                </label>
              ))}
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
    </div>
  );
}




