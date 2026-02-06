const knex = require('knex');
const knexConfig = require('../../knexfile');
const env = require('./env');

const environment = env.nodeEnv;
const config = knexConfig[environment];

const db = knex(config);

module.exports = db;
