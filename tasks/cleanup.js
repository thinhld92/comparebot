const cron = require('node-cron');
const StandardPriceController = require('../controllers/StandardPriceController');
const DiffPriceController = require('../controllers/DiffPriceController');

async function deleteOldRecords() {
  try {
    await Promise.all([
      StandardPriceController.deleteOldRecords(),
      DiffPriceController.deleteOldRecords()
    ]);
    console.log(`Deleted old records older than 2 minutes at ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    console.error("Error deleting old records:", error);
  }
}

// Lên lịch chạy mỗi 2 phút
cron.schedule('*/2 * * * *', deleteOldRecords);
// cron.schedule('* * * * *', deleteOldRecords);

module.exports = deleteOldRecords;
