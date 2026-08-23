const sequelize = require('../db/db');
const { DataTypes } = require('sequelize');

const User = sequelize.define(
    'user',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, unique: true },
        password: { type: DataTypes.STRING },
        token: { type: DataTypes.STRING },
    }
);

const Room = sequelize.define(
    'room',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING },
        roomToken: { type: DataTypes.TEXT, required: true, unique: true },
    },
);
module.exports = {
    User,
    Room
};