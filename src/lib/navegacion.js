/**
 * navegacion.js — Utilidades de navegación en AsiSport con soporte para retorno a SaaSport.
 */

export const SAASPORT_PROD_URL = 'https://saasport.pro'; // Ajustar si es diferente
export const SAASPORT_DEV_URL = 'http://localhost:5174'; // SaaSport suele correr en el siguiente puerto

/** Retorna la URL base de SaaSport según el entorno */
export const getSaasportUrl = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? SAASPORT_DEV_URL : SAASPORT_PROD_URL;
};

export const volverOIrAPanel = (navigate, rutaFallback = '/admin/escuela') => {
  const params = new URLSearchParams(window.location.search);
  const origin = params.get('origin');

  if (origin === 'saasport') {
    window.location.href = `${getSaasportUrl()}/panel-escuela`;
  } else {
    navigate(rutaFallback);
  }
};

/** Mantiene el parámetro origin en las rutas internas */
export const rutaConOrigin = (ruta) => {
  const params = new URLSearchParams(window.location.search);
  const origin = params.get('origin');
  if (!origin) return ruta;
  
  const separator = ruta.includes('?') ? '&' : '?';
  return `${ruta}${separator}origin=${origin}`;
};
