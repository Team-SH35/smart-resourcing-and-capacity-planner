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

  const tokens = ["employee", "project", "client"];
  const tokenMatch = query.match(/^(employee|project|client):(.*)$/i);

  const tokenType = tokenMatch?.[1];
  const tokenValue = tokenMatch?.[2]?.toLowerCase().trim() || "";

  const clients = [...new Set(jobCodes.map(job => job.customerName))];

  let employeeResults: typeof employees = [];
  let projectResults: typeof jobCodes = [];
  let clientResults: string[] = [];
  let clientProjectResults: typeof jobCodes = [];

  if (tokenType === "employee") {
    employeeResults = employees.filter(emp =>
      emp.name.toLowerCase().includes(tokenValue)
    );
  }

  else if (tokenType === "project") {
    projectResults = jobCodes.filter(job =>
      job.description.toLowerCase().includes(tokenValue)
    );
  }

  else if (tokenType === "client") {

    // show matching client names
    clientResults = clients.filter(client =>
      client.toLowerCase().includes(tokenValue)
    );

    // if exact client typed → show their projects
    const matchedClient = clients.find(
      c => c.toLowerCase() === tokenValue
    );

    if (matchedClient) {
      clientProjectResults = jobCodes.filter(
        job => job.customerName === matchedClient
      );
    }
  }

  else if (query !== "") {
    employeeResults = employees.filter(emp =>
      emp.name.toLowerCase().includes(query.toLowerCase())
    );

    projectResults = jobCodes.filter(job =>
      job.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  const goToResult = (type: string, value: string) => {
    setQuery(`${type}: ${value}`);

    if (type === "employee") {
      navigate(`/Employee/${encodeURIComponent(value)}`);
    }

    if (type === "project") {
      navigate(`/Project/${encodeURIComponent(value)}`);
    }

    if (type === "client") {
      navigate(`/ProjectSchedule?client=${encodeURIComponent(value)}`);
    }

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
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
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={e => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search for employee, project or client..."
            className="w-full max-w-5xl px-5 py-3 rounded-full border-[3px] border-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {isFocused && (
            <div className="absolute top-16 w-full max-w-5xl bg-white border rounded-xl shadow mt-8 z-20">

              {/* Token suggestions */}
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

              {/* Client results */}
              {query !== "" && tokenType === "client" &&
                clientResults.map(client => (
                  <div
                    key={client}
                    onClick={() => goToResult("client", client)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                  >
                    <span>{client}</span>
                    <span className="text-xs text-gray-500">client</span>
                  </div>
                ))}

              {/* Client project results */}
              {clientProjectResults.map(job => (
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

        <div className="flex-1 p-1">{children}</div>

      </main>
    </div>
  );
}

