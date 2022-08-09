import './css/App.css';
import './css/index.css';

import Header from './components/Header.js';
import Footer from './components/Footer.js';
import VideoOverlay from './components/VideoOverlay';

function App() {
  return (
    <>
      <div className="wrap">
        <Header />
        <VideoOverlay />
      </div>
      <Footer />
    </>
  );
}

export default App;
