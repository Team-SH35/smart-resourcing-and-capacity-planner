import { useNavigate } from "react-router-dom";

interface Employee {
  name: string;
  specialisms: string[];
  excludedFromAI: boolean;
}

interface Avatar {
  initials: string;
  color: string;
}

interface BusinessUnitCardProps {
  name: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  avatars: Avatar[];
  employees: Employee[];
  onSave?: (updatedUnit: {
    name: string;
    icon: string;
    employees: Employee[];
  }) => void;
}

export default function BusinessUnitCard({
  name,
  icon,
  iconBgColor,
  iconColor,
  avatars,
  employees
}: BusinessUnitCardProps) {
  const navigate = useNavigate(); 
 
  const handleNavigate = () => {
    navigate(`/businessunit/${name}`);
  };

  const handleEmployeeClick = (employeeName: string) => {
    navigate(`/Employee/${encodeURIComponent(employeeName)}`);
  };
  return (
    <div
      onClick={handleNavigate} 
      className="bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between relative cursor-pointer hover:shadow-md transition"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl ${iconBgColor} flex items-center justify-center`}
          >
            <span className={`material-icons-outlined ${iconColor}`}>{icon}</span>
          </div>
          <span className="font-bold text-lg">{name}</span>
        </div>

      </div>

      <div className="flex items-center">
        {avatars.map((avatar, index) => {
          const employee = employees[index];

          return (
            <div
              key={index}
              onClick={(e) => {
                e.stopPropagation(); // 🔥 prevents card click
                if (employee) {
                  handleEmployeeClick(employee.name);
                }
              }}
              className={`w-8 h-8 rounded-full ${avatar.color} flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800 cursor-pointer hover:scale-105 transition`}
              style={{ marginLeft: index > 0 ? "-0.5rem" : "0" }}
            >
              {avatar.initials}
            </div>
          );
        })}
      </div>

      
    </div>
  );
}
