// server.js
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Wrap Express in an HTTP server so Socket.IO can share the port
const httpServer = http.createServer(app);

// Attach Socket.IO
initSocket(httpServer);

httpServer.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`   Web:      http://localhost:${PORT}`);
  console.log(`   Emulator: http://10.0.2.2:${PORT}`);
  console.log(`   Socket.IO: attached`);
});