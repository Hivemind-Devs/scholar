# Hivemind API Backend

Bu proje, Hivemind platformunun backend API servisidir. FastAPI framework'ü kullanılarak geliştirilmiş, asenkron bir mimariye sahiptir.

## 📋 Gereksinimler

- **Python**: 3.9 veya daha yeni bir sürüm
- **PostgreSQL**: Veritabanı olarak kullanılır
- **pip**: Paket yöneticisi

## 🚀 Kurulum

### 1. Projeyi İndirin

```bash
git clone <repository-url>
cd Backend
```

### 2. Sanal Ortam (Virtual Environment) Oluşturun

Projeyi izole bir ortamda çalıştırmak için sanal ortam oluşturun:

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

### 3. Bağımlılıkları Yükleyin

Gerekli Python kütüphanelerini yükleyin:

```bash
pip install -r requirements.txt
```

Scraper servisi için gerekli Playwright tarayıcılarını yükleyin:

```bash
playwright install
```

## ⚙️ Konfigürasyon

Proje ayarları `config/` klasörü altındaki JSON dosyalarından yönetilir. Ortama göre uygun dosya seçilir:

- `config.development.json`: Local geliştirme ortamı
- `config.production.json`: Canlı ortam
- `config.stage.json`: Test ortamı

### Veritabanı Ayarları

Kullanacağınız `config.{env}.json` dosyasındaki `database_url` alanını kendi PostgreSQL bağlantı bilginizle güncelleyin.

Örnek:
```json
"database_url": "postgresql+asyncpg://kullanici:sifre@localhost:5432/veritabani_adi"
```

### Ortam Değişkeni (Opsiyonel)

Uygulama varsayılan olarak `development` modunda çalışır. Farklı bir ortamda çalıştırmak için `APP_ENV` değişkenini set edebilirsiniz:

```bash
export APP_ENV=production
```

## 🗄️ Veritabanı Hazırlığı

PostgreSQL veritabanınızda UUID desteğinin açık olduğundan emin olun. Veritabanına bağlanıp şu SQL komutunu çalıştırın:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

*Not: Uygulama ilk kez çalıştırıldığında gerekli tablolar (User, Scholar, University vb.) otomatik olarak oluşturulacaktır.*

## ▶️ Çalıştırma

Uygulamayı geliştirme modunda (kod değişikliklerinde otomatik yenileme ile) başlatmak için:

```bash
uvicorn app.main:app --reload
```

Uygulama varsayılan olarak `http://127.0.0.1:8000` adresinde çalışacaktır.

## 📚 Dökümantasyon

API endpoint'lerini test etmek ve dökümantasyonu incelemek için tarayıcınızda şu adrese gidin:

- **Scalar API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **OpenAPI Schema**: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

The API documentation uses Scalar UI, which provides a modern and interactive interface for exploring endpoints, testing requests, and viewing detailed API schemas.

## 🕸️ Scraper Kullanımı

Scraper servislerini tetiklemek için API endpoint'lerini kullanabilirsiniz (Admin yetkisi gerektirebilir):

- **Üniversiteleri Çek**: `POST /scraper/universities/all`
- **Departmanları Çek**: `POST /scraper/departments/all`
- **Akademisyenleri Çek**: `POST /scraper/scholar/all`

Bu işlemler uzun sürebilir ve arka planda çalışır.

