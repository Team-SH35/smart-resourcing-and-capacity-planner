import type { ForecastEntry, JobCode } from "../data/types";
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


  const maxAllocatedDays =
    forecastEntries.length > 0
      ? Math.max(...forecastEntries.map(a => a.days))
      : 0;

  return (
    <div className="space-y-4">
      {forecastEntries.map(entry => {
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
