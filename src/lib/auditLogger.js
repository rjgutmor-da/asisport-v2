import { supabase } from './supabaseClient';

export const logActivity = (options) => {
  const {
    escuela_id,
    usuario_id,
    usuario_nombre,
    accion,
    modulo,
    entidad_id,
    detalle
  } = options;

  // Fire and forget
  supabase
    .from('audit_log')
    .insert([{
      escuela_id,
      usuario_id,
      usuario_nombre,
      accion,
      modulo,
      entidad_id,
      detalle,
      // Distinguimos el origen
      ip_address: 'AsiSport' 
    }])
    .then(({ error }) => {
      if (error) console.error('Error logging activity:', error);
    });
};
