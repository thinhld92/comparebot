CREATE DATABASE comparebot CHARACTER SET utf8mb4 COLLATE UTF8MB4_UNICODE_CI;

USE comparebot;

CREATE TABLE standard_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(128) NULL,
    server_name VARCHAR(128) NULL,
    server_code VARCHAR(64) NOT NULL,
    account INT NOT NULL,
    symbol VARCHAR(16) NOT NULL,
    ask DOUBLE NOT NULL,
    bid DOUBLE NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    
    INDEX idx_server_code (server_code),
    INDEX idx_account (account)
);