package uy.itrip.barometro;

import android.content.Context;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/** Registro de lecturas (presión de estación en hPa, sin corrección) guardado en un CSV interno. */
final class Historial {
    private Historial() {}

    static final long DIAS_GUARDADOS = 10;
    private static final String ARCHIVO = "historial.csv";
    private static final Object CANDADO = new Object();

    static final class Muestra {
        final long t;
        final double hPa;

        Muestra(long t, double hPa) {
            this.t = t;
            this.hPa = hPa;
        }
    }

    private static File archivo(Context c) {
        return new File(c.getFilesDir(), ARCHIVO);
    }

    static void agregar(Context c, long t, double hPa) {
        synchronized (CANDADO) {
            try (FileWriter w = new FileWriter(archivo(c), true)) {
                w.write(t + "," + String.format(java.util.Locale.US, "%.3f", hPa) + "\n");
            } catch (IOException ignored) {
            }
        }
    }

    static List<Muestra> cargar(Context c) {
        List<Muestra> lista = new ArrayList<>();
        long limite = System.currentTimeMillis() - DIAS_GUARDADOS * 86_400_000L;
        boolean hayViejas = false;
        synchronized (CANDADO) {
            File f = archivo(c);
            if (!f.exists()) return lista;
            try (BufferedReader r = new BufferedReader(new FileReader(f))) {
                String linea;
                while ((linea = r.readLine()) != null) {
                    int coma = linea.indexOf(',');
                    if (coma <= 0) continue;
                    try {
                        long t = Long.parseLong(linea.substring(0, coma));
                        double p = Double.parseDouble(linea.substring(coma + 1));
                        if (t < limite) {
                            hayViejas = true;
                            continue;
                        }
                        lista.add(new Muestra(t, p));
                    } catch (NumberFormatException ignored) {
                    }
                }
            } catch (IOException ignored) {
            }
            lista.sort((a, b) -> Long.compare(a.t, b.t));
            if (hayViejas) reescribir(f, lista);
        }
        return lista;
    }

    private static void reescribir(File f, List<Muestra> lista) {
        try (FileWriter w = new FileWriter(f, false)) {
            for (Muestra m : lista) {
                w.write(m.t + "," + String.format(java.util.Locale.US, "%.3f", m.hPa) + "\n");
            }
        } catch (IOException ignored) {
        }
    }

    static void borrar(Context c) {
        synchronized (CANDADO) {
            //noinspection ResultOfMethodCallIgnored
            archivo(c).delete();
        }
    }

    static long ultima(List<Muestra> lista) {
        return lista.isEmpty() ? 0 : lista.get(lista.size() - 1).t;
    }

    /** Lectura más cercana al instante indicado, si hay alguna dentro de la tolerancia. */
    static Muestra cercana(List<Muestra> lista, long t, long tolerancia) {
        Muestra mejor = null;
        long mejorDif = Long.MAX_VALUE;
        for (Muestra m : lista) {
            long d = Math.abs(m.t - t);
            if (d < mejorDif) {
                mejorDif = d;
                mejor = m;
            }
        }
        return mejorDif <= tolerancia ? mejor : null;
    }

    /** Cambio de presión (hPa) en las últimas 3 h, o null si no hay datos suficientes. */
    static Double cambio3h(List<Muestra> lista, double actual, long ahora) {
        Muestra antes = cercana(lista, ahora - 3 * 3_600_000L, 40 * 60_000L);
        return antes == null ? null : actual - antes.hPa;
    }

    static String comoCsv(List<Muestra> lista, double offset, double altitud) {
        StringBuilder sb = new StringBuilder("fecha,presion_estacion_hPa,presion_nivel_mar_hPa\n");
        java.text.SimpleDateFormat f = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm", java.util.Locale.US);
        for (Muestra m : lista) {
            double p = m.hPa + offset;
            sb.append(f.format(new java.util.Date(m.t))).append(',')
              .append(String.format(java.util.Locale.US, "%.2f,%.2f", p, Presion.aNivelDelMar(p, altitud)))
              .append('\n');
        }
        return sb.toString();
    }
}
