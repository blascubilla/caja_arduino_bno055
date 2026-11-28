package uy.itrip.barometro;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Vuelve a programar el registro tras reiniciar la tablet o actualizar la app. */
public class ArranqueReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String a = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(a)) {
            Muestreo.programar(context.getApplicationContext());
        }
    }
}
