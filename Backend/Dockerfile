FROM python:3.10-slim

# Çalışma dizinini ayarla
WORKDIR /app

# Sistem bağımlılıklarını yükle (Playwright ve derleme araçları için)
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Bağımlılıkları kopyala ve yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Playwright tarayıcılarını ve bağımlılıklarını yükle
# Sadece Chromium yüklüyoruz, diğerlerine ihtiyacınız varsa ekleyebilirsiniz
RUN playwright install --with-deps chromium

# Uygulama kodlarını kopyala
COPY . .

# Portu dışa aç
EXPOSE 8000

# Uygulamayı başlat (gunicorn ile uvicorn workers kullanarak)
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]







