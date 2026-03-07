# Checklist B2B Pre-Lanzamiento

## 🔴 Bloqueadores absolutos

### Seguridad de datos
- [ ] Toda query a DB filtra por `tenant_id` / `organization_id`
- [ ] Ownership verification en todos los endpoints de recursos (`GET /invoice/:id` verifica que pertenece al tenant)
- [ ] JWT incluye `tenantId` en payload y se valida en cada request
- [ ] No hay IDs secuenciales sin verificación de ownership (usar UUIDs)
- [ ] Variables de entorno con secretos nunca en el código fuente

### Error handling
- [ ] Global error handler en backend (ningún 500 expone stack trace)
- [ ] Error boundary en frontend (ninguna pantalla blanca sin mensaje)
- [ ] Todos los endpoints async tienen try/catch
- [ ] Logger centralizado con contexto de usuario en cada error

### Autenticación
- [ ] Rate limiting en `/login` y endpoints de autenticación
- [ ] Tokens con expiración configurada (no "never expires")
- [ ] Refresh token con rotación
- [ ] Logout invalida el token (no solo borra cookie del cliente)

---

## ⚠️ Alta prioridad (primera semana)

### Estabilidad
- [ ] Timeouts en todas las llamadas a APIs externas (< 10s)
- [ ] Timeouts en queries a DB (< 30s para operaciones largas)
- [ ] Paginación en TODOS los endpoints que devuelven listas
- [ ] Validación de parámetros de paginación (límite máximo = 100-500)

### Observabilidad
- [ ] Alertas si error rate > 1% en 5 minutos
- [ ] Health check endpoint (`/health`) para monitoreo
- [ ] Logs estructurados (JSON) con: timestamp, level, userId, tenantId, path, duration
- [ ] Request ID en cada request para correlación

### Costos
- [ ] Budget alert en cloud provider al 80% del límite mensual
- [ ] Rate limiting por tenant (un cliente no puede saturar el sistema)
- [ ] Límites en operaciones costosas (exports, reportes masivos)

---

## 🟢 Mediano plazo (primer mes)

### B2B enterprise
- [ ] Audit log: quién hizo qué y cuándo (mínimo: login, cambios críticos, borrados)
- [ ] Proceso de offboarding documentado (qué pasa con los datos si el cliente cancela)
- [ ] Exportación de datos del cliente (GDPR o simplemente buena práctica)
- [ ] Documentación básica de la API para el equipo técnico del cliente

### Resiliencia
- [ ] Retry con backoff exponencial para llamadas a servicios externos
- [ ] Circuit breaker para dependencias críticas
- [ ] Graceful shutdown (el proceso no corta requests en vuelo al reiniciar)

---

## Señales de que estás listo para escalar

✅ Puedes agregar un segundo cliente SIN tocar código de aislamiento  
✅ Sabes en menos de 5 minutos si algo está fallando en producción  
✅ Un error de un cliente NO afecta la experiencia de otro cliente  
✅ Puedes responder "¿qué hizo el usuario X ayer a las 3pm?" con tus logs  
