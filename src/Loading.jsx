// LoadingScreen.tsx
import React, { useEffect, useState } from 'react';
import { ProgressBar } from 'react95';
import styled from 'styled-components';

const LoadingWrapper = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  justify-content: center;
  align-items: center;
  background: #000;
  flex-direction: column;
`;

const StyledProgressBar = styled(ProgressBar)`
  width: 40%; /* not full width */
  background-color: transparent;
  
  & > div {
    background: #fff !important; /* white progress fill */
  }
`;

const LoadingScreen = ({ onLoaded }) => {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const totalDuration = 2000; // 2 seconds
    const steps = 100;
    const interval = totalDuration / steps; // 20ms per increment

    const timer = setInterval(() => {
      setPercent(prev => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => onLoaded(), 200); // slight delay
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onLoaded]);

  return (
    <LoadingWrapper>
      <StyledProgressBar value={percent} />
    </LoadingWrapper>
  );
};

export default LoadingScreen;
