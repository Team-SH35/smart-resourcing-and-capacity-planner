import { useState } from "react";
import { uploadExcel } from "../api/client"; 

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

      setSuccess("Excel uploaded successfully");
    } catch (err: unknown) {
      console.error(err);
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-xl font-semibold">
        Hi SH35,{" "}
        <span className="text-slate-400">
          here’s the current settings
        </span>
      </h1>

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
      </div>
    </div>
  );
}