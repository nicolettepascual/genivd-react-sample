import '../css/App.css';
import '../css/index.css';
import genvidOverlayLogo from '../img/genvid_overlay.png';

const Header = (props) => {
    return (
        <header>
            <div className="container-fluid">
                <div className="navbar-header">
                    <button
                        type="button"
                        className="navbar-toggle collapsed"
                        data-toggle="collapse"
                        data-target="#navbar"
                        aria-expanded="false"
                        aria-controls="navbar"
                    >
                        <span className="sr-only">Toggle navigation</span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                    </button>
                    <a className="logo navbar-brand" href="/"> </a>
                </div>
                <div id="navbar" className="navbar-collapse collapse">
                    <ul className="nav navbar-nav">
                        <li className="active"><a href="/">Play</a></li>
                    </ul>
                    <ul className="nav navbar-nav navbar-right">
                        <li>
                            <a title="Show/Hide Genvid overlay" id="genvid_overlay_button" onClick={props.toggleGenvidOverlay} href="/">
                                <img
                                    src={genvidOverlayLogo}
                                    alt="Genvid Overlay"
                                    className="clickable"
                                    style={{ opacity: props.isGenvidOverlayToggled ? 1 : 0.3 }}
                                />
                            </a>
                        </li>
                        <li><a id="help_button" className="clickable" onClick={props.onHelpActivation} href='/'>Help Menu</a></li>
                    </ul>
                </div>
            </div>
        </header>
    );
}

export default Header;
