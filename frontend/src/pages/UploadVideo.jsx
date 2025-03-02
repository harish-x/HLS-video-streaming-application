import React from "react";

const UploadVideo = () => {
  const [loading, setLoading] = React.useState(0);
  const [spinner, setSpinner] = React.useState(false);
  const [err,setErr] = React.useState("");
  async function uploadLargeVideo(file, sasUrl) {
    const chunkSize = 10 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const blockIds = [];

    try {
      // Upload the video in chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);

        const blockId = btoa(`block-${String(i).padStart(6, "0")}`);
        blockIds.push(blockId);

        await fetch(
          `${sasUrl}&comp=block&blockid=${encodeURIComponent(blockId)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Length": chunk.size.toString(),
            },
            body: chunk,
          }
        );

        setLoading(((i + 1) / totalChunks) * 100);
      }
      // commit the block list
      const blockListXml = `<?xml version="1.0" encoding="utf-8"?><BlockList>${blockIds
        .map((id) => `<Latest>${id}</Latest>`)
        .join("")}</BlockList>`;

      await fetch(`${sasUrl}&comp=blocklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/xml" },
        body: blockListXml,
      });
      setLoading(0);
      console.log("Upload completed successfully!");
    } catch (error) {
      console.error(error);
    }
  }

  async function uploadVideo(file) {
    if (!file) return;
    setSpinner(true);
    const { sasUrl, uniqueFileName } = await fetch(
      `${
        import.meta.env.VITE_VIDEOSTREAMING_SERVER_BASEURL
      }/upload/request-upload-url`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      }
    )
      .then((res) => res.json()).catch((err) => setErr(err.message))
      setSpinner(false);
    await uploadLargeVideo(file, sasUrl);
    await fetch(
      `${
        import.meta.env.VITE_VIDEOSTREAMING_SERVER_BASEURL
      }/upload/verify-upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uniqueFileName,
        }),
      }
    );
  }

  return (
    <div>
      <div className={"p-10 w-3/4 mx-auto"}>
        <h1 className={"text-3xl font-bold underline text-center mt-10 "}>
          {" "}
          Upload Video
        </h1>
        <div
          className={
            "flex justify-center items-center flex-col border-1 border-black/10 rounded mt-10 "
          }
        >
          <label htmlFor="upload" className={"p-10 cursor-pointer"}>
            {" "}
            <img
              className={"w-20 border-2 border-dashed border-black/20 p-2"}
              src="https://cdn3.iconfinder.com/data/icons/social-media-management-soft-fill/60/Upload-Video-uploading-videos-send-512.png "
              alt=""
            />{" "}
            Choose a file
          </label>
          <input
            type="file"
            className={"hidden"}
            name="upload"
            id={"upload"}
            accept={"video/*"}
            onChange={(e) => uploadVideo(e.target.files[0])}
          />

          {spinner && (<span className="loader"></span>)}
      
          {loading > 0 && (
            <div
              className={"w-full h-2 bg-gray-200 rounded-full overflow-hidden"}
            >
              <div
                className={"h-full bg-blue-500"}
                style={{ width: `${loading}%` }}
              ></div>
            </div>
          )}
          {err && <p className="text-red-500 text-xs">{err}</p>}
        </div>
      </div>
    </div>
  );
};

export default UploadVideo;
