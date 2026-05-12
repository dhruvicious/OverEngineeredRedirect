import express from "express";
import { rateLimit } from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { logger } from "./logger.js";
import { getDailyLink, getCacheStatus } from "./leetcode.js";

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));

app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 30,                    // 30 req/min per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, slow down." },
});

app.use(limiter);

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/daily", async (req, res) => {
  try {
    const link = await getDailyLink();
    res.redirect(302, `https://leetcode.com${link}`);
  } catch (err) {
    req.log.error({ code: err.code }, err.message);

    const statusMap = {
      UPSTREAM_TIMEOUT: 504,
      UPSTREAM_NETWORK: 503,
      UPSTREAM_ERROR:   502,
      BAD_RESPONSE:     502,
    };

    res
      .status(statusMap[err.code] ?? 500)
      .json({ error: err.message, code: err.code ?? "INTERNAL" });
  }
});

app.get("/health", (_, res) => {
  res.json({ ok: true, cache: getCacheStatus() });
});

// 404
app.use((_, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server started");
});