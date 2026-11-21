# iTrip × Windy

Plugin de [Windy.com](https://www.windy.com) que dibuja el **iTrip** (caja Arduino con GPS + BNO055)
sobre la **capa de viento** de Windy:

- Track del recorrido (blanco) y tramo ya recorrido (rosa).
- Barco orientado con el **rumbo del BNO055** (si no hay rumbo, se usa el COG).
- Flecha amarilla con la **dirección del viento real** del pronóstico en la posición del barco.
- Panel con rumbo, SOG, COG, escora, cabeceo, **TWS, TWD, TWA** (babor/estribor) y el rumbo respecto al viento
  (ceñida, través, largo…).
- Reproducción del track con barra de tiempo. Si los puntos tienen hora, **la hora del pronóstico de Windy se sincroniza** con la del track.
- **Ruta de referencia**: carga un GPX (con o sin horas) como línea discontinua azul. No cambia la hora del
  pronóstico, se recuerda entre sesiones y muestra el desvío respecto a la ruta y las millas que faltan.
- Datos **en vivo** (el pronóstico se mantiene en la hora actual del dispositivo y la pantalla no se apaga):
  - **GPS tablet**: GPS del propio dispositivo (posición, SOG, COG) y, opcionalmente, su brújula como rumbo.
  - **USB** (Web Serial, Chrome/Edge de escritorio): conecta la caja al ordenador.
  - **Wi‑Fi / URL**: lee periódicamente una URL que devuelva el último punto (p. ej. un ESP32 en la caja o un servidor intermedio).

## Formatos aceptados

| Formato | Detalles |
| --- | --- |
| GPX | `trkpt`/`rtept`/`wpt`, `<time>`, `<course>`, `<speed>` (m/s) y extensiones `heading`/`pitch`/`roll` |
| CSV | Con cabecera (`time, lat, lon, heading, pitch, roll, sog, cog`; también vale `yaw`, `rumbo`, `escora`, `velocidad`…), separador `,` `;` o tabulador. Sin cabecera: `lat,lon,rumbo[,sog,pitch,roll]` |
| NMEA 0183 | `$--RMC`, `$--GGA`, `$--HDG`/`HDT`/`HDM`, `$--XDR` (PTCH/ROLL) |
| JSON | Lista de puntos, `{ "points": [...] }`, un único punto, objetos anidados (`{"gps":{…},"imu":{…}}`) o GeoJSON `LineString` |

En vivo se acepta lo mismo línea a línea (NMEA, JSON o CSV). En `examples-data/` hay ficheros de prueba
y en `arduino/itrip_nmea_out/` un sketch de referencia que reenvía el GPS y añade `$HCHDG` y `$IIXDR`
con la orientación del BNO055.

> **Wi‑Fi / URL:** Windy funciona en HTTPS, así que el navegador sólo permite leer URLs **HTTPS** con la cabecera
> `Access-Control-Allow-Origin: *`. Una IP local `http://192.168.x.x` será bloqueada; usa USB o un relay HTTPS.

## Desarrollo y prueba

Requisitos: Node.js 18+.

```bash
npm install
npm start          # compila en modo watch y sirve https://localhost:9999/plugin.js
```

1. Abre <https://localhost:9999/plugin.js> una vez y acepta el certificado autofirmado.
2. Entra en <https://www.windy.com/developer-mode> (con sesión iniciada).
3. Carga el plugin desde `https://localhost:9999/plugin.js`.
4. El plugin activa la capa de viento al abrirse. Carga un track o conecta la caja.

## Publicar

```bash
npm run build      # genera dist/
```

Para publicarlo en Windy, crea una API key de plugins en Windy, guárdala como secreto `WINDY_API_KEY`
en el repositorio de GitHub y lanza manualmente el workflow **publish-plugin** (Actions).
El plugin está marcado como `private: true` en `src/pluginConfig.ts`: no aparecerá en la galería pública.

## Estructura

```
src/pluginConfig.ts   configuración del plugin (nombre, icono, UI)
src/plugin.svelte     interfaz y lógica sobre el mapa
src/parsers.ts        lectura de GPX / CSV / NMEA / JSON
src/live.ts           conexión en vivo (USB Web Serial y HTTP)
src/geo.ts            cálculos (TWA, distancia, rumbo)
src/boatIcon.ts       icono del barco y flecha de viento
arduino/              sketch de referencia para la caja
```

Basado en la plantilla oficial [windycom/windy-plugin-template](https://github.com/windycom/windy-plugin-template).
