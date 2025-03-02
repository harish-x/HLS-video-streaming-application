import processVideo from "../utils/process-video.js";
const consumeVideo = async (channel) => { 
    const queueName = "video-processor-queue";
    await channel.assertQueue(queueName, { durable: true });
    channel.bindQueue(queueName, "video-processor-exchange", "process-video");

    channel.consume(queueName, async (message) => {
        if (message) {
            const video = JSON.parse(message.content.toString());            
            await processVideo(video.videoUrl, video.uniqueFileName);
        }
    }, { noAck: true });
}
export { consumeVideo }