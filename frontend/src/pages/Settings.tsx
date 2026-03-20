import { useState, useEffect } from "react";
import {
  uploadExcel,
  getJobs,
  updateStartDate,
  updateEndDate,
  updateBudget,
  updateTimeBudget,
  updateCurrencySymbol,
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

const CURRENCIES = ["£", "$", "€"];

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const [showJobModal, setShowJobModal] = useState(false);

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

      <div className="bg-white p-4 rounded-xl border space-y-3">
        <input type="file" onChange={handleFileChange} />

        {loading && <p>Uploading...</p>}

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

          </div>
        )}
      </div>

      {showJobModal && (
        <JobModal onClose={() => setShowJobModal(false)} />
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

  // ✅ typed handlers
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

        {jobs.map((job, i) => (
          <div key={job.jobCode} className="grid grid-cols-7 gap-2">
            <div>{job.jobCode}</div>
            <div>{job.description}</div>

            <input type="date" value={job.startDate} onChange={handleInputChange(i, "startDate")} />
            <input type="date" value={job.endDate} onChange={handleInputChange(i, "endDate")} />
            <input type="number" value={job.budget} onChange={handleInputChange(i, "budget")} />
            <input type="number" value={job.timeBudget} onChange={handleInputChange(i, "timeBudget")} />

            <select value={job.currency} onChange={handleSelectChange(i)}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        ))}

        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}

