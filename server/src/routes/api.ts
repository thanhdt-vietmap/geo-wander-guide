import { Router, Request, Response } from 'express';
import { ApiResponse, User, HealthStatus } from '../types';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response<ApiResponse<HealthStatus>>) => {
  const healthData: HealthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };

  res.json({
    success: true,
    data: healthData
  });
});

// Test endpoint
router.get('/test', (req: Request, res: Response<ApiResponse<string>>) => {
  res.json({
    success: true,
    data: 'Hello from TypeScript proxy server!',
    message: 'Server is working correctly'
  });
});

// Users endpoint
router.get('/users', (req: Request, res: Response<ApiResponse<User[]>>) => {
  const users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
  ];

  res.json({
    success: true,
    data: users
  });
});

// Get user by ID
router.get('/users/:id', (req: Request, res: Response<ApiResponse<User>>) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid user ID'
    });
  }

  const user: User = {
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`
  };

  res.json({
    success: true,
    data: user
  });
});

// Create user endpoint
router.post('/users', (req: Request, res: Response<ApiResponse<User>>) => {
  const { name, email } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Name is required'
    });
  }

  const newUser: User = {
    id: Date.now(),
    name,
    email
  };

  res.status(201).json({
    success: true,
    data: newUser,
    message: 'User created successfully'
  });
});

export default router;