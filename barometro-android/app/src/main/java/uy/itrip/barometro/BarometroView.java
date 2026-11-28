package uy.itrip.barometro;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.util.AttributeSet;
import android.view.View;

/** Esfera de barómetro aneroide con aguja animada y aguja de referencia (valor de hace 3 h). */
public class BarometroView extends View {
    private static final float MIN = 960f, MAX = 1060f;
    private static final float ANG_INICIO = 135f, ANG_BARRIDO = 270f;

    private final Paint pArco = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint pMarca = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint pTexto = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint pAguja = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint pRef = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path camino = new Path();
    private final RectF rect = new RectF();
    private final float dp;

    private float objetivo = Float.NaN, mostrado = Float.NaN;
    private float referencia = Float.NaN;
    private String textoCentral = "—", textoUnidad = "", textoInferior = "";

    public BarometroView(Context c, AttributeSet a) {
        super(c, a);
        dp = getResources().getDisplayMetrics().density;
        pArco.setStyle(Paint.Style.STROKE);
        pArco.setStrokeCap(Paint.Cap.BUTT);
        pMarca.setColor(0xFFEAF1F8);
        pMarca.setStrokeCap(Paint.Cap.ROUND);
        pTexto.setColor(0xFFEAF1F8);
        pTexto.setTextAlign(Paint.Align.CENTER);
        pAguja.setColor(0xFFFFB74D);
        pRef.setColor(0xFF4FC3F7);
        pRef.setStyle(Paint.Style.STROKE);
        pRef.setStrokeCap(Paint.Cap.ROUND);
    }

    /** @param hPa presión a mostrar en la esfera (hPa); NaN si no hay dato. */
    void fijar(float hPa, float refHPa, String central, String unidad, String inferior) {
        objetivo = hPa;
        referencia = refHPa;
        textoCentral = central;
        textoUnidad = unidad;
        textoInferior = inferior;
        if (Float.isNaN(mostrado)) mostrado = hPa;
        invalidate();
    }

    @Override
    protected void onMeasure(int w, int h) {
        int ancho = MeasureSpec.getSize(w);
        // Que la esfera quepa siempre en pantalla (tablet en apaisado o retrato).
        int maxAlto = (int) (getResources().getDisplayMetrics().heightPixels * 0.62f);
        int lado = Math.min(ancho, maxAlto);
        if (MeasureSpec.getMode(h) == MeasureSpec.EXACTLY) lado = MeasureSpec.getSize(h);
        setMeasuredDimension(ancho, lado);
    }

    private float angulo(float hPa) {
        float v = Math.max(MIN - 3, Math.min(MAX + 3, hPa));
        return ANG_INICIO + (v - MIN) / (MAX - MIN) * ANG_BARRIDO;
    }

