-- Lagaao database bootstrap
-- Runs automatically when Docker MySQL container starts

CREATE DATABASE IF NOT EXISTS `lagaao` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `lagaao_test` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON `lagaao`.* TO 'lagaao_user'@'%';
GRANT ALL PRIVILEGES ON `lagaao_test`.* TO 'lagaao_user'@'%';
FLUSH PRIVILEGES;
