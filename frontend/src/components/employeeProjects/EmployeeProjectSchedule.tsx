import type { ForecastEntry, JobCode, Employee } from "../data/types";
import EmployeeProjectRow from "./EmployeeProjectRow";

interface Props {
  employeeName: string;
  forecastEntries: ForecastEntry[];
  jobCodes: JobCode[];
  currentDate: Date;
  onUpdateAllocation: (jobCode: string, newDays: number) => void;
  onDeleteAllocation: (jobCode: string) => void;
}

export default function EmployeeProjectSchedule({
  employeeName,
  forecastEntries,
  jobCodes,
  currentDate,
  onUpdateAllocation,
  onDeleteAllocation,
}: Props) {
  const monthKey = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const employeeEntries = forecastEntries.filter(
    entry =>
      entry.employeeName === employeeName &&
      entry.month === monthKey
  );

  const allocations = forecastEntries; // or whatever array you map over

  // Calculate the largest allocation for this set
  const maxAllocatedDays = allocations.length > 0
    ? Math.max(...allocations.map(a => a.days))
    : 0;


  return (
    <div className="space-y-4">
      {employeeEntries.map(entry => {
        const job = jobCodes.find(j => j.jobCode === entry.jobCode);

        return (
          <EmployeeProjectRow
            key={entry.jobCode}
            jobCode={entry.jobCode}
            jobDescription={job?.description ?? entry.jobCode}
            daysAllocated={entry.days}
            currentDate={currentDate}
            maxAllocatedDays={maxAllocatedDays}
            onUpdateAllocation={onUpdateAllocation}
            onDeleteAllocation={onDeleteAllocation}
          />
        );
      })}
    </div>
  );
}
