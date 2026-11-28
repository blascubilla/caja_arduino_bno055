package uy.itrip.barometro;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;

import java.util.List;
import java.util.Locale;

/** Programación del registro en segundo plano y alertas de caída de presión. */
final class Muestreo {
    private Muestreo() {}

    static final long INTERVALO = 15 * 60_000L;
    private static final String CANAL = "alertas";

    private static PendingIntent intencion(Context c) {
        Intent i = new Intent(c, MuestreoReceiver.class);
        return PendingIntent.getBroadcast(c, 1, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Programa la próxima lectura (o la cancela si el registro está desactivado). */
    static void programar(Context c) {
        AlarmManager am = c.getSystemService(AlarmManager.class);
        if (am == null) return;
        PendingIntent pi = intencion(c);
        if (!new Ajustes(c).registro()) {
            am.cancel(pi);
            return;
        }
        // Alarma inexacta permitida en reposo (Doze): no requiere permisos de alarma exacta.
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + INTERVALO, pi);
    }

    /** Comprueba si la presión ha caído por encima del umbral y avisa con una notificación. */
    static void comprobarAlerta(Context c, List<Historial.Muestra> lista, double actual) {
        Ajustes a = new Ajustes(c);
        if (!a.alerta()) return;
        long ahora = System.currentTimeMillis();
        Double d = Historial.cambio3h(lista, actual, ahora);
        if (d == null || d > -a.umbral()) return;
        if (ahora - a.ultimaAlerta() < 3 * 3_600_000L) return;
        if (c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;

        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        nm.createNotificationChannel(new NotificationChannel(CANAL, "Alertas de presión",
                NotificationManager.IMPORTANCE_HIGH));

        double p = actual + a.offset();
        String texto = String.format(Locale.getDefault(), "%s %s en 3 h (ahora %s %s). %s",
                Presion.formatoCambio(d, a.unidad()), Presion.UNIDADES[a.unidad()],
                Presion.formato(a.nivelMar() ? Presion.aNivelDelMar(p, a.altitud()) : p, a.unidad()),
                Presion.UNIDADES[a.unidad()],
                Presion.pronostico(Presion.aNivelDelMar(p, a.altitud()), d));

        PendingIntent abrir = PendingIntent.getActivity(c, 0, new Intent(c, MainActivity.class),
                PendingIntent.FLAG_IMMUTABLE);
        Notification n = new Notification.Builder(c, CANAL)
                .setSmallIcon(R.drawable.ic_notif)
                .setContentTitle("Presión bajando rápido")
                .setContentText(texto)
                .setStyle(new Notification.BigTextStyle().bigText(texto))
                .setContentIntent(abrir)
                .setAutoCancel(true)
                .build();
        nm.notify(1, n);
        a.ultimaAlerta(ahora);
    }
}
