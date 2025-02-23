const net = require('net');
const axios = require('axios');
const sequelize = require('./config/database');

const StandardPriceController = require('./controllers/StandardPriceController');
const DiffPriceController = require('./controllers/DiffPriceController');
const OrderController = require('./controllers/OrderController');

// Task
require('./tasks/cleanup');

// Định nghĩa route
const routes = {
  "/standard-price/create": StandardPriceController.create,
  // "/standard-price/read": StandardPriceController.readAll,
  // "/standard-price/readById": StandardPriceController.readById,
  // "/standard-price/update": StandardPriceController.update,
  // "/standard-price/delete": StandardPriceController.delete,
  
  "/diff-price/create": DiffPriceController.create,

  "/order/create": OrderController.create,
  "/order/position": OrderController.position,
  "/order/close": OrderController.closePosition,
  
  // Thêm controller khác nếu cần...
};
const modeForce = { force: true };
// const modeForce = {};

sequelize.sync(modeForce)
    .then(() => console.log("✅ Kết nối MySQL thành công!"))
    .catch(err => console.error("❌ Lỗi kết nối MySQL:", err));

// Tạo TCP server
const server = net.createServer((socket) => {
  // console.log('MQL5 connected.');
  socket.setNoDelay(true)
  socket.setTimeout(10000); // 10 giây không hoạt động thì đóng
  socket.setKeepAlive(true, 6000); // Giữ kết nối mở

  socket.on('data', async (data) => {
    try {
        const request = JSON.parse(data.toString().trim());
        // console.log('Received:', request);
        // console.time('handler');  // Bắt đầu đo thời gian node
        const handler = routes[request.path];
        if (!handler) {
          socket.write(JSON.stringify({ status: 404, message: "Route not found" }));
          return;
        }
        // Gọi handler với request.data (nếu có) và chờ kết quả
        const { response, meta } = await handler(request.data || {});
        
        // ✅ Trả về response ngay lập tức
        socket.write(JSON.stringify(response));
        // console.timeEnd('handler');
        // socket.end();
        // ✅ Xử lý các tác vụ nền dựa trên meta
        setImmediate(async () => {
          try {
            // if (meta.deletePriceRecord) {
            //   await StandardPriceController.deleteOldRecords();
            //   await DiffPriceController.deleteOldRecords();
            // }
            if (meta.telegramMessage) {
                // await sendTelegramMessage(meta.telegramMessage);
            }

          } catch (error) {
              console.error("Error in background tasks:", error);
          }
      });
        
        
    } catch (e) {
        socket.write(JSON.stringify({ status: 400, message: "Invalid request", error: e.message }));
    }

});

  // Xử lý khi kết nối bị đóng
  socket.on('end', () => {
    // console.log('MQL5 disconnected.');
  });

   // Xử lý lỗi
   socket.on('error', (err) => {
    if (err.code === 'ECONNRESET') {
      console.log('Client closed connection prematurely');
    } else {
      console.error('Socket error:', err);
    }
  });
});

// Lắng nghe trên cổng 4000
const PORT = process.env.PORT || 4000;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on 127.0.0.1:${PORT}`);
});

// Hàm gửi thông báo lên Telegram
async function sendTelegramMessage(message) {
  const token = '7281569973:AAF6OMYEhf8MU84FKfrdkUDyUoUmjdsPokE'
  const telegramApiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
  const chatId = '@TBO_group';

  try {
    const response = await axios.post(telegramApiUrl, {
      chat_id: chatId,
      text: message
    });
    // console.log('Telegram response:', response.data);
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}