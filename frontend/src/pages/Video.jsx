import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Hls from "hls.js";

const Video = () => {
  const params = useParams();
  const videoRef = useRef(null);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(null);
  const [hlsInstance, setHlsInstance] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const loadVideo = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_VIDEOSTREAMING_SERVER_BASEURL}/video/${
            params.id
          }`
        );

        const data = await response.json();
        console.log(data)
        if (data.length === 0) {
          setErr("Video not found");
          setLoading(false);
          return;
        }

        const videoUrl = `${data.url}?${data.sasToken}`;

        console.log(videoUrl);

        if (!videoRef.current) {
          console.error("Video element not found");
          setErr("Player initialization failed");
          setLoading(false);
          return;
        }
        // check if hls.js is supported
        if (Hls.isSupported()) {
          if (hlsInstance) {
            hlsInstance.destroy();
          }

          const hls = new Hls({
            debug: false,
            enableWorker: true,
          });

          hls.loadSource(videoUrl);
          hls.attachMedia(videoRef.current);

          hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            console.log("Manifest parsed, levels:", data.levels.length);
            setQualities(data.levels);
            setCurrentQuality(data.levels.length - 1);
            setLoading(false);

            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                console.error("Autoplay prevented:", error);
              });
            }
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error("Network error");
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error("Media error");
                  hls.recoverMediaError();
                  break;
                default:
                  hls.destroy();
                  setErr(`Fatal playback error: ${data.details}`);
                  setLoading(false);
                  break;
              }
            }
          });

          setHlsInstance(hls);
          // check if the browser is natively able to play HLS stream (apple safari)
        } else if (
          videoRef.current.canPlayType("application/vnd.apple.mpegurl")
        ) {
          videoRef.current.src = videoUrl;
          videoRef.current.addEventListener("loadedmetadata", () => {
            setLoading(false);
            videoRef.current
              .play()
              .catch((e) => console.error("Autoplay prevented:", e));
          });
          videoRef.current.addEventListener("error", (e) => {
            console.error("Video error:", e);
            setErr("Video playback error");
            setLoading(false);
          });
        } else {
          setErr("HLS is not supported in your browser");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching or setting up video:", err);
        setErr("Failed to load video");
        setLoading(false);
      }
    };

    loadVideo();

    // cleanup
    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [params.id]);

  const handleQualityChange = (level) => {
    if (hlsInstance) {
      console.log("Changing quality to level:", level);
      hlsInstance.currentLevel = level;
      setCurrentQuality(level);
    }
  };

  if (err) {
    return (
      <div className="flex items-center justify-center h-svh max-w-[1280px] mx-auto">
        <h1 className="text-3xl">{err}</h1>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-svh max-w-[1280px] mx-auto">
      <div className="w-full">
        {loading && (
          <div className="flex items-center justify-center h-[calc(9/16*100%)] bg-black">
            <h1 className="text-white text-3xl">Loading video...</h1>
          </div>
        )}

        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            className="absolute top-0 left-0 w-full h-full"
            style={{ display: loading ? "none" : "block" }}
          ></video>
        </div>

        {qualities.length > 0 && (
          <div className="mt-4">
            <label htmlFor="quality-select" className="mr-2">
              Quality:
            </label>
            <select
              id="quality-select"
              value={currentQuality}
              onChange={(e) => handleQualityChange(Number(e.target.value))}
            >
              {qualities.map((level, index) => (
                <option key={index} value={index}>
                  {level.height}p
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default Video;
