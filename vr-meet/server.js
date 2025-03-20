const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
    console.log('🔹 A client connected.');

    ws.on('message', message => {
        console.log('📩 Received message:', message);

        // 广播消息给所有客户端（除了自己）
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('🔻 A client disconnected.');
        // 通知所有客户端用户离开了
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'leave' }));
            }
        });
    });
});

console.log('✅ WebSocket signaling server running on ws://localhost:8080');
