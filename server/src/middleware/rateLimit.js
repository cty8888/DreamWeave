// 轻量内存级固定窗口限流（零外部依赖，单实例足够课程项目使用）。
// 测试环境（NODE_ENV=test）自动放行，避免影响用例。
function rateLimit({ windowMs, max }) {
  const hits = new Map(); // key -> { count, reset }

  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next();

    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    let rec = hits.get(key);
    if (!rec || now > rec.reset) {
      rec = { count: 0, reset: now + windowMs };
      hits.set(key, rec);
    }
    rec.count++;

    if (rec.count > max) {
      res.set('Retry-After', String(Math.ceil((rec.reset - now) / 1000)));
      return res.status(429).json({ error: 'too many requests, try again later' });
    }
    next();
  };
}

module.exports = { rateLimit };
