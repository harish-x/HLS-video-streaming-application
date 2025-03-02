import client from 'amqplib';
import config from '../utils/config.js';

async function createConnection(){
    const connection  = await client.connect(config.RABBITMQENDPOINT)
    const channel = await connection.createChannel()
    console.log("Video Processor queue connection established");
    return channel
}

export default createConnection