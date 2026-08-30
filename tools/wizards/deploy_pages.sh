#!/usr/bin/env bash
# Wizard: Deploy preview Cloudflare Pages — ModoOps landing (Fase 1 preview sin dominio)
# Generado via /wizard skill — abrir URLs, capturar valores, validar.

set -euo pipefail

if [[ -t 1 ]] && command -v tput >/dev/null 2>&1 && [[ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]]; then
  BOLD=$(tput bold); DIM=$(tput dim); RESET=$(tput sgr0)
  BLUE=$(tput setaf 4); GREEN=$(tput setaf 2); YELLOW=$(tput setaf 3); RED=$(tput setaf 1)
else
  BOLD=""; DIM=""; RESET=""; BLUE=""; GREEN=""; YELLOW=""; RED=""
fi

TOTAL_STAGES=5
_STAGE_INDEX=0
ENV_FILE="${ENV_FILE:-web/.env}"
WRITTEN_ENV=()
WRITTEN_SECRET=()
SKIPPED=()

_clear() { [[ -t 1 ]] || return 0; if command -v tput >/dev/null 2>&1; then tput clear; else printf '\033[2J\033[3J\033[H'; fi; }
banner() { _clear; printf '\n%s%s  %s%s\n' "$BOLD" "$BLUE" "$1" "$RESET"; printf '%s  %s stages%s\n\n' "$DIM" "$TOTAL_STAGES" "$RESET"; printf '%s  Preview Cloudflare Pages (sin dominio) — ModoOps landing 8 secciones USD.%s\n' "$DIM" "$RESET"; pause "Listo?"; }
stage() { _clear; _STAGE_INDEX=$((_STAGE_INDEX + 1)); printf '\n%s%s▸ Stage %s/%s · %s%s\n' "$BOLD" "$BLUE" "$_STAGE_INDEX" "$TOTAL_STAGES" "$1" "$RESET"; }
say()  { printf '  %s\n' "$1"; }
step() { printf '  %s•%s %s\n' "$BLUE" "$RESET" "$1"; }
note() { printf '  %s%s%s\n' "$DIM" "$1" "$RESET"; }
warn() { printf '  %s⚠ %s%s\n' "$YELLOW" "$1" "$RESET"; }
open_url() { local url="$1"; printf '  %s↗ opening%s %s\n' "$GREEN" "$RESET" "$url"; { if command -v wslview >/dev/null 2>&1; then wslview "$url"; elif command -v explorer.exe >/dev/null 2>&1; then explorer.exe "$url"; elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$url"; elif command -v open >/dev/null 2>&1; then open "$url"; else warn "Abrí manual: $url"; fi; } >/dev/null 2>&1 || warn "Abrí manual: $url"; }
pause() { printf '  %s%s%s ' "$DIM" "${1:-Enter para continuar}" "$RESET"; read -r _ || true; }
confirm() { local reply=""; printf '  %s? %s [y/N] ' "$YELLOW" "$1"; read -r reply || true; [[ "$reply" =~ ^[Yy] ]]; }
_existing() { [[ -f "$ENV_FILE" ]] || return 1; local line; line=$(grep -E "^${1}=" "$ENV_FILE" | tail -n1) || return 1; printf '%s' "${line#*=}"; }
ask() { local key="$1" prompt="$2" current input; current=$(_existing "$key" || true); if [[ -n "$current" ]]; then printf '  %s%s%s %s[Enter mantiene]%s ' "$BOLD" "$prompt" "$RESET" "$DIM" "$RESET"; else printf '  %s%s%s ' "$BOLD" "$prompt" "$RESET"; fi; read -r input || true; [[ -z "$input" && -n "$current" ]] && input="$current"; printf -v "$key" '%s' "$input"; }
ask_secret() { local key="$1" prompt="$2" current input; current=$(_existing "$key" || true); if [[ -n "$current" ]]; then printf '  %s%s%s %s[Enter mantiene]%s ' "$BOLD" "$prompt" "$RESET" "$DIM" "$RESET"; else printf '  %s%s%s ' "$BOLD" "$prompt" "$RESET"; fi; read -rs input || true; printf '\n'; [[ -z "$input" && -n "$current" ]] && input="$current"; printf -v "$key" '%s' "$input"; }
write_env() { local key="$1" value="$2" tmp; touch "$ENV_FILE"; tmp=$(mktemp); grep -vE "^${key}=" "$ENV_FILE" > "$tmp" || true; printf '%s=%s\n' "$key" "$value" >> "$tmp"; mv "$tmp" "$ENV_FILE"; WRITTEN_ENV+=("$key"); printf '  %s✓ wrote%s %s → %s\n' "$GREEN" "$RESET" "$key" "$ENV_FILE"; }
set_secret() { local name="$1" value="$2"; if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then if printf '%s' "$value" | gh secret set "$name" >/dev/null 2>&1; then WRITTEN_SECRET+=("$name"); printf '  %s✓ set%s GitHub secret %s\n' "$GREEN" "$RESET" "$name"; return; fi; fi; SKIPPED+=("GitHub secret $name"); warn "gh no listo — setea manual: gh secret set $name"; }
finish() { _clear; printf '\n%s%s  ✓ Preview setup completo%s\n' "$BOLD" "$GREEN" "$RESET"; (( ${#WRITTEN_ENV[@]} )) && note "wrote ${#WRITTEN_ENV[@]} a $ENV_FILE: ${WRITTEN_ENV[*]}"; (( ${#WRITTEN_SECRET[@]} )) && note "set ${#WRITTEN_SECRET[@]} secrets: ${WRITTEN_SECRET[*]}"; if (( ${#SKIPPED[@]} )); then printf '\n'; warn "pendiente manual:"; for s in "${SKIPPED[@]}"; do note "  - $s"; done; fi; printf '\n'; }

# ──────────────────────────────────────────────────────────────────────────
TOTAL_STAGES=5
banner "ModoOps · Cloudflare Pages Preview"

stage "1 · Verificar build local"
say "Build ya verde en 7b13280. Re-validar sin Formspree."
step "Ejecuta: npm --prefix web run build"
if confirm "¿Ejecutó build y generó dist/index.html?"; then
  say "OK — dist listo para Pages."
else
  warn "Corre npm run build antes de seguir."
  pause "Enter cuando dist esté listo"
fi

stage "2 · Crear repo remoto (si falta)"
say "Cloudflare Pages necesita GitHub/GitLab remoto. Hoy git remote está vacío."
open_url "https://github.com/new"
step "Crea repo 'ModoOps' privado → copia URL https."
step "En terminal: git remote add origin <URL> && git push -u origin master"
ask GH_REPO "Pega la URL del repo (ej: https://github.com/tuuser/ModoOps):"
if [[ -n "${GH_REPO:-}" ]]; then
  write_env GH_REPO "$GH_REPO"
  note "Si aún no pusheaste, hazlo ahora y vuelve."
  pause "Enter cuando git push esté hecho"
else
  note "Sin repo remoto, puedes usar wrangler pages publish dist/ directo (siguiente stage)."
fi

stage "3 · Cloudflare Pages — crear proyecto"
open_url "https://dash.cloudflare.com/?to=/:account/pages"
say "En dashboard Cloudflare → Pages → Create a project → Connect to Git"
step "Selecciona repo ModoOps → Framework preset: Astro"
step "Build command: npm --prefix web run build  (o: npm run build si root es web/)"
step "Build output directory: web/dist  (o dist si root es web)"
step "Env vars: sin PUBLIC_FORMSPREE (eliminado). Solo PUBLIC_SITE_URL si querés."
step "Deploy → espera build verde."
ask CF_PAGES_URL "Pega la URL preview asignada (ej: https://modoops-xxx.pages.dev):"
if [[ -n "${CF_PAGES_URL:-}" ]]; then
  write_env PUBLIC_SITE_URL "$CF_PAGES_URL"
  write_env CF_PAGES_URL "$CF_PAGES_URL"
fi
pause "Enter cuando el deploy preview esté verde"

stage "4 · Verificar preview"
say "Chequeos manuales:"
step "Abre la URL preview → Hero debe decir 'Tu operación, en modo.' (ModoOps)"
step "Verifica #descubrimiento muestra \$155 USD y tope 500 no es visible en landing"
step "Verifica /grafo carga (vis-network) pero no está en nav"
step "Verifica mailto consultoria.matasini@gmail.com + WhatsApp +54 9 354 753-2008"
if confirm "¿Preview se ve canónico (8 secciones, sin Formspree, favicon M)?"; then
  say "Perfecto."
else
  warn "Revisa build logs en Cloudflare → Pages → View build."
fi

stage "5 · Siguiente: dominio + control plane"
say "Preview sin dominio cumple Q5-b. Para dominio real:"
step "Cloudflare Pages → Custom domains → Add domain modoops.com"
step "Para Control Plane: Odoo 19 en VPS Hetzner + DB modoops_master (script tools/modoops_provision/provision_tenant.py)"
note "Fase 1 sin hot standby; RPO 24h via cron backup. Tenant demo: modoops_pintureria_centro"
ask NEXT_DOMAIN "Dominio futuro (ej: modoops.com) o Enter para dejar preview:"
if [[ -n "${NEXT_DOMAIN:-}" ]]; then
  write_env NEXT_DOMAIN "$NEXT_DOMAIN"
fi

finish
say "Resumen: preview = \$CF_PAGES_URL — próximo: conectar dominio + provisionar tenant en VPS."
