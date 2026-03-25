// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import Navbar from "../components/ui/Navbar";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import WorkoutHistory from "./WorkoutHistory";
import {Menu, Play, PanelsTopLeft, Settings, Calendar, LogOut, ChartNoAxesCombined} from "lucide-react"
import ProgressTrends from "./ProgressTrends";
import { useLanguage } from "../context/LanguageContext";
import BMIMeter from "../components/BMIMeter";
import Setting from "./Setting";
import Analyze from "./Analyze";

function Dashboard() {
  const { token, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const {t} = useLanguage();

  // State to manage which view is active
  // We'll default to 'overview'
  const [activeView, setActiveView] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const navigate = useNavigate();

  // --- No changes to your useEffect logic ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setIsLoading(false);
        setError("No token found. Please log in.");
        navigate("/login");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setProfileData(data.user_data);
        } else if (response.status === 401 || response.status === 403) {
          setError("Session expired or invalid. Please log in again.");
          logout();
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Failed to fetch profile.");
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
        setError("An error occurred while fetching your profile.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [token, logout, navigate, refreshTrigger]);

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50 text-red-500">
        {error}
      </div>
    );
  }

  // Helper component for sidebar items
  const SidebarItem = ({ title, viewName, icon }) => (
    <div
      onClick={() => setActiveView(viewName)}
      className={`p-3 m-2 rounded-lg cursor-pointer transition-all duration-200 ${
        activeView === viewName
          ? "bg-yellow-100 text-yellow-900 font-bold" // Active state
          : viewName==="analyze"?"p-3 bg-white/80 border m-2  rounded text-yellow-900 font-bold hover:bg-yellow-200 transition-all duration-200 ":"bg-none text-gray-700 hover:bg-gray-200" // Inactive state
      }`}
    >
      {isSidebarOpen? <h2 className="flex items-center justify-center gap-1">{title}<span>{icon}</span></h2>:<h2 className="flex justify-center items-center">{icon}</h2>}
    </div>
  );

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleString("en-US", {
      dateStyle: "medium",
      // timeStyle: 'short',
    });
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 font-sans">
      <Navbar profileData={profileData.username}/>

      {/* Main layout container */}
      <div className="flex" style={{ paddingTop: "5rem" }}>
        {" "}
        {/* Adjust top padding to match navbar height */}
        {/* --- Sidebar --- */}
        {/* It's fixed, so it stays on the left */}
        <aside
          className={`fixed z-40 left-0  top-15 bg-[#cfb498] bottom-0 border-r border-black ${
            isSidebarOpen ? "w-60" : "w-20"
          }`}
        >
          <div className="text-xl flex flex-col justify-between h-full font-semibold">
            <div
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-3 bg-gray-100 border m-2 rounded cursor-pointer text-center hover:bg-gray-200"
            >
              <span className="text-2xl flex items-center justify-center">
                <Menu />
              </span>
            </div>
            <div>
              {/* Add more items here */}
            <div>
              {/* Use the helper component for state-based view switching */}
              <SidebarItem title={t('sidebar1')} viewName="analyze" icon={<Play />}/>
              <SidebarItem title={t('sidebar2')} viewName="overview" icon={<PanelsTopLeft />}/>
              <SidebarItem title={t('sidebar3')} viewName="history" icon={<Calendar />}/>
              <SidebarItem title={t('sidebar4')} viewName="settings" icon={<Settings />}/>
              <SidebarItem title={t('sidebar5')} viewName="progress" icon={<ChartNoAxesCombined />} />
            </div>
            </div>

            <div
              onClick={logout}
              className="p-3 bg-gray-100 border m-2 rounded cursor-pointer hover:bg-red-100 hover:text-red-700 transition-all duration-200"
            >
              {isSidebarOpen?<h2 className="flex items-center justify-center gap-1">{t('logout')}<span><LogOut /></span></h2>:<h2 className="flex items-center justify-center"><LogOut /></h2>}
            </div>
          </div>
        </aside>
        {/* --- Main Content Area --- */}
        {/* This div will contain the content, offset by the sidebar's width */}
        <main className={`${isSidebarOpen? "md:ml-60 ml-20":"ml-20"} w-full p-8`}>
          {/* Conditionally render the "Overview" content */}
          {activeView === "analyze" && (
            <Analyze />
          )}
          {activeView === "overview" && (
            <div className="flex flex-col items-center gap-10 animate-fade-in">
              <h1 className="text-[#cfb498] font-bold text-5xl">
                {t('dash_title')} {profileData?.username}!
              </h1>

              {/* Restyled Profile Card */}
              <div className="w-full max-w-lg bg-white rounded-lg shadow-xl p-6 text-left">
                <h2 className="text-2xl text-center font-semibold mb-4 border-b pb-2 text-gray-800">
                  {t('dash_subtitle')}
                </h2>
                <div className="space-y-3 text-lg text-gray-700">
                  <p>
                    <span className="font-semibold">{t('dash_age')}</span>{" "}
                    {profileData?.age}
                  </p>
                  <p>
                    <span className="font-semibold">{t('dash_height')}</span>{" "}
                    {profileData?.height} cm
                  </p>
                  <p>
                    <span className="font-semibold">{t('dash_weight')}</span>{" "}
                    {profileData?.weight} kg
                  </p>
                  <p>
                    <span className="font-semibold">{t('dash_bmi')}</span>{" "}
                    {profileData?.bmi ? profileData.bmi.toFixed(2) : "N/A"}
                  </p>
                  <BMIMeter bmi={profileData?.bmi}/>
                  {/* <p><span className="font-semibold">Account created at:</span> {formatDate(profileData?.created_at)}</p> */}
                </div>
              </div>

              <div className="mt-12 z-1">
                <Link
                  to="/analyze"
                  className="text-white p-4  font-bold text- animate-pulse focus:outline-none border-2 border-[#cfb498] bg-[#cfb498] rounded-full shadow-lg hover:animate-none hover:bg-opacity-90 transition-all duration-200"
                >
                  {t('dash_button')}
                </Link>
              </div>
            </div>
          )}

          {/* Conditionally render the "Workout History" component */}
          {activeView === "history" && (
            <WorkoutHistory profileData={profileData} />
          )}

          {/* Placeholder for Settings */}
          {activeView === "settings" && (
            <Setting
                  profileData={profileData} 
                  onUpdateSuccess={() => setRefreshTrigger(prev => prev + 1)} 
              />
          )}

          {activeView === "progress" && <ProgressTrends profileData={profileData}/>}
        </main>
      </div>
    </div>
  );
}
export default Dashboard;
