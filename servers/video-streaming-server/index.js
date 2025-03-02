import express from 'express';
import cors from 'cors';
import config from './utils/config.js';
import uploadRoutes from './routes/uploadVideos.js'
import morgan from 'morgan';
import createConnection from './queues/connection.js';
import pool from './utils/database.js';
import { generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';

const app = express();

app.use(cors(
    {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE',"OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["Content-Length", "ETag"],
    }
));
app.use(morgan('dev'));
app.use(express.json());
let channel
const initializeRabbitMQ = async () => {
    channel = await createConnection();  
};

await initializeRabbitMQ();
export { channel };
app.use('/api/v1/upload', uploadRoutes);

app.get('/api/v1/video/:id', async (req, res) => {
    if (!req.params.id) {
        return res.status(400).json({ error: "Video id is required" });
    }
    const result = await pool.query("SELECT * FROM Videos WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Video not found" });
    }

      const sasOptions = {
          containerName: config.AZURE_PROCESSED_VIDEO_CONTAINER,
          permissions: "r",
          startsOn: new Date(),
          expiresOn: new Date(new Date().valueOf() + 15 * 60 * 1000),
        };
    // generate sas token for accessing blob
        const sasToken = generateBlobSASQueryParameters(
          sasOptions,
          new StorageSharedKeyCredential(
            config.AZURE_STORAGE_ACCOUNT_NAME,
            config.AZURE_STORAGE_ACCESS_KEY
          )
        ).toString();
    res.json({...result.rows[0],sasToken});
});

app.get('/api/v1/videos', async (req, res) => {
    const result =  await pool.query("SELECT Videos.id FROM Videos");
    res.send(result.rows);
});


app.listen(config.PORT, () => {
    console.log(`app listening on port ${config.PORT}`);
});