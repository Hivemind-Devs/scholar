const config = require('../bin');

const logger = require('./logger.service');

const {makeRabbitMQService} = require('./rabbit.service');
const rabbitMQService = makeRabbitMQService({logger : console});
const rabbitClient = rabbitMQService.createRabbitMQClient({
    host : config.get('rabbitMQConnection.host'),
    port : config.get('rabbitMQConnection.port'),
    username : config.get('rabbitMQConnection.username'),
    password : config.get('rabbitMQConnection.password'),
    connectionName : `Hivemind@${config.getEnvironment()}`,
    queuePrefix : config.get('rabbitMQConnection.queuePrefix'),
    logger : logger
});
rabbitClient.connect();

const {
    startProfileConsumer, 
    startScholarConsumer
} = require('./rabbit.service/consumer');

module.exports = {
    rabbitClient,
    startProfileConsumer,
    startScholarConsumer
};