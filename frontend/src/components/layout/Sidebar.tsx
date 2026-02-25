import { useState } from "react"; 
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Projects", path: "/ProjectSchedule" },
  { label: "Settings", path: "/Settings" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);// state for business unit dropdown

  return (
    <div className="space-y-6">
      {/* Business Unit Dropdown */}
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wide"
        >
          Business Unit
        </button>

        <div
          className={`mt-4 space-y-2 overflow-hidden transition-all duration-300 ${open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <NavLink
            to="/businessunit"
            className={`block w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 font-medium `}
            >
              Developers
          </NavLink>

          <NavLink
            to="/businessunit"
            className={`block w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 font-medium `}
            >
              Analytics
          </NavLink>
        </div>
      </div>

      {/* Divider */}
      <div className="my-4 border-t-2 border-slate-200" />

      {/* Nav Links */}
      <div>
        <nav className="space-y-1">
          {navItems.map(({ label, path }) => (
            <NavLink
              key={label}
              to={path}
              end
              className={({ isActive }) =>`w-full flex items-center px-3 py-2 rounded-lg hover:bg-slate-100 ${isActive ? "font-semibold text-custom-blue" : "font-medium text-black"}`}
              >
                {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
