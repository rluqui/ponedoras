---
description: commit automático después de cada modificación de código
---

// turbo-all
# Auto-commit y push post modificación

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

3. Hacer push al repositorio remoto para que Vercel dispare el deploy automáticamente
```
git push origin main
```

4. Confirmar mostrando el hash corto del commit y que el push fue exitoso.

> Si hay múltiples archivos modificados en una misma tarea, agruparlos en un solo commit antes del push.
