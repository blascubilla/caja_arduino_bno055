package uy.itrip.barometro;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MainActivity extends Activity implements SensorEventListener {
    private static final int PERMISO_NOTIF = 1, PERMISO_GPS = 2;
    private static final long GUARDAR_CADA = 5 * 60_000L;

    private Ajustes ajustes;
    private SensorManager sm;
    private Sensor sensor;
    private final Handler h = new Handler(Looper.getMainLooper());

    private BarometroView esfera;
    private GraficoView grafico;
    private TextView valorPrincipal, valorSecundario, etqPrincipal, tendencia, cambios, pronostico,
            infoSensor, estadoSensor, txtOffset;
    private EditText edAltitud, edQnh, edUmbral;

    private double filtrado = Double.NaN;
    private int precision = SensorManager.SENSOR_STATUS_ACCURACY_HIGH;
    private List<Historial.Muestra> historial = new ArrayList<>();
    private long ultimoGuardado;
    private LocationListener oyenteGps;

    private final Runnable refresco = new Runnable() {
        @Override
        public void run() {
            actualizar();
            h.postDelayed(this, 1000);
        }
    };

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        setContentView(R.layout.activity_main);
        ajustes = new Ajustes(this);
        sm = getSystemService(SensorManager.class);
        sensor = sm == null ? null : sm.getDefaultSensor(Sensor.TYPE_PRESSURE);

        esfera = findViewById(R.id.esfera);
        grafico = findViewById(R.id.grafico);
        valorPrincipal = findViewById(R.id.valorPrincipal);
        valorSecundario = findViewById(R.id.valorSecundario);
        etqPrincipal = findViewById(R.id.etqPrincipal);
        tendencia = findViewById(R.id.tendencia);
        cambios = findViewById(R.id.cambios);
        pronostico = findViewById(R.id.pronostico);
        infoSensor = findViewById(R.id.infoSensor);
        estadoSensor = findViewById(R.id.estadoSensor);
        txtOffset = findViewById(R.id.txtOffset);
        edAltitud = findViewById(R.id.altitud);
        edQnh = findViewById(R.id.qnhRef);
        edUmbral = findViewById(R.id.umbral);

        if (sensor == null) {
            findViewById(R.id.sinSensor).setVisibility(View.VISIBLE);
            estadoSensor.setText("Sin barómetro");
        } else {
            infoSensor.setText(String.format(Locale.getDefault(), "Sensor: %s (%s) · resolución %.2f hPa",
                    sensor.getName(), sensor.getVendor(), sensor.getResolution()));
        }

        orientar(getResources().getConfiguration());
        configurarAjustes();
        pedirNotificaciones();
        Muestreo.programar(this);
    }

    @Override
    public void onConfigurationChanged(Configuration c) {
        super.onConfigurationChanged(c);
        orientar(c);
    }

    /** En apaisado, esfera y datos lado a lado; en retrato, uno debajo del otro. */
    private void orientar(Configuration c) {
        LinearLayout fila = findViewById(R.id.filaPrincipal);
        View panel = findViewById(R.id.panelDatos);
        boolean apaisado = c.orientation == Configuration.ORIENTATION_LANDSCAPE;
        fila.setOrientation(apaisado ? LinearLayout.HORIZONTAL : LinearLayout.VERTICAL);
        LinearLayout.LayoutParams pe = (LinearLayout.LayoutParams) esfera.getLayoutParams();
        LinearLayout.LayoutParams pp = (LinearLayout.LayoutParams) panel.getLayoutParams();
        if (apaisado) {
            pe.width = 0; pe.weight = 1;
            pp.width = 0; pp.weight = 1;
            pp.setMarginStart(dp(16)); pp.topMargin = 0;
        } else {
            pe.width = LinearLayout.LayoutParams.MATCH_PARENT; pe.weight = 0;
            pp.width = LinearLayout.LayoutParams.MATCH_PARENT; pp.weight = 0;
            pp.setMarginStart(0); pp.topMargin = dp(16);
        }
        esfera.setLayoutParams(pe);
        panel.setLayoutParams(pp);
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    @Override
    protected void onResume() {
        super.onResume();
        historial = Historial.cargar(this);
        ultimoGuardado = Historial.ultima(historial);
        if (sensor != null) sm.registerListener(this, sensor, SensorManager.SENSOR_DELAY_UI);
        aplicarPantalla();
        h.post(refresco);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (sensor != null) sm.unregisterListener(this);
        h.removeCallbacks(refresco);
        pararGps();
    }

    @Override
    public void onSensorChanged(SensorEvent e) {
        double p = e.values[0];
        if (p < 300 || p > 1200) return;
        // Filtro paso bajo para suavizar el ruido del sensor.
        filtrado = Double.isNaN(filtrado) ? p : filtrado + 0.08 * (p - filtrado);
        long ahora = System.currentTimeMillis();
        if (ahora - ultimoGuardado >= GUARDAR_CADA) {
            ultimoGuardado = ahora;
            Historial.agregar(this, ahora, filtrado);
            historial.add(new Historial.Muestra(ahora, filtrado));
            Muestreo.comprobarAlerta(this, historial, filtrado);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor s, int a) {
        precision = a;
    }

    // ---------------------------------------------------------------- Pantalla

    private double corregir(double crudo) {
        double p = crudo + ajustes.offset();
        return ajustes.nivelMar() ? Presion.aNivelDelMar(p, ajustes.altitud()) : p;
    }

    private void actualizar() {
        int u = ajustes.unidad();
        String uni = Presion.UNIDADES[u];
        boolean nm = ajustes.nivelMar();
        etqPrincipal.setText(nm ? "Presión a nivel del mar (QNH)" : "Presión de estación");
        long ahora = System.currentTimeMillis();

        if (sensor != null) {
            estadoSensor.setText(Double.isNaN(filtrado) ? "Esperando sensor…"
                    : precision <= SensorManager.SENSOR_STATUS_ACCURACY_LOW ? "● Precisión baja" : "● En vivo");
        }

        double base = filtrado;
        if (Double.isNaN(base) && !historial.isEmpty()) base = historial.get(historial.size() - 1).hPa;

        if (Double.isNaN(base)) {
            valorPrincipal.setText("—");
            valorSecundario.setText("");
            tendencia.setText("—");
            cambios.setText("");
            pronostico.setText(sensor == null ? "Sin sensor de presión." : "Esperando lecturas…");
            esfera.fijar(Float.NaN, Float.NaN, "—", uni, "");
        } else {
            double estacion = base + ajustes.offset();
            double qnh = Presion.aNivelDelMar(estacion, ajustes.altitud());
            double mostrado = nm ? qnh : estacion;

            valorPrincipal.setText(Presion.formato(mostrado, u) + " " + uni);
            valorSecundario.setText(nm
                    ? String.format(Locale.getDefault(), "Estación: %s %s · altitud %.0f m",
                            Presion.formato(estacion, u), uni, ajustes.altitud())
                    : String.format(Locale.getDefault(), "Nivel del mar: %s %s",
                            Presion.formato(qnh, u), uni));

            Double d3 = Historial.cambio3h(historial, base, ahora);
            if (d3 == null) {
                tendencia.setText("Calculando…");
                cambios.setText("Hacen falta unas 3 h de registro.");
            } else {
                tendencia.setText(Presion.flecha(d3) + "  " + Presion.formatoCambio(d3, u) + " " + uni + " · "
                        + Presion.tendencia(d3));
                tendencia.setTextColor(d3 <= -ajustes.umbral() ? 0xFFE57373 : 0xFFEAF1F8);
            }
            StringBuilder sb = new StringBuilder();
            int[] horas = {1, 6, 12, 24};
            for (int hh : horas) {
                Historial.Muestra m = Historial.cercana(historial, ahora - hh * 3_600_000L,
                        Math.max(20, hh * 5) * 60_000L);
                if (m == null) continue;
                if (sb.length() > 0) sb.append("   ");
                sb.append(hh).append(" h: ").append(Presion.formatoCambio(base - m.hPa, u));
            }
            if (d3 != null) cambios.setText(sb.length() > 0 ? sb + " " + uni : "");
            pronostico.setText(Presion.pronostico(qnh, d3));

            Historial.Muestra ref = Historial.cercana(historial, ahora - 3 * 3_600_000L, 40 * 60_000L);
            float refEsfera = ref == null ? Float.NaN : (float) corregir(ref.hPa);
            esfera.fijar((float) mostrado, refEsfera, Presion.formato(mostrado, u), uni,
                    d3 == null ? "" : Presion.flecha(d3) + " " + Presion.formatoCambio(d3, u) + " / 3 h");
        }

        actualizarGrafico(ahora);
        txtOffset.setText(String.format(Locale.getDefault(), "Corrección aplicada: %+.2f hPa", ajustes.offset()));
    }

    private void actualizarGrafico(long ahora) {
        long desde = ahora - ajustes.horasGrafico() * 3_600_000L;
        int n = 0;
        for (Historial.Muestra m : historial) if (m.t >= desde) n++;
        long[] t = new long[n];
        double[] v = new double[n];
        int i = 0;
        for (Historial.Muestra m : historial) {
            if (m.t < desde) continue;
            t[i] = m.t;
            v[i] = corregir(m.hPa);
            i++;
        }
        grafico.fijar(t, v, desde, ahora, ajustes.unidad());
    }

    // ---------------------------------------------------------------- Ajustes

    private static Double leer(EditText e) {
        try {
            return Double.parseDouble(e.getText().toString().trim().replace(',', '.'));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private void alTerminar(EditText e, Runnable r) {
        e.setOnEditorActionListener((v, id, ev) -> {
            if (id == EditorInfo.IME_ACTION_DONE) r.run();
            return false;
        });
        e.setOnFocusChangeListener((v, foco) -> {
            if (!foco) r.run();
        });
    }

    private void configurarAjustes() {
        RadioGroup gu = findViewById(R.id.grupoUnidad);
        int[] idsU = {R.id.uHpa, R.id.uMmhg, R.id.uInhg};
        gu.check(idsU[ajustes.unidad()]);
        gu.setOnCheckedChangeListener((g, id) -> {
            for (int i = 0; i < idsU.length; i++) if (idsU[i] == id) ajustes.unidad(i);
            actualizar();
        });

        RadioGroup gh = findViewById(R.id.grupoHoras);
        int[] idsH = {R.id.h6, R.id.h24, R.id.h48, R.id.h168};
        int[] horas = {6, 24, 48, 168};
        for (int i = 0; i < horas.length; i++) if (horas[i] == ajustes.horasGrafico()) gh.check(idsH[i]);
        gh.setOnCheckedChangeListener((g, id) -> {
            for (int i = 0; i < idsH.length; i++) if (idsH[i] == id) ajustes.horasGrafico(horas[i]);
            actualizar();
        });

        interruptor(R.id.swNivelMar, ajustes.nivelMar(), (b, v) -> { ajustes.nivelMar(v); actualizar(); });
        interruptor(R.id.swRegistro, ajustes.registro(), (b, v) -> {
            ajustes.registro(v);
            Muestreo.programar(this);
        });
        interruptor(R.id.swAlerta, ajustes.alerta(), (b, v) -> {
            ajustes.alerta(v);
            if (v) pedirNotificaciones();
        });
        interruptor(R.id.swPantalla, ajustes.pantallaEncendida(), (b, v) -> {
            ajustes.pantallaEncendida(v);
            aplicarPantalla();
        });

        edAltitud.setText(String.format(Locale.getDefault(), "%.0f", ajustes.altitud()));
        alTerminar(edAltitud, () -> {
            Double v = leer(edAltitud);
            if (v != null && v > -500 && v < 9000) ajustes.altitud(v);
            edAltitud.setText(String.format(Locale.getDefault(), "%.0f", ajustes.altitud()));
            actualizar();
        });

        edUmbral.setText(String.format(Locale.getDefault(), "%.1f", ajustes.umbral()));
        alTerminar(edUmbral, () -> {
            Double v = leer(edUmbral);
            if (v != null && v > 0.2 && v < 30) ajustes.umbral(v);
            edUmbral.setText(String.format(Locale.getDefault(), "%.1f", ajustes.umbral()));
        });

        ((Button) findViewById(R.id.btnCalibrar)).setOnClickListener(v -> calibrar());
        ((Button) findViewById(R.id.btnQuitarOffset)).setOnClickListener(v -> {
            ajustes.offset(0);
            actualizar();
        });
        ((Button) findViewById(R.id.btnGps)).setOnClickListener(v -> altitudGps());
        ((Button) findViewById(R.id.btnExportar)).setOnClickListener(v -> exportar());
        ((Button) findViewById(R.id.btnBorrar)).setOnClickListener(v -> new AlertDialog.Builder(this)
                .setMessage("¿Borrar todo el historial de presión?")
                .setPositiveButton("Borrar", (d, w) -> {
                    Historial.borrar(this);
                    historial = new ArrayList<>();
                    ultimoGuardado = 0;
                    actualizar();
                })
                .setNegativeButton("Cancelar", null)
                .show());
    }

    private void interruptor(int id, boolean valor, CompoundButton.OnCheckedChangeListener l) {
        CompoundButton s = findViewById(id);
        s.setChecked(valor);
        s.setOnCheckedChangeListener(l);
    }

    private void aplicarPantalla() {
        if (ajustes.pantallaEncendida()) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    /** Ajusta la corrección para que la presión a nivel del mar coincida con un QNH de referencia. */
    private void calibrar() {
        Double ref = leer(edQnh);
        if (ref == null || ref < 870 || ref > 1090) {
            Toast.makeText(this, "Introduce un QNH en hPa (p. ej. 1013.2)", Toast.LENGTH_LONG).show();
            return;
        }
        if (Double.isNaN(filtrado)) {
            Toast.makeText(this, "Aún no hay lectura del sensor", Toast.LENGTH_LONG).show();
            return;
        }
        double estacionRef = ref * Math.pow(1.0 - ajustes.altitud() / 44330.0, 5.255);
        ajustes.offset(estacionRef - filtrado);
        edQnh.setText("");
        edQnh.clearFocus();
        Toast.makeText(this, String.format(Locale.getDefault(), "Corrección: %+.2f hPa", ajustes.offset()),
                Toast.LENGTH_LONG).show();
        actualizar();
    }

    private void exportar() {
        if (historial.isEmpty()) {
            Toast.makeText(this, "No hay datos todavía", Toast.LENGTH_SHORT).show();
            return;
        }
        Intent i = new Intent(Intent.ACTION_SEND);
        i.setType("text/plain");
        i.putExtra(Intent.EXTRA_SUBJECT, "Historial del barómetro");
        i.putExtra(Intent.EXTRA_TEXT, Historial.comoCsv(historial, ajustes.offset(), ajustes.altitud()));
        startActivity(Intent.createChooser(i, "Exportar historial"));
    }

    // ---------------------------------------------------------------- Permisos / GPS

    private void pedirNotificaciones() {
        if (android.os.Build.VERSION.SDK_INT >= 33 && ajustes.alerta()
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, PERMISO_NOTIF);
        }
    }

    private void altitudGps() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION}, PERMISO_GPS);
            return;
        }
        LocationManager lm = getSystemService(LocationManager.class);
        if (lm == null || !lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
            Toast.makeText(this, "Activa la ubicación (GPS)", Toast.LENGTH_LONG).show();
            return;
        }
        pararGps();
        Toast.makeText(this, "Buscando altitud por GPS…", Toast.LENGTH_SHORT).show();
        oyenteGps = new LocationListener() {
            @Override
            public void onLocationChanged(Location l) {
                if (!l.hasAltitude() || (l.hasAccuracy() && l.getAccuracy() > 50)) return;
                double alt = l.getAltitude();
                if (android.os.Build.VERSION.SDK_INT >= 34 && l.hasMslAltitude()) alt = l.getMslAltitudeMeters();
                ajustes.altitud(Math.round(alt));
                edAltitud.setText(String.format(Locale.getDefault(), "%.0f", ajustes.altitud()));
                Toast.makeText(MainActivity.this,
                        String.format(Locale.getDefault(), "Altitud GPS: %.0f m (aprox.)", alt), Toast.LENGTH_LONG).show();
                pararGps();
                actualizar();
            }

            @Override public void onProviderEnabled(String p) {}
            @Override public void onProviderDisabled(String p) {}
            @Override public void onStatusChanged(String p, int s, Bundle b) {}
        };
        try {
            lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000, 0, oyenteGps, Looper.getMainLooper());
            h.postDelayed(() -> {
                if (oyenteGps != null) {
                    pararGps();
                    Toast.makeText(this, "Sin señal GPS suficiente; prueba al aire libre", Toast.LENGTH_LONG).show();
                }
            }, 90_000);
        } catch (SecurityException ignored) {
        }
    }

    private void pararGps() {
        if (oyenteGps == null) return;
        LocationManager lm = getSystemService(LocationManager.class);
        if (lm != null) lm.removeUpdates(oyenteGps);
        oyenteGps = null;
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] p, int[] r) {
        super.onRequestPermissionsResult(req, p, r);
        if (req == PERMISO_GPS && r.length > 0 && r[0] == PackageManager.PERMISSION_GRANTED) altitudGps();
    }
}
