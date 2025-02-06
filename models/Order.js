const { Sequelize, DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define("Order", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    company: { type: DataTypes.STRING(128), allowNull: true },
    server: { type: DataTypes.STRING(128), allowNull: true },
    serverCode: { type: DataTypes.STRING(64), allowNull: false, field: "server_code" },
    account: { type: DataTypes.STRING(32), allowNull: false },
    symbol: { type: DataTypes.STRING(16), allowNull: false },
    askPrice: { type: DataTypes.DOUBLE, allowNull: false , field: "ask_price" },
    bidPrice: { type: DataTypes.DOUBLE, allowNull: false , field: "bid_price" },
    askStandardPrice: { type: DataTypes.DOUBLE, allowNull: false , field: "ask_standard_price" },
    bidStandardPrice: { type: DataTypes.DOUBLE, allowNull: false , field: "bid_standard_price" },
    askDiffPrice: { type: DataTypes.DOUBLE, allowNull: false , field: "ask_diff_price" },
    bidDiffPrice: { type: DataTypes.DOUBLE, allowNull: false , field: "bid_diff_price" },
    diff: {type: DataTypes.DOUBLE, allowNull: false , field: "diff"},
    lastTickTimeStandard: { type: DataTypes.BIGINT, allowNull: true , field: "last_tick_time_standard" },
    lastTickTimeDiff: { type: DataTypes.BIGINT, allowNull: true , field: "last_tick_time_diff" },
    recommend: {type: DataTypes.INTEGER, allowNull: true },
    action: {type: DataTypes.INTEGER, allowNull: true },
    ticket: {type: DataTypes.BIGINT, allowNull: true },
    volume: {type: DataTypes.DOUBLE, allowNull: true },
    positionOpen: {type: DataTypes.DOUBLE, allowNull: true, field: "position_open" },
    close: {type: DataTypes.INTEGER, allowNull: true },
    positionClose: {type: DataTypes.DOUBLE, allowNull: true, field: "position_close" },
    profit: {type: DataTypes.DOUBLE, allowNull: true },
    createdAt: { 
        type: DataTypes.DATE(3), 
        allowNull: false, 
        field: "created_at", 
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)')
    }
}, {
    tableName: "orders",
    timestamps: false,
    indexes: [
        { fields: ["server_code"] },
        { fields: ["account"] },
        { fields: ["ticket"] },
        { fields: ["last_tick_time_standard", "last_tick_time_diff"] }
    ]
});

Order.getLastOrderByTickTimes = async function (lastTickTimeStandard, lastTickTimeDiff) {
    try {
        const record = await Order.findOne({
            where: {
                lastTickTimeStandard: lastTickTimeStandard,
                lastTickTimeDiff: lastTickTimeDiff
            },
            order: [['createdAt', 'DESC']] // Lấy record mới nhất theo createdAt
        });

        return record;
    } catch (error) {
        console.error("Error fetching last order:", error);
        throw error;
    }
};

Order.getOrdersByTickets = async (ticketList) => {
    try {
        const orders = await Order.findAll({
            where: {
                ticket: {
                    [Op.in]: ticketList  // Điều kiện tìm kiếm tất cả các ticket trong danh sách
                }
            }
        });
        return orders;
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};

module.exports = Order;