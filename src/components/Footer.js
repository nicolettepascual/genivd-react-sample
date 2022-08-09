import '../css/App.css';
import '../css/index.css';

function Footer() {
    return (
        <footer>
            <div className="container-fluid">
                <div className="row">
                    <div className="col-xs-8">
                        <div className="footer-info">
                            <p>
                                This Genvid SDK Demo Website and the functionality exhibited is
                                Proprietary &amp; Confidential, 2016-2020 Genvid Technologies
                                LLC. All Rights Reserved.
                            </p>
                        </div>
                    </div>
                    <div className="col-xs-4">
                        <div className="footer-info">
                            <div className="text-right">
                                <a href="https://www.genvidtech.com/">Genvid Technologies</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;