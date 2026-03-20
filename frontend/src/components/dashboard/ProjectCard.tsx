import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Avatar {
  initials: string;
  color: string;
  name: string; 
}

interface ProjectCardProps {
  jobCode: string;
  name: string;
  department: string;
  client: string;
  daysLeft: number;
  budget: string;
  progress: number;
  avatars: Avatar[];
  onClick?: () => void;
  onSave?: (
    updatedProject: Omit<
      ProjectCardProps,
      "avatars" | "onClick" | "onSave"
    >
  ) => void;
}

export default function ProjectCard({
  jobCode,
  name,
  department,
  client,
  daysLeft,
  budget,
  progress,
  avatars,
  onSave,
}: ProjectCardProps) {
  const navigate = useNavigate(); 

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    jobCode,
    name,
    department,
    client,
    daysLeft,
    budget,
    progress,
  });

  const getDaysColor = () => {
    if (form.daysLeft <= 1)
      return "bg-red-50 dark:bg-red-900/20 text-red-500";
    if (form.daysLeft <= 8)
      return "bg-orange-50 dark:bg-orange-900/20 text-orange-500";
    return "bg-slate-100 dark:bg-slate-800 text-slate-500";
  };

  const handleSave = () => {
    if (onSave) onSave(form);
    setIsEditing(false);
  };

  return (
    <div
      onClick={() => navigate(`/project/${jobCode}`)} 
      className="bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-md transition-shadow relative"
    >
      {/* HEADER */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg">{form.name}</h3>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            {form.department} · {form.client}
          </p>
        </div>

        {/* EDIT BUTTON */}
        <button
          className="text-slate-400"
          onClick={(e) => {
            e.stopPropagation(); 
            setIsEditing(true);
          }}
        >
          <span className="material-icons-outlined text-xl">
            more_horiz
          </span>
        </button>
      </div>

      {/* DAYS BADGE */}
      <div className="mt-4 mb-6">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 ${getDaysColor()} rounded-full text-xs font-medium`}
        >
          <span className="material-icons-outlined text-[14px]">
            schedule
          </span>
          {form.daysLeft} days left
        </span>
      </div>

      {/* PROGRESS */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-xs font-bold">
          <span>Budget: {form.budget}</span>
          <span className="text-slate-400">
            {form.progress}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full"
            style={{ width: `${form.progress}%` }}
          />
        </div>
      </div>

      {/* AVATARS */}
      {avatars.length > 0 && (
        <div className="flex items-center">
          {avatars.map((avatar, index) => (
            <div
              key={index}
              onClick={(e) => {
                e.stopPropagation(); 
                navigate(
                  `/Employee/${encodeURIComponent(avatar.name)}`
                );
              }}
              title={avatar.name}
              className={`w-8 h-8 rounded-full ${avatar.color} flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800 cursor-pointer hover:scale-110 active:scale-95 transition ${
                index > 0 ? "-ml-2" : ""
              }`}
            >
              {avatar.initials}
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditing && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl p-6 w-96 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-lg">
              Edit Project
            </h2>

            <div>
              <h4 className="font-semibold mt-4 mb-2">
                Project Name
              </h4>
              <input
                className="border rounded w-full px-3 py-2"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            <div>
              <h4 className="font-semibold mt-4 mb-2">
                Department
              </h4>
              <input
                className="border rounded w-full px-3 py-2"
                value={form.department}
                onChange={(e) =>
                  setForm({
                    ...form,
                    department: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <h4 className="font-semibold mt-4 mb-2">
                Client
              </h4>
              <input
                className="border rounded w-full px-3 py-2"
                value={form.client}
                onChange={(e) =>
                  setForm({ ...form, client: e.target.value })
                }
              />
            </div>

            <div>
              <h4 className="font-semibold mt-4 mb-2">
                Days Left
              </h4>
              <input
                type="number"
                className="border rounded w-full px-3 py-2"
                value={form.daysLeft}
                onChange={(e) =>
                  setForm({
                    ...form,
                    daysLeft:
                      parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div>
              <h4 className="font-semibold mt-4 mb-2">
                Budget
              </h4>
              <input
                className="border rounded w-full px-3 py-2"
                value={form.budget}
                onChange={(e) =>
                  setForm({
                    ...form,
                    budget: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                className="border rounded px-3 py-1"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                className="bg-emerald-500 text-white rounded px-3 py-1"
                onClick={handleSave}
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