-- Dijital Oyun Magazasi - MySQL 8.0.16+
-- Yalnizca sema: trigger, procedure, uygulama kodu ve ornek veri icermez.
-- Para tutarlari TRY cinsindedir. Sifreler password_hash olarak saklanir.
-- Siparis toplami order_items.unit_price toplami uzerinden hesaplanir.
-- Satis/sahiplik kontrolu, odeme ve kutuphaneye ekleme akisi daha sonra
-- uygulamada transaction ile gerceklestirilmelidir. Loglar otomatik yazilmaz.

CREATE DATABASE IF NOT EXISTS digital_game_store
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE digital_game_store;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE games (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  developer VARCHAR(200) NOT NULL,
  publisher VARCHAR(200) NOT NULL,
  release_date DATE,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_games_price CHECK (price >= 0),
  CONSTRAINT chk_games_is_active CHECK (is_active IN (0, 1)),
  KEY idx_games_name (name)
) ENGINE=InnoDB;

CREATE TABLE genres (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_genres_name (name)
) ENGINE=InnoDB;

CREATE TABLE game_genres (
  game_id BIGINT UNSIGNED NOT NULL,
  genre_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (game_id, genre_id),
  CONSTRAINT fk_game_genres_game FOREIGN KEY (game_id) REFERENCES games (id),
  CONSTRAINT fk_game_genres_genre FOREIGN KEY (genre_id) REFERENCES genres (id)
) ENGINE=InnoDB;

CREATE TABLE game_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  game_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(2048) NOT NULL,
  image_type ENUM('cover', 'screenshot') NOT NULL DEFAULT 'screenshot',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_game_images_game FOREIGN KEY (game_id) REFERENCES games (id)
) ENGINE=InnoDB;

-- Her kullanicinin tek sepeti vardir; bos sepet icin ayri kayit gerekmez.
CREATE TABLE cart_items (
  user_id BIGINT UNSIGNED NOT NULL,
  game_id BIGINT UNSIGNED NOT NULL,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, game_id),
  CONSTRAINT fk_cart_items_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_cart_items_game FOREIGN KEY (game_id) REFERENCES games (id)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  checkout_key VARCHAR(100) NOT NULL COMMENT 'Ayni satin alma isteginin tekrarinda ayni anahtar kullanilir',
  status ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  UNIQUE KEY uq_orders_checkout_key (checkout_key),
  UNIQUE KEY uq_orders_id_user (id, user_id),
  KEY idx_orders_user_created (user_id, created_at),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT chk_orders_completion CHECK (
    (status = 'completed' AND completed_at IS NOT NULL)
    OR (status <> 'completed' AND completed_at IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE order_items (
  order_id BIGINT UNSIGNED NOT NULL,
  game_id BIGINT UNSIGNED NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL COMMENT 'Satin alma anindaki fiyat',
  PRIMARY KEY (order_id, game_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT fk_order_items_game FOREIGN KEY (game_id) REFERENCES games (id),
  CONSTRAINT chk_order_items_price CHECK (unit_price >= 0)
) ENGINE=InnoDB;

-- Her odeme denemesi ayri kayittir; kart bilgileri tutulmaz.
CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(100) NOT NULL,
  provider_payment_id VARCHAR(191) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'succeeded', 'failed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  UNIQUE KEY uq_payments_provider_reference (provider, provider_payment_id),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT chk_payments_amount CHECK (amount >= 0)
) ENGINE=InnoDB;

-- Kutuphane ve envanter ayni sahiplik kayitlarini kullanir.
-- Bilesik FK'ler oyunun ilgili kullanicinin siparisinde olmasini saglar.
CREATE TABLE user_games (
  user_id BIGINT UNSIGNED NOT NULL,
  game_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  acquired_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, game_id),
  CONSTRAINT fk_user_games_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_user_games_game FOREIGN KEY (game_id) REFERENCES games (id),
  CONSTRAINT fk_user_games_order_owner FOREIGN KEY (order_id, user_id) REFERENCES orders (id, user_id),
  CONSTRAINT fk_user_games_order_item FOREIGN KEY (order_id, game_id) REFERENCES order_items (order_id, game_id)
) ENGINE=InnoDB;

CREATE TABLE achievements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  game_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  completion_condition TEXT NOT NULL,
  UNIQUE KEY uq_achievements_game_name (game_id, name),
  UNIQUE KEY uq_achievements_id_game (id, game_id),
  CONSTRAINT fk_achievements_game FOREIGN KEY (game_id) REFERENCES games (id)
) ENGINE=InnoDB;

-- Yalnizca kazanilan basarimlar kaydedilir. Eksik kayit = henuz kazanilmamis.
CREATE TABLE user_achievements (
  user_id BIGINT UNSIGNED NOT NULL,
  achievement_id BIGINT UNSIGNED NOT NULL,
  game_id BIGINT UNSIGNED NOT NULL,
  unlocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, achievement_id),
  CONSTRAINT fk_user_achievements_ownership FOREIGN KEY (user_id, game_id) REFERENCES user_games (user_id, game_id),
  CONSTRAINT fk_user_achievements_definition FOREIGN KEY (achievement_id, game_id) REFERENCES achievements (id, game_id)
) ENGINE=InnoDB;

-- Oyun degisiklikleri ve siparis durum gecisleri icin islem gecmisi.
-- actor_user_id NULL ise islem sistem tarafindan yapilmistir.
CREATE TABLE activity_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_user_id BIGINT UNSIGNED,
  game_id BIGINT UNSIGNED,
  order_id BIGINT UNSIGNED,
  action VARCHAR(100) NOT NULL,
  old_values JSON,
  new_values JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_logs_actor FOREIGN KEY (actor_user_id) REFERENCES users (id),
  CONSTRAINT fk_activity_logs_game FOREIGN KEY (game_id) REFERENCES games (id),
  CONSTRAINT fk_activity_logs_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT chk_activity_logs_target CHECK (game_id IS NOT NULL OR order_id IS NOT NULL)
) ENGINE=InnoDB;
