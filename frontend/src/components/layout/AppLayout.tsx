import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ChatbotOverlay from "../chatbot/chatbotOverlay";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { employees } from "../data/employees";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
    const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const match = employees.find(emp =>
      emp.name.toLowerCase().includes(query.toLowerCase())
    );

    if (match) {
      navigate(`/employee/${match.name}`);
      setQuery("");
    } else {
      alert("Employee not found");
    }
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
