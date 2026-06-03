
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
  padding: 1rem;

  .window-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .window {
    width: 100%;
  }

  .content-inner {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  .ani-image {
    max-width: 250px;
    flex-shrink: 0;

    img {
      width: 100%;
      height: auto;
      border-radius: 8px;
    }

    @media (max-width: 768px) {
      max-width: 80%;
      margin: 0 auto;
    }
  }

  .ani-text {
    flex: 1;
  }

  .footerdes {
    margin-top: 1rem;
    font-size: 1rem;
    line-height: 1.6;
  }
`;


function Desktop() {
  const [open, setOpen] = useState(false);
  return (
  <Wrapper className='container'>
      <br />
      <div className='content-wrapper'>
       
        <div className='window-container glowy'>
          <Window resizable className=''>
            <WindowHeader className='window-title'>
              <span className='fonan'>FAQ</span>
              <div>
                <Button>
                  <MinimizeIcon />
                </Button>
                <Button>
                  <CheckBoxOutlineBlankIcon />
                </Button>
                <Button>
                  <CloseIcon />
                </Button>
              </div>
            </WindowHeader>

            <WindowContent>
 <div className="content-inner">
   
    <div className="ani-text">

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

    </div>
  </div>
            </WindowContent>
          </Window>
        </div>
      </div>
    </Wrapper>
  )
}

export default Desktop