import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname,"..",".env") });

class config {
    constructor() {
        this.PORT = process.env.PORT || 3000;
        this.AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
        this.AZURE_STORAGE_ACCESS_KEY = process.env.AZURE_STORAGE_ACCESS_KEY;
        this.AZURE_TEMP_CONTAINER_NAME = process.env.AZURE_TEMP_CONTAINER_NAME;
        this.RABBITMQENDPOINT = process.env.RABBITMQENDPOINT;
        this.AZURE_PROCESSED_VIDEO_CONTAINER = process.env.AZURE_PROCESSED_VIDEO_CONTAINER
        this.DB_NAME = process.env.DB_NAME
        this.DB_USER = process.env.DB_USER
        this.DB_PASSWORD = process.env.DB_PASSWORD
        this.DB_HOST = process.env.DB_HOST
    }
}

export default new config();