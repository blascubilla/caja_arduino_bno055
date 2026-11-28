package uy.itrip.barometro;

import java.util.Locale;

/** Cálculos y textos relacionados con la presión atmosférica. */
final class Presion {
    private Presion() {}

    static final String[] UNIDADES = {"hPa", "mmHg", "inHg"};

    /** Presión reducida al nivel del mar (QNH aproximado, atmósfera estándar). */
    static double aNivelDelMar(double hPa, double altitudM) {
        if (altitudM == 0) return hPa;
        return hPa / Math.pow(1.0 - altitudM / 44330.0, 5.255);
    }

    /** Altitud barométrica estimada a partir de la presión y una presión de referencia al nivel del mar. */
    static double altitud(double hPa, double qnh) {
        return 44330.0 * (1.0 - Math.pow(hPa / qnh, 1.0 / 5.255));
    }

    static double convertir(double hPa, int unidad) {
        switch (unidad) {
            case 1: return hPa * 0.750062;
            case 2: return hPa * 0.0295300;
            default: return hPa;
        }
    }

    static String formato(double hPa, int unidad) {
        double v = convertir(hPa, unidad);
        switch (unidad) {
            case 1: return String.format(Locale.getDefault(), "%.1f", v);
            case 2: return String.format(Locale.getDefault(), "%.2f", v);
            default: return String.format(Locale.getDefault(), "%.1f", v);
        }
    }

    static String formatoCambio(double dhPa, int unidad) {
        double v = convertir(dhPa, unidad);
        String f = unidad == 2 ? "%+.2f" : "%+.1f";
        return String.format(Locale.getDefault(), f, v);
    }

    /** Descripción de la tendencia en 3 h (criterio de la OMM / boletines marítimos). */
    static String tendencia(double d3h) {
        double a = Math.abs(d3h);
        if (a < 0.1) return "Estable";
        if (a <= 1.5) return (d3h > 0 ? "Subiendo" : "Bajando") + " lentamente";
        if (a <= 3.5) return (d3h > 0 ? "Subiendo" : "Bajando");
        if (a <= 6.0) return (d3h > 0 ? "Subiendo" : "Bajando") + " rápidamente";
        return (d3h > 0 ? "Subiendo" : "Bajando") + " muy rápidamente";
    }

    static String flecha(double d3h) {
        if (Math.abs(d3h) < 0.1) return "→";
        if (Math.abs(d3h) <= 1.5) return d3h > 0 ? "↗" : "↘";
        return d3h > 0 ? "↑" : "↓";
    }

    /**
     * Pronóstico orientativo combinando la presión a nivel del mar y la tendencia en 3 h.
     * Es una regla empírica (tipo Zambretti simplificada), no sustituye a un parte oficial.
     */
    static String pronostico(double qnh, Double d3h) {
        if (d3h == null) {
            if (qnh >= 1025) return "Alta presión: tiempo estable y seco probable.";
            if (qnh >= 1013) return "Presión normal: tiempo variable. Esperando datos para la tendencia.";
            if (qnh >= 1000) return "Presión baja: posible nubosidad o lluvia.";
            return "Presión muy baja: tiempo inestable, posible temporal.";
        }
        double d = d3h;
        if (d <= -6.0) return "¡Caída muy rápida! Temporal o viento muy fuerte en pocas horas.";
        if (d <= -3.5) return "Caída rápida: aumento fuerte del viento y empeoramiento probable.";
        if (d <= -1.6) {
            return qnh < 1005 ? "Bajando con presión baja: lluvia y viento en aumento."
                              : "Bajando: empeoramiento probable en 12–24 h.";
        }
        if (d < -0.1) {
            return qnh >= 1020 ? "Ligero descenso con presión alta: cambios lentos, nubosidad."
                               : "Ligero descenso: tiempo variable, posible empeoramiento.";
        }
        if (d <= 0.1) {
            if (qnh >= 1020) return "Estable con presión alta: buen tiempo.";
            if (qnh >= 1008) return "Estable: sin grandes cambios previstos.";
            return "Estable con presión baja: tiempo inestable persistente.";
        }
        if (d <= 1.5) {
            return qnh >= 1015 ? "Subiendo lentamente: buen tiempo en camino."
                               : "Subiendo lentamente: mejoría gradual.";
        }
        if (d <= 3.5) return "Subiendo: mejoría, posibles rachas tras el paso del frente.";
        return "Subida rápida: mejoría pero con viento fuerte y racheado de momento.";
    }
}
