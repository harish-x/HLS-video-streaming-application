<h1 >HLS Streaming Application</h1>


### Overview
This project is a simple HLS streaming application with two backend servers responsible for video streaming, uploading, and processing. It leverages Azure Blob Storage, Azure CDN, and RabbitMQ for efficient video delivery and processing.

### Architecture



![Screenshot from 2025-03-07 12-35-13](https://github.com/user-attachments/assets/3688e4b8-e570-4059-98fc-d519319225d1)

The application consists of the following components:

 #### 1. Video Streaming Server
 
  - Handles video streaming and uploading.
  - Generates SAS (Shared Access Signature) URLs for secure video upload and streaming.
  - Streams videos from a private Azure Blob Storage.

 #### 2. Video Processing Server

   - Processes uploaded videos using FFmpeg.
   - Stores processed videos in Azure Blob Storage.
   - Sends processed video URLs to the frontend via RabbitMQ.

 #### 3. Azure Blob Storage

  - A temporary storage container for uploaded videos.
  - A private storage container for streaming, accessible only via SAS tokens.

 #### 4. Azure CDN + Front Door

   - Serves processed videos efficiently to users.

 #### 5. RabbitMQ

   - Manages message queues to process videos asynchronously.



### Features

  - Secure video upload and retrieval using SAS tokens.
  - Video processing with FFmpeg.
  - HLS streaming with Azure Blob Storage and CDN.
  - Asynchronous message-based processing with RabbitMQ.

### Setup Instructions

  - Node.js (for backend servers)
  - FFmpeg (for video processing)
  - RabbitMQ (for messaging)
  - Azure Storage Account
  - Azure CDN & Front Door

### Installation

  1. Clone the repository:

     ```
       git clone https://github.com/your-repo/hls-streaming.git
       cd hls-streaming
     ```
  2. Install dependencies:

     ```
       cd video-streaming-server
       npm install
       cd ../video-processing-server
       npm install
     ```
  3. Configure environment variables

     - .env for frontend react app
       
      ```
        VITE_VIDEOSTREAMING_SERVER_BASEURL=http://localhost:3000/api/v1
      ```

      - .env for both servers 
        
      ```
        PORT=3000
        AZURE_STORAGE_ACCOUNT_NAME=<your-storage-account>
        AZURE_STORAGE_ACCESS_KEY=<your-storage-key>
        AZURE_TEMP_CONTAINER_NAME=<your-temp-container>
        RABBITMQENDPOINT=amqp://<rabbitMQ url>
        AZURE_PROCESSED_VIDEO_CONTAINER=<your-processed-container>
        DB_HOST=<your-postgres-host>
        DB_NAME=<your-postgres-dbname>
        DB_USER=<your-postgres-user>
        DB_PASSWORD=<your-postgres-password>
        FRONTDOOR_ENDPOINT=<your-azure-front-door-url>
      ```

  4. Run servers:

     ```
       cd video-streaming-server
       npm start
       cd ../video-processing-server
       npm start
     ```

### Usage

  1. Upload a video using the video-streaming-server API.
  2. The video-processing-server processes the video and stores it in Azure Blob Storage.
  3. The frontend fetches the video via Azure CDN and streams it using HLS.

  
