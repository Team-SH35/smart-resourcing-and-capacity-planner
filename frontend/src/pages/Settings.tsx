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

/* ================= TYPES ================= */

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

type EmployeeRow = {
  employeeID: number;
  name: string;
  specialisms: string;
};

const CURRENCIES = ["£", "$", "€"];

/* ================= SETTINGS ================= */

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const [showJobModal, setShowJobModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  useEffect(() => {
    const uploaded = sessionStorage.getItem("excelUploaded");
    const savedFileName = sessionStorage.getItem("excelFileName");

    if (uploaded === "true") setHasUploaded(true);

    if (savedFileName) {
      setFileName(savedFileName);
    }
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
      sessionStorage.setItem("excelFileName", file.name);
      setHasUploaded(true);

      alert("Upload successful");
      window.location.reload();
    } catch {
      alert("Upload failed");
      setFileName(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-2">
        <span className="material-icons-outlined text-xxl">
          settings
        </span>
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <div className="bg-white p-4 rounded-xl border space-y-3">
        <div className="flex gap-2">
          <span className="material-icons-outlined text-xxl">
            upload
          </span>
          <h1 className="text-xl font-semibold">Upload</h1>
        </div>
        <input type="file" onChange={handleFileChange} />

        {loading && <p>Uploading...</p>}

        {fileName && (
          <p className="text-lg text-slate-600">
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
              className="border-2 border-blue-600 rounded text-blue-600 px-3 py-1"
            >
              Add Employee Specialisms
            </button>
          </div>
        )}
      </div>

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

  useEffect(() => {
    const init = async () => {
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

    init();
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

  const handleInputChange =
    (row: number, field: keyof JobRow) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField(row, field, e.target.value);
    };

  const handleSelectChange =
    (row: number) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateField(row, "currency", e.target.value);
    };

  const handleSave = async () => {
    const updates: Promise<void>[] = [];

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
        <div className="grid grid-cols-7 gap-2 text-sm font-semibold text-slate-500 border-b pb-2">
          <div>Code</div>
          <div>Description</div>
          <div>Start</div>
          <div>End</div>
          <div>Budget</div>
          <div>Time</div>
          <div>Currency</div>
        </div>

        {/* DATA ROWS */}
        {jobs.map((job, i) => (
          <div key={job.jobCode}>

            <div className="grid grid-cols-7 gap-2 items-center py-2">
              <div className="text-sm">{job.jobCode}</div>
              <div className="text-sm">{job.description}</div>

              <input
                type="date"
                value={job.startDate}
                onChange={handleInputChange(i, "startDate")}
                className="border rounded px-2 py-1"
              />

              <input
                type="date"
                value={job.endDate}
                onChange={handleInputChange(i, "endDate")}
                className="border rounded px-2 py-1"
              />

              <input
                type="number"
                value={job.budget}
                onChange={handleInputChange(i, "budget")}
                className="border rounded px-2 py-1"
              />

              <input
                type="number"
                value={job.timeBudget}
                onChange={handleInputChange(i, "timeBudget")}
                className="border rounded px-2 py-1"
              />

              <select
                value={job.currency}
                onChange={handleSelectChange(i)}
                className="border rounded px-2 py-1"
              >
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* THIN GREY DIVIDER */}
            <div className="border-t border-slate-200" />
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            Save
          </button>
        </div>

      </div>
    </div>
  );
}

type EmployeeApi = {
  employeeID: number;
  name: string;
  specialisms?: string[];
};


/* ================= EMPLOYEE MODAL (NEW) ================= */

function EmployeeModal({ onClose }: { onClose: () => void }) {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);

  useEffect(() => {
    const init = async () => {
      const data = (await getEmployees()) as EmployeeApi[];

      const mapped = data.map((e) => ({
        employeeID: e.employeeID,
        name: e.name,
        specialisms: (e.specialisms || []).join(", "),
      }));

      setEmployees(mapped);
    };

    init();
  }, []);

  const updateField = (row: number, value: string) => {
    setEmployees((prev) =>
      prev.map((e, i) =>
        i === row ? { ...e, specialisms: value } : e
      )
    );
  };

  const handleSave = async () => {
    const updates: Promise<void>[] = [];

    employees.forEach((emp) => {
      const specialismsArray = emp.specialisms
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      updates.push(
        addSpecialism({
          employeeName: emp.name,
          specialisms: specialismsArray,
        })
      );
    });

    await Promise.all(updates);

    alert("Specialisms saved");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[600px] max-h-[80vh] overflow-auto space-y-4">
        <h2 className="text-lg font-semibold">Add Employee Specialisms</h2>

        {employees.map((emp, i) => (
          <div key={`${emp.employeeID}-${i}`} className="grid grid-cols-2 gap-2">
            <div>{emp.name}</div>

            <input
              type="text"
              placeholder="e.g. React, Finance"
              value={emp.specialisms}
              onChange={(e) => updateField(i, e.target.value)}
              className="border px-2 py-1 rounded"
            />
          </div>
        ))}

        <div className="flex justify-end gap-3">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={handleSave}
            className="border-blue-600 rounded text-blue-600 px-3 py-1"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

