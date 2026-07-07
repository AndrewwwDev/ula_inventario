# 🏛️ Sistema Web para la Gestión y Control de Inventario de Bienes Tecnológicos

![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)

Un sistema logístico integral y auditor de activos tecnológicos desarrollado a medida para la **Dirección General de Medios de Comunicación de la Universidad de Los Andes (ULA)**. 

Este software transforma los procesos manuales vulnerables en una plataforma centralizada, segura y 100% auditable, garantizando la transparencia y trazabilidad que exige la administración de bienes públicos.

## ✨ Características Principales

<img width="1354" height="729" alt="image" src="https://github.com/user-attachments/assets/f9443dab-a139-4cf6-b3c3-c466105f84e2" />

<img width="1366" height="725" alt="image" src="https://github.com/user-attachments/assets/645a600a-e3b8-44b6-b143-9451fd3f43be" />

<img width="1366" height="725" alt="image" src="https://github.com/user-attachments/assets/85fc3300-5f24-4400-84cf-54ef06f59fdc" />



* 🔒 **Seguridad y Auditoría Transaccional:** Autenticación robusta y sistema de roles estricto (RLS). Cuenta con una Bitácora automatizada (Triggers en Base de Datos) que garantiza la inmutabilidad de los datos, registrando el "antes y después" de cada movimiento.
* 📱 **Trazabilidad QR Interactiva:** Generación automática de códigos QR para cada equipo. Al ser escaneados con cualquier dispositivo móvil, dirigen a una ficha técnica segura para auditorías rápidas en campo.
* 🔄 **Gestión de Ciclo de Vida y Estados:** Control preciso de 7 estados operativos (Activo, Inactivo, Mantenimiento, Desincorporado, Traslado Interno, Traslado Externo y Faltante) con separación lógica de responsabilidades.
* 📊 **Reportes Institucionales Dinámicos:** Exportación de inventarios y métricas en formato PDF (con membrete institucional automatizado mediante jsPDF) y Excel.
* ⚡ **Arquitectura de Alto Rendimiento:** Interfaz *Mobile-First* con navegación reactiva, búsqueda dual con autocompletado y carga de datos eficiente (*Infinite Scroll*).

## 🛠️ Stack Tecnológico

* **Frontend:** Angular 18, Tailwind CSS, RxJS.
* **Backend & Base de Datos:** Supabase (PostgreSQL), GoTrue Auth, Storage.
* **Infraestructura:** Docker (Containerización del entorno local), Vercel (Despliegue de producción).
* **Control de Versiones:** Git & GitHub (Manejo estricto de `.gitignore` para protección de credenciales y binarios).

## 🚀 Instalación y Despliegue Local

Este proyecto está containerizado para garantizar consistencia en cualquier entorno de desarrollo.

1. Clona el repositorio:
   ```bash
   git clone [https://github.com/tu-usuario/ula-inventario.git](https://github.com/tu-usuario/ula-inventario.git)
