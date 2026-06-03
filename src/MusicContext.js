import React, { createContext, useRef, useState, useEffect } from "react";
import son from "./son.mp3";

export const MusicContext = createContext();

export function MusicProvider({ children }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(son);
      audioRef.current.loop = true; // optional: keep looping

      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current.currentTime);
      };
    }

    return () => {
      // ❌ Do NOT cleanup here, or it will stop music when route changes
    };
  }, []);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <MusicContext.Provider value={{ isPlaying, togglePlayPause, currentTime }}>
      {children}
    </MusicContext.Provider>
  );
}
