-- Ideal Weddings non-destructive schema-only migration
-- Purpose: preserve existing data and avoid inserting any seed rows.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `ideaxrbb_idealweddings`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `ideaxrbb_idealweddings`;

-- ------------------------------------------------------------------
-- Core Prisma tables (create if missing)
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `User` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) NOT NULL,
  `role` enum('USER','ADMIN','VENDOR') NOT NULL DEFAULT 'USER',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_name_key` (`name`),
  UNIQUE KEY `Category_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `News` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `content` longtext NOT NULL,
  `imageUrl` varchar(191) DEFAULT NULL,
  `published` tinyint(1) NOT NULL DEFAULT 1,
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `authorId` int NOT NULL,
  `categoryId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `News_slug_key` (`slug`),
  KEY `News_authorId_fkey` (`authorId`),
  KEY `News_categoryId_fkey` (`categoryId`),
  CONSTRAINT `News_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `News_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `DataFile` (
  `name` varchar(191) NOT NULL,
  `data` json NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------
-- Backend service tables (create if missing)
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `vendors` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `business_name` varchar(255) NOT NULL,
  `business_description` text DEFAULT NULL,
  `category` enum('venue','catering','photography','music','decor','transportation','planning','florist','other') NOT NULL,
  `location` text NOT NULL,
  `contact_info` text NOT NULL,
  `services` text NOT NULL,
  `price_range` text DEFAULT NULL,
  `is_approved` tinyint(1) NOT NULL DEFAULT 0,
  `is_visible` tinyint(1) NOT NULL DEFAULT 0,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `total_reviews` int NOT NULL DEFAULT 0,
  `portfolio` text NOT NULL,
  `business_info` text DEFAULT NULL,
  `availability` text DEFAULT NULL,
  `credit_balance` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_65b4134d1ddc73872e6abee2c1` (`user_id`),
  KEY `IDX_2ac317de41718a80c7895341ae` (`category`,`is_approved`),
  KEY `IDX_78dfcc6e11c00a9f056ddd04b1` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vendor_services` (
  `id` varchar(36) NOT NULL,
  `vendor_id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `duration_hours` int DEFAULT NULL,
  `min_guests` int DEFAULT NULL,
  `max_guests` int DEFAULT NULL,
  `includes` text NOT NULL,
  `add_ons` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_vendor_services_vendor_id` (`vendor_id`),
  CONSTRAINT `FK_vendor_services_vendor_id` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quotes` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `vendor_id` varchar(36) DEFAULT NULL,
  `wedding_id` varchar(36) DEFAULT NULL,
  `service_category` varchar(100) NOT NULL,
  `requirements` text NOT NULL,
  `budget_min` decimal(10,2) DEFAULT NULL,
  `budget_max` decimal(10,2) DEFAULT NULL,
  `event_date` datetime DEFAULT NULL,
  `event_location` text DEFAULT NULL,
  `status` enum('pending','sent','responded','accepted','rejected','completed','cancelled') NOT NULL DEFAULT 'pending',
  `vendor_response` text DEFAULT NULL,
  `response_date` datetime DEFAULT NULL,
  `total_responses` int NOT NULL DEFAULT 0,
  `is_urgent` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_quotes_user_status` (`user_id`,`status`),
  KEY `IDX_quotes_vendor_status` (`vendor_id`,`status`),
  KEY `IDX_quotes_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quote_responses` (
  `id` varchar(36) NOT NULL,
  `quote_id` varchar(36) NOT NULL,
  `vendor_id` varchar(36) NOT NULL,
  `message` text NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `valid_until` datetime DEFAULT NULL,
  `terms` text DEFAULT NULL,
  `attachments` text DEFAULT NULL,
  `status` enum('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `response_time_hours` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_quote_responses_quote_vendor` (`quote_id`,`vendor_id`),
  KEY `IDX_quote_responses_status_created` (`status`,`created_at`),
  CONSTRAINT `FK_quote_responses_quote` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `guests` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `rsvp_status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  `dietary_requirements` text DEFAULT NULL,
  `plus_one` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_guests_user_id` (`user_id`),
  KEY `IDX_guests_user_rsvp` (`user_id`,`rsvp_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vendor_credit_balances` (
  `id` varchar(36) NOT NULL,
  `vendor_id` varchar(36) NOT NULL,
  `balance` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `total_purchased` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_used` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_refunded` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_vendor_credit_balances_vendor_id` (`vendor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `credit_transactions` (
  `id` varchar(36) NOT NULL,
  `vendor_id` varchar(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `type` enum('purchase','usage','refund','bonus','deduction') NOT NULL,
  `status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL,
  `stripe_refund_id` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `metadata` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_credit_transactions_vendor_status` (`vendor_id`,`status`),
  KEY `IDX_credit_transactions_type_status` (`type`,`status`),
  KEY `IDX_credit_transactions_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------
-- Add missing columns on existing legacy tables (safe ALTERs)
-- ------------------------------------------------------------------

ALTER TABLE `DataFile`
  ADD COLUMN IF NOT EXISTS `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  ADD COLUMN IF NOT EXISTS `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3);

ALTER TABLE `vendors`
  ADD COLUMN IF NOT EXISTS `credit_balance` decimal(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS `services` text NOT NULL,
  ADD COLUMN IF NOT EXISTS `portfolio` text NOT NULL;

ALTER TABLE `quotes`
  ADD COLUMN IF NOT EXISTS `vendor_id` varchar(36) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `status` enum('pending','sent','responded','accepted','rejected','completed','cancelled') NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS `total_responses` int NOT NULL DEFAULT 0;
