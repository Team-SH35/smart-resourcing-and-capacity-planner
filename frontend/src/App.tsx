import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import ProjectSchedule from "./pages/ProjectSchedule";
import BusinessUnit from "./pages/BusinessUnit";
import ProjectDetail from "./pages/IndividualProject";
import Settings from "./pages/Settings";
import { BrowserRouter,Routes,Route } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ProjectSchedule" element={<ProjectSchedule />} />
          <Route path="/BusinessUnit" element={<BusinessUnit />} />
          <Route path="/project/:jobCode" element={<ProjectDetail />} />
          <Route path="/Settings" element={<Settings />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

