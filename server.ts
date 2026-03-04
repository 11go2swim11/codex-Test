import express from "express";
import { createServer as createViteServer } from "vite";
import YahooFinance from "yahoo-finance2";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Set a common user agent to avoid being blocked by Yahoo Finance
const yahooFinance = new YahooFinance({
  validation: { logErrors: false },
  fetchOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/quote/:symbol", async (req, res) => {
    const { symbol } = req.params;
    try {
      console.log(`[API] Fetching quote for: ${symbol}`);
      const quote = await yahooFinance.quote(symbol);
      if (!quote) {
        console.warn(`[API] No quote found for: ${symbol}`);
        return res.status(404).json({ error: "Quote not found" });
      }
      console.log(`[API] Quote received for ${symbol}`);
      res.json(quote);
    } catch (error) {
      console.error(`[API] Error fetching quote for ${symbol}:`, error);
      res.status(500).json({ 
        error: "Failed to fetch quote", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.get("/api/history/:symbol", async (req, res) => {
    const { symbol } = req.params;
    try {
      const { period1, period2, interval } = req.query;
      console.log(`[API] Fetching history for: ${symbol}, params:`, { period1, period2, interval });
      
      const queryOptions: any = {
        interval: (interval as any) || '1d'
      };

      if (period1) {
        queryOptions.period1 = period1;
      } else {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 1);
        queryOptions.period1 = date;
      }

      if (period2) {
        queryOptions.period2 = period2;
      } else {
        queryOptions.period2 = new Date();
      }

      const history = await yahooFinance.historical(symbol, queryOptions);
      console.log(`[API] History received for ${symbol}: ${Array.isArray(history) ? history.length : 0} rows`);
      res.json(history);
    } catch (error) {
      console.error(`[API] Error fetching history for ${symbol}:`, error);
      res.status(500).json({ 
        error: "Failed to fetch history", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.get("/api/search/:query", async (req, res) => {
    const { query } = req.params;
    try {
      console.log(`[API] Searching for: ${query}`);
      let results;
      try {
        results = await yahooFinance.search(query);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!message.includes("Schema validation")) throw err;
        console.warn("[API] Search schema validation failed; retrying without validation.");
        results = await (yahooFinance as any).search(query, undefined, { validateResult: false });
      }
      console.log(`[API] Search results for ${query}: ${results.quotes?.length || 0} quotes`);
      res.json(results);
    } catch (error) {
      console.error(`[API] Error searching for ${query}:`, error);
      res.status(500).json({ 
        error: "Failed to search", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
