// Shared strict validation functions with 5-8 word clear user messages

export const validators = {
  // 1. Cédula Validation (5-8 words)
  validateCedula(cedula) {
    if (!cedula || typeof cedula !== 'string') return 'La cédula del funcionario es requerida.';
    const trimmed = cedula.trim();
    if (trimmed.length < 5 || trimmed.length > 15) {
      return 'Ingrese una cédula entre 5 y 15 caracteres.';
    }
    if (/^(.)\1+$/.test(trimmed.replace(/-/g, ''))) {
      return 'Ingrese una cédula válida sin repeticiones de caracteres.';
    }
    const regex = /^[0-9EPEAea\-\s]+$/;
    if (!regex.test(trimmed)) {
      return 'La cédula solo admite números, letras y guiones.';
    }
    return null;
  },

  // 2. Name / Surname Validation (5-8 words)
  validateName(name, fieldName = 'Nombre') {
    if (!name || typeof name !== 'string') return `El ${fieldName.toLowerCase()} del funcionario es requerido.`;
    const trimmed = name.trim();
    if (trimmed.length < 2) return `El ${fieldName.toLowerCase()} debe contener al menos 2 letras.`;
    if (trimmed.length > 40) return `El ${fieldName.toLowerCase()} no puede exceder 40 caracteres.`;
    if (/^(.)\1+$/.test(trimmed)) return `Ingrese un ${fieldName.toLowerCase()} válido sin repeticiones.`;
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\.'\-]+$/;
    if (!regex.test(trimmed)) {
      return `El ${fieldName.toLowerCase()} contiene caracteres especiales no permitidos.`;
    }
    return null;
  },

  // 3. Phone Validation (5-8 words)
  validatePhone(phone) {
    if (!phone) return null; // Optional
    const trimmed = phone.trim();
    if (trimmed.length < 7 || trimmed.length > 15) {
      return 'Ingrese un teléfono entre 7 y 15 dígitos.';
    }
    if (/^(.)\1+$/.test(trimmed.replace(/[\-\s\+]/g, ''))) {
      return 'Ingrese un número de teléfono válido.';
    }
    const regex = /^[0-9\-\+\s\(\)]+$/;
    if (!regex.test(trimmed)) {
      return 'El teléfono solo admite números y guiones.';
    }
    return null;
  },

  // 4. Email Validation (5-8 words)
  validateEmail(email, isRequired = false) {
    if (!email || !email.trim()) {
      return isRequired ? 'El correo electrónico es un campo requerido.' : null;
    }
    const trimmed = email.trim();
    if (trimmed.length > 60) return 'El correo no puede exceder 60 caracteres.';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(trimmed)) {
      return 'Ingrese un correo electrónico con formato válido.';
    }
    return null;
  },

  // 5. Generic Text Validation (5-8 words)
  validateText(text, fieldName, minLen = 2, maxLen = 60, isRequired = true) {
    if (!text || typeof text !== 'string') {
      return isRequired ? `El campo ${fieldName.toLowerCase()} es obligatorio.` : null;
    }
    const trimmed = text.trim();
    if (isRequired && trimmed.length === 0) return `El campo ${fieldName.toLowerCase()} es obligatorio.`;
    if (trimmed.length > 0 && trimmed.length < minLen) return `El ${fieldName.toLowerCase()} requiere al menos ${minLen} caracteres.`;
    if (trimmed.length > maxLen) return `El ${fieldName.toLowerCase()} no puede exceder ${maxLen} caracteres.`;
    if (trimmed.length > 0 && /^(.)\1+$/.test(trimmed)) return `Ingrese un valor válido para ${fieldName.toLowerCase()}.`;
    return null;
  },

  // 6. Funcionario Form Composite Validation
  validateFuncionario(data) {
    const cedulaErr = this.validateCedula(data?.cedula);
    if (cedulaErr) return cedulaErr;

    const nombreErr = this.validateName(data?.nombre, 'Nombre');
    if (nombreErr) return nombreErr;

    const apellidoErr = this.validateName(data?.apellido, 'Apellido');
    if (apellidoErr) return apellidoErr;

    const cargoErr = this.validateText(data?.cargo, 'Cargo', 2, 50);
    if (cargoErr) return cargoErr;

    const phoneErr = this.validatePhone(data?.telefono);
    if (phoneErr) return phoneErr;

    const emailErr = this.validateEmail(data?.email);
    if (emailErr) return emailErr;

    return null;
  },

  // 7. Herramienta Form Composite Validation
  validateHerramienta(data) {
    const codigoErr = this.validateText(data?.codigo, 'Código de herramienta', 2, 30);
    if (codigoErr) return codigoErr;

    const nombreErr = this.validateText(data?.nombre, 'Nombre de herramienta', 2, 60);
    if (nombreErr) return nombreErr;

    const marcaErr = this.validateText(data?.marca, 'Marca de herramienta', 2, 40);
    if (marcaErr) return marcaErr;

    const modeloErr = this.validateText(data?.modelo, 'Modelo', 1, 40, false);
    if (modeloErr) return modeloErr;

    const serieErr = this.validateText(data?.numero_serie, 'Número de Serie', 1, 40, false);
    if (serieErr) return serieErr;

    const ubicacionErr = this.validateText(data?.ubicacion, 'Ubicación en bodega', 2, 50);
    if (ubicacionErr) return ubicacionErr;

    return null;
  },

  // 8. Préstamo Wizard Composite Validation
  validatePrestamo(data) {
    if (!data?.funcionario_id) {
      return 'Debe seleccionar un funcionario responsable del préstamo.';
    }
    if (!Array.isArray(data?.herramienta_ids) || data.herramienta_ids.length === 0) {
      return 'Debe seleccionar al menos una herramienta disponible.';
    }
    const proyectoErr = this.validateText(data?.escuela_proyecto, 'Escuela o Proyecto', 3, 100);
    if (proyectoErr) return proyectoErr;

    if (!data?.fecha_devolucion_estimada) {
      return 'Especifique la fecha estimada para la devolución.';
    }
    return null;
  },

  // 9. Devolución Form Composite Validation
  validateDevolucion(data) {
    if (!data?.prestamo_id) {
      return 'Debe seleccionar un registro de préstamo activo.';
    }
    const obsErr = this.validateText(data?.observaciones, 'Observaciones de devolución', 1, 250, false);
    if (obsErr) return obsErr;

    return null;
  }
};
