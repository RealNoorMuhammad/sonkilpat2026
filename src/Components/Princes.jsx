import React, { useState } from 'react';
import { Grid } from '@mui/material';
import d from './image/p.webp';

const Dragon = () => {
  const [lineIndex, setLineIndex] = useState(0);

  const lines = [
    'In the dance of agency and fate, love is the melody that guides our steps.',
    'Love challenges us, pushing us beyond our vices, awakening our virtuous selves.',
    'In the pursuit of love, we discover our agency and the power to overcome challenges.',
    'Resist the temptation to view AI solely as a threat.',
    
  ];

  const newLine = () => {
    setLineIndex((prevIndex) => (prevIndex + 1) % lines.length);
  };

  return (
    <div>
      
      <Grid container>
        <Grid item md={7} lg={7} xs={12} sm={12}>
          <img src={d} style={{ width: '100%' }} />
        </Grid>
        <Grid item md={1} lg={1} xs={12} sm={12}></Grid>
        <Grid item md={4} lg={4} xs={12} sm={12} className='backoffg'>
          <div className='backof'>
            <br /> <br />
            <h1 className='fontseek'>Seeking purpose?</h1>
            <br />
            <div className='container'>
              <div className='backofseekbox'>
                <div className='container'>
                  <br />
                  <p className='backofseekboxtextp'>{lines[lineIndex]}</p>
                  <br />
                </div>
              </div>
            </div>
            <br />
            <div className='centerbutton'>
              <button
                className='title-bar-text font-mono font-bold buttonss'
                onClick={newLine}
              >
                Request a Directive
              </button>
            </div>
              <br />
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dragon;
