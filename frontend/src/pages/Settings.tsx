import { useState, useEffect, useRef } from "react";
import {
  uploadExcel,
  getJobs,
  updateCost,
  updateStartTime,
  updateEndTime,
} from "../api/client";

type JobRow = {
  jobCode: string;
  description: string;
  cost: string;
  startDate: string;
  endDate: string;
};

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [hasUploaded, setHasUploaded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // session-based flag (clears when app closes)
  useEffect(() => {
    const uploaded = sessionStorage.getItem("excelUploaded");
    if (uploaded === "true") {
      setHasUploaded(true);
    }
  }, []);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await uploadExcel(file);

      sessionStorage.setItem("excelUploaded", "true");
      setHasUploaded(true);

      setSuccess("Excel uploaded successfully");
    } catch (err) {
      console.error(err);
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-xl font-semibold">
        Hi SH35{" "}
        <span className="text-slate-400">
          here’s the current settings
        </span>
      </h1>

      {/* Upload Card */}
      <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
        <div>
          <h2 className="font-semibold text-slate-700">
            Upload Resource Plan
          </h2>
          <p className="text-xs text-slate-400">
            Upload an Excel file to update employees, jobs, or forecasts.
          </p>
        </div>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-slate-100 file:text-slate-700
            hover:file:bg-slate-200"
        />

        {loading && (
          <p className="text-sm text-slate-400">Uploading...</p>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {success && (
          <p className="text-sm text-green-600">{success}</p>
        )}

        {/* After upload */}
        {hasUploaded && (
          <div className="border-t pt-4 space-y-2">
            <p className="text-sm text-green-600 font-medium">
              ✔ Excel file already uploaded
            </p>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Add missing project data
            </button>

          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ModalGrid onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

function ModalGrid({ onClose }: { onClose: () => void }) {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const inputsRef = useRef<Array<Array<HTMLInputElement | null>>>([]);

  const workspaceID = 1;

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const data = await getJobs();

    const mapped = data.map((j: any) => ({
      jobCode: j.jobCode,
      description: j.description || "",
      cost: "",
      startDate: "",
      endDate: "",
    }));

    setJobs(mapped);
    inputsRef.current = mapped.map(() => []);
  };

  const updateField = (
    row: number,
    field: keyof JobRow,
    value: string
  ) => {
    setJobs((prev) =>
      prev.map((j, i) =>
        i === row ? { ...j, [field]: value } : j
      )
    );
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    row: number,
    col: number
  ) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();

      const nextCol = col + 1;
      const nextRow = nextCol >= 3 ? row + 1 : row;
      const colIndex = nextCol >= 3 ? 0 : nextCol;

      inputsRef.current[nextRow]?.[colIndex]?.focus();
    }
  };

  const handleSave = async () => {
    try {
      const workspaceID = 1; // keep as number

      const updates: Promise<any>[] = [];

      jobs.forEach((job) => {
        // ✅ COST
        if (job.cost !== "") {
          const costNum = Number(job.cost);

          if (!isNaN(costNum)) {
            updates.push(
              updateCost({
                cost: costNum, // ✅ number
                jobCode: job.jobCode,
                workspaceID, // ✅ number
              })
            );
          }
        }

        // ✅ START DATE
        if (job.startDate) {
          const parsed = new Date(job.startDate);

          if (!isNaN(parsed.getTime())) {
            updates.push(
              updateStartTime({
                startDate: parsed.toISOString(), // ✅ clean ISO
                jobCode: job.jobCode,
                workspaceID,
              })
            );
          }
        }

        // ✅ END DATE
        if (job.endDate) {
          const parsed = new Date(job.endDate);

          if (!isNaN(parsed.getTime())) {
            updates.push(
              updateEndTime({
                endDate: parsed.toISOString(),
                jobCode: job.jobCode,
                workspaceID,
              })
            );
          }
        }
      });

      if (updates.length === 0) {
        alert("Nothing valid to save");
        return;
      }

      await Promise.all(updates);

      alert("Saved successfully");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[1000px] max-h-[80vh] overflow-auto space-y-4">
        <h2 className="text-lg font-semibold">
          Add Missing Project Data
        </h2>

        {/* Header */}
        <div className="grid grid-cols-5 gap-2 font-semibold text-sm border-b pb-2">
          <div>Job Code</div>
          <div>Description</div>
          <div>Cost</div>
          <div>Start Date</div>
          <div>End Date</div>
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {jobs.map((job, row) => (
            <div
              key={job.jobCode}
              className="grid grid-cols-5 gap-2 items-center"
            >
              <div>{job.jobCode}</div>
              <div>{job.description}</div>

              <input
                ref={(el) => {
                  inputsRef.current[row][0] = el;
                }}
                value={job.cost}
                onChange={(e) =>
                  updateField(row, "cost", e.target.value)
                }
                onKeyDown={(e) => handleKeyDown(e, row, 0)}
                className="border px-2 py-1 rounded"
              />

              <input
                ref={(el) => {
                  inputsRef.current[row][1] = el;
                }}
                type="date"
                value={job.startDate}
                onChange={(e) =>
                  updateField(row, "startDate", e.target.value)
                }
                onKeyDown={(e) => handleKeyDown(e, row, 1)}
                className="border px-2 py-1 rounded"
              />

              <input
                ref={(el) => {
                  inputsRef.current[row][2] = el;
                }}
                type="date"
                value={job.endDate}
                onChange={(e) =>
                  updateField(row, "endDate", e.target.value)
                }
                onKeyDown={(e) => handleKeyDown(e, row, 2)}
                className="border px-2 py-1 rounded"
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="border px-3 py-1 rounded"
          >
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