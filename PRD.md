# Documento de Requisitos del Producto (PRD)
## Sistema de Inventario ULA - ula_inventario

**Versión:** 1.0  
**Fecha:** 12 de mayo de 2026  
**Estado:** En Desarrollo

---

## 1. Visión General

**ula_inventario** es un sistema integral de gestión de inventario diseñado para la Universidad de Los Andes (ULA). El sistema permite a los operadores registrar, rastrear, mantener y desincorporar bienes institucionales, proporcionando un control centralizado del patrimonio universitario.

### Objetivo Principal
Proporcionar una plataforma completa para la administración eficiente del inventario de bienes de la universidad, incluyendo seguimiento de ubicaciones, estados operativos, mantenimiento preventivo y desincorporación de activos.

---

## 2. Usuarios Objetivo

### Tipos de Usuarios
1. **Operadores de Inventario**
   - Responsables de registrar nuevos bienes
   - Registran movimientos y cambios de ubicación
   - Documentan mantenimiento y reparaciones
   - Actualizan estados operativos

2. **Encargados de Dependencia**
   - Supervisan bienes en su dependencia
   - Reportan problemas o cambios necesarios
   - Generan solicitudes de mantenimiento

3. **Administradores**
   - Gestión de usuarios y permisos
   - Configuración del sistema
   - Generación de reportes
   - Auditoría del sistema

---

## 3. Funcionalidades Principales

### 3.1 Gestión de Bienes (Activos)
- ✅ **Registro de Bienes**
  - Código único de identificación
  - Nombre y descripción
  - Categorización
  - Asignación de encargado
  - Ubicación inicial (dependencia)
  - Estado operativo (En uso, Regular, Dañado)
  - Valor monetario
  - Fotos/imágenes
  - Generación de código QR

- ✅ **Actualización de Bienes**
  - Modificación de información
  - Cambio de encargado
  - Actualización de estado operativo
  - Ajuste de ubicación

- ✅ **Visualización de Bienes**
  - Listados completos
  - Filtrado por categoría
  - Búsqueda por código o nombre
  - Vista de detalles

### 3.2 Movimientos y Traslados
- ✅ **Registro de Movimientos**
  - Tipo de movimiento (Traslado, Mantenimiento, etc.)
  - Origen y destino (dependencias)
  - Fecha y hora del movimiento
  - Usuario responsable
  - Observaciones

- ✅ **Seguimiento de Ubicación**
  - Historial completo de movimientos
  - Ubicación actual del bien
  - Trazabilidad de cambios

### 3.3 Desincorporación de Bienes
- ✅ **Proceso de Desincorporación**
  - Registro de motivo de desincorporación
  - Fecha de desincorporación
  - Documentación fotográfica (antes/después)
  - Cambio de estado a inactivo
  - Separación de bienes activos

- ✅ **Historial de Desincorporados**
  - Listado de bienes removidos del inventario
  - Información de desincorporación
  - Justificación y documentación

### 3.4 Gestión de Categorías
- ✅ **Mantenimiento de Categorías**
  - Creación de nuevas categorías
  - Descripción de categoría
  - Clasificación de bienes

### 3.5 Gestión de Dependencias
- ✅ **Administración de Dependencias**
  - Registro de dependencias/departamentos
  - Descripción y ubicación
  - Asignación de encargados
  - Información de contacto

### 3.6 Gestión de Encargados
- ✅ **Registro de Encargados**
  - Nombre completo
  - Cargo/posición
  - Información de contacto (teléfono, email)
  - Asignación a dependencia
  - Bienes bajo su responsabilidad

### 3.7 Mantenimiento de Bienes
- ✅ **Registro de Mantenimiento**
  - Tipo de mantenimiento (preventivo, correctivo)
  - Fechas de servicio
  - Descripción del trabajo realizado
  - Responsable del mantenimiento
  - Observaciones y recomendaciones

