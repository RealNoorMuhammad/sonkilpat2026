// App.js
import React, { useEffect, useRef } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { Routes, Route, useLocation } from "react-router-dom";

import ArtistSubmission from "./Artist/Automated";
import AiPfpMaker from "./Artist/AiPfpMaker";
import ArtistHome from "./Artist/Home";
import MainHome from "./Components/Home";
import SonUpload from './Artist/SonUpload';
import AboutSon from './Artist/AboutSon';
import Editor from './Artist/Editor';
import Navbar from './Artist/Navbar';
import SonMeme from './Artist/SonMeme';
import UploadMeme from "./Artist/UploadMeme";
import MemeGenerator from "./Artist/MemeGenerator";
import MemeLeaderboard from "./Artist/MemeLeaderboard";

import theme from "./Theme";

function App() {
  const location = useLocation();
  const musicRef = useRef(null);
  const videoRefs = useRef([]); // shared between pages

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  // ✅ Control functions
  const stopMusic = () => {
    if (musicRef.current) {
      musicRef.current.pause();
    }
  };

  const resumeMusic = () => {
    if (musicRef.current) {
      musicRef.current.play().catch(() => {});
    }
  };

  const stopAllVideos = () => {
    videoRefs.current.forEach((video) => {
      if (video) video.pause();
    });
  };

  return (
    <div className="cursor">
      <MuiThemeProvider theme={theme}>
        {location.pathname !== "/" && <Navbar />}

        <Routes>
          <Route path="/" element={<MainHome />} />
          <Route path="/sonpfpmaker" element={<ArtistHome />} />
          <Route path="/pfp-maker" element={<SonUpload />} />
          <Route path="/ai-pfp-maker" element={<AiPfpMaker />} />
          <Route path="/about-son-pfp" element={<AboutSon />} />
          <Route path="/upload-meme" element={<UploadMeme />} />
          <Route path="/meme-generator" element={<MemeGenerator />} />
          <Route path="/meme-leaderboard" element={<MemeLeaderboard />} />
          <Route path="/editor" element={<Editor />} />
          <Route
            path="/son-memes"
            element={
              <SonMeme
                stopMusic={stopMusic}
                resumeMusic={resumeMusic}
                videoRefs={videoRefs}
                stopAllVideos={stopAllVideos}
              />
            }
          />
          <Route path="/submission" element={<ArtistSubmission />} />
        </Routes>
      </MuiThemeProvider>
    </div>
  );
}

export default App;
