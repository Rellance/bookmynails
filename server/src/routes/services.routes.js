import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { serviceSchema } from '../schemas/service.schema.js';
import * as controller from '../controllers/services.controller.js';

export const servicesRouter = Router();

// GET  /api/services                          — hae kaikki palvelut (opt. ?technicianId=)
// POST /api/services                          — luo uusi palvelu
// GET  /api/services/:id                      — hae palvelu id:llä
// PUT  /api/services/:id                      — päivitä palvelua
// DELETE /api/services/:id                    — poista palvelu
servicesRouter.get('/', controller.listServices);
servicesRouter.post('/', validate(serviceSchema), controller.createService);
servicesRouter.get('/:id', controller.getService);
servicesRouter.put('/:id', validate(serviceSchema.partial()), controller.updateService);
servicesRouter.delete('/:id', controller.deleteService);
