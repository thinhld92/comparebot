const DiffPrice = require('../models/DiffPrice');
const StandardPrice = require('../models/StandardPrice');
const Action = require('../constants/Action');
const Order = require('../models/Order');

const OrderController = {
    /**
     * 1. kiểm tra điều kiện có order không?
     * - 
     * 2. kiểm tra có lệnh cần đóng không?
     * @param {*} data 
     * @returns 
     */
    // 📌 Create
    create: async (data) => {   
             
        try {
            // Lưu thêm lastticktime nữa để bỏ bớt tín hiệu thừa

            if (!data.standardAccount || !data.diffAccount) {
                return {
                    response: { status: 400, message: "data khong du 2 san" },
                    meta: {}
                  };
            }

            const standardRecord = await StandardPrice.getLastestRecordByAccount(data.standardAccount.toString().trim());
            const diffRecord = await DiffPrice.getLastestRecordByAccount(data.diffAccount.toString().trim());
            
            if (!diffRecord || !standardRecord) {
                return {
                    response: { status: 300, orderRecommend : Action.NONE, message: "Khong tim thay gia"},
                    meta: {}
                  };
            }
            const current = new Date();
            // console.log(current - standardRecord.createdAt);
            
            if (current - standardRecord.createdAt < process.env.TIME_STABLE || current - diffRecord.createdAt < process.env.TIME_STABLE) {
                return {
                    response: { status: 300, orderRecommend : Action.NONE, orderRecommend : Action.NONE, message: "Khong thoa thoi gian"},
                    meta: {}
                  };
            }

            let diff = 0;
            let closeRecommend = Action.NONE;
            // cắt lệnh sell
            if ((standardRecord.bidPrice - diffRecord.askPrice) >= process.env.CLOSE_POINT) {
                closeRecommend = Action.CLOSE_SELL;
                diff = standardRecord.bidPrice - diffRecord.askPrice;
            }

            // cắt lệnh buy
            if ((diffRecord.bidPrice - standardRecord.askPrice) >= process.env.CLOSE_POINT) {
                closeRecommend = Action.CLOSE_BUY;
                diff = diffRecord.bidPrice - standardRecord.askPrice;
            }

            // sell
            let orderRecommend = Action.NONE
            
            if ((diffRecord.bidPrice - standardRecord.askPrice) >= process.env.ENTRY_POINT) {
                orderRecommend = Action.SELL;
                diff = diffRecord.bidPrice - standardRecord.askPrice;
            }
            // buy
            if ((standardRecord.bidPrice - diffRecord.askPrice) >= process.env.ENTRY_POINT) {
                orderRecommend = Action.BUY;
                diff = standardRecord.bidPrice - diffRecord.askPrice;
            }

            if (orderRecommend !== Action.NONE) {
                const lastOrderRecord = await Order.getLastOrderByTickTimes(standardRecord.lastTickTime, diffRecord.lastTickTime);
                
                if (lastOrderRecord) {
                    return {
                        response: { status: 205, message: "ton tai recommend"},
                        meta: {}
                      };
                }
                data.createdAt = new Date();
                data.askStandardPrice = standardRecord.askPrice;
                data.bidStandardPrice = standardRecord.bidPrice;
                data.askDiffPrice = diffRecord.askPrice;
                data.bidDiffPrice = diffRecord.bidPrice;
                data.diff = diff;
                data.lastTickTimeStandard = standardRecord.lastTickTime;
                data.lastTickTimeDiff = diffRecord.lastTickTime;
                data.recommend = orderRecommend;
                const newOrder = await Order.create(data);

                
                return {
                    response: { status: 200, message: "success create order", orderRecommend:orderRecommend, closeRecommend:closeRecommend, id:newOrder.id},
                    meta: {}
                };
            }

            return {
                response: { status: 200, orderRecommend : orderRecommend, closeRecommend:closeRecommend, message: "Khong thoa gia"},
                meta: {}
              };

        } catch (error) {
            
            return {
                response: { status: 500, message: "Error finding", error: error.message },
                meta: {}
              };
        }
    },

    position: async (data) => {
        try {
            if (!data.ticket || !data.orderId || !data.positionOpen) {
                return {
                    response: { status: 200, message: "data not enough"},
                    meta: {}
                };
            }

            const [affectedRows] = await Order.update(
                { 
                    ticket: data.ticket, 
                    volume: data.volume, 
                    positionOpen: data.positionOpen 
                },
                { where: { id: data.orderId } }
            );

            if (affectedRows) {
                const order = await Order.findByPk(data.orderId);
                const recommendStr = order.recommend == Action.BUY ? 'Buy' : 'Sell';
                return {
                    response: { status: 200, message: "success update order"},
                    meta: {
                        telegramMessage: `${order.symbol}||${recommendStr}||${order.bidPrice}||${order.askPrice}||${order.diff.toFixed(3)}||${order.positionOpen}`
                    }
                };
            }
        
            return {
                response: { status: 200, message: "cant update"},
                meta: {}
            };
        } catch (error){
            console.log(error);
            
            return {
                response: { status: 500, message: "Error finding", error: error.message },
                meta: {}
            };
        }
    },

    closePosition: async (data) => {
        try {
            if (!data.length) {
                return {
                    response: { status: 200, message: "data not enough"},
                    meta: {}
                };
            }

            const updatePromises = data.map(async (item) => {
                const { ticket, positionClose } = item;
            
                // Cập nhật order với ticket và positionClose
                const [affectedCount] = await Order.update(
                    { positionClose }, // Dữ liệu muốn cập nhật
                    {
                    where: { ticket }, // Điều kiện tìm kiếm theo ticket
                    }
                );
            
                // Kiểm tra xem có cập nhật được record nào không
                if (affectedCount === 0) {
                    console.log(`No record found for ticket: ${ticket}`);
                } else {
                    console.log(`Successfully updated ticket: ${ticket}`);
                }
            });
            await Promise.all(updatePromises);
            const tickets = data.map(item => item.ticket);
            const orders = await Order.getOrdersByTickets(tickets);
            let teleMessage = '';
            if (orders.length > 0) {
                for (const order of orders) {
                    const recommendStr = order.recommend == Action.BUY ? 'Buy' : 'Sell';
                    teleMessage += `${order.symbol}||Close ${recommendStr}||${order.bidPrice}||${order.askPrice}||${order.diff.toFixed(3)}||${order.positionOpen}||${order.positionClose}\n`;
                }
            }
            return {
                response: { status: 200, message: "updated close order" },
                meta: {telegramMessage: teleMessage}
            };
        } catch (error){
            console.log(error);
            
            return {
                response: { status: 500, message: "Error finding", error: error.message },
                meta: {}
            };
        }
    }
    
};

module.exports = OrderController;
