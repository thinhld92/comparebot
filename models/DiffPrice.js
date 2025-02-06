const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiffPrice = sequelize.define("DiffPrice", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    company: { type: DataTypes.STRING(128), allowNull: true },
    server: { type: DataTypes.STRING(128), allowNull: true },
    serverCode: { type: DataTypes.STRING(64), allowNull: false, field: "server_code" },
    account: { type: DataTypes.STRING(32), allowNull: false },
    symbol: { type: DataTypes.STRING(16), allowNull: false },
    askPrice: { type: DataTypes.DOUBLE, allowNull: false , field: "ask_price" },
    bidPrice: { type: DataTypes.DOUBLE, allowNull: false , field: "bid_price" },
    lastTickTime: { type: DataTypes.BIGINT, allowNull: true , field: "last_tick_time" },
    createdAt: { 
        type: DataTypes.DATE(3), 
        allowNull: false, 
        field: "created_at", 
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)')
    }
}, {
    tableName: "diff_prices",
    timestamps: false,
    indexes: [
        { fields: ["server_code"] },
        { fields: ["account"] }
    ]
});

DiffPrice.getLastestRecordByAccount = async function(acountId) {
    try {
        const record = await this.findOne({
            where: { account: acountId },
            order: [['createdAt', 'DESC']] // Sắp xếp lấy record mới nhất
            // ,logging: console.log
        });

        return record;
    } catch (error) {
        console.error("Error fetching record:", error);
        throw error;
    }
};

module.exports = DiffPrice;