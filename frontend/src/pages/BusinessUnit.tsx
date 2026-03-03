import { useParams } from "react-router-dom";
import EmployeeByBUCard from "../components/businessUnit/EmployeeByBUCard";

export default function BusinessUnit() {
  const { unit } = useParams<{ unit: string }>(); // e.g., "Developers" or "Analytics"

  if (!unit) return <div>No business unit selected.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-slate-900">{unit}</h1>
        <EmployeeByBUCard businessUnit={unit} />
      </div>
    </div>
  );
}