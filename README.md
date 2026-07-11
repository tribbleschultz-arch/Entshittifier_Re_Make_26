# Suffizienz-Check

> Ein interaktives Web-Tool zur Einschätzung der Suffizienz, Reparierbarkeit und
> Systemrelevanz von Produkten anhand gezielter Fragen – visualisiert in einer
> 2D-Nachhaltigkeits-Matrix.

**Suffizienz-Check** ist eine kleine Single-Page-App (React + Vite + Tailwind),
die im Rahmen des *Re_Make Hackathons 2026* des Habitat Augsburg e.V. entstanden
ist. Der Nutzer beantwortet eine kurze Reihe von Fragen zu einem Produkt; die
Antworten werden zu einem Punkt in einer zweidimensionalen Matrix verrechnet, die
zeigt, ob das Produkt im Sinne der Suffizienz (gesellschaftlicher Nutzen bei
gleichzeitig hoher Nachhaltigkeit) einordnet werden kann.

Alle Fragen, Gewichtungen und Zonen liegen als statische JSON-Dateien vor und
werden lokal im Browser verarbeitet – es ist keine Server- oder API-Anbindung
nötig.

---

## Funktionsweise

1. **Fragen laden:** Beim Start werden `public/questions.json` (die Fragen inkl.
   Gewichtung) und `public/einordnung.json` (die Matrix-Zonen) geladen.
2. **Beantworten:** Jede Frage wird mit *Ja* / *Weiß nicht* / *Nein* beantwortet.
   Jede Antwort verschiebt einen Punkt im Koordinatensystem.
3. **Auswertung:** Am Ende wird der Punkt in einer 2D-Matrix (X = Nachhaltigkeit,
   Y = gesellschaftliches Bedürfnis) eingezeichnet und der passenden Zone
   zugeordnet (z. B. *Suffizient*, *Starkes Potential*, *Schwaches Potential*).

Die zugrunde liegende Mathematik (Begrenzung auf ±15, Zonen-Kurven,
Kreisbögen) ist in `src/App.tsx` implementiert. Eine ausführliche Dokumentation
der Fragen und ihrer Gewichtung findest du in [`docs/fragen_gewichtung.md`](docs/fragen_gewichtung.md).

---

## Projektstruktur

```
Entshittifier_Re_Make_26/
├── index.html              # HTML-Einstiegspunkt
├── package.json            # Abhängigkeiten & Skripte
├── vite.config.ts         # Vite-Konfiguration
├── tsconfig.json          # TypeScript-Konfiguration
├── wrangler.toml         # Cloudflare-Deployment-Konfiguration
├── metadata.json          # App-Metadaten
├── public/
│   ├── questions.json     # Fragen + Score-Gewichtung (x/y pro Antwort)
│   └── einordnung.json   # Matrix-Zonen (Texte pro Zone)
├── src/
│   ├── App.tsx            # Hauptlogik: Scoring, Zonen, UI
│   ├── main.tsx           # React-Einstiegspunkt
│   ├── types.ts           # TypeScript-Typen
│   ├── index.css          # Styles (Tailwind)
│   └── components/
│       └── ScoreBlob.tsx  # Animierte Blob-Visualisierung des Scores
└── docs/
    └── fragen_gewichtung.md  # Doku: Fragen & Gewichtung
```

---

## Lokales Ausführen

**Voraussetzungen:** Node.js (aktuelle LTS-Version)

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
2. App starten:
   ```bash
   npm run dev
   ```
3. Die App ist unter `http://localhost:3000` erreichbar.

### Build & Deployment

- **Build:** `npm run build` (Ausgabe in `dist/`)
- **Preview:** `npm run preview`
- **Lint:** `npm run lint` (TypeScript-Typecheck via `tsc --noEmit`)
- **Deployment:** Die App ist für Cloudflare Pages vorkonfiguriert
  (`wrangler.toml`, `assets`-Verzeichnis `./dist`).

---

## Anpassen

- **Fragen ändern:** Bearbeite `public/questions.json`. Jede Frage hat ein
  `id`, ein `question`-Text, ein `why_it_matters` und die Score-Verschiebungen
  `yes` / `no` / `dont_know` als `{ x, y }`-Werte.
- **Zonen-Texte ändern:** Bearbeite `public/einordnung.json`.
- **Scoring-Logik ändern:** Siehe `src/App.tsx` (Konstanten `MAX_ABS = 15`,
  Zonen-Berechnung in `activeZone`).

---

## Quellen & Grundlage

Die inhaltliche Auswahl der Fragen und die Einordnung in die Suffizienz-Matrix
stützen sich auf folgende öffentlich zugängliche Quellen und Literatur:

- WWF Deutschland – *Nachhaltiges Wirtschaften* (Online-Artikel):
  https://www.wwf.de/nachhaltiges-wirtschaften
- WWF Deutschland – *Modell Deutschland: Circular Economy* (Broschüre, PDF):
  https://www.wwf.de/fileadmin/fm-wwf/Publikationen-PDF/Unternehmen/WWF-Modell-Deutschland-Circular-Economy-Broschuere.pdf
- *Die Donut-Ökonomie – Endlich ein Wirtschaftsmodell, das den Planeten nicht
  zerstört.* (Hanse, 2018)
- *Degrowth: Postwachstum zur Einführung.* (Junius, 2021)
- *Hackathons: Von der Idee zur erfolgreichen Umsetzung.* (ISBN 978-3658260279)

## Credits

- Entstanden beim **Re_Make Hackathon 2026** des *Habitat Augsburg e.V.*
- Idee & Konzept: Kreislaufwirtschafts- und Suffizienz-Check als
  Entscheidungshilfe für nachhaltigen Konsum.

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz (siehe `LICENSE`, sofern vorhanden).
