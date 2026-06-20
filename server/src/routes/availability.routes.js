import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { slotSchema } from '../schemas/slot.schema.js';
import * as controller from '../controllers/availability.controller.js';

export const availabilityRouter = Router();

// GET  /api/availability?technicianId=&date=  — hae vapaat ajat
// POST /api/availability                       — lisää aika mestarin kalenteriin
// DELETE /api/availability/:id                 — poista aika
availabilityRouter.get('/', controller.listSlots);
availabilityRouter.post('/', validate(slotSchema), controller.createSlot);
availabilityRouter.delete('/:id', controller.deleteSlot);
