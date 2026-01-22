const { Pool } = require('pg');
const {of, mergeMap, map, catchError} = require('rxjs');

const makePool = (postgresConnectionString) => {
    const pool = new Pool(postgresConnectionString);
    return of(pool);
}

const makeQueryBuilder = ({poolMaster, poolFloating, poolAsync, poolSync, logger}) => ({query, pool, params = [], logObject = {}, methodName}) => {
    let poolToUse = poolMaster;

    switch (pool) {
        case 'floating':
            poolToUse = poolFloating;
            break;
        case 'async':
            poolToUse = poolAsync;
            break;
        case 'sync':
            poolToUse = poolSync;
            break;
    }

    return poolToUse.pipe(
        mergeMap(pool => pool.query(query, params)),
        map(result => ({success : true, data : result})),
        catchError(error => {
            logger.error(`${methodName || 'Query Builder'} Error : `,{
                ...logObject,
                message : error?.message,
                constraint : error?.constraint,
                name : error?.name,
                code : error?.code,
                where : error?.where
            });

            return of({success : false, error : 'Database Error'});
        })
    )
}

module.exports = {makeQueryBuilder, makePool}