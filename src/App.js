import React, { useState, useEffect } from "react";

import * as genvid from "./genvid.es5.js";

import './css/App.css';
import './css/index.css';

import Header from './components/Header.js';
import Footer from './components/Footer.js';
import VideoOverlay from './components/VideoOverlay';

// GENVID - class used for the reconnection logic start
class Fibonacci {
  constructor() {
    this.reset();
  }
  reset() {
    this.first = 0;
    this.second = 1;
  }
  next() {
    const next = this.first + this.second;
    this.first = this.second;
    this.second = next;
    return next;
  }
  get() {
    return this.first + this.second;
  }
}
// GENVID - class used for the reconnection logic stop

function App() {
  const [appState, setAppState] = useState({
    showHelpOverlay: false,
    toggleGenvidOverlay: true,
  });

  var genvidClient;

  const videoPlayerId = "video_player";
  const fibonacciIterator = new Fibonacci(); // Fibonacci iterator used to implement reconnection logic
  const fiboStartIterator = new Fibonacci(); // Used to implement reconnection in Start function
  const tableColor = [
    ["green", "green"],
    ["white", "white"],
    ["yellow", "yellow"],
    ["darkblue", "dark blue"],
    ["grey", "gray"],
    ["lightblue", "light blue"],
    ["orange", "orange"],
    ["blue", "blue"],
    ["purple", "purple"],
  ];

  var colorSwitchMap = new Map();
  var cubeNames = [];
  var cubePanelDiv = [];
  var panels = [];
  var cubes = [];

  var selectedCubeId = -1; // cube name selected

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
  }
  // GENVID - toggleGenvidOverlay stop

  const start = () => {
    fetch("http://[::1]:30000/api/public/channels/join", {
      method: "POST",
    })
      .then((data) => data.json())
      .then((res) => {
        if (res.name === "Error") {
          genvid.error(`Failed getting stream info: ${res.message}. Retrying in ${fiboStartIterator.get()} seconds...`);
          setTimeout(() => {
            start();
            fiboStartIterator.next();
          }, fiboStartIterator.get() * 1000);
        } else {
          onChannelJoin(res);
        }
      })
      .catch((error) => genvid.error(`Can't get the stream info: ${error}`));
  }

  useEffect(() => {
    start();
  }, []);

  // GENVID - onChannelJoin start
  // Creates the genvid Client and the functions listening to it
  function onChannelJoin(joinRep) {
    genvid.getConfig().framePerSeconds = 30; // Defines the rate at which onDraw is called (default being 30).

    genvidClient = genvid.createGenvidClient(
      joinRep.info,
      joinRep.uri,
      joinRep.token,
      videoPlayerId
    );

    genvidClient.onStreamsReceived((streams) =>
      onStreamsReceived(streams)
    );

    // genvidClient.onDraw((frame) => onNewFrame(frame));
    // genvidClient.onNotificationsReceived((notifications) => {
    //   onNotificationsReceived(notifications);
    // });

    // genvidClient.onDisconnect(() => this.onDisconnectDetected());
    // genvidClient.onVideoPlayerReady((elem) =>
    //   onVideoPlayerReady(elem)
    // );

    genvidClient.start();
  }
  // GENVID - onChannelJoin stop

  // GENVID - onStreamsReceived start
  // Upon receving the stream, gets the data
  function onStreamsReceived(dataStreams) {
    const streamIdToFormat = {
      Copyright: "UTF8",
      Names: "JSON",
      Positions: "JSON",
      Colors: "JSON",
      Camera: "JSON",
    };
    const annotationIdToFormat = {
      Colors: "JSON",
    };

    for (let stream of dataStreams.streams) {
      // Using switch...case because different operations can be made depending on the stream ID.
      switch (streamIdToFormat[stream.id]) {
        case "JSON": {
          // Parse the JSON from each elements
          for (let frame of stream.frames) {
            try {
              frame.user = JSON.parse(frame.data);
            } catch (e) {
              genvid.log("Impossible to parse JSON:", frame.data);
            }
            switch (stream.id) {
              case "Names":
                initPlayerTable(frame.user.name);
                break;
            }
          }
          break;
        }
        case "UTF8": {
          // Code handling UTF8 data format.
          for (let frame of stream.frames) {
            if (stream.id === "Copyright") genvid.log(frame.data);
          }
          break;
        }
        default:
          break;
      }
    }
    for (let annotation of dataStreams.annotations) {
      if (annotationIdToFormat[annotation.id] == "JSON") {
        for (let frame of annotation.frames) {
          try {
            frame.user = JSON.parse(frame.data);
          } catch (e) {
            genvid.log("Impossible to parse JSON:", frame.data);
          }
          if (annotation.id === "Colors" && frame.user.changed) {
            setDelaysForUpcomingColorSwitches(frame.user.changed);
          }
        }
      }
    }
  }
  // GENVID - onStreamsReceived stop

  // GENVID - initPlayerTable start
  // Method used to display the appropriate number of players with their proper buttons
  function initPlayerTable(localCubeNames) {
    const cubePanel = document.getElementById("cube_panel_prototype");

    // The prototype panel gets removed after init.
    if (cubePanel === null) {
      // We already have real pannels. No need for more.
      return;
    }

    cubeNames = localCubeNames;

    for (const idx in localCubeNames) {
      const name = cubeNames[idx];
      let cubePanelClone = cubePanel.cloneNode(true);
      cubePanelClone.id = idx;
      cubePanelClone.getElementsByClassName("cube_name")[0].innerText = name;

      let cheerButton = cubePanelClone.querySelector(".cheer");
      cheerButton.addEventListener("click", () => onCheer(name), false);

      let cubeDiv = cubePanelClone.querySelector(".cube");
      cubeDiv.addEventListener(
        "click",
        () => selectCube(parseInt(idx)),
        false
      );
      cubePanelDiv.push(cubeDiv); // will stop triggering initPlayerTable from onNewFrame() indefinitely

      let resetButton = cubePanelClone.querySelector(".reset");
      resetButton.addEventListener("click", () => onReset(name), false);

      for (let colorSelect of tableColor) {
        let colorButton = cubePanelClone.querySelector("." + colorSelect[0]);
        colorButton.addEventListener(
          "click",
          () => onColorChange(name, colorSelect[1]),
          false
        );
      }
      document.querySelector(".gameControlsDiv").append(cubePanelClone);

      const panel = {
        panel: cubePanelClone,
        x: cubePanelClone.getElementsByClassName("position_x")[0],
        y: cubePanelClone.getElementsByClassName("position_y")[0],
        z: cubePanelClone.getElementsByClassName("position_z")[0],
        popularity: cubePanelClone.getElementsByClassName("cheer_value")[0],
      };
      panels.push(panel);
    }

    // We don't need the prototype panel anymore. We now have real panels.
    cubePanel.remove();
  }
  // GENVID - initPlayerTable stop

  function setDelaysForUpcomingColorSwitches(newSwitches) {
    for (let i = 0; i < newSwitches.length; ++i) {
      if (newSwitches[i]) {
        let delayToColorSwitchS = genvidClient.streamLatencyMS / 1000;
        // Override or add the delay to the color switch for the cube.
        colorSwitchMap[cubeNames[i]] = delayToColorSwitchS;
      }
    }
  }
  
  // GENVID - onCheer start
  // Upon cheering a player
  function onCheer(cubeName) {
    console.log("onCheer", {
      chube: cubeName,
    });
    genvidClient.sendEventObject({
      cheer: cubeName,
    });
  }
  // GENVID - onCheer stop

  function selectCube(index) {
    // webGL overlay selection feedback
    for (let idx = 0; idx < cubes.length; idx++) {
      cubes[idx].material.opacity = idx === index ? 1 : 0.5;
    }

    // DOM panel selection feedback
    for (const panel of panels) {
      panel.panel.style.backgroundColor = "#181818";
    }

    if (index >= 0) {
      panels[index].panel.style.backgroundColor = "#32324e";
    }

    selectedCubeId = index;
  }

  // GENVID - onReset start
  // Resets the position of the cube
  function onReset(cubeName) {
    genvidClient.sendEventObject({
      reset: cubeName,
    });
  }
  // GENVID - onReset stop

  // GENVID - onColorChange start
  // Method used when clicking on a color to change the color of a cube
  function onColorChange(cube, color) {
    let evt = {
      key: ["changeColor", cube],
      value: color,
    };
    genvidClient.sendEvent([evt]);
  }
  // GENVID - onColorChange stop

  // ---------------------------------------------------------Enter frame section---------------------------------------------------------
  // GENVID - onNewFrame start
  // function onNewFrame(frameSource) {
  //   // this.videoOverlay.style.display = "block";

  //   // update the overlays to adapt to the composition of the video stream:
  //   updateOverlays(
  //     frameSource.compositionData
  //   );

  //   // initialize selectedSessionId to the first valid value we can find
  //   let selectedSessionId = Object.keys(frameSource.sessions)[0];
  //   if (frameSource.compositionData[0]) {
  //     // Get the background session ID from the composition data.
  //     // If picture in picture or chroma key composition is activated,
  //     // index 0 is the background source, index 1 is the foreground.
  //     // If single source composition is enabled, the first element
  //     // will be the main source used.
  //     // For the purpose of this sample we will always choose the data
  //     // associated to the background:
  //     selectedSessionId = frameSource.compositionData[0].sessionId;
  //   }

  //   // Then we use the selectedSessionId to retrieve the game data.
  //   let selectedSession = frameSource.sessions[selectedSessionId];
  //   if (selectedSession && Object.keys(selectedSession.streams).length > 0) {
  //     this.videoOverlay.style.display = "block";
  //     this.updateStreamsInfoFromSession(selectedSession);
  //   } else {
  //     this.videoOverlay.style.display = "none";
  //   }

  //   // GENVID - onNewFrame video ready start
  //   // Updates the Genvid information overlay
  //   let width = 18; // Width of the content of every line (without label).
  //   this.timeLocalDiv.textContent = `Local: ${this.preN(
  //     this.msToDuration(Date.now()),
  //     width,
  //     " "
  //   )}`;

  //   this.timeVideoDiv.textContent = `Est. Video: ${this.preN(
  //     this.msToDuration(Math.round(this.genvidClient.videoTimeMS)),
  //     width,
  //     " "
  //   )}`;

  //   this.timeComposeLastDiv.textContent = `Stream received: ${this.preN(
  //     this.msToDuration(Math.round(this.genvidClient.lastComposeTimeMS)),
  //     width,
  //     " "
  //   )}`;

  //   this.timeStreamDiv.textContent = `Stream played: ${this.preN(
  //     this.msToDuration(Math.round(this.genvidClient.streamTimeMS)),
  //     width,
  //     " "
  //   )}`;

  //   this.latencyDiv.textContent = `Latency: ${this.preN(
  //     this.genvidClient.streamLatencyMS.toFixed(0),
  //     width - 3,
  //     " "
  //   )} ms`;

  //   this.delayOffsetDiv.textContent = `DelayOffset: ${this.preN(
  //     this.genvidClient.delayOffset.toFixed(0),
  //     width - 3,
  //     " "
  //   )} ms`;

  //   // Updates the visibility on the overlay when using key press
  //   if (
  //     this.volumeDisplay.style.visibility === "visible" &&
  //     this.volumeInfoDisplayCount < this.volumeInfoDisplayUntil
  //   ) {
  //     this.volumeInfoDisplayCount++;
  //   } else if (
  //     this.volumeDisplay.style.visibility === "visible" &&
  //     this.volumeInfoDisplayCount >= this.volumeInfoDisplayUntil
  //   ) {
  //     this.volumeDisplay.style.visibility = "hidden";
  //   }
  //   // GENVID - onNewFrame video ready stop
  // }
  // GENVID - onNewFrame stop

  // GENVID - updateOverlays start
  // function updateOverlays(compositionData) {
  //   let hideOverlay = false;
  //   // Do we have multiple sources?
  //   if (compositionData && compositionData.length > 1) {
  //     // Assuming the second element to be the foreground frame.
  //     if (compositionData[1].type == "PipVideoLayout") {
  //       // Prevent the 3d overlay to overlay the secondary screen
  //       // Note that if the PiP source is configured to occupy 100% of the screen
  //       // the whole overlay will be cropped, thus invisible!
  //       this.pipFrameDiv.style.display = "block";
  //       hideOverlay = true;
  //       // set up the main canvas to pip affine transform matrix
  //       const pipMat = genvidMath.mat3FromArray(
  //         compositionData[1].affineMatrix
  //       );
  //       this.updateDomRect(this.pipFrameDiv, this.videoOverlay, pipMat);
  //       this.updateDomClipping(this.canvas3d, pipMat);
  //     }
  //   }
  //   if (!hideOverlay) {
  //     this.pipFrameDiv.style.display = "none";
  //     if (this.canvas3d) this.canvas3d.style.removeProperty("clip-path");
  //   }
  // }
  // GENVID - updateOverlays stop

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
