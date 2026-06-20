// Liiketoimintalogiikka mestareille.
// Kutsuu techniciansRepository-metodeja. Ei sisällä SQL:ää.
import * as repo from '../repositories/technicians.repository.js';

export function getTechnicians() {
  return repo.findAll();
}

export function getTechnicianById(id) {
  return repo.findById(id);
}

export function createTechnician(data) {
  return repo.insert(data);
}

export function updateTechnician(id, data) {
  return repo.update(id, data);
}

export function deleteTechnician(id) {
  return repo.remove(id);
}
