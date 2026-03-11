import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ChatbotOverlay from "../chatbot/chatbotOverlay";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { employees } from "../data/employees";
import { jobCodes } from "../data/jobCodes";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const q = query.toLowerCase();

  // Live search results
  const employeeResults = employees.filter(emp =>
    emp.name.toLowerCase().includes(q)
  );

  const projectResults = jobCodes.filter(job =>
    job.description.toLowerCase().includes(q)
  );

  const clientResults = jobCodes.filter(job =>
    job.customerName.toLowerCase().includes(q)
  );

  const businessUnitResults = employees.filter(emp =>
    emp.specialisms.some(spec =>
      spec.toLowerCase().includes(q)
    )
  );

  const goToResult = (type: string, value: string) => {
    if (type === "employee") navigate(`/employee/${value}`);
    if (type === "project") navigate(`/project/${value}`);
    if (type === "client") navigate(`/client/${value}`);
    if (type === "unit") navigate(`/business-unit/${value}`);

    setQuery("");
  };

  const handleSearch = () => {
    const search = query.toLowerCase().trim();
    if (!search) return;

    const employeeMatch = employees.find(emp =>
      emp.name.toLowerCase().includes(search)
    );

    if (employeeMatch) {
      navigate(`/employee/${employeeMatch.name}`);
      setQuery("");
      return;
    }

    const projectMatch = jobCodes.find(job =>
      job.description.toLowerCase().includes(search)
    );

    if (projectMatch) {
      navigate(`/project/${projectMatch.jobCode}`);
      setQuery("");
      return;
    }

    const clientMatch = jobCodes.find(job =>
      job.customerName.toLowerCase().includes(search)
    );

    if (clientMatch) {
      navigate(`/client/${clientMatch.customerName}`);
      setQuery("");
      return;
    }

    const businessUnitMatch = employees.find(emp =>
      emp.specialisms.some(spec =>
        spec.toLowerCase().includes(search)
      )
    );

    if (businessUnitMatch) {
      navigate(`/business-unit/${businessUnitMatch.specialisms[0]}`);
      setQuery("");
      return;
    }

    alert("No results found");
  };

  return (
    <div className="flex h-screen bg-slate-50 pt-16">
      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 z-10">
        <Topbar />
      </header>

      {/* Chatbot button */}
      <ChatbotOverlay />

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r px-4 py-6">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-y-auto">

          {/* Search */}
          <div className="flex justify-center p-10">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Search for project, client, business department..."
              className="w-full max-w-5xl px-5 py-3 rounded-full border-[3px] border-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

        {/* Page content */}
        <div className="flex-1 p-1">
          {children}
        </div>
      </main>
    </div>
  );
}
