/**
 * Formatea un número de teléfono para que sea compatible con WhatsApp (wa.me)
 * Si el número tiene 8 dígitos (Bolivia), se le agrega el prefijo 591
 * @param {string} phone - El número de teléfono original
 * @returns {string} - El número limpio y con prefijo internacional
 */
export const formatWhatsAppPhone = (phone) => {
    if (!phone) return '';

    // Eliminar todo lo que no sea dígito
    const cleanPhone = phone.replace(/\D/g, '');

    // Si tiene 8 dígitos, asumimos que es de Bolivia y le falta el prefijo
    if (cleanPhone.length === 8) {
        return `591${cleanPhone}`;
    }

    return cleanPhone;
};
