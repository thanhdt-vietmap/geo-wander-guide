import express, { Express, Request, Response } from 'express';
import path from 'path';
import corsMiddleware from './middleware/cors';
import apiRoutes from './routes/api';

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3443');
const isDev: boolean = process.env.NODE_ENV !== 'production';

// Middleware
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', apiRoutes);

// Health check for root
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'Server is running!', 
    environment: isDev ? 'development' : 'production',
    timestamp: new Date().toISOString()
  });
});

// Serve static files in production
if (!isDev) {
  const distPath = path.join(__dirname, '../../dist');
  app.use(express.static(distPath));
  
  // Handle React Router - serve index.html for all non-API routes
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req: Request, res: Response) => {
    res.json({ 
      message: 'Development server running',
      frontend: 'http://localhost:5173',
      api: `http://localhost:${PORT}/api`
    });
  });
}

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: isDev ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${isDev ? 'development' : 'production'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api`);
});