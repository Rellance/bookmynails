import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { techniciansRouter } from './routes/technicians.routes.js';
import { servicesRouter } from './routes/services.routes.js';
import { availabilityRouter } from './routes/availability.routes.js';
import { bookingsRouter } from './routes/bookings.routes.js';
import { aiRouter } from './routes/ai.routes.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/technicians', techniciansRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/availability', availabilityRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/ai', aiRouter);

  app.use((req, res) => res.status(404).json({ error: 'Reittiä ei löytynyt' }));
  app.use(errorHandler);

  return app;
}
