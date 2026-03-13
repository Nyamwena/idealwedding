const { PrismaClient } = require("../frontend/node_modules/@prisma/client");

const prisma = new PrismaClient();

const createQuotesSql = `
CREATE TABLE IF NOT EXISTS quotes (
  id varchar(36) NOT NULL,
  user_id varchar(36) NOT NULL,
  vendor_id varchar(36) NULL,
  wedding_id varchar(36) NULL,
  service_category varchar(100) NOT NULL,
  requirements text NOT NULL,
  budget_min decimal(10,2) NULL,
  budget_max decimal(10,2) NULL,
  event_date datetime NULL,
  event_location text NULL,
  status enum('pending','sent','responded','accepted','rejected','completed','cancelled') NOT NULL DEFAULT 'pending',
  vendor_response text NULL,
  response_date datetime NULL,
  total_responses int NOT NULL DEFAULT 0,
  is_urgent tinyint(1) NOT NULL DEFAULT 0,
  notes text NULL,
  created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY IDX_quotes_user_status (user_id,status),
  KEY IDX_quotes_vendor_status (vendor_id,status),
  KEY IDX_quotes_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const createQuoteResponsesSql = `
CREATE TABLE IF NOT EXISTS quote_responses (
  id varchar(36) NOT NULL,
  quote_id varchar(36) NOT NULL,
  vendor_id varchar(36) NOT NULL,
  message text NOT NULL,
  price decimal(10,2) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'USD',
  valid_until datetime NULL,
  terms text NULL,
  attachments text NULL,
  status enum('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
  is_featured tinyint(1) NOT NULL DEFAULT 0,
  response_time_hours int NULL,
  created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY IDX_quote_responses_quote_vendor (quote_id,vendor_id),
  KEY IDX_quote_responses_status_created (status,created_at),
  CONSTRAINT FK_quote_responses_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function main() {
  await prisma.$executeRawUnsafe(createQuotesSql);
  await prisma.$executeRawUnsafe(createQuoteResponsesSql);
  console.log("Quote tables created or already present.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
