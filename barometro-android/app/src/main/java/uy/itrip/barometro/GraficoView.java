package uy.itrip.barometro;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/** Gráfico de la evolución de la presión. Tocar y arrastrar muestra el valor en cada instante. */
public class GraficoView extends View {
    private final Paint pLinea = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint pRejilla = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint pTexto = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint pCursor = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path camino = new Path();
    private final float dp;

    private long[] ts = new long[0];
    private double[] vs = new double[0];
    private long desde, hasta;
    private int unidad;
    private float toqueX = -1;

    public GraficoView(Context c, AttributeSet a) {
        super(c, a);
        dp = getResources().getDisplayMetrics().density;
        pLinea.setStyle(Paint.Style.STROKE);
        pLinea.setStrokeWidth(2.5f * dp);
        pLinea.setStrokeJoin(Paint.Join.ROUND);
        pLinea.setColor(0xFF4FC3F7);
        pRejilla.setColor(0xFF2B3B4F);
        pRejilla.setStrokeWidth(1 * dp);
        pTexto.setColor(0xFF93A4B8);
        pTexto.setTextSize(11 * dp);
        pCursor.setColor(0xFFFFB74D);
        pCursor.setStrokeWidth(1.5f * dp);
    }

    /** Valores en hPa ya corregidos (offset / nivel del mar). */
    void fijar(long[] t, double[] v, long desde, long hasta, int unidad) {
        this.ts = t;
        this.vs = v;
        this.desde = desde;
        this.hasta = hasta;
        this.unidad = unidad;
        invalidate();
    }

    @Override
    protected void onMeasure(int w, int h) {
        int ancho = MeasureSpec.getSize(w);
        int alto = MeasureSpec.getMode(h) == MeasureSpec.EXACTLY ? MeasureSpec.getSize(h) : (int) (220 * dp);
        setMeasuredDimension(ancho, alto);
    }

    @Override
    public boolean onTouchEvent(MotionEvent e) {
        switch (e.getAction()) {
            case MotionEvent.ACTION_DOWN:
            case MotionEvent.ACTION_MOVE:
                getParent().requestDisallowInterceptTouchEvent(true);
                toqueX = e.getX();
                invalidate();
                return true;
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                toqueX = -1;
                invalidate();
                return true;
        }
        return super.onTouchEvent(e);
    }

    @Override
    protected void onDraw(Canvas c) {
        float izq = 48 * dp, der = getWidth() - 12 * dp, arr = 12 * dp, abj = getHeight() - 24 * dp;
        if (der <= izq || abj <= arr) return;

        if (ts.length < 2) {
            pTexto.setTextAlign(Paint.Align.CENTER);
            pTexto.setTextSize(14 * dp);
            c.drawText("Acumulando datos… (una lectura cada 15 min)", getWidth() / 2f, getHeight() / 2f, pTexto);
            pTexto.setTextSize(11 * dp);
            return;
        }

        double min = Double.MAX_VALUE, max = -Double.MAX_VALUE;
        for (double v : vs) {
            min = Math.min(min, v);
            max = Math.max(max, v);
        }
        double medio = (min + max) / 2, rango = Math.max(6, (max - min) * 1.2);
        min = medio - rango / 2;
        max = medio + rango / 2;

        // Rejilla horizontal (pasos "redondos")
        double paso = rango > 30 ? 10 : rango > 14 ? 5 : rango > 7 ? 2 : 1;
        pTexto.setTextAlign(Paint.Align.RIGHT);
        for (double v = Math.ceil(min / paso) * paso; v <= max; v += paso) {
            float y = (float) (abj - (v - min) / (max - min) * (abj - arr));
            c.drawLine(izq, y, der, y, pRejilla);
            c.drawText(Presion.formato(v, unidad).replaceAll("[.,]0+$", ""), izq - 6 * dp, y + 4 * dp, pTexto);
        }

        // Rejilla vertical por horas
        long rangoT = hasta - desde;
        int pasoH = rangoT <= 6 * 3_600_000L ? 1 : rangoT <= 24 * 3_600_000L ? 3 : rangoT <= 72 * 3_600_000L ? 12 : 24;
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(desde);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        cal.add(Calendar.HOUR_OF_DAY, 1);
        while (cal.get(Calendar.HOUR_OF_DAY) % pasoH != 0) cal.add(Calendar.HOUR_OF_DAY, 1);
        SimpleDateFormat fh = new SimpleDateFormat(pasoH >= 24 ? "EEE d" : "HH:mm", Locale.getDefault());
        pTexto.setTextAlign(Paint.Align.CENTER);
        while (cal.getTimeInMillis() < hasta) {
            float x = xDe(cal.getTimeInMillis(), izq, der);
            c.drawLine(x, arr, x, abj, pRejilla);
            String etq = cal.get(Calendar.HOUR_OF_DAY) == 0 && pasoH < 24
                    ? new SimpleDateFormat("EEE d", Locale.getDefault()).format(cal.getTime())
                    : fh.format(cal.getTime());
            c.drawText(etq, x, getHeight() - 6 * dp, pTexto);
            cal.add(Calendar.HOUR_OF_DAY, pasoH);
        }

        // Curva (corta la línea si faltan datos más de 1 h)
        camino.reset();
        boolean primero = true;
        long tAnt = 0;
        for (int i = 0; i < ts.length; i++) {
            float x = xDe(ts[i], izq, der);
            float y = (float) (abj - (vs[i] - min) / (max - min) * (abj - arr));
            if (primero || ts[i] - tAnt > 3_600_000L) camino.moveTo(x, y); else camino.lineTo(x, y);
            primero = false;
            tAnt = ts[i];
        }
        c.drawPath(camino, pLinea);

        // Cursor
        if (toqueX >= izq && toqueX <= der) {
            long t = desde + (long) ((toqueX - izq) / (der - izq) * (hasta - desde));
            int mejor = 0;
            for (int i = 1; i < ts.length; i++) if (Math.abs(ts[i] - t) < Math.abs(ts[mejor] - t)) mejor = i;
            float x = xDe(ts[mejor], izq, der);
            float y = (float) (abj - (vs[mejor] - min) / (max - min) * (abj - arr));
            c.drawLine(x, arr, x, abj, pCursor);
            c.drawCircle(x, y, 5 * dp, pCursor);
            String txt = new SimpleDateFormat("EEE HH:mm", Locale.getDefault()).format(new Date(ts[mejor]))
                    + "  " + Presion.formato(vs[mejor], unidad) + " " + Presion.UNIDADES[unidad];
            Paint caja = new Paint(Paint.ANTI_ALIAS_FLAG);
            caja.setColor(0xEE0E1621);
            Paint tt = new Paint(pTexto);
            tt.setColor(0xFFEAF1F8);
            tt.setTextSize(13 * dp);
            tt.setTextAlign(Paint.Align.LEFT);
            float w = tt.measureText(txt) + 16 * dp;
            float bx = Math.min(Math.max(x - w / 2, izq), der - w);
            c.drawRoundRect(bx, arr, bx + w, arr + 24 * dp, 6 * dp, 6 * dp, caja);
            c.drawText(txt, bx + 8 * dp, arr + 17 * dp, tt);
        }
    }

    private float xDe(long t, float izq, float der) {
        return izq + (float) (t - desde) / (hasta - desde) * (der - izq);
    }
}
