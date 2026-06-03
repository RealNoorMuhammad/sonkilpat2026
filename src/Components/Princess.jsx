

import Dragon from './Dragon';
import Angel from './Angel';
import Princes from './Princes';


import React, { useState } from 'react';
import {

  Tab,
  Button,
  TabBody,
  Tabs,
  Window,
  WindowContent,
  WindowHeader
} from 'react95';


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
  .HOVERTABSANDSIZES {
    cursor: pointer;
    padding: 10px 15px;
    margin-right: 5px;
    color: ${({ theme }) => theme.materialText};
    background-color: ${({ theme }) => theme.material};

    &:hover {
      background-color: ${({ theme }) => theme.materialDark};
    }
  }

  .active-tab {
    background-color: silver;
  }

  .inactive-tab {
    background-color: transparent;
  }
`;

function Desktop() {
    const [state, setState] = useState({
        activeTab: 0,
      });
    
      const handleChange = (value: number) => {
        setState({ activeTab: value });
      };
    
      const { activeTab } = state;


   
  return (
    <div className=''>  <Wrapper className='container  ' >
    <br/>
    <div className='centeralldiv glowy'>  
    <Window resizable className='' >
   <WindowHeader className='window-title'>
     <span className='fonttop'>ANI Knowledge</span>
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

      {/*    <div className="sunken-panel w-full ">
 <table style={{width:"100%"}}>
<tr>
<th>Supply</th>
<th>Tax</th>
<th>Max Buy</th>
</tr>
<tr>
<td>5.5 Billion $LARP</td>
<td>0</td>
<td>1%</td>
</tr>

</table>
</div> */}
  <p className='textsa'>
      (竜・天使・姫 – Ryū, Tenshi, Hime)
      <br/>
    Choose your aura.
<br/>
Ani’s essence fragments into three forms — Dragon, Angel, and Princess — each echoing a unique energy, path, and purpose. These archetypes reflect different expressions of identity, spirit, and style in the Animecoin universe.</p>


<WindowContent>
<Tabs value={activeTab} onChange={(value) => handleChange(value)}>
        <Tab
          value={0}
          className={`HOVERTABSANDSIZES ${activeTab === 0 ? 'active-tab' : 'inactive-tab'}`}
        >
        Dragon
        </Tab>
        <Tab
          value={1}
          className={`HOVERTABSANDSIZES ${activeTab === 1 ? 'active-tab' : 'inactive-tab'}`}
        >
         Angel
        </Tab>
        <Tab
          value={2}
          className={`HOVERTABSANDSIZES ${activeTab === 2 ? 'active-tab' : 'inactive-tab'}`}
        >
      Princess
        </Tab>
      </Tabs>
       <TabBody style={{ height: 650 }}  className='glowy'>
         {activeTab === 0 && (
           <div >
              <Dragon/>
           </div>
         )}
         {activeTab === 1 && (
          <div>
             <Angel/>
            </div>
         )}
          {activeTab === 2 && (
           <div>
           <Princes/>
           </div>
          )}
       </TabBody>
     </WindowContent>
   
 </Window></div>
  



</Wrapper></div>
  
  )
}

export default Desktop