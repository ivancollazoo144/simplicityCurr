# Despliegue en VPS

Reemplaza `TU_IP` y `TU_DOMINIO` en todos los comandos antes de correrlos.

---

## FASE 1 — Preparar en tu Mac (antes de tocar el VPS)

### 1.1 — Volcar la base de datos local

```bash
# Corre esto en tu terminal local desde ~/simplicityCurr
pg_dump -Fc postgresql://ivancollazo@localhost:5432/simplicitycurr > /tmp/simplicitycurr.dump
```

### 1.2 — Generar un SESSION_SECRET fuerte

```bash
openssl rand -hex 32
# Copia el resultado — lo usarás en el paso 3.3
```

### 1.3 — Subir el dump al VPS

```bash
scp /tmp/simplicitycurr.dump root@TU_IP:/tmp/simplicitycurr.dump
```

---

## FASE 2 — Configurar el VPS (corre todo como root en el servidor)

Conéctate primero:
```bash
ssh root@TU_IP
```

### 2.1 — Actualizar el sistema

```bash
apt update && apt upgrade -y
```

### 2.2 — Instalar Node.js 22 (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node --version   # debe mostrar v22.x
```

### 2.3 — Instalar PostgreSQL 16

```bash
apt install -y postgresql postgresql-contrib
systemctl enable --now postgresql
```

### 2.4 — Crear base de datos y usuario

```bash
sudo -u postgres psql <<'SQL'
CREATE USER simplicity WITH PASSWORD 'ELIGE_UNA_CLAVE_SEGURA';
CREATE DATABASE simplicitycurr OWNER simplicity;
\q
SQL
```

### 2.5 — Restaurar el dump

```bash
sudo -u postgres pg_restore -d simplicitycurr /tmp/simplicitycurr.dump
rm /tmp/simplicitycurr.dump
```

### 2.6 — Instalar Nginx y Certbot

```bash
apt install -y nginx certbot python3-certbot-nginx
systemctl enable --now nginx
```

### 2.7 — Instalar PM2

```bash
npm install -g pm2
```

---

## FASE 3 — Desplegar la aplicación

### 3.1 — Clonar el repositorio

```bash
cd /var/www
git clone https://github.com/ivancollazoo144/simplicityCurr.git
cd simplicityCurr
```

### 3.2 — Instalar dependencias

```bash
npm ci --omit=dev
```

### 3.3 — Crear el archivo .env

```bash
cat > .env <<'EOF'
DATABASE_URL="postgresql://simplicity:ELIGE_UNA_CLAVE_SEGURA@localhost:5432/simplicitycurr"
SESSION_SECRET="PEGA_AQUI_EL_RESULTADO_DE_OPENSSL"
ANTHROPIC_API_KEY="sk-ant-..."
NODE_ENV=production
# GENERATION_MODEL=claude-haiku-4-5-20251001
# AI_DAILY_LIMIT=50
EOF
```

> Edita el archivo con `nano .env` para poner los valores reales.

### 3.4 — Aplicar migraciones (no re-seed — el dump ya tiene los datos)

```bash
npx prisma migrate deploy
```

### 3.5 — Build de producción

```bash
npm run build
```

### 3.6 — Crear usuario admin inicial

```bash
# Uso: npx tsx scripts/create-admin.ts <email> <clave> [nombre]
npx tsx scripts/create-admin.ts ivan@tudominio.com MiClaveSegura123 "Ivan"
```

### 3.7 — Iniciar con PM2

```bash
pm2 start npm --name "simplicitycurr" -- start
pm2 startup   # copia y corre el comando que imprime
pm2 save
```

Verifica que esté corriendo:
```bash
pm2 status
pm2 logs simplicitycurr --lines 20
```

---

## FASE 4 — Nginx + SSL

### 4.1 — Configurar Nginx

```bash
nano /etc/nginx/sites-available/simplicitycurr
```

Pega esto (reemplaza `TU_DOMINIO`):

```nginx
server {
    listen 80;
    server_name TU_DOMINIO;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/simplicitycurr /etc/nginx/sites-enabled/
nginx -t      # debe decir "syntax is ok"
systemctl reload nginx
```

### 4.2 — SSL con Let's Encrypt

```bash
certbot --nginx -d TU_DOMINIO
# Sigue las instrucciones — escoge redirigir HTTP→HTTPS
```

Verifica que el auto-renew esté activo:
```bash
systemctl status certbot.timer
```

---

## FASE 5 — Apuntar el dominio al VPS

En el panel DNS de tu dominio añade un registro **A**:

| Nombre | Tipo | Valor |
|--------|------|-------|
| `@` o `curriculum` | A | `TU_IP` |

Los cambios DNS toman entre 5 y 30 minutos en propagarse.

---

## Comandos útiles post-despliegue

```bash
# Ver logs en tiempo real
pm2 logs simplicitycurr

# Reiniciar la app (después de cambios)
cd /var/www/simplicityCurr && git pull && npm ci --omit=dev && npm run build && pm2 restart simplicitycurr

# Estado general
pm2 status
systemctl status nginx postgresql

# Verificar endpoint de salud
curl https://TU_DOMINIO/api/health
```
