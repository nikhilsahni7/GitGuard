import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { Permit } from 'permitio';
import { authenticateJwt } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { accessRequestRouter } from './routes/accessRequest';
import { auditLogRouter } from './routes/auditLog';
import { authRouter } from './routes/auth';
import { organizationRouter } from './routes/organization';
import { repositoryRouter } from './routes/repository';
import { userRouter } from './routes/user';

// Load environment variables
dotenv.config();


const app = express();
const PORT = process.env.PORT || 4000;


export const prisma = new PrismaClient();


export const permit = new Permit({
  token: process.env.PERMIT_API_KEY || '',
  pdp: process.env.PERMIT_PDP_URL || 'http://localhost:7766',
  log: {
    level: "debug",
  },
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', authenticateJwt, userRouter);
app.use('/api/repositories', authenticateJwt, repositoryRouter);
app.use('/api/access-requests', authenticateJwt, accessRequestRouter);
app.use('/api/organizations', authenticateJwt, organizationRouter);
app.use('/api/audit-logs', authenticateJwt, auditLogRouter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});


app.use(errorHandler as express.ErrorRequestHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
