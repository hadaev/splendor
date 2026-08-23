'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
    async up({ context: queryInterface }) {
        await queryInterface.createTable('users', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING, unique: true },
            password: { type: DataTypes.STRING },
            token: { type: DataTypes.STRING },
            createdAt: { type: DataTypes.DATE, allowNull: false },
            updatedAt: { type: DataTypes.DATE, allowNull: false },
        });

        await queryInterface.createTable('rooms', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING },
            roomToken: { type: DataTypes.TEXT, allowNull: false, unique: true },
            createdAt: { type: DataTypes.DATE, allowNull: false },
            updatedAt: { type: DataTypes.DATE, allowNull: false },
        });
    },

    async down({ context: queryInterface }) {
        await queryInterface.dropTable('rooms');
        await queryInterface.dropTable('users');
    }
};
