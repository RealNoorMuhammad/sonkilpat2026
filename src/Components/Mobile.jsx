import React, { useState } from 'react';
import {  Snackbar } from '@mui/material';
import logo from './image/ano.jpg'
import About from './About';

import Princess from './PrincessMobile'
import {
    Button,
    Window,
    WindowContent,
    WindowHeader,
    Anchor
  } from 'react95';
  import { Grid } from '@mui/material';
  import styled from 'styled-components';
  import MinimizeIcon from '@mui/icons-material/Minimize';
  import CloseIcon from '@mui/icons-material/Close';
  import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
  const Wrapper = styled.div`
   padding: 5rem;
    background: ${({ theme }) => theme.desktopBackground};
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
       height: 100%;
       width: 3px;
       left: 50%;
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
     width:100%;
     min-height: 200px;
    }
    .window:nth-child(2) {
     margin: 2rem;
   }
   .footer {
     display: block;
     margin: 0.25rem;
     height: 31px;
     line-height: 31px;
     padding-left: 0.25rem;
   }
  `;
function Mobile() {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);

    // Reset copied state after a few seconds
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };
  return (
    <div className='container '>

        <div className=' '>    <br/>
 <Button fullWidth className='cabutton '    onClick={() => handleCopyClick('CQkgAQg5qCor8UMee5s8SzGkpjoYxCxrNzUuhwAnbonk')}>

CQkgAQg5qCor8UMee5s8SzGkpjoYxCxrNzUuhwAnbonk

 </Button>


 <Anchor href='https://dexscreener.com/solana/asugttks5hwudsyjw6eaff48muawwdzuupbr2hxzhsmw' target='_blank'> 
          <Button  fullWidth>
          Dexscreener
          </Button></Anchor>
       
      
      
          <Anchor href='https://x.com/i/communities/1945188428720824738' target='_blank'> <Button fullWidth>
Twitter
          </Button></Anchor>
                <Anchor href='https://t.me/Animecoin_PORTAL' target='_blank'> <Button fullWidth>
    Telegram
          </Button></Anchor>
    
    <Anchor href='./Anime-Art-Hub' target='_blank'> <Button fullWidth>
Anime Art Hub
          </Button></Anchor>
          <br/>
<br/><br/></div>

           <Window resizable className='  glowy' >
        <WindowHeader className='window-title  glowy'>
       <Grid container spacing={0}>
        
       <Grid item md={6} lg={6} xs={6}> 
        
        
        
         <span className='fonttops'>The first ever Animecoin </span>  </Grid>
       <Grid item md={6} lg={6} xs={6} className="indicate_modal">         
<Button>
<MinimizeIcon/>
</Button>
<Button>
<CheckBoxOutlineBlankIcon/>
</Button>
<Button>
 <CloseIcon/>  
</Button>  </Grid>


 </Grid>   
        
         
         
        </WindowHeader>
     
   
        <Grid container spacing={2}>

<Grid item md={6} lg={6} xs={12} sm={12}  className=''>

  <div className='buttonback'> 
    <img src={logo} style={{width:"100%"}} />
    <a href='https://dexscreener.com/solana/asugttks5hwudsyjw6eaff48muawwdzuupbr2hxzhsmw'>
        <Button className='padsa'>
    BUY $ANI HERE AND BECOME A PART OF THE BEST ANIME COMMUNITY


    </Button>
    </a>


    </div>


</Grid>


</Grid>
      </Window>  <br/>  <br/>  <br/>  <br/> 



<Princess/>



<br/>  <br/><br/>  <br/>   
      <Window resizable className='  glowy' >
        <WindowHeader className='window-title  glowy'>
       <Grid container spacing={0}>
        
       <Grid item md={6} lg={6} xs={6}> <span className='fonttop'>FAQ</span>   </Grid>
       <Grid item md={6} lg={6} xs={6} className="indicate_modal">         
<Button>
<MinimizeIcon/>
</Button>
<Button>
<CheckBoxOutlineBlankIcon/>
</Button>
<Button>
 <CloseIcon/>  
</Button>  </Grid>


 </Grid>   
        
         
         
        </WindowHeader>
     
        <div className="sunken-panel  w-full ">
  
    </div>
        <WindowContent className='backofseekboxtexts centeralldivs   glowy'>
      


        <div className="sunken-panel w-full ">
        <WindowContent className=''>

 <p className="footerdes" style={{ color: "#000" }}>
     
<section class="faq-section">
  <h2 class="faq-title"> The $ANI Guidebook</h2>

  <div class="faq-item">
    <p class="faq-question">Q: Is this the same as Grok’s $ANI token?</p>
    <p class="faq-answer">A: No — this is the original Animecoin, launched in 2014 by a user named Ani-Chan. The same name and ticker are being used to preserve its roots.</p>
  </div>



  <div class="faq-item">
    <p class="faq-question">Q: Is there a community or way to get involved?</p>
    <p class="faq-answer">A: Yes! Join our Twitter/X, and keep an eye out for upcoming collaborations, events.</p>
  </div>



  <div class="faq-item">
    <p class="faq-question">Q: Is this a new coin or a reboot?</p>
    <p class="faq-answer">A: It's a revival — not a copy. Same name, same vision, same culture. We're continuing what Ani-Chan started over a decade ago.</p>
  </div>
</section>

      </p>


        </WindowContent>
    </div>
        </WindowContent>
   
      </Window>




<br/>  <br/><br/>  <br/>   
<About/>

<br/>  <br/><br/>  <br/>   
      <Window resizable className='  glowy' >
        <WindowHeader className='window-title  glowy'>
       <Grid container spacing={0}>
        
       <Grid item md={6} lg={6} xs={6}> <span className='fonttop'>Roadmap</span>   </Grid>
       <Grid item md={6} lg={6} xs={6} className="indicate_modal">         
<Button>
<MinimizeIcon/>
</Button>
<Button>
<CheckBoxOutlineBlankIcon/>
</Button>
<Button>
 <CloseIcon/>  
</Button>  </Grid>


 </Grid>   
        
         
         
        </WindowHeader>
     
        <div className="sunken-panel  w-full ">
  
    </div>
        <WindowContent className='backofseekboxtexts centeralldivs   glowy'>
      


        <div className="sunken-panel w-full ">
        <WindowContent className=''>

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
    </div>
        </WindowContent>
   
      </Window>




<br/>  <br/><br/>  <br/>   
      <Window resizable className='  glowy' >
        <WindowHeader className='window-title  glowy'>
       <Grid container spacing={0}>
        
       <Grid item md={6} lg={6} xs={6}> <span className='fonttop'>VPL</span>   </Grid>
       <Grid item md={6} lg={6} xs={6} className="indicate_modal">         
<Button>
<MinimizeIcon/>
</Button>
<Button>
<CheckBoxOutlineBlankIcon/>
</Button>
<Button>
 <CloseIcon/>  
</Button>  </Grid>


 </Grid>   
        
         
         
        </WindowHeader>
     
        <div className="sunken-panel  w-full ">
  
    </div>
        <WindowContent className='backofseekboxtexts centeralldivs   glowy'>
      


        <div className="sunken-panel w-full ">
        <WindowContent className=''>

 <p className="footerdes" style={{ color: "#000" }}>
© 2025 Animecoin ($ANI). All rights reserved. Powered by the Anime community.
      </p>


        </WindowContent>
    </div>
        </WindowContent>
   
      </Window>


      <br/>  <br/>  <br/>  <br/>  <br/>  

 <Snackbar
        open={copied}
        message='Copied!'
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
      />


      
    </div>
  )
}

export default Mobile