import { ListCheck, Camera, TrendingUp } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

function HowItWorks() {
  const {t} = useLanguage();
  return (
    <div id="how-it-works" className="w-full">
      <h2 className="text-[#cfb498] font-semibold text-3xl m-4 p-4 ">{t('landing_subtitle2')}</h2>
      <div className="md:flex md:flex-row md:justify-center md:items-center">
        <div className="border-2 shadow-md hover:shadow-lg hover:shadow-gray-500/50  border-white rounded-lg p-3 m-7 mt-1 md:m-4 text-[#cfb498] ">
          <span className="flex flex-row items-center justify-center">
            <div className="bg-[#cfb498] rounded-lg p-1">
              <ListCheck className=" " size={35} color="white" />
            </div>
            <p className="p-3 m-3 text-xl"> {t('howitworks1')}</p>
          </span>
          <p className="text-left text-gray-400 italic">
            {t('howitworks1.1')}
          </p>
        </div>
        <div className="border-2 shadow-md hover:shadow-lg hover:shadow-gray-500/50 border-white rounded-lg p-3 m-7 md:m-4 text-[#cfb498] ">
          <span className="flex flex-row items-center justify-center ml-1">
            <div className="bg-[#cfb498] rounded-lg p-1 ">
              <Camera className=" " size={35} color="white" />
            </div>
            <p className="p-3 m-3 text-xl"> {t('howitworks2')}</p>
          </span>
          <p className="text-left text-gray-400 italic">
            {t('howitworks2.2')}
          </p>
        </div>
        <div className="border-2 shadow-md hover:shadow-lg hover:shadow-gray-500/50 border-white rounded-lg p-3 m-7 md:m-4 text-[#cfb498] ">
          <span className="flex flex-row items-center justify-center">
            <div className="bg-[#cfb498] rounded-lg p-1">
              <TrendingUp className=" " size={35} color="white" />
            </div>
            <p className="p-3 m-3 text-xl"> {t('howitworks3')}</p>
          </span>
          <p className="text-left text-gray-400 italic">
            {t('howitworks3.3')}
          </p>
        </div>
      </div>
    </div>
  );
}
export default HowItWorks;
