package uy.itrip.barometro;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.Looper;

/** Se despierta cada ~15 min, toma unas cuantas lecturas del barómetro, las promedia y las guarda. */
public class MuestreoReceiver extends BroadcastReceiver {
    private static final int LECTURAS = 10;

    @Override
    public void onReceive(Context context, Intent intent) {
        final Context c = context.getApplicationContext();
        Muestreo.programar(c);

        SensorManager sm = c.getSystemService(SensorManager.class);
        Sensor s = sm == null ? null : sm.getDefaultSensor(Sensor.TYPE_PRESSURE);
        if (s == null) return;

        final PendingResult pendiente = goAsync();
        final Handler h = new Handler(Looper.getMainLooper());
        final double[] suma = {0};
        final int[] n = {0};
        final boolean[] hecho = {false};

        final SensorEventListener[] oyente = new SensorEventListener[1];
        final Runnable terminar = () -> {
            if (hecho[0]) return;
            hecho[0] = true;
            sm.unregisterListener(oyente[0]);
            if (n[0] > 0) {
                double p = suma[0] / n[0];
                long ahora = System.currentTimeMillis();
                // Evita duplicar si la app abierta acaba de guardar una lectura.
                java.util.List<Historial.Muestra> lista = Historial.cargar(c);
                if (ahora - Historial.ultima(lista) > 5 * 60_000L) {
                    Historial.agregar(c, ahora, p);
                    lista.add(new Historial.Muestra(ahora, p));
                }
                Muestreo.comprobarAlerta(c, lista, p);
            }
            pendiente.finish();
        };
        oyente[0] = new SensorEventListener() {
            @Override
            public void onSensorChanged(SensorEvent e) {
                if (hecho[0]) return;
                suma[0] += e.values[0];
                n[0]++;
                if (n[0] >= LECTURAS) h.post(terminar);
            }

            @Override
            public void onAccuracyChanged(Sensor sensor, int accuracy) {}
        };
        sm.registerListener(oyente[0], s, SensorManager.SENSOR_DELAY_NORMAL, h);
        h.postDelayed(terminar, 6000);
    }
}
