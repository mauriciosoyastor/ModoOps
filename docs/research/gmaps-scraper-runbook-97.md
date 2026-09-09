# Runbook GMaps scraper (S3 #97) — gosom, captación propia

> Constraints: rate-limit, solo datos públicos, sin credenciales en el repo,
> sin flag `-email`, telemetría off. ToS Google Maps §3.2.3 prohíbe el scraping;
> esta corrida es acotada y bajo riesgo asumido (#89). Vía conforme: Places API.

## Imagen

- `docker.io/gosom/google-maps-scraper:latest`
- Digest verificado 2026-09-05: `sha256:b5cb22cfe7d91f81d66d090e72ac9b3806350ae74b74bcbf244e8a54edfa3495`
- Re-fijar digest ante nueva corrida (`docker pull` + `docker inspect --format '{{.RepoDigests}}'`).

## Comando (caso acotado validado: pinturerías, Córdoba, 16 filas)

```bash
printf 'pinturerias en Cordoba Argentina\n' > queries.txt
docker run --rm \
  -e DISABLE_TELEMETRY=1 \
  -v "$PWD:/work" gosom/google-maps-scraper:latest \
  -input /work/queries.txt -lang es -geo "-31.42,-64.18" -radius 5000 \
  -depth 1 -c 1 -browser-pool-size 1 -pages-per-browser 1 \
  -results /work/leads.csv
```

Notas: las queries van por `-input` (un arg posicional arranca el web server, no scrapea).
Sin `-email`, sin proxies (concurrencia mínima como rate-limit). Proxies, si hicieran
falta, solo por env local nunca commiteado.

## Renombre gosom → S2 (obligatorio: S2 espera claves españolas)

| gosom | S2 |
|---|---|
| title | nombre |
| complete_address | direccion |
| phone | telefono |
| emails | email (vacío sin `-email`: verificado 0/16) |
| website | web |
| category | categoria |
| review_rating | rating |
| latitude | lat |
| longitude | lon |
| place_id | place_id |
| — | fuente / fecha_captura / estado (defaults: gosom, hoy, nuevo) |

Resto de headers gosom (~26: reviews, horarios, fotos, etc.) = descarte real documentado
aquí (el reporte `discarded` de S2 usa la lista del prototipo #91: cosmético, no bloqueante).

## Validación

```bash
python tools/gmaps/check_csv.py leads_s2.csv   # ok=True filas=16
```

más `parse_csv_bytes` + `map_rows` + `to_lead_vals` de S2 sobre el CSV renombrado.
CSV con datos reales NO se commitea (solo conteo + headers como asset del ticket).
