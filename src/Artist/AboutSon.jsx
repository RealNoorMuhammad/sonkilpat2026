import React from 'react'
import Footer from './Footer'
import SiteLogo from '../buttons/SiteLogo'
import './AboutSon.css'

function AboutSon() {
  return (
    <div className="about-son-container">
      <div className="about-son-content">
        <SiteLogo className="site-logo--hero about-son-logo" />
        <p>
          The “Are ya winning, son?” meme has lived rent-free in the internet’s brain for years.  
          It’s the eternal question from a dad peeking into his son’s room, asking if he’s winning —  
          in life, in games, or maybe just in general.
          <br /><br />
          The SON PFP takes that moment and turns it into an identity.
        </p>
      </div>
      <Footer />
    </div>
  )
}

export default AboutSon
