import "./App.css";
import {  Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Analyze from "./pages/Analyze";
import HowItWorks from "./components/ui/HowItWorks";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import WorkoutHistory from "./pages/WorkoutHistory";

function App() {
  return (
    <main className="min-h-screen text-center flex flex-col gap-10 items-center">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/login" element={<LoginPage isLogin={true}/>} />
        <Route path="/login/register" element={<LoginPage isLogin={false}/>} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<WorkoutHistory /> } />
      </Routes>
    </main>
  );
}
export default App;
