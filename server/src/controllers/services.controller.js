// Kutsuu servicesService-metodeja, ei sisällä liiketoimintalogiikkaa.
import * as servicesService from '../services/services.service.js';

export async function listServices(req, res, next) {
  try {
    const { technicianId } = req.query;
    res.json(await servicesService.getServices(technicianId ? Number(technicianId) : undefined));
  } catch (err) {
    next(err);
  }
}

export async function createService(req, res, next) {
  try {
    const service = await servicesService.createService(req.body);
    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
}

export async function getService(req, res, next) {
  try {
    const service = await servicesService.getServiceById(Number(req.params.id));
    if (!service) return res.status(404).json({ error: 'Palvelua ei löydy' });
    res.json(service);
  } catch (err) {
    next(err);
  }
}

export async function updateService(req, res, next) {
  try {
    const service = await servicesService.updateService(Number(req.params.id), req.body);
    if (!service) return res.status(404).json({ error: 'Palvelua ei löydy' });
    res.json(service);
  } catch (err) {
    next(err);
  }
}

export async function deleteService(req, res, next) {
  try {
    const deleted = await servicesService.deleteService(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Palvelua ei löydy' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
