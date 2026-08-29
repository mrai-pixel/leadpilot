import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import AppLayout from "@/components/AppLayout";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Leads from "@/pages/Leads";
import LeadProfile from "@/pages/LeadProfile";
import Pipeline from "@/pages/Pipeline";
import Appointments from "@/pages/Appointments";
import Calls from "@/pages/Calls";
import AISalesAgent from "@/pages/AISalesAgent";
import Settings from "@/pages/Settings";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <div className="App dark">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <Protected>
                  <AppLayout />
                </Protected>
              }
            >
              <Route path="/app" element={<Dashboard />} />
              <Route path="/app/leads" element={<Leads />} />
              <Route path="/app/leads/:id" element={<LeadProfile />} />
              <Route path="/app/pipeline" element={<Pipeline />} />
              <Route path="/app/agent" element={<AISalesAgent />} />
              <Route path="/app/appointments" element={<Appointments />} />
              <Route path="/app/calls" element={<Calls />} />
              <Route path="/app/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" theme="dark" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
