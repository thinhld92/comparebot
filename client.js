const net = require('net');

const client = net.createConnection({ port: 4000 }, () => {
    console.log('Connected to server');

    // Gửi yêu cầu GET_TIME
    client.write(JSON.stringify({ command: "GET_TIME" }) + "\n");
});

client.on('data', (data) => {
    console.log('Server response:', data.toString());
    client.end();
});

client.on('end', () => {
    console.log('Disconnected from server');
});