### 3.8 Reportes y Análisis
- ✅ **Dashboard Ejecutivo**
  - Total de bienes en inventario
  - Bienes en uso vs. dañados vs. regulares
  - Visualización rápida del estado

- ✅ **Reportes Disponibles** (Planeado)
  - Reporte de inventario por categoría
  - Reporte de bienes por dependencia
  - Historial de movimientos
  - Estado de mantenimiento
  - Bienes para desincorporación próxima

---

## 4. Entidades de Datos Principales

### 4.1 Estructura de Base de Datos

| Entidad | Descripción |
|---------|-------------|
| **usuarios** | Usuarios del sistema con roles y autenticación |
| **dependencias** | Departamentos, oficinas y áreas de la universidad |
| **encargados** | Personas responsables de bienes en dependencias |
| **categorias** | Clasificación de tipos de bienes (muebles, electrónicos, etc.) |
| **bienes** | Registro principal de activos/bienes |
| **movimientos** | Historial de traslados y cambios de ubicación |
| **mantenimiento** | Registros de servicios de mantenimiento (futuro) |
| **bitacora** | Registro de auditoría de cambios en el sistema (futuro) |
| **estados_operativos** | Catálogo de estados posibles (En uso, Regular, Dañado) |

### 4.2 Campos Críticos de Bienes

```typescript
Bien {
  id: number;              // Identificador único
  codigo: string;          // Código único del bien
  nombre: string;          // Nombre descriptivo
  descripcion: string;     // Descripción detallada
  categoria_id: number;    // Referencia a categoría
  encargado_id: number;    // Responsable actual
  operador_id: number;     // Usuario que registró
  ubicacion_id: number;    // Dependencia donde está
  estado_operativo: string; // En uso / Regular / Dañado
  valor: decimal;          // Valor monetario
  fecha_registro: date;    // Cuándo se registró
  fecha_actualizacion: date; // Última actualización
  imagen_url: string;      // Foto del bien
  qr_code: string;         // Código QR
  activo: boolean;         // ¿Sigue en inventario?
}
```

---

## 5. Flujos de Trabajo Principales

### 5.1 Registro de Nuevo Bien
1. Operador inicia sesión
2. Accede a "Nuevo Bien"
3. Completa formulario:
   - Código único
   - Nombre y descripción
   - Selecciona categoría
   - Asigna encargado
   - Define ubicación
   - Carga foto
4. Sistema genera código QR automáticamente
5. Bien se registra en base de datos
6. Sistema confirma registro exitoso

### 5.2 Traslado de Bien
1. Operador busca el bien
2. Registra movimiento:
   - Origen (ubicación actual)
   - Destino (nueva ubicación)
   - Fecha y hora
   - Observaciones
3. Sistema actualiza ubicación
4. Se mantiene historial de movimiento

### 5.3 Desincorporación de Bien
1. Operador identifica bien a desincorporar
2. Accede a "Desincorporar"
3. Proporciona:
   - Motivo (robo, daño, obsolescencia, etc.)
   - Fecha de desincorporación
   - Evidencia fotográfica
4. Sistema marca como inactivo
5. Bien removido de inventario activo
6. Genera documentación de desincorporación

### 5.4 Generación de Reportes
1. Administrador accede a sección de reportes
2. Selecciona tipo de reporte
3. Define parámetros de filtrado
4. Sistema genera reporte
5. Opción para descargar en PDF/Excel

---

## 6. Requisitos No Funcionales

### 6.1 Seguridad
- ✅ Autenticación con JWT
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Validación de entrada en todas las solicitudes
- ✅ Auditoría de cambios (bitácora)
- ✅ Sesiones seguras

### 6.2 Rendimiento
- ⏳ Tiempo de carga del dashboard < 2 segundos
- ⏳ Búsqueda de bienes < 1 segundo
- ⏳ Generación de reportes < 5 segundos
- ⏳ Soporte para 10,000+ bienes

