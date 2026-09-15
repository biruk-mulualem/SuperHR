// // server.js
// require('dotenv').config();  // Load environment variables
// const app = require('./app');  // Import app.js file

// const PORT = process.env.PORT || 5000;  // Set default port
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });


// server.js
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`   Web:      http://localhost:${PORT}`);
  console.log(`   Emulator: http://10.0.2.2:${PORT}`);
});