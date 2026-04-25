import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/ui/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import AIFitnessCoach from "../components/AIFitnesscoach";

function Analyze() {
  const [liveVideo, setLiveVideo] = useState(false);
  const [reps, setReps] = useState(0);
  const [form, setForm] = useState("N/A");
  const [accuracy, setAccuracy] = useState(0);
  const [videoSrc, setVideoSrc] = useState("");
  const [detectedExercise, setDetectedExercise] = useState('Detecting...');
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionExercises, setSessionExercises] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [saveSessionModal, setSaveSessionModal] = useState(false);
  const [sessionName, setSessionName ] = useState("");
  const [sessionToSave, setSessionToSave] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const lastSpokenMessage = useRef(null);
  const currentExerciseData = useRef({ name: null, startTime: null, reps: 0, accuracySum: 0, frameCount: 0 });
  const { t, language } = useLanguage();
  const [showCoach, setShowCoach] = useState(false);
  

  // --- No changes to your useEffect logic ---
  useEffect(() => {
    if(token){
      setIsLoggedIn(true)
    }
  },[])
  useEffect(() => {
    let eventSource;
    if (liveVideo) {
      if (!sessionStartTime) {
        setSessionStartTime(new Date());
      }
      eventSource = new EventSource(`${import.meta.env.VITE_API_URL}/data`);
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const newlyDetectedExercise = data.exercise || null;

        if (newlyDetectedExercise && newlyDetectedExercise !== 'Detecting...' && newlyDetectedExercise !== currentExerciseData.current.name) {
          if (currentExerciseData.current.name && currentExerciseData.current.frameCount > 0 && currentExerciseData.current.reps > 0) {
            const exerciseEndTime = new Date();
            const durationSeconds = Math.round((exerciseEndTime - currentExerciseData.current.startTime) / 1000);
            const avgAccuracy = Math.round(currentExerciseData.current.accuracySum / currentExerciseData.current.frameCount);
            setSessionExercises(prev => [
              ...prev,
              {
                exercise_name: currentExerciseData.current.name,
                reps: currentExerciseData.current.reps,
                avg_accuracy: avgAccuracy,
                duration_seconds: durationSeconds
              }
            ]);
          }
          console.log("Switching to:", newlyDetectedExercise);
          currentExerciseData.current = {
            name: newlyDetectedExercise,
            startTime: new Date(),
            reps: 0,
            accuracySum: 0,
            frameCount: 0
          };
        }

        if (newlyDetectedExercise && newlyDetectedExercise !== 'Detecting...' && newlyDetectedExercise === currentExerciseData.current.name) {
          currentExerciseData.current.reps = data.reps;
          currentExerciseData.current.accuracySum += data.accuracy;
          currentExerciseData.current.frameCount += 1;
        }

        setDetectedExercise(newlyDetectedExercise || 'Detecting...');
        setReps(currentExerciseData.current.name === newlyDetectedExercise ? data.reps : 0);
        setForm(data.form);
        setAccuracy(data.accuracy);
      };
      eventSource.onerror = (err) => {
        console.error("EventSource failed:", err);
        if (eventSource) eventSource.close();
      };
    } else {
      setSessionStartTime(null);
      setSessionExercises([]);
      currentExerciseData.current = { name: null, startTime: null, reps: 0, accuracySum: 0, frameCount: 0 };
    }
    return () => {
      if (eventSource) {
        eventSource.close();
        console.log("EventSource closed");
      }
    };
  }, [liveVideo, token, sessionStartTime]);

  useEffect(() => {
    // Map the backend messages (which are always English) to your JSON keys
    const feedbackMap = {
        "Go Deeper": "go_deeper",
        "Keep Chest Up": "keep_chest_up",
        "Keep Back Straight": "keep_back_straight",
        "Stop Swinging Shoulders": "stop_swinging",
        "Error": "error",
        "Bad Form": "bad_form",
        "Keep Arms Close": "keep_arms_close",
        "Lock Out Arms": "lock_out_arms",
        "Keep Forearms Vertical": "keep_forearms_vertical",
        "Keep Elbows In": "keep_elbows_in",
        "Lower Hips": "lower_hips",
        "Don't Sag Back": "dont_sag_back"
    };

    // Is the current form in our "bad list"?
    const messageKey = feedbackMap[form];

    // Only speak if it's a bad form message AND it's new
    if (messageKey && form !== lastSpokenMessage.current) {
      window.speechSynthesis.cancel();
      
      // Translate the message key to the current language
      const textToSpeak = t(messageKey); 
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Set the voice language (defined in your json files)
      utterance.lang = t('voice_lang_code'); 
      utterance.rate = 1.0;
      
      window.speechSynthesis.speak(utterance);
      lastSpokenMessage.current = form;
    }

    if (form.includes("Good")) {
      lastSpokenMessage.current = null;
    }
  }, [form, language]);

  // --- No changes to your async functions logic ---
  async function startAnalysis() {
    setSessionStartTime(null);
    setSessionExercises([]);
    currentExerciseData.current = { name: null, startTime: null, reps: 0, accuracySum: 0, frameCount: 0 };
    setLiveVideo(true);
    setReps(0);
    setForm('N/A');
    setAccuracy(0);
    setDetectedExercise('Detecting...');
    setVideoSrc(`${import.meta.env.VITE_API_URL}/video?t=${new Date().getTime()}`);
  }

  async function stopWorkout() {
    const sessionEndTime = new Date();
    await fetch(`${import.meta.env.VITE_API_URL}/stop`, { method: "POST" });
    setLiveVideo(false);
    // await setSaveSessionModal(true);
    // console.log("save session modal", saveSessionModal)

    let finalSessionExercises = [...sessionExercises];
    if (currentExerciseData.current.name && currentExerciseData.current.frameCount > 0 && currentExerciseData.current.reps>0) {
      const durationSeconds = Math.round((sessionEndTime - currentExerciseData.current.startTime) / 1000);
      const avgAccuracy = Math.round(currentExerciseData.current.accuracySum / currentExerciseData.current.frameCount);
      finalSessionExercises.push({
        exercise_name: currentExerciseData.current.name,
        reps: currentExerciseData.current.reps,
        avg_accuracy: avgAccuracy,
        duration_seconds: durationSeconds
      });
    }

    const sessionSummary = {
      startTime: sessionStartTime?.toISOString(),
      endTime: sessionEndTime.toISOString(),
      exercises: finalSessionExercises
    };

    console.log("Session Summary to send:", sessionSummary);

    if (sessionSummary.exercises.length > 0 && isLoggedIn)  {
      setSessionToSave(sessionSummary); // Store the data
      setSaveSessionModal(true); // Show the modal
    } else {
      // If no exercises, just reset
      resetSessionState();
    }
  }

  async function handleSaveSession() {
    if (!token || !sessionToSave) {
      alert("Error: No session data to save or not logged in.");
      return;
    }

    // Add the user-defined name to the session object
    const finalSessionData = {
      ...sessionToSave,
      sessionName: sessionName || `Workout - ${new Date().toLocaleDateString()}` // Add a default name
    };

    try {
      console.log("Saving session:", finalSessionData);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/save_session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(finalSessionData)
      });

      if (response.ok) {
        const data = await response.json();
        alert("Workout session saved successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to save workout: ${errorData.message}`);
      }
    } catch (err) {
      alert("An error occurred while saving the workout.");
    } finally {
      // Close modal and reset everything
      handleDiscardSession();
    }
  }

  function handleDiscardSession() {
    setSaveSessionModal(false);
    resetSessionState();
  }

  // --- NEW: Helper to reset all session state ---
  function resetSessionState() {
    setDetectedExercise(null);
    setVideoSrc("");
    setSessionStartTime(null);
    setSessionExercises([]);
    currentExerciseData.current = { name: null, startTime: null, reps: 0, accuracySum: 0, frameCount: 0 };
    setSessionToSave(null);
    setSessionName("");
  }

  // --- START OF UI / CSS CHANGES ---
  return (
    // Use a softer background color and default to a modern sans-serif font
    <div className="bg-gray-50 min-h-screen w-full font-sans text-gray-900">
      {!isLoggedIn && <Navbar />}
      
      {saveSessionModal && (
        // Modal Overlay: dark background, fills screen
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm  ">
          {/* Modal Content */}
          <div className="bg-[#cfb498] shadow-sm shadow-gray-300 p-6 rounded-lg shadow-xl text-white w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{t('save_session_title')}</h2>
            {/* <p className="mb-4 text-gray-100">Name your workout session to save it to your history.</p> */}
            <div>
              <input
                type="text"
                placeholder={`Leg Day, Back and Biceps ...`}
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
              />
            </div>
            <div className="mt-6 flex justify-center gap-4">
              {/* FIX: Use arrow functions for onClick */}
              <button
                onClick={handleDiscardSession}
                className="px-4 py-2 font-semibold text-gray-700 hover:cursor-pointer bg-gray-200 rounded-md hover:bg-gray-300"
              >
                {t('discard_session')}
              </button>
              <button
                onClick={handleSaveSession}
                className="px-4 py-2 font-semibold text-black hover:cursor-pointer bg-yellow-200 rounded-md hover:bg-yellow-300"
              >
                {t('save_session')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content wrapper with padding and max-width for a sleek, centered layout */}
      <main className="w-full max-w-7xl mx-auto px-4 py-8">
        {!liveVideo ? (
          // "Lobby" view before starting workout
          <div className="flex flex-col items-center justify-center gap-6 text-center h-[70vh]">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
             {t('app_title')}
            </h1>
            <p className="text-lg text-gray-600 max-w-lg">
              {t('analysis_subtitle')}
            </p>
            <button
              className="font-bold bg-red-500 cursor-pointer text-white m-4 hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl rounded-lg py-3 px-8 text-lg hover:scale-[1.03]"
              onClick={startAnalysis}
            >
              {t('start_analysis')}
            </button>
            {!isLoggedIn && <button
              className="font-bold bg-[#cfb498] cursor-pointer text-white m-4 transition-all duration-200 shadow-lg hover:shadow-xl rounded-lg py-3 px-8 text-lg hover:scale-[1.03]"
              onClick={() => navigate("/login/register")}
            >
              {t('signup')}
            </button>}
            <div>
              <h3 className="text-xl font-medium max-w-xl">{t('fitness_coach')}</h3>
              <button
  onClick={() => setShowCoach(!showCoach)}
  className="hover:scale-[1.03] rounded-lg transition-all duration-200 shadow-lg text-white hover:shadow-xl px-8 py-3 m-2 text-lg font-bold bg-blue-300 hover:cursor-pointer"
>
  {t('fitness_btn')}
</button>
            </div>
          </div>
        ) : (
          // "Active Workout" view
          <div className="w-full flex flex-col items-center gap-6">
            <button
              className="border-2 font-bold hover:shadow-lg bg-red-500 text-white rounded-lg py-3 px-8 text-lg hover:bg-red-600 transition-all duration-200"
              onClick={stopWorkout} 
            >
              {t('stop_workout')}
            </button>

            {/* Main analysis area */}
            <div className="flex flex-col lg:flex-row items-start justify-center gap-8 w-full">
              
              {/* Video Feed: Made larger and added shadow */}
              <div className="w-full lg:flex-1">
                <img
                  src={videoSrc}
                  alt="AI Gym Trainer"
                  className="rounded-xl shadow-2xl border-4 border-orange-500 w-full aspect-[3/4] md:aspect-[4/3] object-cover"
                />
              </div>

              {/* Stats Panel: Restyled for a modern "dashboard card" look */}
              <div className="w-full lg:w-96 md:h-155 bg-gray-800 rounded-xl shadow-2xl p-6 text-white space-y-6 md:flex flex-col justify-between ">

                <div>
                <h2 className="text-2xl font-bold mb-4 text-orange-500 text-center uppercase tracking-wider">
                  {t('stats')}
                </h2>

                {/* Detected Exercise */}
                <div className="text-center bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-400 uppercase">{t('exercise')}</p>
                  <p className="text-3xl font-bold capitalize">
                    {detectedExercise.replace('_', ' ')}
                  </p>
                </div>
                </div>

                <div className="flex flex-col gap-4 md:mb-15">

                {/* Reps */}
                <div className="flex justify-between items-baseline p-3 bg-gray-700 rounded-lg">
                  <p className="text-lg font-medium text-gray-400">{t('reps')}</p>
                  <p className="text-4xl font-bold text-green-400 font-mono">{reps}</p>
                </div>

                {/* Form */}
                <div className="flex justify-between items-baseline p-3 bg-gray-700 rounded-lg">
                  <p className="text-lg font-medium text-gray-400">{t('form')}</p>
                  <p
                    className={`text-3xl font-bold ${
                      form === t('good_form') || form === t('good_depth')
                        ? "text-green-400"
                        : "text-red-500"
                    }`}
                  >
                    {form==="Go Deeper"?t('go_deeper'):
                    form==="Keep Chest Up"?t('keep_chest_up'):
                    form==="Keep Back Straight"?t('keep_back_straight'):
                    form==="Bad Form"?t('bad_form'):
                    form==="Lock Out Arms"?t('lock_out_arms'):
                    form==="Keep Forearms Vertical"?t('keep_forearms_vertical'):
                    form==="Keep Elbows In"?t('keep_elbows_in'):
                    form==="Lower Hips"?t('Lower Hips'):
                    form==="Don't Sag Back"?t('dont_sag_back'):
                    form==="Good Form"?t('good_form'):
                    form==="Good Depth"?t('good_depth'):
                    form==="Keep Arms Close"?t('keep_arms_close'):form
                    }
                  </p>
                </div>

                {/* Accuracy */}
                <div className="flex justify-between items-baseline p-3 bg-gray-700 rounded-lg">
                  <p className="text-lg font-medium text-gray-400">{t('accuracy')}</p>
                  <p
                    className={`text-4xl font-bold font-mono ${
                      accuracy > 85 ? "text-green-400" : "text-yellow-500"
                    }`}
                  >
                    {accuracy}%
                  </p>
                </div>
              </div>
            </div>
          </div>
                </div>
        )}
        {showCoach && <AIFitnessCoach />}
      </main>
    </div>
  );
}

export default Analyze;