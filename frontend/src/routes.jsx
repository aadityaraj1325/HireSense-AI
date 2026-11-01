import { Navigate, createBrowserRouter } from "react-router-dom";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Landing from "@/pages/Landing";
import Resumes from "@/pages/Resumes";
import ResumeDetail from "@/pages/ResumeDetail";
import ExportPage from "@/pages/Export";
import Insights from "@/pages/Insights";
import Versions from "@/pages/Versions";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import Interview from "@/pages/Interview";
import LiveInterviewStudio from "@/pages/LiveInterviewStudio";
import KeywordIntelligence from "@/pages/KeywordIntelligence";
import CareerRoadmap from "@/pages/CareerRoadmap";
import MentorWorkspace from "@/pages/MentorWorkspace";
import DeveloperTracker from "@/pages/DeveloperTracker";
import GapIntelligenceLab from "@/pages/GapIntelligenceLab";
import { useAuth } from "@/context/AuthContext";

function HomeRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--ink-muted)] text-sm">
        Loading...
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

export const router = createBrowserRouter([
  { path: "/", element: <HomeRoute /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/",
    element: <ProtectedShell />,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "resumes", element: <Resumes /> },
      { path: "resumes/:id", element: <ResumeDetail /> },
      { path: "resumes/:id/keyword-intelligence", element: <KeywordIntelligence /> },
      { path: "resumes/:id/roadmap", element: <CareerRoadmap /> },
      { path: "resumes/:id/roadmap/:roadmapId", element: <CareerRoadmap /> },
      { path: "resumes/:id/roadmap/:roadmapId/mentor", element: <MentorWorkspace /> },
      { path: "resumes/:id/export", element: <ExportPage /> },
      { path: "insights", element: <Insights /> },
      { path: "versions", element: <Versions /> },
      { path: "history", element: <Navigate to="/settings?tab=history" replace /> },
      { path: "settings", element: <Settings /> },
      { path: "settings/gap-intelligence", element: <GapIntelligenceLab /> },
      { path: "interview", element: <Interview /> },
      { path: "interview/live/:sessionId", element: <LiveInterviewStudio /> },
      { path: "developer-tracker", element: <DeveloperTracker /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
