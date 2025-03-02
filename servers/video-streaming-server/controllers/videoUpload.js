import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import config from "../utils/config.js";
import { videoProducer } from "../queues/video.producer.js";
import pool from "../utils/database.js";

const AZURE_STORAGE_ACCOUNT_NAME = config.AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_STORAGE_ACCESS_KEY = config.AZURE_STORAGE_ACCESS_KEY;
const AZURE_TEMP_CONTAINER_NAME = config.AZURE_TEMP_CONTAINER_NAME;

const blobServiceClient = new BlobServiceClient(
  `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  new StorageSharedKeyCredential(
    AZURE_STORAGE_ACCOUNT_NAME,
    AZURE_STORAGE_ACCESS_KEY
  )
);

export const uploadVideo = async (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.body;
    const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024;

    if (!fileType.startsWith("video/"))
      return res.status(400).json({ error: "Invalid file type" });
    if (fileSize > MAX_VIDEO_SIZE)
      return res.status(400).json({ error: "File too large" });

    // create unique file name
    const uniqueFileName = `videos/${uuidv4()}-${fileName}`;
    const containerClient = blobServiceClient.getContainerClient(
      AZURE_TEMP_CONTAINER_NAME
    );
    const blobClient = containerClient.getBlockBlobClient(uniqueFileName);

    const sasOptions = {
      containerName: AZURE_TEMP_CONTAINER_NAME,
      blobName: uniqueFileName,
      permissions: "cw",
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 15 * 60 * 1000),
    };
    // generate sas token for the blob
    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      new StorageSharedKeyCredential(
        AZURE_STORAGE_ACCOUNT_NAME,
        AZURE_STORAGE_ACCESS_KEY
      ) 
    ).toString();

    res.json({ sasUrl: `${blobClient.url}?${sasToken}`, uniqueFileName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const validateUpload = async (req, res) => {
  try {
    const { uniqueFileName } = req.body;
    const containerClient = blobServiceClient.getContainerClient(
      AZURE_TEMP_CONTAINER_NAME
    );
    const blobClient = containerClient.getBlockBlobClient(uniqueFileName);

    const exists = await blobClient.exists();
    if (!exists)
      return res.status(400).json({ error: "File not found in storage" });

    const videoUrl = blobClient.url;
    // send video to queue
    videoProducer(videoUrl.toString(), uniqueFileName);

    // save video to database
    await pool.query(
      "INSERT INTO Temp_videos (url, unique_file_name) VALUES ($1, $2)",
      [videoUrl, uniqueFileName]
    );
    res.json({
      message: "Upload validated & completed",
      videoUrl: blobClient.url,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
