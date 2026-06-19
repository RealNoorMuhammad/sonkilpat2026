import React, { useEffect } from "react";
import { useTheme } from "../theme/ThemeContext";
import { SonPriceProvider } from "../token/SonPriceContext";
import FloatingControls from "./FloatingControls";
import MainNavbar from "./MainNavbar";
import HeroSection from "./HeroSection";
import ListedOnSection from "./ListedOnSection";
import PriceTicker from "./PriceTicker";
import LiveBuysFeed from "./LiveBuysFeed";
import SonChartSection from "./SonChartSection";
import Tokenomics from "./Tokenomics";
import MemeCommunitySection from "./MemeCommunitySection";
import BannerSection from "./BannerSection";
import HowToBuy from "./HowToBuy";
import BeforeFooterSection from "./BeforeFooterSection";
import HomeFooter from "./HomeFooter";
import "./Home.css";

const Home = () => {
  const { theme } = useTheme();

  useEffect(() => {
    document.title = "Are ya winning, $SON?";
  }, []);

  return (
    <SonPriceProvider>
      <div className="main-home" data-theme={theme}>
        <MainNavbar />
        <HeroSection />
        <PriceTicker />
        <LiveBuysFeed />
        <SonChartSection />
        <Tokenomics />
        <MemeCommunitySection />
        <BannerSection />
        <HowToBuy />
        <ListedOnSection />
        <PriceTicker />
        <BeforeFooterSection />
        <HomeFooter />
        <FloatingControls />
      </div>
    </SonPriceProvider>
  );
};

export default Home;
