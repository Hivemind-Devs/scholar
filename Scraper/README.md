# Scraper Worker

YÖK Akademik Portal'dan akademisyen profillerini ve bilgilerini çeken, RabbitMQ tabanlı bir web scraper worker sistemidir.

## 📋 İçindekiler

- [Genel Bakış](#genel-bakış)
- [Özellikler](#özellikler)
- [Mimari](#mimari)
- [Kurulum](#kurulum)
- [Yapılandırma](#yapılandırma)
- [Kullanım](#kullanım)
- [Proje Yapısı](#proje-yapısı)
- [Worker'lar](#workerlar)
- [Bağımlılıklar](#bağımlılıklar)

## 🎯 Genel Bakış

Scraper Worker, YÖK Akademik Portal'dan akademisyen bilgilerini toplayan dağıtık bir sistemdir. RabbitMQ mesaj kuyruğu üzerinden görevleri alır, web scraping işlemlerini gerçekleştirir ve sonuçları PostgreSQL veritabanına kaydeder.

### Ana İşlevler

- **Scholar Worker**: Bölüm sayfalarından akademisyen listelerini çeker
- **Profile Worker**: Akademisyen profil sayfalarından detaylı bilgileri çeker
- **Proxy Desteği**: Rotasyonlu proxy kullanımı ile rate limiting'i aşma
- **Otomatik Yeniden Bağlanma**: RabbitMQ bağlantılarında otomatik yeniden bağlanma
- **Detaylı Loglama**: Tüm işlemlerin günlüğünü tutma

## ✨ Özellikler

- ✅ RabbitMQ tabanlı mesaj kuyruğu entegrasyonu
- ✅ İki farklı worker tipi (Scholar ve Profile)
- ✅ Proxy rotasyonu desteği
- ✅ PostgreSQL veritabanı entegrasyonu
- ✅ Otomatik yeniden deneme mekanizması
- ✅ Günlük dönen log dosyaları
- ✅ Çevre tabanlı yapılandırma (development/production)
- ✅ Cookie ve session yönetimi
- ✅ Çok sayfalandırılmış listeler için otomatik sayfa geçişi

## 🏗️ Mimari

```
┌─────────────────┐
│   RabbitMQ      │
│   Mesaj Kuyruğu │
└────────┬────────┘
         │
         ├──► scholar_tasks ──► Scholar Worker ──► profile_tasks
         │                            │
         │                            ▼
         └──► profile_tasks ──► Profile Worker ──► PostgreSQL
                                                  Veritabanı
```

### İş Akışı

1. **Scholar Worker** bölüm URL'lerini alır
2. Bölüm sayfasından akademisyen listesini çıkarır
3. Her akademisyen için kayıt oluşturur veya günceller
4. Detaylı bilgi için **Profile Worker**'a görev gönderir
5. **Profile Worker** profil sayfasından tüm detayları çıkarır
6. Veritabanına akademisyen bilgilerini kaydeder

## 🚀 Kurulum

### Gereksinimler

- Node.js (v14 veya üzeri)
- PostgreSQL veritabanı
- RabbitMQ sunucusu

### Adımlar

1. **Repository'yi klonlayın:**
```bash
git clone <repository-url>
cd Scraper
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Yapılandırma dosyalarını oluşturun:**
```bash
# Development ortamı için
cp bin/config.development.json bin/config.development.json
# Production ortamı için
cp bin/config.production.json bin/config.production.json
```

4. **Yapılandırma dosyalarını düzenleyin:**
   - `bin/config.development.json` veya `bin/config.production.json` dosyalarında veritabanı ve RabbitMQ ayarlarını yapın

5. **Proxy listesini ekleyin (opsiyonel):**
   - `services/proxy.service/proxies.json` dosyasına proxy listesini ekleyin

## ⚙️ Yapılandırma

### Yapılandırma Dosyası Yapısı

```json
{
  "postgresConfig": {
    "master": {
      "user": "kullanici",
      "host": "localhost",
      "database": "hivemind",
      "password": "sifre",
      "port": 5432,
      "max": 1000,
      "idleTimeoutMillis": 300000,
      "ssl": {
        "rejectUnauthorized": false
      }
    }
  },
  "rabbitMQConnection": {
    "host": "localhost",
    "port": 5672,
    "username": "kullanici",
    "password": "sifre",
    "queuePrefix": "Hivemind@development"
  }
}
```

### Proxy Yapılandırması

`services/proxy.service/proxies.json` dosyası:

```json
[
  {
    "protocol": "http",
    "host": "proxy1.example.com",
    "port": 8080,
    "auth": {
      "username": "user",
      "password": "pass"
    }
  }
]
```

## 💻 Kullanım

### Development Ortamında Çalıştırma

```bash
npm run dev
```

veya

```bash
node index.js --env=development
```

### Production Ortamında Çalıştırma

```bash
npm start
```

veya

```bash
node index.js --env=production
```

### RabbitMQ'ya Mesaj Gönderme

#### Scholar Görevi (Bölüm Sayfası)

```javascript
{
  "url": "https://akademik.yok.gov.tr/AkademikArama/viewDepartment.jsp?kod=12345",
  "departmentUrl": "https://akademik.yok.gov.tr/AkademikArama/viewDepartment.jsp?kod=12345"
}
```

Kuyruk: `{queuePrefix}:scholar_tasks`

#### Profile Görevi (Profil Sayfası)

```javascript
{
  "url": "https://akademik.yok.gov.tr/AkademikArama/viewAuthor.jsp?authorId=12345",
  "profileUrl": "https://akademik.yok.gov.tr/AkademikArama/viewAuthor.jsp?authorId=12345"
}
```

Kuyruk: `{queuePrefix}:profile_tasks`

## 📁 Proje Yapısı

```
Scraper/
├── bin/                          # Yapılandırma dosyaları
│   ├── index.js                 # Yapılandırma yükleyici
│   ├── config.development.json  # Development yapılandırması
│   └── config.production.json   # Production yapılandırması
├── data-access/                 # Veritabanı erişim katmanı
│   ├── index.js                 # Repository factory
│   ├── querybuilder.js          # Query builder ve pool yönetimi
│   └── repositories.js          # Veritabanı repository'leri
├── scrapers/                    # Scraper modülleri
│   ├── profile.scraper.js       # Profil sayfası scraper'ı
│   └── scholar.scraper.js       # Bölüm sayfası scraper'ı
├── services/                    # Servis modülleri
│   ├── index.js                 # Servis factory
│   ├── logger.service/          # Winston logger servisi
│   │   └── index.js
│   ├── proxy.service/           # Proxy yönetim servisi
│   │   ├── index.js
│   │   └── proxies.json         # Proxy listesi
│   └── rabbit.service/          # RabbitMQ servisi
│       ├── index.js             # RabbitMQ client factory
│       └── consumer/            # Worker consumer'ları
│           ├── index.js
│           ├── profile.worker.js # Profil worker'ı
│           └── scholar.worker.js # Akademisyen worker'ı
├── logs/                        # Log dosyaları (otomatik oluşturulur)
├── index.js                     # Ana giriş noktası
└── package.json                 # Proje bağımlılıkları
```

## 👷 Worker'lar

### Scholar Worker

**Sorumlulukları:**
- Bölüm sayfalarından akademisyen listelerini çekmek
- Akademisyenlerin temel bilgilerini veritabanına kaydetmek
- Her akademisyen için Profile Worker'a detaylı scraping görevi göndermek

**Yapılandırma:**
- Kuyruk: `scholar_tasks`
- Prefetch: 5 (eşzamanlı işlem sayısı)

**Çıkardığı Veriler:**
- Akademisyen adı
- Ünvan
- YÖK ID
- Profil URL
- E-posta
- Araştırma alanları
- Üniversite/Bölüm bilgisi

### Profile Worker

**Sorumlulukları:**
- Akademisyen profil sayfalarından detaylı bilgileri çekmek
- Tüm alt sayfaları (yayınlar, dersler, tezler vb.) ziyaret etmek
- Veritabanına detaylı bilgileri kaydetmek

**Yapılandırma:**
- Kuyruk: `profile_tasks`
- Prefetch: 15 (eşzamanlı işlem sayısı)

**Çıkardığı Veriler:**
- Kişisel bilgiler (ad, ünvan, e-posta, ORCID)
- Akademik geçmiş
- Eğitim geçmişi
- Yayınlar (makaleler, bildiriler, kitaplar)
- Verilen dersler
- Yönetilen tezler
- İdari görevler

## 📦 Bağımlılıklar

### Ana Bağımlılıklar

- **amqplib** (^0.10.9): RabbitMQ client
- **axios** (^1.13.2): HTTP client
- **cheerio** (^1.1.2): HTML parsing
- **got** (^14.6.5): HTTP client (scraping için)
- **pg** (^8.16.3): PostgreSQL client
- **winston** (^3.19.0): Logging
- **winston-daily-rotate-file** (^5.0.0): Günlük log rotasyonu

### Proxy Desteği

- **hpagent** (^1.2.0): HTTP proxy agent
- **https-proxy-agent** (^7.0.6): HTTPS proxy agent

### Cookie Yönetimi

- **tough-cookie** (^6.0.0): Cookie jar yönetimi
- **axios-cookiejar-support** (^6.0.5): Axios cookie desteği

## 🔧 Geliştirme

### Yeni Scraper Ekleme

1. `scrapers/` klasörüne yeni scraper dosyası ekleyin
2. `services/rabbit.service/consumer/` klasörüne yeni worker ekleyin
3. `services/index.js` dosyasında worker'ı export edin
4. `index.js` dosyasında worker'ı başlatın

### Loglama

Loglar `logs/` klasörüne günlük olarak kaydedilir:
- Yapı: `logs/YYYY/MM/DD/application-YYYY-MM-DD.log`
- `current.log` symlink ile en güncel log dosyasına işaret eder
- Loglar 14 gün saklanır

### Hata Yönetimi

- Worker hataları loglanır ve mesajlar yeniden kuyruğa alınır (nack)
- Başarılı işlemler onaylanır (ack)
- Proxy hatası durumunda proxy serbest bırakılır

## 📝 Notlar

- Proxy kullanımı opsiyoneldir; proxy yoksa doğrudan bağlantı kullanılır
- SSL sertifika doğrulaması devre dışı bırakılmıştır (YÖK sitesi için)
- Cookie jar her scraping işlemi için yeniden oluşturulur
- Sayfa istekleri arasında gecikme eklenir (rate limiting)

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📄 Lisans

ISC License

