import { useLanguage } from "../../context/LanguageContext";

function ExerciseList() {
  const {t} = useLanguage();
  return (
    <div className="">
      <h2 className="text-[#cfb498] font-semibold text-3xl m-4 p-4 ">
        {t('landing_subtitle1')}
      </h2>
      <div className="md:flex md:flex-row md:justify-center md:items-center">
        <div className="flex items-center justify-center ">
          <div className="border-2 border-white rounded-lg p-3 m-7 mt-1 md:m-4 mb-2 hover:cursor-pointer shadow-md hover:shadow-lg hover:shadow-gray-500/50  text-gray-400 h-65 w-75">
            <div className="h-40 w-full  bg-[url('/pushup-exercise.jpg')] bg-cover bg-center" />
            <p className="text-xl text-left">Push Ups</p>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="border-2 border-white rounded-lg p-3 m-7 mt-10 md:m-4 mb-2 hover:cursor-pointer shadow-md hover:shadow-lg hover:shadow-gray-500/50  text-gray-400 h-65 w-75">
             <div className="h-40 bg-[url('/squat-exercise.jpg')] bg-cover bg-center" />
            <p className="text-xl text-left">Squats</p>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="border-2 border-white rounded-lg p-3 m-4 mt-10 md:m-4 mb-2 hover:cursor-pointer  shadow-md hover:shadow-lg hover:shadow-gray-500/50  text-gray-400 h-65 w-75">
             <div className="h-40 w-full bg-[url('/bicepCurls-exercise.png')] bg-cover bg-center" />
            <p className="text-xl text-left">Bicep Curls</p>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="border-2 border-white rounded-lg p-3 m-7 mt-10 md:m-4 mb-2 hover:cursor-pointer shadow-md hover:shadow-lg hover:shadow-gray-500/50   text-gray-400 h-65 w-75">
           <div className="h-40 w-full bg-[url('/shoulderPress-exercise.jpg')] bg-cover bg-center" />
            <p className="text-xl text-left">Shoulder Press</p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ExerciseList;
