// components/Sidebar.tsx
import { useState } from "react"; 
import { NavLink } from "react-router-dom";
import { jobCodes } from "../data/jobCodes"; // just import the data itself

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Projects", path: "/ProjectSchedule" },
  { label: "Settings", path: "/Settings" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  // dynamically get unique business units from jobCodes
  const businessUnits = Array.from(new Set(jobCodes.map((job) => job.businessUnit)));

  return (
    <div className="space-y-6 p-4 w-60 bg-white shadow-md h-screen">
      
      {/* Business Unit Dropdown */}
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wide"
        >
          Business Unit
          <span>{open ? "▲" : "▼"}</span>
        </button>

        <div
          className={`mt-4 space-y-2 overflow-hidden transition-all duration-300 ${
            open ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {businessUnits.map((unit) => (
            <NavLink
              key={unit}
              to={`/businessunit/${unit}`}
              className={({ isActive }) =>
                `block w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 font-medium ${
                  isActive ? "bg-slate-200 font-semibold" : "text-slate-700"
                }`
              }
            >
              {unit}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="my-4 border-t-2 border-slate-200" />

      {/* Main Nav Links */}
      <div>
        <nav className="space-y-1">
          {navItems.map(({ label, path }) => (
            <NavLink
              key={label}
              to={path}
              end
              className={({ isActive }) =>
                `w-full flex items-center px-3 py-2 rounded-lg hover:bg-slate-100 ${
                  isActive ? "font-semibold text-custom-blue" : "font-medium text-black"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}