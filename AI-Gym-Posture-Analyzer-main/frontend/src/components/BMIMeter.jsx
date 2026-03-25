import React from 'react';

const BMIMeter = ({ bmi }) => {
  // 1. Handle missing or invalid BMI
  if (!bmi) return null;

  // 2. Define the scale limits
  const minScale = 15;
  const maxScale = 40;

  // 3. Calculate percentage position of the needle
  // Formula: ((Value - Min) / (Max - Min)) * 100
  let percentage = ((bmi - minScale) / (maxScale - minScale)) * 100;
  
  // Clamp the percentage between 0% and 100%
  percentage = Math.max(0, Math.min(100, percentage));

  // 4. Determine status label and color
  let status = "";
  let statusColor = "";

  if (bmi < 18.5) {
    status = "Underweight";
    statusColor = "text-blue-500";
  } else if (bmi < 25) {
    status = "Healthy Weight";
    statusColor = "text-green-500";
  } else if (bmi < 30) {
    status = "Overweight";
    statusColor = "text-yellow-500";
  } else {
    status = "Obese";
    statusColor = "text-red-500";
  }

  return (
    <div className="w-full mt-4">
      {/* Status Label */}
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-semibold text-gray-600">BMI Scale</span>
        <div className="text-right">
          <span className={`text-xl font-bold ${statusColor}`}>{bmi.toFixed(1)}</span>
          <span className={`ml-2 text-sm font-medium ${statusColor}`}>({status})</span>
        </div>
      </div>

      {/* The Meter Bar */}
      <div className="relative h-4 w-full rounded-full overflow-hidden shadow-inner flex">
        {/* Underweight (< 18.5) ~ 14% of the scale (3.5 / 25) */}
        <div className="h-full bg-blue-400 w-[14%]"></div>
        
        {/* Healthy (18.5 - 25) ~ 26% of the scale (6.5 / 25) */}
        <div className="h-full bg-green-400 w-[26%]"></div>
        
        {/* Overweight (25 - 30) ~ 20% of the scale (5 / 25) */}
        <div className="h-full bg-yellow-400 w-[20%]"></div>
        
        {/* Obese (> 30) ~ 40% of remaining scale (10 / 25) */}
        <div className="h-full bg-red-400 flex-1"></div>
      </div>

      {/* The Needle/Marker */}
      <div className="relative w-full h-4 -mt-5">
        <div 
          className="absolute w-1 h-6 bg-black border-2 border-purple-700 rounded shadow-md transform -translate-x-1/2 transition-all duration-500 ease-out"
          style={{ left: `${percentage}%` }}
        ></div>
      </div>
      
      {/* Legend Labels - FIXED: Positioned absolutely to match color breaks */}
      <div className="relative w-full h-6 text-xs text-gray-400 mt-2 font-mono">
        {/* Start */}
        <span className="absolute left-0">15</span>
        
        {/* 18.5 (14%) */}
        <span className="absolute transform -translate-x-1/2" style={{ left: '14%' }}>18.5</span>
        
        {/* 25 (14% + 26% = 40%) */}
        <span className="absolute transform -translate-x-1/2" style={{ left: '40%' }}>25</span>
        
        {/* 30 (40% + 20% = 60%) */}
        <span className="absolute transform -translate-x-1/2" style={{ left: '60%' }}>30</span>
        
        {/* End */}
        <span className="absolute right-0">40</span>
      </div>
    </div>
  );
};

export default BMIMeter;