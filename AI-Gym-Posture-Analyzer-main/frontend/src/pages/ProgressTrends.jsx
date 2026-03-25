import React,{ useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie, 
    Cell
} from 'recharts';

const formatDate = (isoString) => {
    if(!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
};

const formatTime = (isoString) => {
    if(!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-US',{timeStyle:'short'})
}

const formatDuration = (ms) => {
    if (isNaN(ms) || ms < 0) return '0m 0s';
    
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}m ${seconds}s`;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
function ProgressTrends({profileData}) {
    const {t} = useLanguage();
    const [timeFilter, setTimeFilter] = useState('all');
    const chartData = useMemo(() => {
        if (!profileData?.sessions || profileData.sessions.length === 0) {
            return [];
        }
        
        console.log("--- Processing Chart Data ---"); // Debugging: Check if hook runs
        
        return profileData.sessions.map((session, index) => {
            
            // --- FIX: Add guards to ensure values are numbers ---
            // This prevents errors if ex.reps or ex.avg_accuracy is null/undefined
            
            const totalReps = session.exercises_performed.reduce((sum, ex) => {
                // (Number(ex.reps) || 0) makes sure it's a number, or 0 if it's not
                return sum + (Number(ex.reps) || 0); 
            }, 0);
            
            const totalAcc = session.exercises_performed.reduce((sum, ex) => {
                const reps = Number(ex.reps) || 0;
                const acc = Number(ex.avg_accuracy) || 0;
                return sum + (acc * reps);
            }, 0);

            const sessionAvgAccuracy = totalReps > 0 ? Math.round(totalAcc / totalReps) : 0;

            const startTime = new Date(session.start_time);
            const endTime = new Date(session.end_time);
            const sessionTime = (endTime - startTime);
            const sessionTimeInSeconds = (sessionTime/60000);

            

            // --- DEBUGGING: See the exact data being calculated ---
            console.log(`Session ${index + 1}:`, {
                rawSession: session,
                calculatedTotalReps: totalReps,
                calculatedAvgAccuracy: sessionAvgAccuracy,
                sessionTime: sessionTime
            });
            // --- END DEBUGGING ---

            return {
                name: `Session ${index + 1}`,
                date: formatDate(session.start_time),

                "Total Reps": totalReps,
                "Average Accuracy": sessionAvgAccuracy,
                time: formatDuration(sessionTime),
                timeSeconds: sessionTimeInSeconds
            };
        });
    }, [profileData]);
    console.log("Chart data: ",chartData);

    const [selectedExercise, setSelectedExercise] = useState('squats');
    const exerciseData = useMemo(() => {
        if (!profileData?.sessions || profileData.sessions.length === 0) {
            return [];
        }
        return profileData.sessions.map((session, index) => {
           const exercisesInSession = session.exercises_performed.filter(
                ex => ex.exercise_name === selectedExercise
            );

            // Sum the reps for that exercise *within this session*
            // This correctly handles multiple sets of the same exercise in one workout
            const totalReps = exercisesInSession.reduce(
                (sum, ex) => sum + (Number(ex.reps) || 0),
                0
            );

            // Calculate the weighted average accuracy for this exercise *in this session*
            const totalAcc = exercisesInSession.reduce(
                (sum, ex) => sum + (Number(ex.avg_accuracy) || 0) * (Number(ex.reps) || 0),
                0
            );
            
            const sessionAvgAccuracy = totalReps > 0 ? Math.round(totalAcc / totalReps) : 0;
                return {
                    sessionName: `Session ${index + 1}`,
                date: formatDate(session.start_time),
                "Reps": totalReps,
                "Accuracy": sessionAvgAccuracy
                };
            });
        },[profileData, selectedExercise]);
    
        const allPerformedExercises = useMemo(() => {
        if (!profileData?.sessions) return [];
        const exerciseSet = new Set();
        profileData.sessions.forEach(session => {
            session.exercises_performed.forEach(ex => {
                exerciseSet.add(ex.exercise_name);
            });
        });
        return Array.from(exerciseSet);
    }, [profileData]);

    console.log("Exercise Data: ",exerciseData)

    const filteredSessions = useMemo(() => {
        if (!profileData?.sessions || profileData.sessions.length === 0) {
            return [];
        }
        const allSessions = profileData.sessions;
        const now = new Date();
        if (timeFilter === 'week') {
            const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            return allSessions.filter(session => new Date(session.start_time) >= sevenDaysAgo);
        } else if (timeFilter === 'last10') {
            return allSessions.slice(-10);
        }
        return allSessions; // 'all'
    }, [profileData, timeFilter]);

    // --- 3. NEW useMemo for Pie Chart Data (Total Reps per Exercise) ---
    const pieChartData = useMemo(() => {
        const repMap = new Map();
        
        // Sum reps from all filtered sessions
        filteredSessions.forEach(session => {
            session.exercises_performed.forEach(ex => {
                const name = ex.exercise_name.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                const reps = Number(ex.reps) || 0;
                repMap.set(name, (repMap.get(name) || 0) + reps);
            });
        });
        
        // Convert Map to array for Recharts
        return Array.from(repMap, ([name, value]) => ({ name, value }));
        
    }, [filteredSessions]);

    const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        // Get the full data object for this point
        const data = payload[0].payload; 
        
        return (
            <div className="p-3 bg-white rounded shadow-lg border border-gray-300">
                <p className="text-sm font-bold text-gray-900 mb-1">{label}</p>
                <p className="text-sm text-gray-700 mb-2">{`Date: ${data.date}`}</p>
                
                {payload.map((entry, index) => {
                    let valueToShow = entry.value;
                    let unit = '';

                    // Check which data point this is and format it
                    if (entry.dataKey === "timeSeconds") {
                        valueToShow = data["time"]; // Show "5m 15s"
                        entry.name = "Duration";
                    } else if (entry.dataKey === "Average Accuracy") {
                        unit = '%';
                    }

                    return (
                        <p key={index} style={{ color: entry.color }} className="text-sm font-semibold">
                            {`${entry.name}: ${valueToShow}${unit}`}
                        </p>
                    );
                })}
            </div>
        );
    }
    return null;
};

    return (
        <div>
            <h1 className="text-[#cfb4a0] mt-10 mb-8 font-bold text-5xl text-center">{t('sidebar5')}</h1>
            {(chartData.length === 0)? 
            <p>No workouts to show here</p>
            :
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <section className="p-6  bg-white rounded-lg shadow-xl border border-gray-200">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800"> exercises performed per session</h2>
                 <div className="mb-8 flex justify-center items-center gap-4">
                <label htmlFor="exercise-select" className="font-semibold text-lg">Set time filter:</label>
                <select 
                    id="exercise-select"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md shadow-sm"
                    >
                    <option value="all">All</option>
                    <option value="week">Last week</option>
                    <option value="last10">Past 10</option>
                </select>
            </div>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                            <Pie
                                data={pieChartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                labelLine={false}
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                >
                                {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip /> 
                            <Legend />
                        </PieChart>
                </ResponsiveContainer>
            </section>
                    <section className="p-6  bg-white rounded-lg shadow-xl border border-gray-200">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Time taken per session</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="name" stroke="#666" />
                        <YAxis domain={[0, 'auto']} stroke="#666" unit="min" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="timeSeconds" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </section>
            <section className="p-6 w-full md:col-span-2 bg-white rounded-lg shadow-xl border border-gray-200">
                <div className="mb-8 flex justify-center items-center gap-4">
                <label htmlFor="exercise-select" className="font-semibold text-lg">Show progress for:</label>
                <select 
                    id="exercise-select"
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md shadow-sm"
                >
                    {allPerformedExercises.map(exName => (
                        <option key={exName} value={exName}>
                            {exName.replace('_', ' ').charAt(0).toUpperCase() + exName.replace('_', ' ').slice(1)}
                        </option>
                    ))}
                </select>
            </div>
                    <h2 className="text-2xl font-semibold mb-6 text-gray-800">Exercise Reps Over Time</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={exerciseData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="sessionName" stroke="#666" />
                        <YAxis domain={[0, 'auto']} stroke="#666" />
                        <Tooltip wrapperClassName="rounded shadow-md" />
                        <Legend />
                        <Bar dataKey="Reps" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Accuracy Over Time</h2>
                <ResponsiveContainer width="100%" height={300}>
                     <LineChart data={exerciseData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="sessionName" stroke="#666" />
                        <YAxis domain={[0, 100]} stroke="#666" unit="%" />
                        <Tooltip wrapperClassName="rounded shadow-md" />
                        <Legend />
                        <Line type="monotone" dataKey="Accuracy" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
               
            </section>
            </div>  
            </>
            }
            
        </div>
    )
}
export default ProgressTrends;