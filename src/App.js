import React, { useState, useEffect } from "react";

import * as genvid from "./genvid.es5.js";
import * as genvidMath from "./genvid-math.es5.js";
import * as THREE from 'https://cdn.skypack.dev/pin/three@v0.132.0-r3eaNU1utrmzS211mhdG/mode=imports/optimized/three.js';

import './css/App.css';
import './css/index.css';

import Fibonacci from "./utils/fibonacci.js";

import Header from './components/Header.js';
import Footer from './components/Footer.js';
import VideoOverlay from './components/VideoOverlay';

function App() {
  const [appState, setAppState] = useState({
    showHelpOverlay: false,
    toggleGenvidOverlay: true,
  });

  var genvidClient;

  const spriteIdleTexture = new THREE.TextureLoader().load(
    "./img/highlight_full.png"
  );

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

  var tagPosition = new THREE.Vector3();

  var colorSwitchMap = new Map();
  var cubeNames = [];
  var cubePanelDiv = [];
  var panels = [];
  var cubes = [];
  var cubePositions = [];
  var cubeColors = [];
  var tags = [];
  var popularities = [];

  var volumeInfoDisplayCount = 100; // number of frames that volume info stays on screen
  var volumeInfoDisplayUntil = 100; // number of frames for wich we want the volume info to stay visible

  var selectedCubeId = -1; // cube name selected
  var lastRenderTimeS = -1;

  var cameraData;
  var scene;
  var camera;
  var renderer;

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

  useEffect(() => {
    start();
    const canvas3d = document.querySelector("#canvas_overlay_3d");
    initThreeJS(canvas3d);
  }, []);

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

  function initThreeJS(canvas) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    if (cameraData) {
      updateCamera();
    }
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true, // so that clear color is transparent
      powerPreference: "high-performance",
    });
    render();
  }


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

    genvidClient.onDraw((frame) => onNewFrame(frame));
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

  function updateCubeColorSwitchMessages(deltaTimeS) {
    let colorChangeMessage = "";
    // Lets see if we have any cubes awaiting a color change.
    for (let cubeName of cubeNames) {
      if (colorSwitchMap[cubeName]) {
        // This cube is awaiting a color change.
        // Update the delay to the color change.
        colorSwitchMap[cubeName] -= deltaTimeS;
        if (colorSwitchMap[cubeName] > 0) {
          // Update the UI.
          let delay = Number.parseFloat(colorSwitchMap[cubeName]).toPrecision(2);
          colorChangeMessage = colorChangeMessage.concat(cubeName + " will change color in " + delay + " seconds." + '<br>');
        }
        else {
          // This entry is no longer needed once the counter is done.
          colorSwitchMap.delete(cubeName);
        }
      }
    }
    // Do we have anything to display?
    if (colorChangeMessage !== "") {
      // Activate and override the UI color change message.
      displayColorCounterMessage(colorChangeMessage);
    } else {
      // No. Hide the UI element.
      let colorCounterMessageDiv = document.querySelector(
        "#alert_color_counter"
      );
      colorCounterMessageDiv.style.visibility = "hidden";
    }
  }

  function render() {
    // check if the cube data is available but the cubes sprites are not yet created
    // and create them
    if (!cubes.length && cubeNames.length) {
      for (const index in cubeNames) {
        const name = cubeNames[index];
        // create sprite overlays
        const spriteMaterial = new THREE.SpriteMaterial({
          map: spriteIdleTexture,
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.name = index;
        sprite.scale.set(4, 4, 4);
        spriteMaterial.opacity = 0.5;

        scene.add(sprite);
        cubes.push(sprite);

        // create tag div
        const elem = document.createElement("div");
        elem.id = "cube_tag_" + name;
        elem.textContent = name;
        elem.classList.add("tag");

        let parent = document.querySelector("#video_overlay");
        parent.appendChild(elem);

        elem.addEventListener("click", () => selectCube(index), false);
        tags.push(elem);
      }
    }

    // update sprite positions according to the last updated positions
    if (cubePositions.length && cubes.length) {
      for (let i = 0; i < cubes.length; i++) {
        const [x, z] = cubePositions[i];
        cubes[i].position.set(x, 0, z);
      }
    }

    // update UI
    for (const idx in cubes) {
      // get screen space tag coordinates
      cubes[idx].updateMatrixWorld();
      tagPosition
        .setFromMatrixPosition(cubes[idx].matrixWorld)
        .project(camera);
      centerAt(tags[idx], tagPosition, genvidMath.vec2(0, -75));

      // update panel
      panels[idx].x.textContent = cubes[idx].position.x.toFixed(2);
      panels[idx].y.textContent = cubes[idx].position.y.toFixed(2);
      panels[idx].z.textContent = cubes[idx].position.z.toFixed(2);
      panels[idx].popularity.textContent = popularityToText(
        popularities[idx]
      );
    }

    // update upcoming color change UI
    let nowS = Date.now() / 1000;
    if (lastRenderTimeS < 0) {
      lastRenderTimeS = nowS;
    }
    updateCubeColorSwitchMessages(nowS - lastRenderTimeS /* render delta */);
    lastRenderTimeS = nowS;

    renderer.render(scene, camera);
    requestAnimationFrame(render.bind(this));
  }

  function updateCamera() {
    if (camera) {
      camera.fov = THREE.MathUtils.radToDeg(cameraData.fov);
      camera.near = cameraData.near;
      camera.far = cameraData.far;
      camera.aspect = cameraData.aspect;
      camera.updateProjectionMatrix();
      camera.position.set(...cameraData.eye);
      camera.up.set(...cameraData.up);
      camera.lookAt(...cameraData.at);
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

  // ---------------------------------------------------------Utility methods section---------------------------------------------------------
  // GENVID - popularityToText start
  // Converts popularity value to popularity text
  function popularityToText(popularity) {
    const hearts = ["💔", "♡", "♥", "💕"];
    const levels = [0.1, 1.0, 5.0];
    for (let i = 0; i < hearts.length; ++i) {
      if (popularity < levels[i]) {
        return hearts[i];
      }
    }
    return hearts[levels.length];
  }
  // GENVID - popularityToText stop

  // GENVID - centerAt start
  // Changes the HTML element position to be at the center of the pos 2d sent
  function centerAt(htmlElement, pos2d, offsetPixels) {
    // Converts from [-1, 1] range to [0, 1].
    let vh = genvidMath.vec2(0.5, 0.5);
    let pos2dN = genvidMath.mad2D(pos2d, vh, vh);

    // Converts from [0, 1] range to [0, w].
    let p = htmlElement.parentElement;
    let pSize = genvidMath.vec2(p.clientWidth, p.clientHeight);
    let posInParent = genvidMath.mul2D(pos2dN, pSize);

    // Adjusts for centering element.
    let eSize = genvidMath.vec2(
      htmlElement.clientWidth,
      htmlElement.clientHeight
    );
    let eOffset = genvidMath.muls2D(eSize, -0.5);
    let posCentered = genvidMath.add2D(posInParent, eOffset);

    // Applies user offset.
    const posFinal = genvidMath.sub2D(posCentered, offsetPixels);
    Object.assign(htmlElement.style, {
      left: posFinal.x + "px",
      bottom: posFinal.y + "px",
      position: "absolute",
      zIndex: "1100",
    });
  }
  // GENVID - centerAt stop

  // ---------------------------------------------------------Enter frame section---------------------------------------------------------
  // GENVID - onNewFrame start
  function onNewFrame(frameSource) {
    // Debug overlay
    const timeLocalDiv = document.querySelector("#time_local"); // browser clock current time
    const timeVideoDiv = document.querySelector("#time_video"); // video player current time
    const timeComposeLastDiv = document.querySelector("#time_compose_last");
    const timeStreamDiv = document.querySelector("#time_stream");
    const latencyDiv = document.querySelector("#latency");
    const delayOffsetDiv = document.querySelector("#delay_offset");

    const volumeDisplay = document.querySelector("#volume_display");

    // this.videoOverlay.style.display = "block";

    // update the overlays to adapt to the composition of the video stream:
    updateOverlays(
      frameSource.compositionData
    );

    // initialize selectedSessionId to the first valid value we can find
    let selectedSessionId = Object.keys(frameSource.sessions)[0];
    if (frameSource.compositionData[0]) {
      // Get the background session ID from the composition data.
      // If picture in picture or chroma key composition is activated,
      // index 0 is the background source, index 1 is the foreground.
      // If single source composition is enabled, the first element
      // will be the main source used.
      // For the purpose of this sample we will always choose the data
      // associated to the background:
      selectedSessionId = frameSource.compositionData[0].sessionId;
    }

    // Then we use the selectedSessionId to retrieve the game data.
    let selectedSession = frameSource.sessions[selectedSessionId];
    if (selectedSession && Object.keys(selectedSession.streams).length > 0) {
      // this.videoOverlay.style.display = "block";
      updateStreamsInfoFromSession(selectedSession);
    } else {
      // this.videoOverlay.style.display = "none";
    }

    // GENVID - onNewFrame video ready start
    // Updates the Genvid information overlay
    let width = 18; // Width of the content of every line (without label).
    timeLocalDiv.textContent = `Local: ${preN(
      msToDuration(Date.now()),
      width,
      " "
    )}`;

    timeVideoDiv.textContent = `Est. Video: ${preN(
      msToDuration(Math.round(genvidClient.videoTimeMS)),
      width,
      " "
    )}`;

    timeComposeLastDiv.textContent = `Stream received: ${preN(
      msToDuration(Math.round(genvidClient.lastComposeTimeMS)),
      width,
      " "
    )}`;

    timeStreamDiv.textContent = `Stream played: ${preN(
      msToDuration(Math.round(genvidClient.streamTimeMS)),
      width,
      " "
    )}`;

    latencyDiv.textContent = `Latency: ${preN(
      genvidClient.streamLatencyMS.toFixed(0),
      width - 3,
      " "
    )} ms`;

    delayOffsetDiv.textContent = `DelayOffset: ${preN(
      genvidClient.delayOffset.toFixed(0),
      width - 3,
      " "
    )} ms`;

    // Updates the visibility on the overlay when using key press
    if (
      volumeDisplay.style.visibility === "visible" &&
      volumeInfoDisplayCount < volumeInfoDisplayUntil
    ) {
      volumeInfoDisplayCount++;
    } else if (
      volumeDisplay.style.visibility === "visible" &&
      volumeInfoDisplayCount >= volumeInfoDisplayUntil
    ) {
      volumeDisplay.style.visibility = "hidden";
    }
    // GENVID - onNewFrame video ready stop
  }
  // GENVID - onNewFrame stop

  // GENVID - updateOverlays start
  function updateOverlays(compositionData) {
    let hideOverlay = false;

    const videoOverlay = document.querySelector("#video_overlay");
    const pipFrameDiv = document.querySelector("#pip_frame");
    const canvas3d = document.querySelector("#canvas_overlay_3d");

    // Do we have multiple sources?
    if (compositionData && compositionData.length > 1) {
      // Assuming the second element to be the foreground frame.
      if (compositionData[1].type == "PipVideoLayout") {
        // Prevent the 3d overlay to overlay the secondary screen
        // Note that if the PiP source is configured to occupy 100% of the screen
        // the whole overlay will be cropped, thus invisible!
        pipFrameDiv.style.display = "block";
        hideOverlay = true;
        // set up the main canvas to pip affine transform matrix
        const pipMat = genvidMath.mat3FromArray(
          compositionData[1].affineMatrix
        );
        updateDomRect(pipFrameDiv, videoOverlay, pipMat);
        updateDomClipping(canvas3d, pipMat);
      }
    }
    if (!hideOverlay) {
      pipFrameDiv.style.display = "none";
      if (canvas3d) canvas3d.style.removeProperty("clip-path");
    }
  }
  // GENVID - updateOverlays stop

  // GENVID - msToDuration start
  // Method used to convert ms to specific duration
  function msToDuration(duration) {
    const msInADay = 1000 * 60 * 60 * 24;
    const date = new Date(duration);
    const days = (duration - (duration % msInADay)) / msInADay;
    return `${days ? `${days}:` : ""}${date.toLocaleTimeString(undefined, {
      hour12: false,
      timeZone: "GMT",
    })}:${preN(date.getMilliseconds().toFixed(0), 3, "0")}`;
  }
  // GENVID - msToDuration stop

  // GENVID - preN start
  /** Widens a string to at least n characters, prefixing with spaces. */
  function preN(str, n, c) {
    let s = str.length;
    if (s < n) {
      str = c.repeat(n - s) + str;
    }
    return str;
  }
  // GENVID - preN stop


  function updateStreamsInfoFromSession(session) {
    if (session) {
      if (session.streams["Positions"]) {
        cubePositions = session.streams["Positions"].user.position;
      }
      if (session.streams["Colors"]) {
        // Update the circle colors if they're new.
        if (cubeColors != session.streams["Colors"].user.color) {
          cubeColors = session.streams["Colors"].user.color;
          setCubeColors();
        }
      }
      if (session.streams["Camera"]) {
        cameraData = session.streams["Camera"].user;
        updateCamera();
      }
    }
  }

  // GENVID - updateDomRect start
  function updateDomRect(targetDom, referenceDom, mat) {
    // get the canvas rect
    const domQuad = genvidMath.Path2.makeQuad(0, 0, 1, 1);
    const pipQuad = new genvidMath.Path2(domQuad.getPoints());
    pipQuad.transform(mat);
    pipQuad.scale(referenceDom.style.width, referenceDom.style.height);
    const bbox = pipQuad.getBoundingBox();

    targetDom.style.left = `${bbox.x}px`;
    targetDom.style.top = `${bbox.y}px`;
    targetDom.style.width = `${bbox.width}px`;
    targetDom.style.height = `${bbox.height}px`;
  }
  // GENVID - updateDomRect stop

  // GENVID - updateDomClipping start
  function updateDomClipping(dom, mat) {
    // get the canvas rect
    const domQuad = genvidMath.Path2.makeQuad(0, 0, 1, 1);
    const pipQuad = new genvidMath.Path2(domQuad.getPoints());
    pipQuad.transform(mat);
    pipQuad.reverse();
    domQuad.append(pipQuad);
    domQuad.scale(dom.width, dom.height);
    dom.style.clipPath = domQuad.toCssPath();
  }
  // GENVID - updateDomClipping stop

  function setCubeColors() {
    for (let i = 0; i < cubeColors.length; ++i) {
      setCubeColor(i, cubeColors[i]);
    }
  }

  function setCubeColor(idx, color) {
    const sprite = cubes[idx];
    if (sprite) {
      sprite.material.color.setRGB(...color);
    }
  }

  function displayColorCounterMessage(message) {
    let colorCounterMessageDiv = document.querySelector(
      "#alert_color_counter"
    );
    colorCounterMessageDiv.style.visibility = "visible";
    let messageSpan = document.querySelector("#counter");
    messageSpan.innerHTML = message;
  }

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
