import { Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
function Navbar({profileData}) {
  const [isLoggedIn, setIsloggedIn] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { token } = useAuth();

  const languages = [
    { code: "en", label: "English" },
    { code: "es", label: "Spanish" },
    { code: "hi", label: "Hindi" },
    { code: "kn", label: "Kannada"},
    { code: "fr", label: "French"},
    { code: "ta", label: "Tamil"},
    { code: "ml", label: "Malayalam"},
    { code: "ja", label: "Japanese"},
    { code: "ar", label: "Arabic"}
  ];

  useEffect(() => {
    if (token) {
      setIsloggedIn(true);
    }
    else setIsloggedIn(false);
  }, []);
  return (
    <nav className="w-full  bg-[#cfb498]  h-15 flex sticky top-0 md:sticky md:top-0 z-99 justify-between items-center  md:flex-row">
      <span className="md:m-4 flex p-2 text-white  font-bold md:text-left text-xl md:text-2xl">
        <Dumbbell className="inline mr-2 " size={25} color="white" />
        <p>FORM AI</p>
      </span>
      <div>
        <ul className="flex items-right md:flex-row gap-3 p-2 text-white md:gap-6 md:p-6 text-md md:text-xl">
          {!isLoggedIn ? (
            <>
              <li className="hover:cursor-pointer hover:text-gray-300">
                <Link to="/">{t('navbar_home')}</Link>
              </li>
               <li className="hover:cursor-pointer hover:text-gray-300">
                <Link to="/login/register">{t('navbar_signup')}</Link>
              </li>
              <li className="hover:cursor-pointer hover:text-gray-300">
                <Link to="/Login">{t('navbar_login')}</Link>
              </li>
            </>
          ) : (
            <>
            <li className="hover:cursor-pointer hover:text-gray-300">
              <Link to="/dashboard">{t('navbar_home')}</Link>
            </li>
            <li className="hover:cursor-pointer hover:text-gray-300  text-white">Hi, <span className="text-gray-100 font-bold">{profileData}</span></li>
          </>
          )}
              {/* Language Toggle Button */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-1  md:px-3 py-1 rounded text-sm font-bold bg-white text-gray-700 hover:bg-gray-100 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
            >
                {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.label}
                    </option>
                ))}
            </select>
        </ul>
      </div>
    </nav>
  );
}
export default Navbar;
