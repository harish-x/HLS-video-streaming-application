import client from "amqplib";
import config from "../utils/config.js";

const initializeRabbitMQ = async () => {
    const connection = await client.connect(config.RABBITMQENDPOINT);
    const channel = await connection.createChannel();
    console.log("Video Processor queue connection established");
    return channel;
};
export default initializeRabbitMQ;