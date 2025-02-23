const net = require('net');
const axios = require('axios');
const cluster = require('cluster');
const os = require('os'); // Để lấy số CPU core
const sequelize = require('./config/database');
const winston = require('winston');

const StandardPriceController = require('./controllers/StandardPriceController');
const DiffPriceController = require('./controllers/DiffPriceController');
const OrderController = require('./controllers/OrderController');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: 'server.log' }), new winston.transports.Console()]
});

// Chuyển cleanup vào master
if (cluster.isMaster) {
  // Task
  // require('./tasks/cleanup'); // Chỉ chạy ở master
}

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

// Số worker dựa trên CPU core hoặc số MT5
const numWorkers = Math.min(os.cpus().length, 7); // Tối đa 7 worker cho 7 MT5
if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  sequelize.sync(modeForce)
    .then(() => console.log("✅ Kết nối MySQL thành công!"))
    .catch(err => console.error("❌ Lỗi kết nối MySQL:", err));

    // Fork worker
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Tạo lại worker nếu chết
  });
}else{
  console.log(`Worker ${process.pid} started`);

  // Tạo TCP server
  const server = net.createServer((socket) => {
    // console.log('MQL5 connected.');
    socket.setNoDelay(true)
    socket.setTimeout(0); // 10 giây không hoạt động thì đóng
    socket.setKeepAlive(true, 60000); // Giữ kết nối mở

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
              logger.error("Error in background tasks:", { error: error.message });
            }
        });
          
          
      } catch (e) {
          logger.error(`Worker ${process.pid} error`, { error: e.message });
          socket.write(JSON.stringify({ status: 400, message: "Invalid request", error: e.message }));
      }

  });

  // Xử lý khi kết nối bị đóng
  socket.on('end', () => {
    // logger.info('Client disconnected');
  });

  socket.on('timeout', () => socket.end());

    // Xử lý lỗi
    socket.on('error', (err) => {
      if (err.code === 'ECONNRESET') logger.info('Client closed prematurely');
      else logger.error('Socket error:', { error: err.message });
    });
  });

  // Lắng nghe trên cổng 4000
  const PORT = process.env.PORT || 4000;
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on 127.0.0.1:${PORT}`);
  });
}
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
