# Patrones por Stack Tecnológico

## Node.js / Express

### Error handling global
```js
// Al final de todos los routes, antes de app.listen()
app.use((err, req, res, next) => {
  logger.error({ err, path: req.path, userId: req.user?.id })
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'UNKNOWN_ERROR'
  })
})

// Captura de rechazos no manejados
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Promise Rejection')
})
```

### Rate limiting con express-rate-limit
```js
import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máx 10 intentos de login
  message: { error: 'Too many attempts, try again later' }
})

app.post('/auth/login', authLimiter, loginHandler)
```

---

## Python / FastAPI

### Error handling global
```python
from fastapi import Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", extra={
        "path": request.url.path,
        "user_id": getattr(request.state, "user_id", None)
    })
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "code": "UNHANDLED_ERROR"}
    )
```

### Multi-tenancy con dependency injection
```python
async def get_current_tenant(token: str = Depends(oauth2_scheme)) -> Tenant:
    payload = decode_jwt(token)
    return await Tenant.get(payload["tenant_id"])

@router.get("/invoices/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    tenant: Tenant = Depends(get_current_tenant)
):
    invoice = await Invoice.find_one(
        Invoice.id == invoice_id,
        Invoice.tenant_id == tenant.id  # ← siempre filtrar por tenant
    )
    if not invoice:
        raise HTTPException(status_code=404)
    return invoice
```

---

## Next.js (full-stack)

### Error boundary global
```jsx
// app/error.tsx
'use client'
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Enviar a tu sistema de logging
    reportError(error)
  }, [error])

  return (
    <div>
      <h2>Algo salió mal</h2>
      <button onClick={reset}>Intentar de nuevo</button>
    </div>
  )
}
```

### API routes con manejo de errores
```js
// app/api/[...route]/route.ts
export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await fetchData(session.user.tenantId)
    return Response.json(data)
  } catch (error) {
    console.error('[API Error]', error)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## Bases de datos

### PostgreSQL — Row Level Security (RLS) para multi-tenancy
```sql
-- Habilitar RLS en la tabla
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Política: solo ver registros del propio tenant
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- En el backend, antes de cada query:
await db.query("SET app.tenant_id = $1", [tenantId])
```

### MongoDB — siempre filtrar por tenantId
```js
// Middleware de mongoose para agregar tenant automáticamente
schema.pre('find', function() {
  if (!this.getQuery().tenantId) {
    throw new Error('Query without tenantId is not allowed')
  }
})
```
