// Kutsuu aiService-metodeja, ei sisällä liiketoimintalogiikkaa.
import * as aiService from '../services/ai.service.js';

export async function chat(req, res, next) {
  try {
    const { message, technicianId } = req.body;
    if (!message) return res.status(400).json({ error: 'Viesti puuttuu' });

    // Asiakas lähettää saman sessionId:n kaikissa saman keskustelun viesteissä.
    // Jos sessionId puuttuu (ensimmäinen viesti), luodaan uusi UUID palvelimella.
    const sessionId = req.body.sessionId ?? crypto.randomUUID();

    const reply = await aiService.chat({ sessionId, message, technicianId });
    res.json(reply); // reply sisältää jo sessionId:n — asiakas tallentaa sen
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req, res, next) {
  try {
    const { sessionId } = req.params;
    res.json(await aiService.getHistory(sessionId));
  } catch (err) {
    next(err);
  }
}
