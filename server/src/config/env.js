import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[CONFIG] Puuttuva ympäristömuuttuja: ${name}. Tarkista .env-tiedostosi`);
  }
  return value;
}

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  GROQ_API_KEY: required('GROQ_API_KEY'),
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  PORT: Number(process.env.PORT) || 3001,
};
