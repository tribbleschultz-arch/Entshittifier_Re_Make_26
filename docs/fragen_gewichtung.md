# Fragen & Gewichtung – Suffizienz-Check

Diese Dokumentation beschreibt die zugrunde liegenden Fragen des
Suffizienz-Checks und wie deren Beantwortung in einen 2D-Score
verrechnet wird. Die Rohdaten liegen in `public/questions.json`
(Fragen + Gewichte) und `public/einordnung.json` (Zonen-Texte).

---

## 1. Das Koordinatensystem

Jede Antwort verschiebt einen Punkt in einem zweidimensionalen Feld:

| Achse | Bedeutung | Richtung |
|-------|-----------|----------|
| **X** | Nachhaltigkeit / Ressourcenschonung | positiv = nachhaltiger |
| **Y** | Gesellschaftliches Bedürfnis / Systemrelevanz | positiv = gesellschaftlich relevanter |

- Der Score wird **auf ±15 begrenzt** (`MAX_ABS = 15` in `src/App.tsx`).
- Pro Frage gibt es drei Antwortmöglichkeiten mit je einer Verschiebung
  `{ x, y }`:
  - `yes` (Ja)
  - `no` (Nein)
  - `dont_know` (Weiß nicht)

Die Summe aller Verschiebungen ergibt den rohen Punkt, der anschließend
begrenzt und in die Matrix eingezeichnet wird.

---

## 2. Die Fragen im Detail

| ID | Kurzlabel | Fokus | Ja (x,y) | Nein (x,y) | Weiß nicht (x,y) |
|----|-----------|-------|-----------|------------|-------------------|
| Q0 | Impuls-Check | Überlebt das Bedürfnis eine Woche Bedenkzeit ohne Werbung? | (0, -3) | (0, 0) | (0, -1) |
| Q1 | Bedürfnis-Stabilität | Besteht das Bedürfnis ohne Werbung/Trends? | (0, +2) | (0, -3) | (0, -1) |
| Q2 | Gemeinwohl-Optimierung | Für Teilen/öffentliche Infrastruktur ausgelegt? | (0, +4) | (0, -1) | (0, 0) |
| Q3 | Zeitlose Nutzbarkeit | Auch in 20 Jahren voll nutzbar? | (+2, 0) | (-2, 0) | (-1, 0) |
| Q4 | Funktionale Reduktion | Ersetzt ≥2 Einzelgeräte? | (+1, 0) | (-1, 0) | (0, 0) |
| Q5 | Postwachstums-Geschäftsmodell | Verdient durch Service statt Neukauf? | (+2, 0) | (-2, 0) | (-1, 0) |
| Q6 | Handwerkliche Souveränität | Selbst reparierbar (Werkzeug, keine Sperren)? | (+3, 0) | (-3, 0) | (-1, 0) |
| Q7 | Regionale Subsistenz | Lokal herstellbar/nachbaubar? | (+2, 0) | (-2, 0) | (-1, 0) |
| Q8 | Zukunftssichere Modularität | Kernkomponenten einzeln tauschbar? | (+2, 0) | (-1, 0) | (-1, 0) |
| Q9 | Ressourcen-Aufwand | Bindet viel Rohstoffe/Energie? | (-4, 0) | (+3, 0) | (-1, 0) |
| Q10 | Systemrelevanz | Gesellschaft überlebt ohne das Produkt? | (0, -4) | (0, +5) | (0, -1) |
| Q11 | Fokus Gemeinwohl vs. Individuum | Dient übergeordnetem gesellschaftlichem Problem? | (0, +4) | (0, -4) | (0, -1) |

### Interpretation der Gewichte

- **Y-Achse (gesellschaftliches Bedürfnis)** wird fast ausschließlich über
  die Fragen Q0, Q1, Q2, Q10, Q11 gesteuert. Besonders Q10
  (*Systemrelevanz*) hat mit ±5 die stärkste Einzelauswirkung auf Y.
- **X-Achse (Nachhaltigkeit)** wird über die produktbezogenen Fragen
  Q3–Q9 gesteuert. Q9 (*Ressourcen-Aufwand*) ist mit ±4 die stärkste
  X-Verschiebung.
- **"Weiß nicht"** ist bewusst leicht negativ gewichtet (meist -1 auf der
  betroffenen Achse), um Unentschiedenheit nicht als neutralen Freifahrtschein
  zu werten.

---

## 3. Die Zonen (Einordnung)

Aus dem begrenzten Punkt `(x, y)` wird über die in `src/App.tsx`
hinterlegte Geometrie eine Zone bestimmt (`activeZone`):

| Zone (Key) | Name | Bedingung (vereinfacht) |
|-------------|------|------------------------|
| `top_right_suffizient` | **Suffizient** | oberhalb der Suffizienz-Grenze (Kurve von (-15,14) über Kreisbogen r=13 zu (14,-15)) |
| `top_right_potential` | **Starkes Potential** | oberer rechter Bereich innerhalb des Bogens |
| `top_left` | **Schwaches Potential** | hohe Nachhaltigkeit, aber geringes gesellschaftliches Bedürfnis |
| `bottom_half` | **Individueller Konsum** | unterer Bereich (privater Individualbedarf) |
| `center_neutral` | **Zu wenige Infos** | Abstand vom Zentrum ≤ 3,0 (von 15) |

Die Grenzkurve verläuft von `(-15, 14)` über die Linie `y = 13 - x/15`
zum Punkt `(0, 13)`, dann als Kreisbogen mit Radius 13 von `(0, 13)` zu
`(13, 0)` und schließlich als Linie `x = 13 - y/15` zu `(14, -15)`.

---

## 4. Anpassen

- **Frage hinzufügen/ändern:** Eintrag in `public/questions.json` mit
  `id`, `short_label`, `question`, `why_it_matters` und den drei
  `{ x, y }`-Verschiebungen.
- **Zone ändern:** Texte in `public/einordnung.json`.
- **Grenzen/Geometrie ändern:** Konstanten `MAX_ABS` und die
  Zonen-Berechnung in `src/App.tsx` (`activeZone`).
