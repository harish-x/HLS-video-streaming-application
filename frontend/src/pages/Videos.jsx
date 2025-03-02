import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Videos = () => {
  const [videos, setvideos] = useState([]);

  useEffect(() => {
    (async function fetchFromDb() {
      await fetch(
        `${import.meta.env.VITE_VIDEOSTREAMING_SERVER_BASEURL}/videos`
      )
        .then((res) => res.json())
        .then((res) => setvideos(res))
        .catch((err) => console.log(err));
    })();
  }, []);
  return (
    <div className="flex flex-col items-center justify-center p-10 h-[100vh]">
      <div className="flex gap-4">
        {videos?.map((video) => (
          <Link to={`/video/${video.id}`} key={video.id}>
            <div
              className="text-3xl aspect-video h-32  bg-slate-400 rounded-2xl cursor-pointer flex items-center justify-center"
              key={video.id}
            >
              <p className="text-center">{video.id}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Videos;
