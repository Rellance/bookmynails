// Kutsuu availabilityService-metodeja, ei sisällä liiketoimintalogiikkaa.
import * as availabilityService from '../services/availability.service.js';

export async function listSlots(req, res, next) {
  try {
    const { technicianId, date } = req.query;
    res.json(await availabilityService.getFreeSlots({ technicianId: Number(technicianId), date }));
  } catch (err) {
    next(err);
  }
}

export async function createSlot(req, res, next) {
  try {
    const slot = await availabilityService.createSlot(req.body);
    res.status(201).json(slot);
  } catch (err) {
    next(err);
  }
}

export async function deleteSlot(req, res, next) {
  try {
    const deleted = await availabilityService.deleteSlot(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Aikaa ei löydy' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
