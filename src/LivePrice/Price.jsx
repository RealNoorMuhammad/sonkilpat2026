// src/components/ANILivePrice.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Window,
  WindowHeader,
  WindowContent,
  Button,
  Anchor
} from 'react95';
import './ANILivePrice.css';

export default function ANILivePrice() {
  const [aniData, setAniData] = useState({ price: null, marketCap: null });
  const [solPrice, setSolPrice] = useState(null);
  const [usdInput, setUsdInput] = useState('');
  const [solInput, setSolInput] = useState('');
  const [convertedAniFromUsd, setConvertedAniFromUsd] = useState(null);
  const [convertedAniFromSol, setConvertedAniFromSol] = useState(null);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const aniRes = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=animecoin-2&vs_currencies=usd&include_market_cap=true'
      );
      const solRes = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
      );

      setAniData({
        price: aniRes.data['animecoin-2'].usd,
        marketCap: aniRes.data['animecoin-2'].usd_market_cap,
      });

      setSolPrice(solRes.data['solana'].usd);
    } catch (err) {
      console.error('Error fetching prices', err);
    }
  };

  const convertUsdToAni = () => {
    if (!aniData.price || !usdInput) return;
    const result = parseFloat(usdInput) / aniData.price;
    setConvertedAniFromUsd(result.toFixed(2));
  };

  const convertSolToAni = () => {
    if (!aniData.price || !solPrice || !solInput) return;
    const usd = parseFloat(solInput) * solPrice;
    const result = usd / aniData.price;
    setConvertedAniFromSol(result.toFixed(2));
  };

  return (
    <div className="ani-wrapper">
      <Window className="ani-window">
        <WindowHeader className='fonttops'> ANI Live Price</WindowHeader>
        <WindowContent>
          {aniData.price && solPrice ? (
            <>
              <p><strong>1 ANI</strong> = ${aniData.price}</p>
              <p><strong>Market Cap</strong>: ${aniData.marketCap.toLocaleString()}</p>

              <hr />

              <div className="convert-box">
                <p><strong>10$</strong> = {(10 / aniData.price).toFixed(2)} ANI</p>
                <p><strong>0.1 SOL</strong> = {((0.1 * solPrice) / aniData.price).toFixed(2)} ANI</p>
              </div>

              <hr />

       


              <p>
                <Anchor href="https://www.coingecko.com/en/coins/animecoin-2/usd" target="_blank">View on CoinGecko</Anchor><br />
              
              </p>
            </>
          ) : (
            <p>Loading data...</p>
          )}
        </WindowContent>
      </Window>
    </div>
  );
}
