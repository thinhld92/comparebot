const { Op } = require('sequelize');
const StandardPrice = require('../models/StandardPrice');

const StandardPriceController = {
    // 📌 Create
    create: async (data) => {        
        try {
            data.createdAt = new Date();
            const newPrice = await StandardPrice.create(data);
            return {
                response: { status: 200, message: "Created Standard Price", id: newPrice.id },
                meta: {}
              };
        } catch (error) {
            return {
                response: { status: 500, message: "Error creating", error: error.message },
                meta: {}
              };
        }
    },

    // 📌 Read all
    readAll: async () => {
        try {
            const prices = await StandardPrice.findAll();
            return { status: 200, prices };
        } catch (error) {
            return { status: 500, message: "Error fetching data", error: error.message };
        }
    },

    // 📌 Read by ID
    readById: async (id) => {
        try {
            const price = await StandardPrice.findByPk(id);
            if (!price) return { status: 404, message: "Not found" };
            return { status: 200, price };
        } catch (error) {            
            return { status: 500, message: "Error fetching data", error: error.message };
        }
    },

    // 📌 Update
    update: async (id, data) => {
        try {
            const updated = await StandardPrice.update(data, { where: { id } });
            if (!updated[0]) return { status: 404, message: "Not found" };
            return { status: 200, message: "Updated successfully" };
        } catch (error) {
            return { status: 500, message: "Error updating", error: error.message };
        }
    },

    // 📌 Delete
    delete: async (id) => {
        try {
            const deleted = await StandardPrice.destroy({ where: { id } });
            if (!deleted) return { status: 404, message: "Not found" };
            return { status: 200, message: "Deleted successfully" };
        } catch (error) {
            return { status: 500, message: "Error deleting", error: error.message };
        }
    },

    deleteOldRecords: async() => {
        try {
            const timeLimit = new Date();
            const timeLimitMinutes = parseInt(process.env.DELETE_RECORDS_TIME_LIMIT) || 10;
            timeLimit.setMinutes(timeLimit.getMinutes() - timeLimitMinutes); // Trừ đi 10 phút từ thời gian hiện tại
        
            const deletedCount = await StandardPrice.destroy({
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
    },
};

module.exports = StandardPriceController;
