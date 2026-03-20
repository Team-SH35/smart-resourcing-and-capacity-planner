import type { ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ChatbotOverlay from "../chatbot/chatbotOverlay";

import { getEmployees, getJobs } from "../../api/client";

/* ================= TYPES ================= */

type AppLayoutProps = {
  children: ReactNode;
};

type Employee = {
  id: number;
  name: string;
};

type Job = {
  jobCode: string;
  description: string;
  customerName: string;
};

/* ================= COMPONENT ================= */

export default function AppLayout({ children }: AppLayoutProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobCodes, setJobCodes] = useState<Job[]>([]);

  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const tokens = ["employee", "project", "client"];

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    const loadData = async () => {
      try {
        const empData = await getEmployees();
        const jobData = await getJobs();

        setEmployees(empData);
        setJobCodes(jobData);
      } catch (err) {
        console.error("Failed to load search data", err);
      }
    };

    loadData();
  }, []);

  /* ================= SEARCH LOGIC ================= */

  const tokenMatch = query.match(/^(employee|project|client):(.*)$/i);
  const tokenType = tokenMatch?.[1];
  const tokenValue = tokenMatch?.[2]?.toLowerCase().trim() || "";

  const clients = [
    ...new Set(jobCodes.map((job) => job.customerName || "Unknown")),
  ];

  let employeeResults: Employee[] = [];
  let projectResults: Job[] = [];
  let clientResults: string[] = [];
  let clientProjectResults: Job[] = [];

  if (tokenType === "employee") {
    employeeResults = employees.filter((emp) =>
      emp.name.toLowerCase().includes(tokenValue)
    );
  } else if (tokenType === "project") {
    projectResults = jobCodes.filter((job) =>
      job.description.toLowerCase().includes(tokenValue)
    );
  } else if (tokenType === "client") {
    clientResults = clients.filter((client) =>
      client.toLowerCase().includes(tokenValue)
    );

    const matchedClient = clients.find(
      (c) => c.toLowerCase() === tokenValue
    );

    if (matchedClient) {
      clientProjectResults = jobCodes.filter(
        (job) => job.customerName === matchedClient
      );
    }
  } else if (query !== "") {
    const lower = query.toLowerCase();

    employeeResults = employees.filter((emp) =>
      emp.name.toLowerCase().includes(lower)
    );

    projectResults = jobCodes.filter((job) =>
      job.description.toLowerCase().includes(lower)
    );
  }

  /* ================= NAVIGATION ================= */

  const goToResult = (type: string, value: string) => {
    setQuery(`${type}: ${value}`);

    if (type === "employee") {
      navigate(`/employee/${encodeURIComponent(value)}`);
    }

    if (type === "project") {
      navigate(`/project/${encodeURIComponent(value)}`);
    }

    if (type === "client") {
      navigate(`/ProjectSchedule?client=${encodeURIComponent(value)}`);
    }

    setIsFocused(false);
  };

  const handleSearch = () => {
    const search = query.toLowerCase().trim();
    if (!search) return;

    const employeeMatch = employees.find((emp) =>
      emp.name.toLowerCase().includes(search)
    );

    if (employeeMatch) {
      navigate(`/employee/${employeeMatch.name}`);
      setIsFocused(false);
      return;
    }

    const projectMatch = jobCodes.find((job) =>
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

  /* ================= CLICK OUTSIDE ================= */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= UI ================= */

  return (
    <div className="flex h-screen bg-slate-50 pt-16">
      <header className="fixed top-0 left-0 right-0 z-10">
        <Topbar />
      </header>

      <ChatbotOverlay />

      <aside className="w-64 bg-white border-r px-4 py-6">
        <Sidebar />
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Search */}
        <div className="flex justify-center p-10 relative" ref={wrapperRef}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search for employee, project or client..."
            className="w-full max-w-5xl px-5 py-3 rounded-full border-[3px] border-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {isFocused && (
            <div className="absolute top-16 w-full max-w-5xl bg-white border rounded-xl shadow mt-8 z-20">
              {/* Tokens */}
              {query === "" &&
                tokens.map((t) => (
                  <div
                    key={t}
                    onClick={() => setQuery(`${t}:`)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                  >
                    <span>{t}:</span>
                    <span className="text-xs text-gray-500">filter</span>
                  </div>
                ))}

              {/* Employees */}
              {employeeResults.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => goToResult("employee", emp.name)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                >
                  <span>{emp.name}</span>
                  <span className="text-xs text-gray-500">employee</span>
                </div>
              ))}

              {/* Projects */}
              {projectResults.map((job) => (
                <div
                  key={job.jobCode}
                  onClick={() => goToResult("project", job.jobCode)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                >
                  <span>{job.description}</span>
                  <span className="text-xs text-gray-500">project</span>
                </div>
              ))}

              {/* Clients */}
              {clientResults.map((client) => (
                <div
                  key={client}
                  onClick={() => goToResult("client", client)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                >
                  <span>{client}</span>
                  <span className="text-xs text-gray-500">client</span>
                </div>
              ))}

              {/* Client Projects */}
              {clientProjectResults.map((job) => (
                <div
                  key={job.jobCode}
                  onClick={() => goToResult("project", job.jobCode)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                >
                  <span>{job.description}</span>
                  <span className="text-xs text-gray-500">project (client)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 p-1">{children}</div>
      </main>
    </div>
  );
}