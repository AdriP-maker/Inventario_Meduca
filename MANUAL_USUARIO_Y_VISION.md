# Documento de Visión y Manual de Usuario Detallado
## Sistema de Control de Préstamo de Herramientas (MEDUCA Coclé)
**Versión:** 1.0
**Fecha:** Julio 2026
**Departamento:** Mantenimiento

---

## 1. Visión del Sistema y Objetivos

### 1.1. Propósito del Proyecto
El **Sistema de Control de Préstamo de Herramientas** de MEDUCA Coclé fue concebido para resolver la problemática histórica del descontrol, pérdida y falta de trazabilidad en los activos físicos del departamento de mantenimiento. Antes de este sistema, los registros se llevaban en bitácoras físicas propensas a errores, alteraciones y daños.

Este software proporciona una plataforma digital centralizada, segura y auditable que garantiza la transparencia total sobre el inventario estatal. 

### 1.2. Objetivos Principales
- **Trazabilidad Absoluta:** Conocer en tiempo real qué herramienta está en posesión de qué funcionario, en qué proyecto se está utilizando y cuándo debe regresar.
- **Auditoría y Responsabilidad:** Reducir a cero la pérdida de equipo por falta de documentación, asignando responsabilidades directas sobre los activos prestados.
- **Gestión del Ciclo de Vida:** Identificar herramientas que frecuentemente entran en estado de "Mantenimiento" o "Dañado" para justificar presupuestos de reposición y descartes (bienes patrimoniales).
- **Eficiencia Operativa:** Reducir el tiempo en ventanilla al momento de despachar herramientas gracias a una interfaz ágil.

---

## 2. Reglas de Negocio Estrictas

El software no es solo un registro; impone reglas lógicas que previenen el error humano y el fraude:

### 2.1. Gestión de Stock
- **Integridad Matemática:** `stock_disponible` + `stock_prestado` + `stock_danado` siempre debe ser igual a `stock_total`. El sistema calcula esto automáticamente.
- **Prevención de Sobre-Préstamo:** Es imposible incluir en el carrito de préstamos una cantidad mayor al `stock_disponible` actual. La interfaz bloquea el botón de confirmación en estos casos.
- **Transiciones de Estado:** Una herramienta no puede pasar de "Prestada" a "Mantenimiento" sin antes pasar por el proceso formal de "Devolución" en la ventanilla, documentando quién la trajo y en qué estado.

### 2.2. Políticas de Préstamo
- **Vinculación Obligatoria:** Un préstamo requiere al menos tres entidades vitales: El Funcionario (receptor), el Bodeguero/Usuario (emisor), y la lista de activos.
- **Destino del Préstamo:** Se debe especificar la "Escuela, Colegio o Proyecto" para poder realizar trazabilidad geográfica, permitiendo auditorías sorpresa en campo.
- **Fechas de Compromiso:** Todo préstamo nace con una fecha de vencimiento. Por defecto, son 7 días naturales, pero el bodeguero puede extenderlo o reducirlo según la magnitud del proyecto.
- **Vencimientos:** Al cumplirse el plazo, si la herramienta no ha sido devuelta, el sistema automáticamente levanta una bandera de "Vencido" en el Dashboard principal, exigiendo la atención del supervisor.

### 2.3. Políticas de Devolución
- **Evaluación de Estado:** El funcionario no solo entrega el equipo; el bodeguero debe inspeccionarlo y registrar en el sistema si la condición es "Excelente", "Bueno", "Regular", o "Con Daño".
- **Generación de Notas de Daño:** Si un equipo ingresa "Con Daño", el sistema exigirá justificaciones para iniciar los procesos patrimoniales correspondientes ante la Contraloría.

---

## 3. Manual de Usuario (Operación Diaria)

Esta sección explica campo por campo la operación de la plataforma.

### 3.1. Acceso y Autenticación
1. **URL de Acceso:** Ingrese a la dirección web provista por el departamento de IT (ej. `http://inventario-meduca.gob.pa`).
2. **Credenciales:** Se le solicitará su **Usuario** y **Contraseña**. Estas credenciales son personales e intransferibles, ya que toda acción quedará registrada a su nombre.
3. **Niveles de Acceso:** 
   - *Administradores:* Pueden ver todas las pantallas y configurar el sistema.
   - *Operadores:* Solo tienen acceso a despachar y recibir herramientas.

### 3.2. Panel Principal (Dashboard)
Al iniciar sesión, visualizará el Dashboard, diseñado para ofrecer un resumen ejecutivo:
- **Tarjetas Superiores:** Muestran en tiempo real el total de herramientas en bodega, total prestadas, herramientas dañadas, y la cantidad de funcionarios registrados.
- **Préstamos Vencidos (Rojo):** Una tabla crítica que exige atención inmediata. Muestra a qué funcionario se le venció el tiempo de entrega y qué tiene en su poder.
- **Accesos Directos:** Botones grandes para las acciones más comunes: "Nuevo Préstamo" y "Recibir Devolución".

