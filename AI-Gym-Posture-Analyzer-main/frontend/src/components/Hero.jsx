import { Link } from "react-router-dom";
import { useCallback } from 'react';
import Particles from "react-tsparticles";
import {loadSlim} from "tsparticles-slim";
import { useLanguage } from "../context/LanguageContext";
import VideoWithMuteButton from "./VideoWithMuteButton";
function Hero() {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const {t} = useLanguage();

  // 👇 Particle options with dumbbell image shape
  const particleOptions = {
  fullScreen: { enable: false },
  particles: {
    number: {
      value: 15,
      density: { enable: true, area: 800 },
    },
    color: "#cfb498",
    shape: {
      type: "image",
      image: [
        {
          src: "/dumbbell.svg", // 👉 your dumbbell image
          width: 26,
          height: 26,
        },
      ],
    },
    opacity: { value: 0.8 },
    size: {
      value: 8,
      random: { enable: true, minimumValue: 23 },
    },
    move: {
      enable: true,
      speed: 2,
      direction: "none",
      outModes: { default: "bounce" },
    },
  },
  detectRetina: true,
};

  return (
    <div className="h-full mt-40 md:mt-0 md:flex md:flex-col md:items-center">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={particleOptions}
        className="absolute hidden md:block top-0 left-0 w-full h-full z-[0]"
      />

      {/* Header Section */}
      <div className="z-1 ">
        <h1 className="text-[#cfb498] bg-white z-1 text-5xl md:text-6xl md:mt-40 md:mb-20 font-bold font-serif">{t('landing_title')}</h1>
      </div>
      {/* Demo Video*/}
      <div className="flex md:w-300  flex-col md:flex-row items-center md:justify-between justify-center md:flex-row md:justify-center md:items-start  ">
        <div className="md:flex bg-white z-1 md:flex-col items-center justify-center">
          <div className="">
            <VideoWithMuteButton videoSrc={'./demoVideo2.0.mp4'} />
          </div>
          <p className="text-gray-400 text-md italic md:text-2xl text-center md:ml-14">Demo Video</p>
        </div>
        {/* Description Section */}
        <div className="bg-white z-1">
          <p className="text-[#cfb498] font-semibold text-xl md:text-3xl m-3 md:text-left">
            {t('landing_subtitle')}
          </p>
          <div className="flex justify-center items-center md:justify-start focus:none">
            <Link
              to="/analyze"
              className="text-white font-bold animate-pulse focus:none border-2 hover:cursor-pointer bg-[#cfb498] p-3 rounded-3xl md:flex px-24 md:w-fit md:px-12"
            >
              {t('trynow')}
            </Link>
          </div>
        </div>
      </div>
      </div>
  );
}
export default Hero;
