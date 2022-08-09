import React, { useState } from "react";

import './css/App.css';
import './css/index.css';

import Header from './components/Header.js';
import Footer from './components/Footer.js';
import VideoOverlay from './components/VideoOverlay';

function App() {
  const [appState, setAppState] = useState({
    showHelpOverlay: false,
    toggleGenvidOverlay: true,
  });

  // GENVID - onHelpActivation start
  // Displays or removes the help overlay
  const onHelpActivation = (e) => {
    e.preventDefault();
    setAppState(prevState => ({
      ...prevState,
      showHelpOverlay: !prevState.showHelpOverlay,
    }));
  };
  // GENVID - onHelpActivation stop

  // GENVID - toggleGenvidOverlay start
  // Displays or removes the Genvid Overlay
  const toggleGenvidOverlay = (e) => {
    e.preventDefault();
    setAppState(prevState => ({
      ...prevState,
      toggleGenvidOverlay: !prevState.toggleGenvidOverlay,
    }));

    // if (this.genvidOverlay.getAttribute("data-isHidden")) {
    //   this.genvidOverlay.setAttribute("data-isHidden", "");
    //   this.genvidOverlay.style.visibility = "visible";
    //   this.genvidOverlayButton.classList.remove("disabled");
    // } else {
    //   this.genvidOverlay.setAttribute("data-isHidden", "true");
    //   this.genvidOverlay.style.visibility = "hidden";
    // container.classList.add("disabled");
    // }
  }
  // GENVID - toggleGenvidOverlay stop

  return (
    <>
      <div className="wrap">
        <Header onHelpActivation={onHelpActivation} toggleGenvidOverlay={toggleGenvidOverlay} isGenvidOverlayToggled={appState.toggleGenvidOverlay} />
        <VideoOverlay showHelpOverlay={appState.showHelpOverlay} toggleGenvidOverlay={appState.toggleGenvidOverlay} />
      </div>
      <Footer />
    </>
  );
}

export default App;
