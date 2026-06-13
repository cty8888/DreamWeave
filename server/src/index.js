require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = config.port;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
