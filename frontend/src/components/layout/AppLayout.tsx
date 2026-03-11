import type { ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ChatbotOverlay from "../chatbot/chatbotOverlay";

import { employees } from "../data/employees";
import { jobCodes } from "../data/jobCodes";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const wrapperRef = useRef<HTMLDivElement>(null);

  const tokens = ["employee", "project"];
  const tokenMatch = query.match(/^(employee|project):(.*)$/i);
  const tokenType = tokenMatch?.[1];
  const tokenValue = tokenMatch?.[2]?.toLowerCase().trim() || "";

  // Filter results based on token or free text
  let employeeResults: typeof employees = [];
  let projectResults: typeof jobCodes = [];

  if (tokenType === "employee") {
    employeeResults = employees.filter(emp =>
      emp.name.toLowerCase().includes(tokenValue)
    );
  } else if (tokenType === "project") {
    projectResults = jobCodes.filter(job =>
      job.description.toLowerCase().includes(tokenValue)
    );
  } else if (query !== "") {
    // Free-text search fallback
    employeeResults = employees.filter(emp =>
      emp.name.toLowerCase().includes(query.toLowerCase())
    );
    projectResults = jobCodes.filter(job =>
      job.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  const goToResult = (type: string, value: string) => {
    setQuery(`${type}: ${value}`);
  
    if (type === "employee") navigate(`/employee/${value}`);
    if (type === "project") navigate(`/project/${value}`);
    setIsFocused(false);
  };

  const handleSearch = () => {
    const search = query.toLowerCase().trim();
    if (!search) return;

    const employeeMatch = employees.find(emp =>
      emp.name.toLowerCase().includes(search)
    );
    if (employeeMatch) {
      navigate(`/employee/${employeeMatch.name}`);
      setIsFocused(false);
      return;
    }

    const projectMatch = jobCodes.find(job =>
      job.description.toLowerCase().includes(search)
    );
    if (projectMatch) {
      navigate(`/project/${projectMatch.jobCode}`);
      setIsFocused(false);
      return;
    }

    alert("No results found");
    setIsFocused(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 pt-16">
      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 z-10">
        <Topbar />
      </header>

      {/* Chatbot */}
      <ChatbotOverlay />

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r px-4 py-6">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Search */}
        <div className="flex justify-center p-10 relative" ref={wrapperRef}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
            placeholder="Search for project or employee..."
            className="w-full max-w-5xl px-5 py-3 rounded-full border-[3px] border-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {isFocused && (
            <div className="absolute top-16 w-full max-w-5xl bg-white border rounded-xl shadow mt-8 z-20">
              {/* Show token suggestions only when query is empty */}
              {query === "" &&
                tokens.map(t => (
                  <div
                    key={t}
                    onClick={() => setQuery(`${t}:`)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                  >
                    <span>{t}:</span>
                    <span className="text-xs text-gray-500">filter</span>
                  </div>
                ))}

              {/* Employee results */}
              {query !== "" && (tokenType === "employee" || !tokenType) &&
                employeeResults.map(emp => (
                  <div
                    key={emp.name}
                    onClick={() => goToResult("employee", emp.name)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                  >
                    <span>{emp.name}</span>
                    <span className="text-xs text-gray-500">employee</span>
                  </div>
                ))}

              {/* Project results */}
              {query !== "" && (tokenType === "project" || !tokenType) &&
                projectResults.map(job => (
                  <div
                    key={job.jobCode}
                    onClick={() => goToResult("project", job.jobCode)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                  >
                    <span>{job.description}</span>
                    <span className="text-xs text-gray-500">project</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Page content */}
        <div className="flex-1 p-1">{children}</div>
      </main>
    </div>
  );
}