// Helper for strict input validation across forms

export const validators = {
  // Validate Panamanian Cédula or ID format
  validateCedula(cedula) {
    if (!cedula || typeof cedula !== 'string') return 'La cédula es requerida.';
    const trimmed = cedula.trim();
    if (trimmed.length < 5 || trimmed.length > 15) {
      return 'La cédula debe tener entre 5 y 15 caracteres (Ej: 2-710-1234).';
    }
    // Prevent single repeated character spam like '333333333'
    if (/^(.)\1+$/.test(trimmed.replace(/-/g, ''))) {
      return 'Ingrese una cédula válida.';
    }
    const regex = /^[0-9EPEAea\-\s]+$/;
    if (!regex.test(trimmed)) {
      return 'La cédula solo debe contener números, letras (E, N, PE, AV) y guiones.';
    }
    return null;
  },

  // Validate Person Name / Surname
  validateName(name, fieldName = 'Nombre') {
    if (!name || typeof name !== 'string') return `El ${fieldName.toLowerCase()} es requerido.`;
    const trimmed = name.trim();
    if (trimmed.length < 2) return `El ${fieldName.toLowerCase()} debe tener al menos 2 letras.`;
    if (trimmed.length > 40) return `El ${fieldName.toLowerCase()} no puede exceder 40 caracteres.`;
    if (/^(.)\1+$/.test(trimmed)) return `Ingrese un ${fieldName.toLowerCase()} válido.`;
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\.'\-]+$/;
    if (!regex.test(trimmed)) {
      return `El ${fieldName.toLowerCase()} contiene caracteres no permitidos.`;
    }
    return null;
  },

  // Validate Phone
  validatePhone(phone) {
    if (!phone) return null; // Optional
    const trimmed = phone.trim();
    if (trimmed.length < 7 || trimmed.length > 15) {
      return 'El teléfono debe tener entre 7 y 15 dígitos (Ej: 6501-1122).';
    }
    if (/^(.)\1+$/.test(trimmed.replace(/[\-\s\+]/g, ''))) {
      return 'Ingrese un número de teléfono válido.';
    }
    const regex = /^[0-9\-\+\s\(\)]+$/;
    if (!regex.test(trimmed)) {
      return 'El teléfono solo debe contener números y símbolos (+, -).';
    }
    return null;
  },

  // Validate Email
  validateEmail(email) {
    if (!email) return null; // Optional
    const trimmed = email.trim();
    if (trimmed.length > 60) return 'El correo electrónico no puede exceder 60 caracteres.';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(trimmed)) {
      return 'Ingrese un correo electrónico válido (Ej: usuario@meduca.gob.pa).';
    }
    return null;
  },

  // Validate Text Field Length & Format
  validateText(text, fieldName, minLen = 2, maxLen = 60) {
    if (!text || typeof text !== 'string') return `El campo ${fieldName} es requerido.`;
    const trimmed = text.trim();
    if (trimmed.length < minLen) return `El campo ${fieldName} debe tener al menos ${minLen} caracteres.`;
    if (trimmed.length > maxLen) return `El campo ${fieldName} no puede exceder ${maxLen} caracteres.`;
    if (/^(.)\1+$/.test(trimmed)) return `Ingrese un valor válido para ${fieldName}.`;
    return null;
  }
};
