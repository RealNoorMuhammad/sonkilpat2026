import React, { useState } from 'react';
import {  Snackbar } from '@mui/material';
import logo from './image/ano.jpg'


import {
  Button,

  Toolbar,
  Window,

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
   min-height: 400px;
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
    <div className=''>  <Wrapper className='container  centeritalls' >
 
    <div className='centeralldiv glowy'>  
    <Window resizable className='' >
   <WindowHeader className='window-title'>
     <span className='fonttop'>The first ever Animecoin from the bitcoin forums in 2014 created by the user ''Ani-Chan</span>
     <div>

   
     <Button className='widthbuttoncloseopen'>
     <MinimizeIcon style={{position:"relative" , bottom:"6px"}}/>
     </Button>
     <Button className='widthbuttoncloseopen'>
     <CheckBoxOutlineBlankIcon/>
     </Button>
     <Button className='widthbuttoncloseopen'>
      <CloseIcon/>  
     </Button>
     </div>
    
    
   </WindowHeader>
   <br/>
   <Toolbar className='backgrond_toolbar '>
   <Button
          size='sm'
          style={{ color: '#000', fontWeight: '100' }}
          className='fontoftextsmall'
          onClick={() => handleCopyClick('CQkgAQg5qCor8UMee5s8SzGkpjoYxCxrNzUuhwAnbonk')}
        >
      CQkgAQg5qCor8UMee5s8SzGkpjoYxCxrNzUuhwAnbonk
        </Button> &nbsp;      &nbsp;      &nbsp;      &nbsp; 
     <Anchor href='https://dexscreener.com/solana/asugttks5hwudsyjw6eaff48muawwdzuupbr2hxzhsmw' target='_blank'> 
     <Button  size='sm' className='fontoftextsmall'>
     Dexscreener
     </Button></Anchor>
     &nbsp;      &nbsp;      &nbsp;      &nbsp; 
    
     <Anchor href='https://x.com/i/communities/1945188428720824738' target='_blank'> <Button size='sm' className='fontoftextsmall'>
Twitter
     </Button></Anchor>
     &nbsp;      &nbsp;      &nbsp;      &nbsp; 
    

    
    
     <Anchor href='https://t.me/Animecoin_PORTAL' target='_blank'> <Button size='sm' className='fontoftextsmall'>
Telegram
     </Button>
      
      </Anchor>
    &nbsp;      &nbsp;      &nbsp;      &nbsp; 
    
    
     <Anchor href='./Anime-Art-Hub' target='_blank'> <Button size='sm' className='fontoftextsmall'>
Anime Art Hub
     </Button>

     </Anchor>
     &nbsp;      &nbsp;      &nbsp;      &nbsp; 
 
   </Toolbar> <br/>



      <div className='centeralldiv'>  <img src={logo} style={{width:"100%"}} /> </div>
   <>
     <Grid container spacing={2}>

     <Grid item md={12} lg={12} xs={12} sm={12}  className='center_everything'>

<a href='https://dexscreener.com/solana/asugttks5hwudsyjw6eaff48muawwdzuupbr2hxzhsmw'>
    <Button href='' className='buttonbackg'>      
        <br/>    <div >     BUY $ANI HERE AND BECOME A PART OF THE BEST ANIME COMMUNITY 
   
     
     </div></Button>


</a>
      
 


 
     </Grid>
   
     </Grid>
   </>
 </Window></div>
  

 <Snackbar
        open={copied}
        message='Copied!'
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
      />

</Wrapper></div>
  
  )
}

export default Desktop