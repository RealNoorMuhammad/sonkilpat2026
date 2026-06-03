import React, { useState } from 'react';
import { Grid } from '@mui/material';
import d from './image/a.webp';

const Dragon = () => {
  const [lineIndex, setLineIndex] = useState(0);

  const lines = [
    'Every challenge we face only adds to the tapestry of our story.',
    'In the symphony of life, every note has its importance.',
    'The warmth of hope can melt even the coldest challenges.',
    'Through every dark night, theres a bright day ahead.',
    
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
                  <p className='backofseekboxtexta'>{lines[lineIndex]}</p>
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
              </button> <br /> <br />
            </div>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dragon;
