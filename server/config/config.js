const fs = require('fs');

module.exports = {
    development: {
        username: 'postgres',
        password: '241083',
        database: 'splendor',
        dialect: 'postgres',
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialectOptions: {
        },
    },
};