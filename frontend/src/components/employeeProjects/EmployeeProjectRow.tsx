import EmployeeProjectCard from "./EmployeeProjectCard";

interface Props {
  jobCode: string;
  jobDescription: string;
  daysAllocated: number;
  currentDate: Date;
  maxAllocatedDays: number;
  onUpdateAllocation: (jobCode: string, newDays: number) => void;
  onDeleteAllocation: (jobCode: string) => void;
}

export default function EmployeeProjectRow({
  jobCode,
  jobDescription,
  daysAllocated,
  currentDate,
  maxAllocatedDays,
  onUpdateAllocation,
  onDeleteAllocation,
}: Props) {
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();


  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <EmployeeProjectCard
          jobCode={jobCode}
          jobDescription={jobDescription}
          daysAllocated={daysAllocated}
          daysInMonth={daysInMonth}
          maxAllocatedDays={maxAllocatedDays}
          onUpdateAllocation={onUpdateAllocation}
          onDeleteAllocation={onDeleteAllocation}
        />
      </div>
    </div>
  );
}