    @Override
    protected void onDraw(Canvas c) {
        float cx = getWidth() / 2f, cy = getHeight() / 2f;
        float r = Math.min(getWidth(), getHeight()) / 2f - 8 * dp;
        if (r <= 0) return;

        // Fondo de la esfera
        Paint fondo = new Paint(Paint.ANTI_ALIAS_FLAG);
        fondo.setColor(0xFF172331);
        c.drawCircle(cx, cy, r, fondo);
        fondo.setStyle(Paint.Style.STROKE);
        fondo.setStrokeWidth(3 * dp);
        fondo.setColor(0xFF2B3B4F);
        c.drawCircle(cx, cy, r, fondo);

        // Arco de colores por zonas
        float ra = r * 0.86f;
        pArco.setStrokeWidth(r * 0.07f);
        rect.set(cx - ra, cy - ra, cx + ra, cy + ra);
        float[][] zonas = {
                {960, 985, 0xFFE57373}, {985, 1000, 0xFFFFB74D}, {1000, 1020, 0xFF81C784},
                {1020, 1040, 0xFF4FC3F7}, {1040, 1060, 0xFF9575CD}};
        for (float[] z : zonas) {
            pArco.setColor((int) (long) z[2]);
            float a0 = angulo(z[0]), a1 = angulo(z[1]);
            c.drawArc(rect, a0, a1 - a0, false, pArco);
        }

        // Marcas y números
        for (int v = (int) MIN; v <= MAX; v++) {
            double a = Math.toRadians(angulo(v));
            boolean mayor = v % 10 == 0, media = v % 5 == 0;
            float r1 = r * 0.78f, r2 = r * (mayor ? 0.66f : media ? 0.71f : 0.74f);
            pMarca.setStrokeWidth((mayor ? 3f : 1.4f) * dp);
            pMarca.setAlpha(mayor ? 255 : 170);
            c.drawLine(cx + (float) Math.cos(a) * r1, cy + (float) Math.sin(a) * r1,
                    cx + (float) Math.cos(a) * r2, cy + (float) Math.sin(a) * r2, pMarca);
            if (mayor) {
                float rt = r * 0.55f;
                pTexto.setTextSize(r * 0.075f);
                pTexto.setTypeface(Typeface.DEFAULT);
                pTexto.setColor(0xFFEAF1F8);
                c.drawText(String.valueOf(v), cx + (float) Math.cos(a) * rt,
                        cy + (float) Math.sin(a) * rt + pTexto.getTextSize() * 0.35f, pTexto);
            }
        }

        // Rótulos de las zonas (por fuera del arco)
        String[] rotulos = {"TEMPORAL", "LLUVIA", "VARIABLE", "BUEN TIEMPO", "MUY SECO"};
        float[] pos = {972, 992, 1010, 1030, 1050};
        pTexto.setTextSize(r * 0.052f);
        pTexto.setTypeface(Typeface.DEFAULT_BOLD);
        pTexto.setColor(0xFF93A4B8);
        for (int i = 0; i < rotulos.length; i++) {
            float a = angulo(pos[i]);
            float rr = r * 0.955f;
            camino.reset();
            float barrido = rotulos[i].length() * 3.4f;
            rect.set(cx - rr, cy - rr, cx + rr, cy + rr);
            camino.addArc(rect, a - barrido / 2f, barrido);
            c.drawTextOnPath(rotulos[i], camino, 0, pTexto.getTextSize() * 0.35f, pTexto);
        }

        // Texto central
        pTexto.setColor(0xFFEAF1F8);
        pTexto.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        pTexto.setTextSize(r * 0.22f);
        c.drawText(textoCentral, cx, cy + r * 0.42f, pTexto);
        pTexto.setTypeface(Typeface.DEFAULT);
        pTexto.setTextSize(r * 0.075f);
        pTexto.setColor(0xFF93A4B8);
        c.drawText(textoUnidad, cx, cy + r * 0.54f, pTexto);
        pTexto.setTextSize(r * 0.068f);
        c.drawText(textoInferior, cx, cy + r * 0.66f, pTexto);

        // Aguja de referencia (hace 3 h)
        if (!Float.isNaN(referencia)) {
            double a = Math.toRadians(angulo(referencia));
            pRef.setStrokeWidth(2.5f * dp);
            float r1 = r * 0.20f, r2 = r * 0.80f;
            c.drawLine(cx + (float) Math.cos(a) * r1, cy + (float) Math.sin(a) * r1,
                    cx + (float) Math.cos(a) * r2, cy + (float) Math.sin(a) * r2, pRef);
        }

        // Aguja principal (animada)
        if (!Float.isNaN(objetivo)) {
            if (Float.isNaN(mostrado)) mostrado = objetivo;
            float dif = objetivo - mostrado;
            mostrado += dif * 0.15f;
            if (Math.abs(dif) > 0.01f) postInvalidateOnAnimation(); else mostrado = objetivo;

            double a = Math.toRadians(angulo(mostrado));
            float largo = r * 0.80f, cola = r * 0.16f, ancho = r * 0.035f;
            float ux = (float) Math.cos(a), uy = (float) Math.sin(a);
            float px = -uy, py = ux;
            camino.reset();
            camino.moveTo(cx + ux * largo, cy + uy * largo);
            camino.lineTo(cx + px * ancho, cy + py * ancho);
            camino.lineTo(cx - ux * cola, cy - uy * cola);
            camino.lineTo(cx - px * ancho, cy - py * ancho);
            camino.close();
            pAguja.setShadowLayer(4 * dp, 0, 2 * dp, Color.argb(120, 0, 0, 0));
            c.drawPath(camino, pAguja);
        }
        Paint eje = new Paint(Paint.ANTI_ALIAS_FLAG);
        eje.setColor(0xFFEAF1F8);
        c.drawCircle(cx, cy, r * 0.05f, eje);
        eje.setColor(0xFF172331);
        c.drawCircle(cx, cy, r * 0.02f, eje);
    }
}
