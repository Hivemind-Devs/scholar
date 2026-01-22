const {
    rabbitClient,
    startProfileConsumer,
    startScholarConsumer
} = require('./services');

startProfileConsumer(rabbitClient);
startScholarConsumer(rabbitClient);
