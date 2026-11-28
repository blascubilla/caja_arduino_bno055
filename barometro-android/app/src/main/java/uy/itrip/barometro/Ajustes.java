package uy.itrip.barometro;

import android.content.Context;
import android.content.SharedPreferences;

/** Preferencias de la app. */
final class Ajustes {
    private final SharedPreferences p;

    Ajustes(Context c) {
        p = c.getSharedPreferences("ajustes", Context.MODE_PRIVATE);
    }

    double altitud() { return p.getFloat("altitud", 0f); }
    void altitud(double v) { p.edit().putFloat("altitud", (float) v).apply(); }

    double offset() { return p.getFloat("offset", 0f); }
    void offset(double v) { p.edit().putFloat("offset", (float) v).apply(); }

    int unidad() { return p.getInt("unidad", 0); }
    void unidad(int v) { p.edit().putInt("unidad", v).apply(); }

    boolean nivelMar() { return p.getBoolean("nivelMar", true); }
    void nivelMar(boolean v) { p.edit().putBoolean("nivelMar", v).apply(); }

    boolean registro() { return p.getBoolean("registro", true); }
    void registro(boolean v) { p.edit().putBoolean("registro", v).apply(); }

    boolean alerta() { return p.getBoolean("alerta", true); }
    void alerta(boolean v) { p.edit().putBoolean("alerta", v).apply(); }

    /** Umbral de alerta: caída en hPa en 3 h. */
    double umbral() { return p.getFloat("umbral", 3f); }
    void umbral(double v) { p.edit().putFloat("umbral", (float) v).apply(); }

    boolean pantallaEncendida() { return p.getBoolean("pantalla", false); }
    void pantallaEncendida(boolean v) { p.edit().putBoolean("pantalla", v).apply(); }

    int horasGrafico() { return p.getInt("horas", 24); }
    void horasGrafico(int v) { p.edit().putInt("horas", v).apply(); }

    long ultimaAlerta() { return p.getLong("ultimaAlerta", 0); }
    void ultimaAlerta(long v) { p.edit().putLong("ultimaAlerta", v).apply(); }
}
