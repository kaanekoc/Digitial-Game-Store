USE digital_game_store;
DELIMITER $$

DROP TRIGGER IF EXISTS trg_cart_validate$$
CREATE TRIGGER trg_cart_validate BEFORE INSERT ON cart_items FOR EACH ROW
BEGIN
  IF NOT EXISTS (SELECT 1 FROM games WHERE id = NEW.game_id AND is_active = 1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Oyun satista degil.';
  END IF;
  IF EXISTS (SELECT 1 FROM user_games WHERE user_id = NEW.user_id AND game_id = NEW.game_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bu oyuna zaten sahipsiniz.';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_game_audit$$
CREATE TRIGGER trg_game_audit AFTER UPDATE ON games FOR EACH ROW
BEGIN
  INSERT INTO activity_logs (actor_user_id, game_id, action, old_values, new_values)
  VALUES (@actor_user_id, NEW.id, 'game.updated',
    JSON_OBJECT('name', OLD.name, 'description', OLD.description, 'developer', OLD.developer,
      'publisher', OLD.publisher, 'release_date', OLD.release_date, 'price', OLD.price, 'is_active', OLD.is_active),
    JSON_OBJECT('name', NEW.name, 'description', NEW.description, 'developer', NEW.developer,
      'publisher', NEW.publisher, 'release_date', NEW.release_date, 'price', NEW.price, 'is_active', NEW.is_active));
END$$

DROP TRIGGER IF EXISTS trg_order_audit$$
CREATE TRIGGER trg_order_audit AFTER UPDATE ON orders FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO activity_logs (actor_user_id, order_id, action, old_values, new_values)
    VALUES (@actor_user_id, NEW.id, 'order.status_changed',
      JSON_OBJECT('status', OLD.status), JSON_OBJECT('status', NEW.status));
  END IF;
END$$

-- Kullanici satiri tum sepet/siparis mutasyonlari icin ortak kilittir.
DROP PROCEDURE IF EXISTS sp_checkout$$
CREATE PROCEDURE sp_checkout(IN p_user BIGINT UNSIGNED, IN p_key VARCHAR(100), IN p_expected DECIMAL(10,2))
main: BEGIN
  DECLARE v_lock BIGINT;
  DECLARE v_order BIGINT DEFAULT NULL;
  DECLARE v_owner BIGINT;
  DECLARE v_count INT;
  DECLARE v_total DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  START TRANSACTION;
  SELECT id INTO v_lock FROM users WHERE id = p_user FOR UPDATE;
  IF v_lock IS NULL OR p_key IS NULL OR CHAR_LENGTH(p_key) < 10 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Gecersiz satin alma istegi.';
  END IF;
  SELECT MAX(id), MAX(user_id) INTO v_order, v_owner FROM orders WHERE checkout_key = p_key;
  IF v_order IS NOT NULL THEN
    IF v_owner <> p_user THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Siparise erisim yok.'; END IF;
    COMMIT;
    SELECT v_order AS order_id;
    LEAVE main;
  END IF;
  SELECT COUNT(*), COALESCE(SUM(g.price), 0) INTO v_count, v_total
    FROM cart_items c JOIN games g ON g.id = c.game_id WHERE c.user_id = p_user FOR UPDATE;
  IF v_count = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sepetiniz bos.'; END IF;
  IF EXISTS (SELECT 1 FROM cart_items c JOIN games g ON g.id = c.game_id
    LEFT JOIN user_games ug ON ug.user_id = c.user_id AND ug.game_id = c.game_id
    WHERE c.user_id = p_user AND (g.is_active = 0 OR ug.game_id IS NOT NULL)) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sepette satista olmayan veya sahip olunan oyun var.';
  END IF;
  IF p_expected IS NULL OR p_expected <> v_total THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fiyat degisti. Sepeti yenileyip tekrar onaylayin.';
  END IF;
  INSERT INTO orders (user_id, checkout_key) VALUES (p_user, p_key);
  SET v_order = LAST_INSERT_ID();
  INSERT INTO order_items (order_id, game_id, unit_price)
    SELECT v_order, g.id, g.price FROM cart_items c JOIN games g ON g.id = c.game_id WHERE c.user_id = p_user;
  COMMIT;
  SELECT v_order AS order_id;
END$$

DROP PROCEDURE IF EXISTS sp_complete_payment$$
CREATE PROCEDURE sp_complete_payment(IN p_user BIGINT UNSIGNED, IN p_order BIGINT UNSIGNED,
  IN p_reference VARCHAR(191), IN p_method VARCHAR(50), IN p_success BOOLEAN)
main: BEGIN
  DECLARE v_lock BIGINT;
  DECLARE v_status VARCHAR(20) DEFAULT NULL;
  DECLARE v_total DECIMAL(10,2);
  DECLARE v_current DECIMAL(10,2);
  DECLARE v_count INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  START TRANSACTION;
  SELECT id INTO v_lock FROM users WHERE id = p_user FOR UPDATE;
  SELECT status INTO v_status FROM orders WHERE id = p_order AND user_id = p_user FOR UPDATE;
  IF v_status IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Siparis bulunamadi.'; END IF;
  IF p_reference IS NULL OR CHAR_LENGTH(p_reference) < 3 OR p_success IS NULL
    OR p_method IS NULL OR p_method NOT IN ('demo_card', 'demo_wallet') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Gecersiz odeme bilgisi.';
  END IF;
  IF v_status <> 'pending' THEN
    IF EXISTS (SELECT 1 FROM payments WHERE order_id = p_order AND provider = 'demo'
      AND provider_payment_id = p_reference AND payment_method = p_method
      AND status = IF(p_success, 'succeeded', 'failed')) THEN
      COMMIT;
      SELECT v_status AS status;
      LEAVE main;
    END IF;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Siparis zaten sonuclandi.';
  END IF;
  SELECT COUNT(*), SUM(oi.unit_price), SUM(g.price) INTO v_count, v_total, v_current
    FROM order_items oi JOIN games g ON g.id = oi.game_id WHERE oi.order_id = p_order FOR UPDATE;
  IF v_count = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Siparis bos.'; END IF;
  IF p_success THEN
    IF v_total <> v_current THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fiyat degisti. Yeni bir siparis olusturun.'; END IF;
    IF EXISTS (SELECT 1 FROM order_items oi JOIN games g ON g.id = oi.game_id
      LEFT JOIN user_games ug ON ug.user_id = p_user AND ug.game_id = oi.game_id
      WHERE oi.order_id = p_order AND (g.is_active = 0 OR ug.game_id IS NOT NULL)) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Oyun satista degil veya zaten kutuphanede.';
    END IF;
  END IF;
  INSERT INTO payments (order_id, provider, provider_payment_id, payment_method, amount, status, processed_at)
    VALUES (p_order, 'demo', p_reference, p_method, v_total, IF(p_success, 'succeeded', 'failed'), CURRENT_TIMESTAMP);
  UPDATE orders SET status = IF(p_success, 'completed', 'failed'),
    completed_at = IF(p_success, CURRENT_TIMESTAMP, NULL) WHERE id = p_order;
  IF p_success THEN
    INSERT INTO user_games (user_id, game_id, order_id)
      SELECT p_user, game_id, p_order FROM order_items WHERE order_id = p_order;
    DELETE c FROM cart_items c JOIN order_items oi ON oi.game_id = c.game_id
      WHERE c.user_id = p_user AND oi.order_id = p_order;
  END IF;
  COMMIT;
  SELECT IF(p_success, 'completed', 'failed') AS status;
END$$

-- Bu procedure yalnizca dogrulanmis oyun sunucusu veya yonetici demo araci tarafindan cagrilir.
DROP PROCEDURE IF EXISTS sp_unlock_achievement$$
CREATE PROCEDURE sp_unlock_achievement(IN p_user BIGINT UNSIGNED, IN p_achievement BIGINT UNSIGNED)
BEGIN
  DECLARE v_game BIGINT DEFAULT NULL;
  DECLARE v_lock BIGINT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  START TRANSACTION;
  SELECT id INTO v_lock FROM users WHERE id = p_user FOR UPDATE;
  SELECT game_id INTO v_game FROM achievements WHERE id = p_achievement;
  IF v_game IS NULL OR NOT EXISTS (SELECT 1 FROM user_games WHERE user_id = p_user AND game_id = v_game) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Basarim bulunamadi veya oyun kullaniciya ait degil.';
  END IF;
  INSERT INTO user_achievements (user_id, achievement_id, game_id)
    VALUES (p_user, p_achievement, v_game)
    ON DUPLICATE KEY UPDATE achievement_id = p_achievement;
  COMMIT;
END$$

DELIMITER ;
