import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { pathToFileURL } from 'url';

function vercelApiDevPlugin() {
  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();

        const routeName = req.url.split('?')[0].replace(/^\/api\//, '');
        const filePath = path.resolve(process.cwd(), 'api', routeName + '.js');

        let rawBody = '';
        req.on('data', (chunk) => {
          rawBody += chunk;
        });

        req.on('end', async () => {
          try {
            if (rawBody) {
              try {
                req.body = JSON.parse(rawBody);
              } catch {
                req.body = rawBody;
              }
            } else {
              req.body = {};
            }

            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
            res.json = (payload) => {
              if (!res.headersSent) {
                res.setHeader('Content-Type', 'application/json');
              }
              res.end(JSON.stringify(payload));
              return res;
            };

            const moduleUrl = pathToFileURL(filePath).href + '?t=' + Date.now();
            const mod = await import(moduleUrl);
            await mod.default(req, res);
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: 'Local API Middleware Error',
                details: err?.message || String(err),
              })
            );
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);
  return {
    plugins: [react(), vercelApiDevPlugin()],
  };
});