### 6.3 Disponibilidad
- ⏳ Uptime objetivo: 99%
- ⏳ Recuperación ante fallos automática
- ⏳ Backups automáticos diarios

### 6.4 Usabilidad
- ✅ Interfaz intuitiva en Angular
- ✅ Responsive design (mobile-friendly)
- ✅ Validación de formularios clara
- ⏳ Ayuda y documentación de usuario

### 6.5 Escalabilidad
- ✅ Arquitectura modular (NestJS)
- ✅ Base de datos PostgreSQL escalable
- ✅ Containerización con Docker

---

## 7. Arquitectura Técnica

### 7.1 Stack Tecnológico

**Backend**
- Framework: NestJS 10.x
- Base de Datos: PostgreSQL
- ORM: TypeORM
- Autenticación: Passport.js + JWT
- Encriptación: bcrypt
- Runtime: Node.js

**Frontend**
- Framework: Angular 18.x
- Styling: Tailwind CSS
- Build Tool: Angular CLI
- Type Safety: TypeScript 5.5

**Infraestructura**
- Containerización: Docker
- Orquestación: Docker Compose
- Almacenamiento: Volúmenes Docker

### 7.2 Estructura del Proyecto

```
ula_inventario/
├── backend/                    # API REST NestJS
│   ├── src/
│   │   ├── auth/              # Autenticación y JWT
│   │   ├── inventario/        # Lógica de inventario
│   │   └── entities/          # Modelos de datos
│   └── uploads/               # Almacenamiento de archivos
│
├── frontend/                   # Aplicación Angular
│   └── src/
│       └── app/
│           ├── pages/         # Componentes principales
│           ├── services/      # Servicios HTTP
│           └── guards/        # Guards de autenticación
│
└── ula_Inventario_BD/          # Scripts de base de datos
    └── ula_inventario.sql      # Schema inicial
```

### 7.3 Endpoints API Principales

**Autenticación**
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar usuario

**Inventario**
- `GET /inventario` - Listar bienes
- `POST /inventario` - Crear bien
- `PUT /inventario/:id` - Actualizar bien
- `PUT /inventario/:id/desincorporar` - Desincorporar bien
- `GET /inventario/desincorporados` - Listar desincorporados

**Datos Maestros**
- `GET /inventario/categorias` - Categorías
- `GET /inventario/dependencias` - Dependencias
- `GET /inventario/encargados` - Encargados

---

## 8. Consideraciones de Implementación

### 8.1 Base de Datos
- ✅ Triggers automáticos para auditoría
- ✅ Vistas para reportes (ej: vista_resumen_dashboard)
- ✅ Índices para búsquedas rápidas
- ✅ Relaciones referenciadas entre tablas

### 8.2 Autenticación
- ✅ JWT con expiración configurable
- ✅ Refresh tokens para sesiones prolongadas
- ✅ Roles de usuario (admin, operador, supervisor)

### 8.3 Almacenamiento de Archivos
- ✅ Multer para upload de imágenes
- ✅ Almacenamiento en servidor (/uploads)
- ✅ Nombres de archivo aleatorios para seguridad

### 8.4 Validación
- ✅ Validación en backend (TypeORM)
- ✅ Validación en frontend (Angular forms)
- ✅ Validación de reglas de negocio

---

## 9. Hitos y Fases de Desarrollo

### Fase 1: MVP (En Progreso)
- [x] Setup inicial del proyecto
- [x] Base de datos
- [x] Autenticación y autorización
- [x] CRUD básico de bienes
- [x] Gestión de movimientos
- [x] Desincorporación de bienes
- [ ] Dashboard básico
- [ ] Validaciones completas

### Fase 2: Mejoras
- [ ] Sistema de mantenimiento
- [ ] Reportes avanzados
- [ ] Código QR/RFID
- [ ] Notificaciones
- [ ] Auditoría detallada
- [ ] Importación/exportación de datos

### Fase 3: Optimización
- [ ] Caching (Redis)
- [ ] Búsqueda avanzada
- [ ] Mobile app nativa
- [ ] Analytics avanzado
- [ ] Integraciones externas

