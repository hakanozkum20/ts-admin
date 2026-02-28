# TeamSpeak Admin Panel — Roadmap

## Proje Özeti
Next.js 14 tabanlı, JWT auth korumalı, TeamSpeak MariaDB'sine bağlanan tam CRUD destekli admin paneli.

---

## Stack
- **Next.js 14** (App Router)
- **NextAuth.js** (JWT auth)
- **Prisma** + **mysql2** (MariaDB bağlantısı)
- **Shadcn/ui** (UI bileşenleri)
- **TanStack Table** (tablo görünümü)
- **bcryptjs** (şifre hash)
- **Tailwind CSS**

---

## Faz 1 — Proje Kurulumu

### 1.1 Next.js projesi oluştur
```bash
npx create-next-app@latest ts-admin --typescript --tailwind --app --src-dir
cd ts-admin
```

### 1.2 Bağımlılıkları kur
```bash
npm install next-auth @auth/prisma-adapter
npm install prisma @prisma/client mysql2
npm install bcryptjs
npm install @tanstack/react-table
npm install -D @types/bcryptjs

npx shadcn@latest init
npx shadcn@latest add button input label card table sidebar sheet dialog form badge separator scroll-area
```

### 1.3 Prisma başlat
```bash
npx prisma init
```

---

## Faz 2 — Konfigürasyon Dosyaları

### 2.1 `.env.local`
```env
DATABASE_URL="mysql://teamspeak:SIFRE@localhost:3306/teamspeak"
NEXTAUTH_SECRET="guclu-random-secret-buraya"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="bcrypt-hash-buraya"
```

> Not: ADMIN_PASSWORD_HASH için küçük bir script yazılacak (bkz. Faz 2.2)

### 2.2 Hash üretme scripti — `scripts/hash-password.ts`
```typescript
import bcrypt from 'bcryptjs'
const hash = await bcrypt.hash('istedigin-sifre', 12)
console.log(hash)
```
```bash
npx ts-node scripts/hash-password.ts
```
Çıktıyı `.env.local` içindeki `ADMIN_PASSWORD_HASH` alanına yapıştır.

### 2.3 `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```
> Prisma migration kullanılmayacak — mevcut TeamSpeak DB'si okunacak (raw query).

---

## Faz 3 — Klasör Yapısı

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts          # NextAuth handler
│   │   ├── tables/
│   │   │   ├── route.ts              # GET /api/tables → tüm tablo isimleri
│   │   │   └── [name]/
│   │   │       ├── route.ts          # GET /api/tables/:name → tablo içeriği
│   │   │       └── [id]/
│   │   │           └── route.ts      # PUT/DELETE /api/tables/:name/:id
│   │   └── tokens/
│   │       └── route.ts              # POST /api/tokens → token ekle
│   ├── login/
│   │   └── page.tsx                  # Login sayfası
│   └── dashboard/
│       ├── layout.tsx                # Sidebar layout (auth guard)
│       ├── page.tsx                  # Dashboard ana sayfa
│       ├── tokens/
│       │   └── page.tsx              # Token ekleme sayfası (öncelikli)
│       └── tables/
│           └── [name]/
│               └── page.tsx          # Dinamik tablo sayfası
├── components/
│   ├── app-sidebar.tsx               # Sol sidebar — tablo listesi
│   ├── data-table.tsx                # TanStack Table wrapper
│   ├── data-table-toolbar.tsx        # Arama, filtre
│   ├── token-form.tsx                # Token ekleme formu
│   └── providers.tsx                 # SessionProvider wrapper
└── lib/
    ├── prisma.ts                     # Prisma client singleton
    ├── auth.ts                       # NextAuth config
    └── db.ts                         # Raw query helpers
