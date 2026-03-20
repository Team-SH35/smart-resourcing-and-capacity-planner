import { useState, useEffect } from "react";
import {
  uploadExcel,
  getJobs,
  getEmployees,
  updateStartDate,
  updateEndDate,
  updateBudget,
  updateTimeBudget,
  updateCurrencySymbol,
  addSpecialism,
} from "../api/client";
 
 
type JobRow = {
  jobCode: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: string;
  timeBudget: string;
  currency: string;
};
 
type JobApi = {
  jobCode: string;
  description?: string;
  startDate?: string;
  finishDate?: string;
  budgetCost?: number;
  budgetTime?: number;
  budgetCostCurrency?: string;
};
 
type Employee = {
  id: number;
  name: string;
  specialisms: string[];
};
 
type RowState = {
  input: string;
  pending: string[];
};
 
const CURRENCIES = ["£", "$", "€"];
 

 
export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
 
  const [showJobModal, setShowJobModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
 
  useEffect(() => {
    const uploaded = sessionStorage.getItem("excelUploaded");
    if (uploaded === "true") setHasUploaded(true);
  }, []);
 
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      setFileName(file.name); 

      await uploadExcel(file);

      sessionStorage.setItem("excelUploaded", "true");
      setHasUploaded(true);

      alert("Upload successful");
    } catch {
      alert("Upload failed");
      setFileName(null); 
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>
 
      {/* Upload */}
      <div className="bg-white p-4 rounded-xl border space-y-3">
        <input type="file" onChange={handleFileChange} />

        {loading && <p>Uploading...</p>}

        {/*  Show file name */}
        {fileName && (
          <p className="text-sm text-slate-600">
            Loaded file: <span className="font-medium">{fileName}</span>
          </p>
        )}

        {hasUploaded && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowJobModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Complete Job Data
            </button>

            <button
              onClick={() => setShowEmployeeModal(true)}
              className="bg-white text-blue-600 px-4 py-2 rounded border-blue-600"
            >
              Manage Employees
            </button>
          </div>
        )}
      </div>
 
      {/* Modals */}
      {showJobModal && (
        <JobModal onClose={() => setShowJobModal(false)} />
      )}
 
      {showEmployeeModal && (
        <EmployeeModal onClose={() => setShowEmployeeModal(false)} />
      )}
    </div>
  );
}
 
/* ================= JOB MODAL ================= */
 
function JobModal({ onClose }: { onClose: () => void }) {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const workspaceID = 1;
 
 
  const loadJobs = async () => {
    const data = (await getJobs()) as JobApi[];
 
    const mapped = data
      .map((j) => {
        const missing =
          !j.startDate ||
          !j.finishDate ||
          j.budgetCost == null ||
          j.budgetTime == null ||
          !j.budgetCostCurrency;
 
        if (!missing) return null;
 
        return {
          jobCode: j.jobCode,
          description: j.description || "",
          startDate: j.startDate ?? "",
          endDate: j.finishDate ?? "",
          budget: j.budgetCost?.toString() ?? "",
          timeBudget: j.budgetTime?.toString() ?? "",
          currency: j.budgetCostCurrency ?? "£",
        };
      })
      .filter((j): j is JobRow => j !== null);
 
    setJobs(mapped);
  };
  
    useEffect(() => {
    loadJobs();
  }, []);
 
  const updateField = (
    row: number,
    field: keyof JobRow,
    value: string
  ) => {
    setJobs((prev) =>
      prev.map((j, i) => (i === row ? { ...j, [field]: value } : j))
    );
  };
 
  const handleSave = async () => {
    const updates: Promise<any>[] = [];
 
    jobs.forEach((job) => {
      if (job.startDate)
        updates.push(
          updateStartDate({
            startDate: new Date(job.startDate).toISOString(),
            jobCode: job.jobCode,
            workspaceID,
          })
        );
 
      if (job.endDate)
        updates.push(
          updateEndDate({
            endDate: new Date(job.endDate).toISOString(),
            jobCode: job.jobCode,
            workspaceID,
          })
        );
 
      if (job.budget)
        updates.push(
          updateBudget({
            newBudget: Number(job.budget),
            jobCode: job.jobCode,
            workspaceID,
          })
        );
 
      if (job.timeBudget)
        updates.push(
          updateTimeBudget({
            timeBudget: Number(job.timeBudget),
            jobCode: job.jobCode,
            workspaceID,
          })
        );
 
      updates.push(
        updateCurrencySymbol({
          currencySymbol: job.currency,
          jobCode: job.jobCode,
          workspaceID,
        })
      );
    });
 
    await Promise.all(updates);
    alert("Saved");
    onClose();
  };
 
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[900px] max-h-[80vh] overflow-auto space-y-4">
        <h2 className="text-lg font-semibold">Complete Job Data</h2>

        {/* Header */}
        <div className="grid grid-cols-7 gap-2 font-semibold border-b pb-2 text-sm">
          <div>Job</div>
          <div>Description</div>
          <div>Start</div>
          <div>End</div>
          <div>Budget</div>
          <div>Time</div>
          <div>Currency</div>
        </div>

        {/* Rows */}
        {jobs.map((job, i) => (
          <div key={job.jobCode} className="grid grid-cols-7 gap-2 items-center border-b border-slate-200 py-1">
            <div>{job.jobCode}</div>
            <div>{job.description}</div>

            <input
              type="date"
              value={job.startDate}
              onChange={(e) =>
                updateField(i, "startDate", e.target.value)
              }
              className="border px-2 py-1 rounded"
            />

            <input
              type="date"
              value={job.endDate}
              onChange={(e) =>
                updateField(i, "endDate", e.target.value)
              }
              className="border px-2 py-1 rounded"
            />

            <input
              type="number"
              value={job.budget}
              onChange={(e) =>
                updateField(i, "budget", e.target.value)
              }
              className="border px-2 py-1 rounded"
            />

            <input
              type="number"
              value={job.timeBudget}
              onChange={(e) =>
                updateField(i, "timeBudget", e.target.value)
              }
              className="border px-2 py-1 rounded"
            />

            <select
              value={job.currency}
              onChange={(e) =>
                updateField(i, "currency", e.target.value)
              }
              className="border px-2 py-1 rounded"
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        ))}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white">
          <button onClick={onClose} className="border px-3 py-1 rounded">
            Close
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            Save All
          </button>
        </div>
      </div>
    </div>
  );
}
 
