// Shared strict validation functions with 5-8 word clear user messages

export const validators = {
  // Unsafe characters regex to prevent injection & bogus input (; * _ < > ' " `)
  unsafeRegex: /[;\*_<>'"]/,

  // 1. Return Date Validation (Must be today or future date) (5-8 words)
  validateReturnDate(dateStr) {
    if (!dateStr) return 'Seleccione la fecha estimada de devolución.';
    const selectedDate = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(selectedDate.getTime())) {
      return 'Ingrese una fecha de devolución válida.';
    }
    if (selectedDate < today) {
      return 'La fecha de devolución debe ser futura.';
    }
    return null;
  },

  // 2. Cédula Validation (5-8 words)
  validateCedula(cedula) {
    if (!cedula || typeof cedula !== 'string') return 'La cédula del funcionario es requerida.';
    const trimmed = cedula.trim();
    if (trimmed.length < 5 || trimmed.length > 12) {
      return 'Ingrese una cédula entre 5 y 12 caracteres.';
    }
    if (/^(.)\1+$/.test(trimmed.replace(/-/g, ''))) {
      return 'Ingrese una cédula válida sin repeticiones de caracteres.';
    }
    if (this.unsafeRegex.test(trimmed)) {
      return 'La cédula contiene caracteres especiales no permitidos.';
    }
    const regex = /^[0-9EPEAea\-\s]+$/;
    if (!regex.test(trimmed)) {
      return 'La cédula solo admite números, letras y guiones.';
    }
    return null;
  },

  // 3. Name / Surname Validation (Strict letters & spaces only) (5-8 words)
  validateName(name, fieldName = 'Nombre') {
    if (!name || typeof name !== 'string') return `El ${fieldName.toLowerCase()} del funcionario es requerido.`;
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 32) {
      return `El ${fieldName.toLowerCase()} debe tener entre 2 y 32 caracteres.`;
    }
    if (/^(.)\1+$/.test(trimmed)) return `Ingrese un ${fieldName.toLowerCase()} válido sin repeticiones.`;
    if (this.unsafeRegex.test(trimmed)) {
      return `El ${fieldName.toLowerCase()} contiene caracteres especiales no permitidos.`;
    }
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-]+$/;
    if (!regex.test(trimmed)) {
      return `El ${fieldName.toLowerCase()} solo admite letras y espacios.`;
    }
    return null;
  },

  // 4. Phone Validation (5-8 words)
  validatePhone(phone) {
    if (!phone) return null; // Optional
    const trimmed = phone.trim();
    if (trimmed.length < 7 || trimmed.length > 12) {
      return 'Ingrese un teléfono entre 7 y 12 dígitos.';
    }
    if (/^(.)\1+$/.test(trimmed.replace(/[\-\s\+]/g, ''))) {
      return 'Ingrese un número de teléfono válido.';
    }
    if (this.unsafeRegex.test(trimmed)) {
      return 'El teléfono contiene caracteres especiales no permitidos.';
    }
    const regex = /^[0-9\-\+\s\(\)]+$/;
    if (!regex.test(trimmed)) {
      return 'El teléfono solo admite números y guiones.';
    }
    return null;
  },

  // 5. Email Validation (5-8 words)
  validateEmail(email, isRequired = false) {
    if (!email || !email.trim()) {
      return isRequired ? 'El correo electrónico es un campo requerido.' : null;
    }
    const trimmed = email.trim();
    if (trimmed.length < 5 || trimmed.length > 50) {
      return 'El correo debe tener entre 5 y 50 caracteres.';
    }
    if (this.unsafeRegex.test(trimmed)) {
      return 'El correo contiene caracteres especiales no permitidos.';
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(trimmed)) {
      return 'Ingrese un correo electrónico con formato válido.';
    }
    return null;
  },

  // 6. Generic Text Validation with Unsafe Character Sanitization (5-8 words)
  validateText(text, fieldName, minLen = 2, maxLen = 50, isRequired = true) {
    if (!text || typeof text !== 'string') {
      return isRequired ? `El campo ${fieldName.toLowerCase()} es obligatorio.` : null;
    }
    const trimmed = text.trim();
    if (isRequired && trimmed.length === 0) return `El campo ${fieldName.toLowerCase()} es obligatorio.`;
    if (trimmed.length > 0 && trimmed.length < minLen) return `El ${fieldName.toLowerCase()} requiere al menos ${minLen} caracteres.`;
    if (trimmed.length > maxLen) return `El ${fieldName.toLowerCase()} no puede exceder ${maxLen} caracteres.`;
    if (trimmed.length > 0 && /^(.)\1+$/.test(trimmed)) return `Ingrese un valor válido para ${fieldName.toLowerCase()}.`;
    if (this.unsafeRegex.test(trimmed)) {
      return `El campo ${fieldName.toLowerCase()} contiene caracteres no permitidos.`;
    }
    return null;
  },

  // 7. Funcionario Form Composite Validation
  validateFuncionario(data) {
    const cedulaErr = this.validateCedula(data?.cedula);
    if (cedulaErr) return cedulaErr;

    const nombreErr = this.validateName(data?.nombre, 'Nombre');
    if (nombreErr) return nombreErr;

    const apellidoErr = this.validateName(data?.apellido, 'Apellido');
    if (apellidoErr) return apellidoErr;

    const cargoErr = this.validateText(data?.cargo, 'Cargo', 2, 40);
    if (cargoErr) return cargoErr;

    const deptErr = this.validateText(data?.departamento, 'Departamento', 2, 40, false);
    if (deptErr) return deptErr;

    const phoneErr = this.validatePhone(data?.telefono);
    if (phoneErr) return phoneErr;

    const emailErr = this.validateEmail(data?.email);
    if (emailErr) return emailErr;

    return null;
  },

  // 8. Herramienta Form Composite Validation
  validateHerramienta(data) {
    const codigoErr = this.validateText(data?.codigo, 'Código de herramienta', 2, 20);
    if (codigoErr) return codigoErr;

    const nombreErr = this.validateText(data?.nombre, 'Nombre de herramienta', 2, 50);
    if (nombreErr) return nombreErr;

    const marcaErr = this.validateText(data?.marca, 'Marca de herramienta', 2, 30);
    if (marcaErr) return marcaErr;

    const modeloErr = this.validateText(data?.modelo, 'Modelo', 1, 30, false);
    if (modeloErr) return modeloErr;

    const serieErr = this.validateText(data?.numero_serie, 'Número de serie', 1, 30, false);
    if (serieErr) return serieErr;

    const ubicacionErr = this.validateText(data?.ubicacion, 'Ubicación en bodega', 2, 40);
    if (ubicacionErr) return ubicacionErr;

    const obsErr = this.validateText(data?.observaciones, 'Observaciones de herramienta', 1, 120, false);
    if (obsErr) return obsErr;

    return null;
  },

  // 9. Préstamo Wizard Composite Validation
  validatePrestamo(data) {
    if (!data?.funcionario_id) {
      return 'Debe seleccionar un funcionario responsable del préstamo.';
    }
    if (!Array.isArray(data?.herramientas_ids) || data.herramientas_ids.length === 0) {
      return 'Debe seleccionar al menos una herramienta disponible.';
    }
    const proyectoErr = this.validateText(data?.escuela_proyecto, 'Escuela o proyecto', 3, 80);
    if (proyectoErr) return proyectoErr;

    const fechaErr = this.validateReturnDate(data?.fecha_devolucion_estimada);
    if (fechaErr) return fechaErr;

    const obsErr = this.validateText(data?.observaciones, 'Observaciones de préstamo', 1, 120, false);
    if (obsErr) return obsErr;

    return null;
  },

  // 10. Devolución Form Composite Validation
  validateDevolucion(data) {
    if (!data?.prestamo_id) {
      return 'Debe seleccionar un registro de préstamo activo.';
    }
    const obsErr = this.validateText(data?.observaciones, 'Observaciones de devolución', 1, 120, false);
    if (obsErr) return obsErr;

    return null;
  }
};