---

## 10. Casos de Uso Principales

### CU-001: Registrar Nuevo Bien
**Actor:** Operador de Inventario  
**Precondición:** Usuario autenticado  
**Flujo:**
1. Accede a la sección de Inventario
2. Selecciona "Nuevo Bien"
3. Completa el formulario
4. Adjunta foto
5. Sistema genera QR automáticamente
6. Registra el bien

### CU-002: Rastrear Ubicación de Bien
**Actor:** Operador/Supervisor  
**Precondición:** Bien registrado en sistema  
**Flujo:**
1. Busca el bien por código o nombre
2. Visualiza ubicación actual
3. Ver historial de movimientos
4. Registrar nuevo movimiento si es necesario

### CU-003: Desincorporar Bien
**Actor:** Operador de Inventario  
**Precondición:** Bien activo en inventario  
**Flujo:**
1. Accede a bien específico
2. Selecciona "Desincorporar"
3. Registra motivo y fecha
4. Sube documentación
5. Sistema marca como inactivo

### CU-004: Generar Reporte
**Actor:** Administrador  
**Precondición:** Datos de inventario disponibles  
**Flujo:**
1. Accede a sección de reportes
2. Selecciona tipo de reporte
3. Define filtros (rango de fechas, categoría, etc.)
4. Genera reporte
5. Descarga en formato deseado

---

## 11. Criterios de Aceptación

- ✅ El sistema debe permitir CRUD completo de bienes
- ✅ Todos los bienes tienen código único e identificable
- ✅ El sistema genera automáticamente código QR
- ✅ Se rastrea completamente la ubicación de bienes
- ✅ Se documenta cada desincorporación
- ✅ Autenticación y autorización funcionan correctamente
- ✅ La interfaz es responsiva y usable
- ✅ Las búsquedas funcionan en < 1 segundo
- ✅ Los datos se validan en backend y frontend

---

## 12. Restricciones y Limitaciones

- 🔒 Solo usuarios autenticados pueden acceder al sistema
- 🔒 Los bienes solo pueden ser desincorporados, no eliminados (auditoría)
- 🔒 Cada operación de cambio requiere usuario responsable
- 🔒 Las imágenes deben ser < 5MB
- 🔒 Códigos de bien son únicos e inmutables
- 📊 Base de datos PostgreSQL solo (no soporta otros motores)

---

## 13. Dependencias Externas

- PostgreSQL 12+
- Node.js 18+
- Docker & Docker Compose
- Angular CLI 18
- Navegadores modernos (Chrome, Firefox, Safari, Edge)

---

## 14. Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| Tiempo de registro de bien | < 2 minutos |
| Precisión en búsqueda de bienes | 100% |
| Uptime del sistema | > 99% |
| Tiempo de carga inicial | < 3 segundos |
| Satisfacción de usuarios | > 4.5/5 |
| Tasa de adopción | > 80% en 3 meses |

---

## 15. Preguntas Abiertas y Decisiones Pendientes

1. ¿Se integrará con sistema de códigos de barras/RFID existente?
2. ¿Cuál es el volumen inicial de bienes a migrar?
3. ¿Se requiere sincronización con otros sistemas universitarios?
4. ¿Qué nivel de detalles en auditoría es requerido?
5. ¿Se necesita integración con sistema financiero?
6. ¿Cuál es el presupuesto para la segunda fase?

---

## Documentos Relacionados

- [README.md](README.md) - Instrucciones de instalación
- [ula_Inventario_BD/ula_inventario.sql](ula_Inventario_BD/ula_inventario.sql) - Schema de base de datos
- [docker-compose.yml](docker-compose.yml) - Configuración de contenedores

---

**Creado:** 12 de mayo de 2026  
**Versión:** 1.0  
**Responsable:** Equipo de Desarrollo  
**Última actualización:** 12 de mayo de 2026
