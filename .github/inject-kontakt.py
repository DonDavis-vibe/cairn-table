#!/usr/bin/env python3
"""Setzt den Kontaktblock aus dem Secret IMPRESSUM_KONTAKT in die Rechtstexte ein.

Laeuft ausschliesslich im Deployment, nach `npm run build`, gegen die Dateien in
`dist/`. Im Repo steht an der Kontaktstelle nur ein Platzhalter zwischen
<!--KONTAKT:START--> / <!--KONTAKT:END-->, damit Name, Anschrift und E-Mail nicht
in Klons, Forks oder der Git-History landen.

Bricht mit Exit-Code 1 ab, wenn das Secret fehlt oder eine Datei nicht die
erwartete Anzahl Platzhalter hat.
"""
import os
import re
import sys
from pathlib import Path

ZIELE = [
    ("dist/impressum.html", 1),   # (Pfad, Anzahl der <!--KONTAKT:START-->-Bloecke)
    ("dist/datenschutz.html", 0),
]

MARKER = re.compile(r"<!--KONTAKT:START-->.*?<!--KONTAKT:END-->", re.DOTALL)

kontakt = os.environ.get("IMPRESSUM_KONTAKT", "").strip()
if not kontakt:
    sys.exit("FEHLER: Secret IMPRESSUM_KONTAKT ist nicht gesetzt oder leer.")

for pfad_str, erwartet in ZIELE:
    pfad = Path(pfad_str)
    if not pfad.exists():
        sys.exit(f"FEHLER: {pfad} nicht gefunden.")
    html = pfad.read_text(encoding="utf-8")
    treffer = len(MARKER.findall(html))
    if treffer != erwartet:
        sys.exit(f"FEHLER: {treffer} Kontakt-Platzhalter in {pfad}, erwartet {erwartet}.")
    if treffer:
        pfad.write_text(MARKER.sub(lambda _m: kontakt, html), encoding="utf-8")
        print(f"Kontaktblock an {treffer} Stelle(n) in {pfad} eingesetzt.")
