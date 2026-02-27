// EmployeeProjectCard.tsx
interface Props {
  jobCode: string;
  jobDescription: string;
  daysAllocated: number;
  daysInMonth: number;
  onUpdateAllocation: (jobCode: string, newDays: number) => void;
  onDeleteAllocation: (jobCode: string) => void;
}

export default function EmployeeProjectCard({
  jobCode,
  jobDescription,
  daysAllocated,
  daysInMonth,
}: Props) {
  const widthPercent = (daysAllocated / daysInMonth) * 100;

  return (
    <div className="relative h-12 bg-slate-100 rounded-lg overflow-hidden">
      <div className="w-64">
        <div className="font-medium">{jobDescription}</div>
        <div className="text-xs text-slate-400">{jobCode}</div>
      </div>
    </div>
  );
}