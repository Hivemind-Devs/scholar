const config = require('../bin');
const { makePool, makeQueryBuilder } = require('./querybuilder');
const makeRepositories = require('./repositories');

// Initialize pools (these return Observables of the pool)
const poolMaster = makePool(config.get('postgresConfig.master'));
const poolFloating = makePool(config.get('postgresConfig.floating'));
const poolSync = makePool(config.get('postgresConfig.sync'));
const poolAsync = makePool(config.get('postgresConfig.async'));

const logger = console; // Or use the logger service if available there

// Pass the Observables directly to makeQueryBuilder
const queryBuilder = makeQueryBuilder({ 
    poolMaster, 
    poolFloating, 
    poolSync, 
    poolAsync, 
    logger 
});

const repositories = makeRepositories(queryBuilder);

module.exports = {
    repositories,
    queryBuilder
};
