import "./App.css";
import { Route, Routes, BrowserRouter as Router, Link } from "react-router-dom";
import Videos from "./pages/Videos.jsx";
import UploadVideo from "./pages/UploadVideo.jsx";
import Home from "./pages/Home.jsx";
import Video from "./pages/Video.jsx";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/videos" element={<Videos />} />
          <Route path="/upload" element={<UploadVideo />} />
          <Route path="/video/:id" element={<Video />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
