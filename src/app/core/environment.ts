const production = true; // false para desenvolvimento local

export const environment = {
  production,
  apiUrl: production
    ? 'https://parking-backend-production-2a75.up.railway.app/api'
    : 'http://localhost:5109/api',
};
