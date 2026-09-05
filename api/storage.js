// Vercel serverless function (deployed automatically because it lives under /api).
// Backs the site's storage with a real database (Upstash Redis via the Vercel
// Marketplace), so data survives across devices and browsers — not just the one
// browser that saved it.
//
// Requires an Upstash Redis integration connected to this project (Storage tab
// in the Vercel dashboard). Vercel injects KV_REST_API_URL / KV_REST_API_TOKEN
// (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN, depending on how the
// integration names them) automatically once connected — no manual .env needed.

import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const NOT_CONFIGURED = {
  error:
    "Banco de dados não conectado. No painel do Vercel: Storage > Create Database > escolha um Redis (Upstash) > Connect ao projeto.",
};

export default async function handler(req, res) {
  if (!redis) {
    return res.status(500).json(NOT_CONFIGURED);
  }

  try {
    if (req.method === "GET") {
      if (req.query.list !== undefined) {
        const prefix = typeof req.query.prefix === "string" ? req.query.prefix : "";
        const keys = await redis.keys(`${prefix}*`);
        return res.status(200).json({ keys });
      }
      const key = req.query.key;
      if (!key || typeof key !== "string") {
        return res.status(400).json({ error: "missing key" });
      }
      const value = await redis.get(key);
      if (value === null || value === undefined) {
        return res.status(404).json({ error: "not found" });
      }
      return res.status(200).json({ key, value });
    }

    if (req.method === "POST") {
      const { key, value } = req.body || {};
      if (!key || typeof key !== "string") {
        return res.status(400).json({ error: "missing key" });
      }
      await redis.set(key, value);
      return res.status(200).json({ key, value });
    }

    if (req.method === "DELETE") {
      const key = req.query.key;
      if (!key || typeof key !== "string") {
        return res.status(400).json({ error: "missing key" });
      }
      await redis.del(key);
      return res.status(200).json({ key, deleted: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: (e && e.message) || "internal error" });
  }
}
