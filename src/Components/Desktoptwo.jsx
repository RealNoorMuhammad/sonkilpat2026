

import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  Button,

  Window,
  WindowContent,
  WindowHeader
} from 'react95';

import styled from 'styled-components';
import MinimizeIcon from '@mui/icons-material/Minimize';

import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
const Wrapper = styled.div`
 padding: 5rem;
 
  .window-title {
    display: flex;
   align-items: center;
   justify-content: space-between;
 }
 .close-icon {
  display: inline-block;
   width: 16px;
   height: 16px;
   margin-left: -1px;
   margin-top: -1px;
   transform: rotateZ(45deg);
  position: relative;
   &:before,
    &:after {
     content: '';
     position: absolute;
     background: ${({ theme }) => theme.materialText};
   }
   &:before {
  
    

     transform: translateX(-50%);
   }
   &:after {
     height: 3px;
     width: 100%;
      left: 0px;
     top: 50%;
     transform: translateY(-50%);
    }
  }  
  .window {
   width: 100%;
   min-height: 100%;
 }
  .window:nth-child(2) {
    margin: 2rem;
  }
 .footer {
   display: block;
    margin: 0.25rem;
    height: 100%;
   line-height: 71px;
    padding-left: 0.25rem;
  }
`;

function Desktop() {

    const [open, setOpen] = useState(false);
  return (
    <div className='centeritalls'>   <Wrapper className='container ' >
       
         <div className='centeralldiv glowy'>  <Window resizable className='s' >
        <WindowHeader className='window-title'>
          <span>VPL</span>
          <div>

        
          <Button>
          <MinimizeIcon/>
          </Button>
          <Button>
          <CheckBoxOutlineBlankIcon/>
          </Button>
          <Button>
           <CloseIcon/>  
          </Button>
          </div>
         
         
        </WindowHeader>
        
     
        <WindowContent >
       <p className="footerdes" style={{ color: "#000" }}>
     © 2025 Animecoin ($ANI). All rights reserved. Powered by the Anime community.
      </p>

        </WindowContent>
    
      </Window></div>
       


   
    </Wrapper></div>
 
  )
}

export default Desktop