```

---

## Faz 4 — Auth Sistemi

### 4.1 `src/lib/auth.ts`
- NextAuth credentials provider
- `.env.local` içindeki `ADMIN_USERNAME` ve `ADMIN_PASSWORD_HASH` ile doğrulama
- bcrypt.compare ile şifre kontrolü
- JWT stratejisi (session değil)

### 4.2 `src/app/api/auth/[...nextauth]/route.ts`
- Auth handler export

### 4.3 `src/app/login/page.tsx`
- Shadcn Card içinde login formu
- Username + Password alanları
- Hatalı girişte error mesajı
- Başarılı girişte `/dashboard` yönlendirme

### 4.4 `src/middleware.ts`
- `/dashboard` altındaki tüm rotaları koru
- Auth yoksa `/login` yönlendir

---

## Faz 5 — Database Katmanı

### 5.1 `src/lib/prisma.ts`
- Prisma client singleton (dev'de hot-reload için)

### 5.2 `src/lib/db.ts`
- `getAllTables()` — `SHOW TABLES` ile tüm tabloları listele
- `getTableData(tableName, page, limit)` — sayfalı veri çek
- `getTableColumns(tableName)` — kolon bilgileri
- `insertRow(tableName, data)` — yeni satır ekle
- `updateRow(tableName, id, data)` — satır güncelle
- `deleteRow(tableName, id)` — satır sil
- `insertToken(tokenKey)` — tokens tablosuna özel insert

### 5.3 Token Insert SQL
```sql
INSERT INTO tokens (server_id, token_key, token_type, token_id1, token_id2, token_created, token_description)
VALUES (1, ?, 0, 2, 0, UNIX_TIMESTAMP(), 'Manual admin token')
```

---

## Faz 6 — API Routes

### 6.1 `GET /api/tables`
- Auth kontrolü (getServerSession)
- `SHOW TABLES` çalıştır
- Tablo isimlerini array olarak döndür

### 6.2 `GET /api/tables/[name]?page=1&limit=50`
- Auth kontrolü
- SQL injection koruması (whitelist tablo isimleri)
- Sayfalı veri + toplam kayıt sayısı döndür
- Kolon bilgilerini de döndür

### 6.3 `POST /api/tables/[name]`
- Yeni satır ekle

### 6.4 `PUT /api/tables/[name]/[id]`
- Satır güncelle

### 6.5 `DELETE /api/tables/[name]/[id]`
- Satır sil

### 6.6 `POST /api/tokens`
- Body: `{ tokenKey: string }`
- Validasyon: boş olamaz, min 8 karakter
- `insertToken()` çağır
- Başarı/hata response döndür

---

## Faz 7 — UI Bileşenleri

### 7.1 `src/components/app-sidebar.tsx`
- Shadcn Sidebar kullan
- Üstte "TeamSpeak Admin" başlığı
- API'den tablo listesini çek
- Her tablo için sidebar item
- **"Token Ekle"** özel menü item'ı (en üstte, vurgulu)
- Aktif sayfayı highlight et

### 7.2 `src/components/data-table.tsx`
- TanStack Table
- Sıralama (her kolon başlığına tıkla)
- Arama/filtreleme
- Sayfalama (önceki/sonraki)
- Satır düzenleme (inline veya dialog)
- Satır silme (confirm dialog)

### 7.3 `src/components/token-form.tsx`
- Shadcn Card içinde
- "Token Key" input alanı
- "Token Ekle" butonu
- Loading state
- Başarı: yeşil success mesajı
- Hata: kırmızı error mesajı
- Eklenen token'ı listeleyen küçük tablo (son 10 token)

---

## Faz 8 — Sayfalar

### 8.1 `src/app/dashboard/layout.tsx`
- Auth guard (session yoksa redirect)
- Sidebar + main content layout
- Üstte header (kullanıcı adı + çıkış butonu)

### 8.2 `src/app/dashboard/page.tsx`
- Hızlı istatistikler: toplam tablo sayısı, token sayısı, kullanıcı sayısı
- Son eklenen tokenlar

### 8.3 `src/app/dashboard/tokens/page.tsx` ⭐ (Öncelikli)
- `token-form.tsx` bileşeni
- Mevcut tokenların listesi

### 8.4 `src/app/dashboard/tables/[name]/page.tsx`
- URL'den tablo adını al
- `data-table.tsx` bileşenine ver
- Üstte "Yeni Kayıt Ekle" butonu (dialog açar)

---

## Faz 9 — Güvenlik

- [ ] Tüm API route'larında `getServerSession` kontrolü
- [ ] SQL injection: tablo adları whitelist ile doğrula
- [ ] Parameterized queries (Prisma raw veya prepared statements)
- [ ] NEXTAUTH_SECRET güçlü random string olmalı
- [ ] Production'da HTTPS zorunlu
- [ ] Rate limiting (opsiyonel — next-rate-limit)

---

## Faz 10 — Docker & Deployment

### 10.1 `Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 10.2 `docker-compose.yml` servis eklemesi
```yaml
  ts-admin:
    build: ./ts-admin
    container_name: ts-admin
    restart: unless-stopped
    environment:
      - DATABASE_URL=${TS_ADMIN_DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - ADMIN_USERNAME=${ADMIN_USERNAME}
      - ADMIN_PASSWORD_HASH=${ADMIN_PASSWORD_HASH}
    depends_on:
      - mariadb
```

### 10.3 Dokploy'da deployment
1. GitHub repo oluştur, kodu push et
2. Dokploy → New Service → **Application**
3. GitHub repo bağla
4. Environment variables gir
5. Domain ekle: `tsadmin.estatech.dev`
6. Deploy et

---

## Öncelik Sırası (Claude Code için)

```
1. Proje kurulumu (Faz 1)
2. .env ve Prisma config (Faz 2)
3. Auth sistemi — login sayfası + middleware (Faz 4)
4. db.ts — insertToken fonksiyonu (Faz 5)
5. POST /api/tokens route (Faz 6.6)
6. Token sayfası UI (Faz 7.3 + 8.3)  ← İLK ÇALIŞAN ÖZELLİK
7. Sidebar + layout (Faz 7.1 + 8.1)
8. Tablo listesi API (Faz 6.1 + 6.2)
9. DataTable bileşeni (Faz 7.2)
10. Dinamik tablo sayfası (Faz 8.4)
11. CRUD işlemleri (Faz 6.3 + 6.4 + 6.5)
12. Docker & deployment (Faz 10)
```

---

## Claude Code için Başlangıç Promptu

```
Bu ROADMAP.md dosyasını takip ederek bir Next.js 14 TeamSpeak admin paneli geliştireceğiz.

Öncelik sırasına göre başla:
1. Önce Faz 1 ve Faz 2'yi tamamla (proje kurulumu ve config)
2. Sonra Faz 4'ü yap (auth sistemi)
3. Ardından Faz 5 db.ts içindeki insertToken fonksiyonunu yaz
4. POST /api/tokens route'unu oluştur
5. Token ekleme sayfasını (dashboard/tokens/page.tsx) tamamla

Stack: Next.js 14, NextAuth.js JWT, Prisma + mysql2, Shadcn/ui, TanStack Table, bcryptjs, Tailwind CSS
```
