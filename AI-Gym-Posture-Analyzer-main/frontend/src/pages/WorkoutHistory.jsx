// src/pages/WorkoutHistory.jsx
import { useState } from 'react';
import React from "react";
import { useLanguage } from '../context/LanguageContext';

// No need to import useAuth/logout/navigate, as this is handled by the parent Dashboard
function WorkoutHistory({ profileData }) {
  // This state is local to the history list, which is correct.
  const [expandedIndex, setExpandedIndex] = useState(null);
  const {t} = useLanguage();
  // Helper to format date strings
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-US', {
      dateStyle: 'medium',
      // timeStyle: 'short',
    });
  };
  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-US', {
      // dateStyle: 'short',
      timeStyle: 'short',
    });
  };
  // console.log("profile: ", formatDate(profileData.sessions[2].start_time));

  return (
    // This is now the main container for the history *page content*
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-[#cfb4a0] mt-10 mb-8 font-bold text-5xl text-center">{t('sidebar3')}</h1>

      <div className="flex flex-col gap-4">
        {/* Check if sessions exist and is an array */}
        {profileData?.sessions && Array.isArray(profileData.sessions) && profileData.sessions.length > 0 ? (
          // Reverse the array to show most recent sessions first
          [...profileData.sessions].reverse().map((session, idx) => (
            <div key={session._id || idx} className="w-full bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-300">
              
              {/* Clickable Header */}
              <div
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex flex-col">
                  <p className="font-bold text-left text-xl text-gray-800">
                    {/* Session {profileData.sessions.length - idx} */}
                    {session.session_name || profileData.sessions.length - idx}
                  </p>
                  <p className="text-sm text-left text-gray-500">
                    {formatDate(session.start_time)}
                  </p>
                </div>
                <span className="text-2xl text-gray-600">
                  {expandedIndex === idx ? '▲' : '▼'}
                </span>
              </div>

              {/* Conditionally Rendered Details */}
              {expandedIndex === idx && (
                <div className="flex flex-col p-4 border-t border-gray-200 bg-gray-50 text-left">
                  <div className="mb-4">
                    <p><span className="font-semibold">Session Start:</span> {formatTime(session.start_time)}</p>
                    <p><span className="font-semibold">Session End:</span> {formatTime(session.end_time)}</p>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Exercises Performed ({session.exercises_performed.length})</h3>
                  <div className="space-y-3">
                    {session.exercises_performed.map((exercise, index) => (
                      <div key={index} className="p-3 border rounded-md bg-white shadow-sm">
                        <p className="font-semibold capitalize text-lg text-blue-600">{exercise.exercise_name.replace("_", " ")}</p>
                        <ul className="list-disc pl-5 mt-1 text-gray-700">
                          <li>Reps: {exercise.reps}</li>
                          <li>Avg. Accuracy: {exercise.avg_accuracy}%</li>
                          <li>Duration: {exercise.duration_seconds}s</li>
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 text-lg">No workout history found. Time to start analyzing!</p>
        )}
      </div>
    </div>
  )
}
export default WorkoutHistory;