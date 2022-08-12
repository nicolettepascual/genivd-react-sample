import '../css/App.css';
import '../css/index.css';
import '../css/icons.css';

import genvidOverlayLogo from '../img/genvid_overlay.png';


import { videoOverlayDefaultStyle } from "../utils/constants.js";

const VideoOverlay = (props) => {
    const helpOverlayVisibility = props.showHelpOverlay ? "visible" : "hidden";
    const genvidOverlayVisibility = props.toggleGenvidOverlay ? "visible" : "hidden";

    return (
        <div className="main">
            <div>
                <div id="help_overlay" style={{ visibility: helpOverlayVisibility }}>
                    <h2>Tutorial sample help</h2>
                    <p>
                        The tutorial sample application is streamed directly into this
                        window. All the cubes move along a specific path. On the webpage,
                        a WebGL circle is displayed moving along each cube at their proper
                        location. The User is able to interact with either the application
                        or the webpage directly.
                    </p>
                    <div className="alert alert-success" id="alert_notification">
                        <strong>Notification received: </strong>
                        <span id="notification_message">Message</span>
                    </div>
                    <table id="table_help">
                        <tbody>
                            <tr>
                                <th colSpan="2">Global</th>
                                <th colSpan="2">Video</th>
                                <th colSpan="2">Bottom panels</th>
                            </tr>
                            <tr>
                                <td>M</td>
                                <td>Mute or unmute the stream</td>
                                <td>Click on cube</td>
                                <td>Panel highlight and circle brighter</td>
                                <td>Click 👍</td>
                                <td>Change player popularity (heart icon)</td>
                            </tr>
                            <tr>
                                <td>Z</td>
                                <td>Reduce volume of the stream</td>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                                <td>Click reset</td>
                                <td>Reset cube position</td>
                            </tr>
                            <tr>
                                <td>X</td>
                                <td>Increase volume of the stream</td>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                                <td>Click color</td>
                                <td>Change cube color</td>
                            </tr>
                            <tr>
                                <td>Space</td>
                                <td>Pause or unpause the stream</td>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                            </tr>
                            <tr>
                                <td>+</td>
                                <td>Increase the DelayOffset</td>
                                <th colSpan="2">Header Buttons</th>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                            </tr>
                            <tr>
                                <td>-</td>
                                <td>Decrease the DelayOffset</td>
                                <td className="help_header">Play</td>
                                <td>Return to the interactive video player</td>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                            </tr>
                            <tr>
                                <td>*</td>
                                <td>Reset the DelayOffset</td>
                                <td className="help_header">Admin</td>
                                <td>Access the admin page (u: admin p: admin)</td>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                            </tr>
                            <tr>
                                <td>G</td>
                                <td>Show or hide the Genvid overlay</td>
                                <td>
                                    <img
                                        id="help_genvid_overlay_button"
                                        src={genvidOverlayLogo}
                                        alt="Genvid Overlay"
                                    />
                                </td>
                                <td>Show or hide the Genvid overlay</td>
                            </tr>
                            <tr>
                                <td>H</td>
                                <td>Open or close the help menu</td>
                                <td className="help_header">Help Menu</td>
                                <td>Open or close the help menu</td>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                            </tr>
                            <tr>
                                <td>F</td>
                                <td>Toggles fullscreen</td>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="video-chat">
                <div className="row">
                    <div className="col-xs-12 col-md-12 col-lg-12">
                        <div id="video_area">
                            <div id="genvid_overlay" className="invisible_div" style={{ visibility: genvidOverlayVisibility }}>
                                <div id="video_overlay" style={{ height: videoOverlayDefaultStyle.height, width: videoOverlayDefaultStyle.width, display: 'block', left: videoOverlayDefaultStyle.left, top: '0px' }}>
                                    <canvas id="canvas_overlay_3d" style={{ height: '100%', width: '100%' }}></canvas>
                                    <div id="pip_frame"></div>
                                    <div id="mouse_overlay" onClick={(e) => props.clickScene(e)}>
                                        <div id="mute-button" onClick={() => props.toggleMute()}>
                                            <i className="fa fa-lg" aria-hidden="true"></i>
                                        </div>
                                        <div className="fullscreen-button" onClick={() => props.toggleFullScreen()}>
                                            <i className="fa fa-expand fa-lg" aria-hidden="true"></i>
                                        </div>
                                    </div>
                                    <div id="volume_display"></div>
                                    <div id="timeCamScene_overlay"></div>
                                </div>
                                <div id="info_overlay">
                                    <div id="time_local"></div>
                                    <div id="time_video"></div>
                                    <div
                                        title="last composition time received"
                                        id="time_compose_last"
                                    ></div>
                                    <div id="time_stream"></div>
                                    <div id="latency"></div>
                                    <div id="delay_offset"></div>
                                </div>
                                <div className="alert alert-success" id="alert_color_counter">
                                    <span id="counter">Message</span>
                                </div>
                            </div>
                            <div id="video_player"></div>
                            <div className="row nopadding gameControlsDiv">
                                <div
                                    id="cube_panel_prototype"
                                    className="col-md-6 col-lg-4 nopadding"
                                >
                                    <div className="cube clickable">
                                        <div>
                                            <span className="cube_name clickable">Prototype cube</span>
                                            <button className="cheer">
                                                <i className="icon_like" aria-hidden="true"></i>
                                            </button>
                                            <span className="cheer_value"></span>
                                        </div>
                                        <div>
                                            <span className="label clickable reset">Reset</span>
                                            <span className="cube_position position_x"></span>
                                            <span className="cube_position position_y"></span>
                                            <span className="cube_position position_z"></span>
                                        </div>
                                        <table className="cube_color text-center">
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <button className="command_button green">Green</button>
                                                    </td>
                                                    <td>
                                                        <button className="command_button white">White</button>
                                                    </td>
                                                    <td>
                                                        <button className="command_button yellow">
                                                            Yellow
                                                        </button>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <button className="command_button darkblue">
                                                            Dark blue
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <button className="command_button grey">Grey</button>
                                                    </td>
                                                    <td>
                                                        <button className="command_button lightblue">
                                                            Light Blue
                                                        </button>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <button className="command_button orange">
                                                            Orange
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <button className="command_button blue">Blue</button>
                                                    </td>
                                                    <td>
                                                        <button className="command_button purple">
                                                            Purple
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VideoOverlay;