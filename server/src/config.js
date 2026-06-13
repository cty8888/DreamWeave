require('dotenv').config();

// 生产环境必须显式配置 JWT_SECRET，禁止回退到公开的默认值（否则 token 可被伪造）
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '7d',
  // 允许的跨域来源；逗号分隔，默认仅本地开发端口
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : ['http://localhost:5173', 'http://localhost:3000'],
  llm: {
    apiKey: process.env.LLM_API_KEY || '',
    baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
  },
  dbPath: process.env.DB_PATH || './data/dreamweave.db',
};
