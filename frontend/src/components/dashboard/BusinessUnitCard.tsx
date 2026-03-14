import { useState } from "react";

interface Employee {
  name: string;
  specialisms: string[];
  excludedFromAI: boolean;
}

interface Avatar {
  initials: string;
  color: string;
}

interface BusinessUnitCardProps {
  name: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  avatars: Avatar[];
  employees: Employee[];
  onSave?: (updatedUnit: {
    name: string;
    icon: string;
    employees: Employee[];
  }) => void;
}

export default function BusinessUnitCard({
  name,
  icon,
  iconBgColor,
  iconColor,
  avatars,
  employees: initialEmployees,
  onSave,
}: BusinessUnitCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [unitName, setUnitName] = useState(name);
  const [employees, setEmployees] = useState<Employee[]>([...initialEmployees]);
  const [newEmployeeName, setNewEmployeeName] = useState("");

  const handleAddEmployee = () => {
    if (!newEmployeeName.trim()) return;
    const newEmp: Employee = {
      name: newEmployeeName.trim(),
      specialisms: [],
      excludedFromAI: false,
    };
    setEmployees([...employees, newEmp]);
    setNewEmployeeName("");
  };

  const handleDeleteEmployee = (name: string) => {
    setEmployees(employees.filter(emp => emp.name !== name));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ name: unitName, icon: icon, employees });
    }
    setEditOpen(false);
  };

  return (
    <div className="bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between relative">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl ${iconBgColor} flex items-center justify-center`}
          >
            <span className={`material-icons-outlined ${iconColor}`}>{icon}</span>
          </div>
          <span className="font-bold text-lg">{name}</span>
        </div>

        <button
          className="text-slate-400"
          onClick={() => setEditOpen(true)}
        >
          <span className="material-icons-outlined text-xl">more_horiz</span>
        </button>
      </div>

      <div className="flex items-center">
        {avatars.map((avatar, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded-full ${avatar.color} flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800`}
            style={{ marginLeft: index > 0 ? "-0.5rem" : "0" }}
          >
            {avatar.initials}
          </div>
        ))}
      </div>

      {/* Edit Overlay */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold">Edit Business Unit</h3>

            {/* Name and Icon */}
            <label className="flex flex-col">
              <h4 className="font-semibold mt-4 mb-2">Name</h4>
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="border rounded px-2 py-1 mt-1"
              />
            </label>
            {/* Employee List */}
            <div>
              <h4 className="font-semibold mt-4 mb-2">Employees</h4>
              <ul className="space-y-2">
                {employees.map(emp => (
                  <li
                    key={emp.name}
                    className="flex justify-between items-center border p-2 rounded"
                  >
                    <span>{emp.name}</span>
                    <button
                      className="text-red-500 font-bold"
                      onClick={() => handleDeleteEmployee(emp.name)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Add employee"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  className="flex-1 border rounded px-2 py-1"
                />
                <button
                  onClick={handleAddEmployee}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setEditOpen(false)}
                className="border rounded px-3 py-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="border rounded px-3 py-1 bg-indigo-500 text-white hover:bg-indigo-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
