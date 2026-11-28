# Barómetro (Android)

App de barómetro para la tablet **Blackview Active 10 Pro** (y cualquier Android 8.0+ con sensor de presión).
Sin anuncios, sin internet y sin librerías externas.

## Instalar

1. Copia `Barometro.apk` a la tablet (o descárgalo desde GitHub en la propia tablet).
2. Ábrelo y permite «Instalar apps desconocidas» para el navegador / gestor de archivos cuando lo pida.
3. Al abrir la app, acepta el permiso de **notificaciones** (para las alertas de caída de presión).

> Para que el registro en segundo plano no se corte, en *Ajustes → Batería* pon la app en «Sin restricciones».

## Qué hace

- **Esfera de barómetro** con aguja animada, zonas (temporal, lluvia, variable, buen tiempo, muy seco) y una
  **aguja azul de referencia** con el valor de hace 3 h, como la aguja de ajuste de un barómetro de barco.
- **Presión de estación** y **presión a nivel del mar (QNH)** según la altitud configurada (manual o por GPS).
- **Tendencia en 3 h** según los criterios de la OMM (estable, lenta, rápida, muy rápida) y cambios en 1, 6, 12 y 24 h.
- **Pronóstico orientativo** a partir de la presión y su tendencia.
- **Historial** con gráfico de 6 h / 24 h / 48 h / 7 días (toca y arrastra para ver cada valor). Se guardan 10 días.
- **Registro en segundo plano** cada ~15 min, también con la pantalla apagada y tras reiniciar.
- **Alerta** por notificación si la presión cae más de X hPa en 3 h (3 hPa por defecto).
- **Calibración** introduciendo un QNH oficial (p. ej. del aeropuerto o del parte marítimo).
- Unidades **hPa, mmHg, inHg**, exportar CSV, mantener la pantalla encendida.

## Compilar

Requiere JDK 17+ y el SDK de Android (API 35):

```bash
cd barometro-android
./gradlew assembleRelease   # → app/build/outputs/apk/release/app-release.apk
```

GitHub Actions (`.github/workflows/barometro-apk.yml`) también lo compila y deja el APK como artefacto.
El APK se firma con `app/firma-barometro.jks` (clave incluida a propósito para que cualquier compilación
pueda instalarse encima de la anterior sin desinstalar).
