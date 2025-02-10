const net = require('net');
const axios = require('axios');
const sequelize = require('./config/database');

const StandardPriceController = require('./controllers/StandardPriceController');
const DiffPriceController = require('./controllers/DiffPriceController');
const OrderController = require('./controllers/OrderController');

// Định nghĩa route
const routes = {
  "/standard-price/create": StandardPriceController.create,
  // "/standard-price/read": StandardPriceController.readAll,
  // "/standard-price/readById": StandardPriceController.readById,
  // "/standard-price/update": StandardPriceController.update,
  // "/standard-price/delete": StandardPriceController.delete,
  
  "/diff-price/create": DiffPriceController.create,
  // "/diff-price/read": DiffPriceController.readAll,
  // "/diff-price/readById": DiffPriceController.readById,
  // "/diff-price/update": DiffPriceController.update,
  // "/diff-price/delete": DiffPriceController.delete,

  "/order/create": OrderController.create,
  "/order/position": OrderController.position,
  "/order/close": OrderController.closePosition,
  
  // Các route cho UserController (ví dụ)
  // "/user/create": UserController.create,
  // "/user/read": UserController.readAll,
  // "/user/readById": UserController.readById,
  // "/user/update": UserController.update,
  // "/user/delete": UserController.delete,
  
  // Thêm controller khác nếu cần...
};
// const modeForce = { force: true };
const modeForce = {};

sequelize.sync(modeForce)
    .then(() => console.log("✅ Kết nối MySQL thành công!"))
    .catch(err => console.error("❌ Lỗi kết nối MySQL:", err));

// Tạo TCP server
const server = net.createServer((socket) => {
  // console.log('MQL5 connected.');
  socket.setNoDelay(true)
  socket.setKeepAlive(true, 6000); // Giữ kết nối mở

  socket.on('data', async (data) => {
    try {
      // let startTime = Date.now();  // Bắt đầu đo thời gian
        const request = JSON.parse(data.toString().trim());
        // console.log('Received:', request);

        const handler = routes[request.path];
        if (!handler) {
          socket.write(JSON.stringify({ status: 404, message: "Route not found" }));
          return;
        }
        // Gọi handler với request.data (nếu có) và chờ kết quả
        const { response, meta } = await handler(request.data || {});
        
        // ✅ Trả về response ngay lập tức
        socket.write(JSON.stringify(response));

        // ✅ Xử lý các tác vụ nền dựa trên meta
        setImmediate(async () => {
          try {
            if (meta.deletePriceRecord) {
                await StandardPriceController.deleteOldRecords();
                await DiffPriceController.deleteOldRecords();
            }

            if (meta.telegramMessage) {
                // await sendTelegramMessage(meta.telegramMessage);
            }

          } catch (error) {
              console.error("Error in background tasks:", error);
          }
      });
        
        
    } catch (e) {
        socket.write(JSON.stringify({ status: 400, message: "Invalid request", error: error.message }));
    }

});

  // Xử lý khi kết nối bị đóng
  socket.on('end', () => {
    // console.log('MQL5 disconnected.');
  });

  // Xử lý lỗi
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

// Lắng nghe trên cổng 4000
server.listen(process.env.PORT, '127.0.0.1', () => {
  console.log('Server running on port 4000');
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

// const a = {
//   command: "TrackData",
//   data: {
//     "Symbol":  
//   }
// }