/* ================= EMPLOYEE MODAL ================= */
/*No employeeId so everything syncs currently*/
 
function EmployeeModal({ onClose }: { onClose: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rows, setRows] = useState<Record<number, RowState>>({});
 
  useEffect(() => {
    loadEmployees();
  }, []);
 
  const loadEmployees = async () => {
    const data = await getEmployees();
    setEmployees(data);
 
    const map: Record<number, RowState> = {};
    data.forEach((e: Employee) => {
      map[e.id] = { input: "", pending: [] };
    });
 
    setRows(map);
  };
 
  const updateInput = (id: number, value: string) => {
    setRows((prev) => ({
      ...prev,
      [id]: {
        input: value,
        pending: prev[id]?.pending || [], 
      },
    }));
  };
 
  const addPending = (id: number) => {
    const val = rows[id]?.input?.trim();
    if (!val) return;

    setRows((prev) => ({
      ...prev,
      [id]: {
        input: "",
        pending: [...(prev[id]?.pending || []), val], 
      },
    }));
  };
 
  const removePending = (id: number, index: number) => {
    setRows((prev) => ({
      ...prev,
      [id]: {
        input: prev[id]?.input || "",
        pending: (prev[id]?.pending || []).filter((_, i) => i !== index),
      },
    }));
  };
 
  const handleSave = async (id: number) => {
    const pending = rows[id]?.pending;
    if (!pending || pending.length === 0) {
      alert("Nothing to save");
      return;
    }
 
    await addSpecialism({
      employeeID: id,
      specialisms: pending,
    });
 
    alert("Saved");
    loadEmployees();
  };
 
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-[900px] max-h-[80vh] overflow-auto space-y-4">
        <h2 className="text-lg font-semibold">
          Manage Employee Specialisms
        </h2>
 
        <div className="grid grid-cols-4 gap-2 font-semibold border-b pb-2 text-sm">
          <div>Name</div>
          <div>Existing</div>
          <div>Add</div>
          <div>Action</div>
        </div>
 
        {employees.map((emp) => {
          const row = rows[emp.id] || { input: "", pending: [] };
 
          return (
            <div key={emp.id} className="grid grid-cols-4 gap-2">
              <div>{emp.name}</div>
 
              <div className="flex flex-wrap gap-2">
                {emp.specialisms.map((s, i) => (
                  <span
                    key={i}
                    className="bg-slate-100 px-2 py-1 rounded text-xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
 
              <div className="space-y-1">
                <div className="flex gap-2">
                  <input
                    value={row.input}
                    onChange={(e) =>
                      updateInput(emp.id, e.target.value)
                    }
                    className="border px-2 py-1 rounded w-full"
                  />
                  <button onClick={() => addPending(emp.id)}>+</button>
                </div>
 
                <div className="flex flex-wrap gap-1">
                  {row.pending.map((s, i) => (
                    <span
                      key={i}
                      className="bg-blue-100 px-2 py-1 rounded text-xs flex gap-1"
                    >
                      {s}
                      <button
                        onClick={() =>
                          removePending(emp.id, i)
                        }
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
 
              <button
                onClick={() => handleSave(emp.id)}
                className="bg-blue-600 text-white px-2 rounded"
              >
                Save
              </button>
            </div>
          );
        })}
 
        <div className="flex justify-end pt-4">
          <button onClick={onClose} className="border px-3 py-1 rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}