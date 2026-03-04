import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import ProjectSchedule from "./pages/ProjectSchedule";
import BusinessUnit from "./pages/BusinessUnit";
import IndividualProject from "./pages/IndividualProject";
import Settings from "./pages/Settings";
import EmployeeProject from "./pages/EmployeeProjects";
import { BrowserRouter,Routes,Route } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ProjectSchedule" element={<ProjectSchedule />} />
          <Route path="/BusinessUnit/:unit" element={<BusinessUnit />} />
          <Route path="/Project/:jobCode" element={<IndividualProject />} />
          <Route path="/Settings" element={<Settings />} />
          <Route path="/Employee/:employeeName" element={<EmployeeProject />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

