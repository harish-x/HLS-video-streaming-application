import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import config from "./config.js";
import { BlobServiceClient } from "@azure/storage-blob";
import pool from "./database.js";

const OUTPUT_DIR = "./hls_videos";
const AZURE_CONNECTION_STRING = `DefaultEndpointsProtocol=https;AccountName=${config.AZURE_STORAGE_ACCOUNT_NAME};AccountKey=${config.AZURE_STORAGE_ACCESS_KEY};EndpointSuffix=core.windows.net`;
const CONTAINER_NAME = config.AZURE_PROCESSED_VIDEO_CONTAINER;

const processAndUploadVideo = async (videoUrl) => {
  try {
    await validateVideo(videoUrl);

    // Process video first
    const videoName = path.basename(videoUrl, path.extname(videoUrl));
    const outputPath = path.join(OUTPUT_DIR, videoName);

    await processVideo(videoUrl);

    // Upload to Azure and create master manifest
    const manifestUrl = await uploadToAzure(videoName, outputPath);

    // Clean up local files
    await cleanupLocalFiles(outputPath);
    await pool.query("INSERT INTO Videos (url) VALUES ($1)", [manifestUrl]);
    console.log(manifestUrl);
  } catch (error) {
    console.error("Error in processAndUploadVideo:", error);
    throw error;
  }
};

const processVideo = async (videoUrl) => {
  const { height } = await getVideoResolution(videoUrl);
  const videoName = path.basename(videoUrl, path.extname(videoUrl));
  const outputPath = path.join(OUTPUT_DIR, videoName);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  //get available resolutions
  const availableResolutions = [
    { name: "360p", size: "640x360", bandwidth: 800000 },
    { name: "720p", size: "1280x720", bandwidth: 2400000 },
    { name: "1080p", size: "1920x1080", bandwidth: 4800000 },
    { name: "1440p", size: "2560x1440", bandwidth: 8000000 },
    { name: "2160p", size: "3840x2160", bandwidth: 16000000 },
    { name: "4320p", size: "7680x4320", bandwidth: 32000000 },
  ].filter((res) => parseInt(res.size.split("x")[1]) <= height);

  if (availableResolutions.length === 0) {
    availableResolutions.push({
      name: "360p",
      size: "640x360",
      bandwidth: 800000,
    });
  }

  // process video using ffmpeg
  for (const { name, size, bandwidth } of availableResolutions) {
    await new Promise((resolve, reject) => {
      ffmpeg(videoUrl)
        .outputOptions([
          "-preset fast",
          "-g 48",
          "-sc_threshold 0",
          `-b:v ${bandwidth}`,
          "-movflags +faststart",
          "-max_muxing_queue_size 1024",
        ])
        .videoCodec("libx264")
        .size(size)
        .audioCodec("aac")
        .audioBitrate("128k")
        .outputOptions([
          "-f hls",
          "-hls_time 4",
          "-hls_playlist_type vod",
          `-hls_segment_filename ${outputPath}/${name}_%03d.ts`,
          "-preset veryfast",
          "-threads 2",
          "-hls_flags independent_segments",
          "-progress pipe:2",
        ])
        .output(`${outputPath}/${name}.m3u8`)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });
  }

  await createMasterManifest(outputPath, availableResolutions);
};

const validateVideo = async (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to probe video: ${err.message}`));
        return;
      }

      const videoStream = metadata.streams.find(
        (s) => s.codec_type === "video"
      );
      if (!videoStream) {
        reject(new Error("No video stream found in the file"));
        return;
      }

      // Get video metadata with fallbacks for missing information
      const videoInfo = {
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        bitrate: videoStream.bit_rate || metadata.format.bit_rate || "2000k",
        duration: videoStream.duration || metadata.format.duration || 0,
        fps: eval(videoStream.r_frame_rate || "24/1"),
        codec: videoStream.codec_name || "unknown",
      };

      console.log("Video metadata:", videoInfo);
      resolve(videoInfo);
    });
  });
};
// create master manifest for the video
const createMasterManifest = async (outputPath, resolutions) => {
  let masterContent = "#EXTM3U\n#EXT-X-VERSION:3\n";

  for (const { name, size, bandwidth } of resolutions) {
    const [width, height] = size.split("x");
    masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${size}\n${name}.m3u8\n`;
  }

  fs.writeFileSync(path.join(outputPath, "master.m3u8"), masterContent);
};
const uploadToAzure = async (videoName, localPath) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

  // Create container if it doesn't exist
  await containerClient.createIfNotExists();

  const files = fs.readdirSync(localPath);
  const uploadPromises = files.map(async (file) => {
    const filePath = path.join(localPath, file);
    const blobClient = containerClient.getBlockBlobClient(
      `${videoName}/${file}`
    );

    await blobClient.uploadFile(filePath);
  });

  await Promise.all(uploadPromises);


  // Return the URL to the master manifest
  return `${config.FRONTDOOR_ENDPOINT}${CONTAINER_NAME}/${videoName}/master.m3u8`;
};

const cleanupLocalFiles = async (outputPath) => {
  try {
    if (fs.existsSync(outputPath)) {
      fs.rmSync(outputPath, { recursive: true, force: true });
    }
    if (fs.existsSync(OUTPUT_DIR)) {
      const files = fs.readdirSync(OUTPUT_DIR);
      if (files.length === 0) {
        fs.rmdirSync(OUTPUT_DIR);
      }
    }
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
};
const getVideoResolution = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      const { width, height } =
        metadata.streams.find((s) => s.codec_type === "video") || {};
      resolve({ width, height });
    });
  });
};

export default processAndUploadVideo;
