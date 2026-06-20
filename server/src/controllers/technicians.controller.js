// Kutsuu techniciansService-metodeja, ei sisällä liiketoimintalogiikkaa.
import * as techniciansService from '../services/technicians.service.js';

export async function listTechnicians(req, res, next) {
  try {
    res.json(await techniciansService.getTechnicians());
  } catch (err) {
    next(err);
  }
}

export async function createTechnician(req, res, next) {
  try {
    const technician = await techniciansService.createTechnician(req.body);
    res.status(201).json(technician);
  } catch (err) {
    next(err);
  }
}

export async function getTechnician(req, res, next) {
  try {
    const technician = await techniciansService.getTechnicianById(Number(req.params.id));
    if (!technician) return res.status(404).json({ error: 'Mestaria ei löydy' });
    res.json(technician);
  } catch (err) {
    next(err);
  }
}

export async function updateTechnician(req, res, next) {
  try {
    const technician = await techniciansService.updateTechnician(Number(req.params.id), req.body);
    if (!technician) return res.status(404).json({ error: 'Mestaria ei löydy' });
    res.json(technician);
  } catch (err) {
    next(err);
  }
}

export async function deleteTechnician(req, res, next) {
  try {
    const deleted = await techniciansService.deleteTechnician(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Mestaria ei löydy' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
