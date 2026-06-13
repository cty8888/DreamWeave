require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/v1/auth', authRoutes);

const tagsRoutes = require('./routes/tags');
app.use('/api/v1/tags', tagsRoutes);

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

const { initSchema } = require('./db/schema');
const { seed } = require('./db/seed');

initSchema();
seed();

const port = config.port;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
