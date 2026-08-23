require('dotenv').config();
const {Sequelize} = require('sequelize');

const options = {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    timezone: '+00:00'
};

if (process.env.DB_SSL === 'true') {
    options.dialectOptions = {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    };
}

module.exports = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, options);