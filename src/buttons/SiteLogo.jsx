import React from "react";
import logo from "./logo.png";
import "./site-logo.css";

function SiteLogo({ className = "", alt = "SON logo", ...props }) {
  return (
    <img
      src={logo}
      alt={alt}
      className={`site-logo${className ? ` ${className}` : ""}`}
      {...props}
    />
  );
}

export default SiteLogo;
export { logo };
