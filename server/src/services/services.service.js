// Liiketoimintalogiikka palveluille (manikyyri, geelikynsien rakennukset jne.).
// Kutsuu servicesRepository-metodeja. Ei sisällä SQL:ää.
import * as repo from '../repositories/services.repository.js';

export function getServices(technicianId) {
  return repo.findAll(technicianId);
}

export function getServiceById(id) {
  return repo.findById(id);
}

export function createService(data) {
  return repo.insert(data);
}

export function updateService(id, data) {
  return repo.update(id, data);
}

export function deleteService(id) {
  return repo.remove(id);
}

// Fuzzy-haku palvelun nimellä — käyttää availability.service.js keston tarkistukseen.
export function findByNameFi(technicianId, nameFi) {
  return repo.findByNameFi(technicianId, nameFi);
}
