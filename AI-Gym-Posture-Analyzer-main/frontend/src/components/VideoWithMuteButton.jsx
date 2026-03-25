// src/components/ui/VideoWithMuteButton.jsx
import React, { useState, useRef } from 'react';
// Import icons from lucide-react (which you are already using)
import { Volume2, VolumeX } from 'lucide-react'; 

const VideoWithMuteButton = ({ videoSrc }) => {
    const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
    const videoRef = useRef(null);

    const toggleMute = () => {
        if (videoRef.current) {
            // 1. Toggle the video element's muted property
            videoRef.current.muted = !videoRef.current.muted;
            // 2. Update React state to re-render the correct icon
            setIsMuted(videoRef.current.muted);
        }
    };

    return (
        // 1. Container: Relative positioning for the button
        <div className=" shadow-xl relative border-white rounded-lg p-3 m-4  mb-2   hover:text-white text-black h-auto  md:w-150">
            
            {/* 2. The Video Element */}
            {/* Note: No 'controls' attribute. We handle state manually. */}
            <video 
                ref={videoRef}
                className="w-full block"
                autoPlay
                muted={isMuted} // Controlled by React state
                loop
                playsInline
            >
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* 3. The Custom Mute Toggle Button */}
            <button 
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute video" : "Mute video"}
                // Tailwind classes for styling and positioning
                className="absolute cursor-pointer  bottom-5 right-5 z-10 p-3 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all transform hover:scale-105"
            >
                {isMuted ? (
                    // Show "Muted" icon if currently muted
                    <VolumeX size={24} />
                ) : (
                    // Show "Volume" icon if currently unmuted
                    <Volume2 size={24} />
                )}
            </button>
        </div>
    );
};

export default VideoWithMuteButton;