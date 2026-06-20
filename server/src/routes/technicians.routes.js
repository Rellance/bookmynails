import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { technicianSchema } from '../schemas/technician.schema.js';
import * as controller from '../controllers/technicians.controller.js';

export const techniciansRouter = Router();

// GET  /api/technicians        — hae kaikki mestarit
// POST /api/technicians        — luo uusi mestari
// GET  /api/technicians/:id    — hae mestari id:llä
// PUT  /api/technicians/:id    — päivitä mestarin tiedot
// DELETE /api/technicians/:id  — poista mestari
techniciansRouter.get('/', controller.listTechnicians);
techniciansRouter.post('/', validate(technicianSchema), controller.createTechnician);
techniciansRouter.get('/:id', controller.getTechnician);
techniciansRouter.put('/:id', validate(technicianSchema.partial()), controller.updateTechnician);
techniciansRouter.delete('/:id', controller.deleteTechnician);
