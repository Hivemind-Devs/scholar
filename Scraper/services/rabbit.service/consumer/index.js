const { startProfileConsumer } = require('./profile.worker');
const { startScholarConsumer } = require('./scholar.worker');

module.exports = {
    startProfileConsumer,
    startScholarConsumer
};