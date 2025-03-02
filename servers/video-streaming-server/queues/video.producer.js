import { channel } from "../index.js";

const exchangeName = "video-processor-exchange";
export const videoProducer = async (videoUrl, uniqueFileName) => {  
    try {
        await channel.assertExchange(exchangeName, 'direct', { durable: true });
        // send video to queue
        await channel.publish(exchangeName,'process-video', Buffer.from(JSON.stringify({ videoUrl, uniqueFileName })));
        console.log("Video uploaded to video processor queue");
    } catch (error) {
        console.log(error);
    }
}