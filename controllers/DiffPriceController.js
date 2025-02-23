const { Op } = require('sequelize');
const DiffPrice = require('../models/DiffPrice');

const DiffPriceController = {
    // 📌 Create
    create: async (data) => {        
        try {
            data.createdAt = new Date();
            const newPrice = await DiffPrice.create(data, { logging: false });
            return {
              response: { status: 200, message: "Created Diff Price", id: newPrice.id },
              meta: {deletePriceRecord: true}
            };
        } catch (error) {
            return {
              response: { status: 500, message: "Error creating", error: error.message },
              meta: {}
            };
        }
    },

    deleteOldRecords: async() => {
        try {
            const timeLimit = new Date();
            const timeLimitMinutes = parseInt(process.env.DELETE_RECORDS_TIME_LIMIT) || 10;
            timeLimit.setMinutes(timeLimit.getMinutes() - timeLimitMinutes); // Trừ đi 10 phút từ thời gian hiện tại
        
            const deletedCount = await DiffPrice.destroy({
              where: {
                createdAt: {
                  [Op.lt]: timeLimit
                }
              }
            });
        
            return deletedCount;
          } catch (error) {
            throw new Error('Error deleting old records: ' + error.message);
          }
    }
};

module.exports = DiffPriceController;
