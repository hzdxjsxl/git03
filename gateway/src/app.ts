import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsConfig } from './middleware/cors';
import { apiLimiter } from './middleware/rateLimiter';
import { requestIdMiddleware } from './middleware/requestId';
import healthRoutes from './routes/health';
import proxyRoutes from './routes/proxy';
import { config } from './config';

const app: Application = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: config.nodeEnv === 'production' ? undefined : false,
}));

app.use(requestIdMiddleware);
app.use(corsConfig);
app.use(apiLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use('/health', healthRoutes);
app.use(proxyRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});

export default app;
