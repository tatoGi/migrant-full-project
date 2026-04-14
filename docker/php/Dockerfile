# ─────────────────────────────────────────────────────────────
# Development Dockerfile
# Node არ არის — npm run dev host-ზე გარბის
# ─────────────────────────────────────────────────────────────
ARG PHP_VERSION=8.2
FROM php:${PHP_VERSION}-fpm

# System dependencies
# libpq-dev   → PostgreSQL-ისთვის (pdo_pgsql)
# დანარჩენი   → MySQL + სხვა Laravel extensions
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpq-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_mysql \
        pdo_pgsql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

RUN chown -R www-data:www-data /var/www/html