### 3.3. Módulo de Herramientas (Inventario)
Aquí reside el catálogo maestro del departamento.
- **Listado:** Una tabla con buscador, donde puede filtrar por nombre, marca o código.
- **Agregar Herramienta:**
  - `Código:` ID único patrimonial (ej. HER-001).
  - `Nombre:` Descripción clara (ej. Taladro Percutor 1/2).
  - `Marca y Modelo:` Vital para repuestos.
  - `Número de Serie:` Identificador único de fábrica.
  - `Ubicación:` Estante o pasillo donde debe almacenarse físicamente.
  - `Stock Inicial:` Cantidad de estas herramientas que se están ingresando.
  - `Fotografía:` Permite cargar una imagen para fácil reconocimiento por el personal menos técnico.
- **Edición y Estados:** Puede editar la información, o marcar manualmente una herramienta en bodega como "Mantenimiento" si se le hará servicio preventivo.

### 3.4. Módulo de Funcionarios (Personal)
Registro de las personas autorizadas a retirar equipo.
- **Campos Requeridos:** Cédula (con formato válido), Nombre completo, Cargo (ej. Plomero, Electricista), y Departamento.
- **Bloqueos:** Un funcionario marcado como "Inactivo" en este módulo no aparecerá en las listas para recibir préstamos nuevos.

### 3.5. Realizar un Nuevo Préstamo (Despacho)
El flujo más importante del sistema.
1. Navegue a **Préstamos > Nuevo Préstamo**.
2. **Selección de Funcionario:** Use el buscador autocompletable.
3. **Datos de Destino:** Ingrese manualmente la "Escuela o Proyecto" (ej. "Reparación de techo en C.E.B.G. Penonomé").
4. **Fechas:** Confirme o edite la fecha máxima de devolución.
5. **Agregar al Carrito:** Busque las herramientas. El sistema le advertirá si no hay stock. Ingrese la cantidad.
6. **Estado de Salida:** Por defecto es "Bueno". Puede agregar observaciones ("Se entrega sin broca").
7. **Confirmar:** Haga clic en "Procesar Préstamo". El sistema descontará inventario al instante.

### 3.6. Registrar una Devolución (Recepción)
1. Navegue a **Devoluciones > Recibir**.
2. **Buscar:** Encuentre el préstamo activo buscando por nombre de funcionario o por código de préstamo.
3. **Inspección Física:** La pantalla le mostrará todo lo que el funcionario debe entregar.
4. **Estado de Entrada:** Seleccione el estado real al momento de la entrega.
5. **Procesar:** Si se devuelve todo, el préstamo se cierra. El stock de la herramienta vuelve a estar disponible para el próximo funcionario.

### 3.7. Módulo de Reportes
Permite generar informes para la dirección regional.
- **Filtros:** Puede filtrar movimientos por rango de fechas (ej. Todo el mes de mayo).
- **Tipos de Reporte:** Historial de préstamos de un funcionario específico, historial de reparaciones de una herramienta, o inventario general.
- **Exportación:** Los reportes pueden descargarse para ser impresos o enviados por correo.

---

## 4. Auditoría y Trazabilidad (Caja Negra)

Para prevenir corrupción y fraudes, el sistema implementa un módulo pasivo pero crítico: el **Historial de Actividades**.
- **Inmutabilidad:** Ningún usuario (ni siquiera el administrador desde la interfaz web) puede borrar o editar las filas de auditoría.
- **Registro:** ¿Un usuario eliminó una herramienta? Queda registrado "El usuario X eliminó la herramienta Y el día Z a la hora H". ¿Se procesó un préstamo? "El usuario X prestó a Y".
- Esto asegura la rendición de cuentas total ante la Contraloría o directores regionales.

---

## 5. Mantenimiento Técnico y Arquitectura (Para TI)

Esta sección está dirigida al equipo de Tecnología de MEDUCA en caso de mantenimiento de servidores o desarrollo.

### 5.1. Stack Tecnológico
- **Frontend:** React 18, Vite, React Router, TailwindCSS/CSS Vanilla. La interfaz es un SPA (Single Page Application) compilada en estáticos puros.
- **Backend:** PHP nativo, estructurado con clases y PDO. API RESTful modular.
- **Base de Datos:** MySQL / MariaDB 10+.

### 5.2. Estructura de Base de Datos
- Las tablas clave están fuertemente enlazadas por Claves Foráneas (`Foreign Keys`).
- El modelo incluye cascadas para facilitar la eliminación lógica, aunque se recomienda siempre cambiar el "estado" a Inactivo en lugar de hacer `DELETE` físicos para no romper históricos.
- La tabla `historial_actividades` no tiene FKs restrictivos a propósito para que el registro perdure aunque se borren usuarios.

### 5.3. Recomendaciones de Seguridad
- **Backups:** Se recomienda programar un cron job diario que realice un `mysqldump` de la base de datos `meduca_inventory`.
- **Sesiones:** Los tokens o variables de sesión PHP deben estar asegurados con cookies HTTP-Only y SameSite si se expone el servidor a internet.

---
*Documento generado automáticamente para SASS Meduca Inventory.*
