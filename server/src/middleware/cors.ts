import cors from 'cors';

const corsOptions: cors.CorsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? false // Chỉ cho phép same origin trong production
    : ['http://localhost:5173', 'http://localhost:3443'], // Dev origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

export default cors(corsOptions);