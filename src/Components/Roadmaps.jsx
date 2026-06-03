

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
    <Wrapper className='container ' >
        
         <div className='centeralldiv glowy'>  <Window resizable className='s' >
        <WindowHeader className='window-title'>
          <span>Roadmap</span>
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
    ANIMECOIN ROADMAP
   <br/> <br/>
1. Legacy Reunited • The original Animecoin devs from 2014 are now onboard • The mission remains the same: support anime creators through tips and community tools • This is a continuation of one of crypto’s earliest cultural coins
 <br/> <br/>
2. Relaunch on Solana • $ANI now lives on Solana, gaining speed, low fees, and broad accessibility • Solana’s modern infrastructure lets fans tip instantly and creators earn with ease
 <br/> <br/>
3. Onboarding Artists • Assist creators in setting up Phantom wallets and receiving tips in $ANI • Roll out contests, commissions, and content drops powered by the token • Provide simple, creator friendly tools for earning and collaboration
 <br/> <br/>
4. Real Utility for the Creative Economy • Explore partnerships for art gear and software so creators can spend $ANI on their craft • Keep value circulating within the anime community
 <br/> <br/>
5. Ecosystem Growth • Team wallet supports marketing, artist initiatives, and community expansion • Focus on transparent, sustainable growth and long term vision
 <br/> <br/>
6. Building the Culture • Active Telegram and Discord spaces centered on anime, art, and crypto crossover • Share anime releases, host watch events, and foster collaboration among fans and creators • Position $ANI as the home of anime culture on Solana




      </p>


      
        </WindowContent>
    
      </Window></div>
       


   
    </Wrapper>
  )
}

export default Desktop