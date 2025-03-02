import express from "express";
import cors from "cors";
import config from "./utils/config.js";
import createConnection from "./queue/connection.js";
import { consumeVideo } from "./queue/video.consumer.js";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Length", "ETag"],
  })
);
app.use(express.json());

let channel;

(async function connectQ() {
  channel = await createConnection();
    // consume video from queue
    await consumeVideo(channel);
})();


app.listen(config.PORT, () => {
  console.log(`app listening on port ${config.PORT}`);
});

