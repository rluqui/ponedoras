---
description: commit automático después de cada modificación de código
---

// turbo-all
# Auto-commit post modificación

Después de CADA modificación de archivos del proyecto, ejecutar automáticamente:

1. Agregar todos los cambios al staging
```
git add -A
```

2. Hacer commit con mensaje descriptivo en español usando el formato:
   `[módulo afectado]: descripción breve del cambio`
   Ejemplos:
   - `contador_ia: agrega etiquetas numeradas en canvas con coordenadas Gemini`
   - `app.css: estilos para canvas-etiquetas-wrap`
   - `granja: corrige carga de galpones en modal`

```
git commit -m "[módulo]: descripción del cambio"
```

3. Confirmar el commit mostrando el hash corto y el mensaje.

> IMPORTANTE: Nunca hacer push automático. Solo commit local.
> Si hay múltiples archivos modificados en una misma tarea, agruparlos en un solo commit.
