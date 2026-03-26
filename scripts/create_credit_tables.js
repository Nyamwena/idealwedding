const { PrismaClient } = require("../frontend/node_modules/@prisma/client");

const prisma = new PrismaClient();

const createVendorBalancesSql = `
CREATE TABLE IF NOT EXISTS vendor_credit_balances (
  id varchar(36) NOT NULL,
  vendor_id varchar(36) NOT NULL,
  balance decimal(10,2) NOT NULL DEFAULT 0,
  currency varchar(3) NOT NULL DEFAULT 'USD',
  total_purchased decimal(10,2) NOT NULL DEFAULT 0,
  total_used decimal(10,2) NOT NULL DEFAULT 0,
  total_refunded decimal(10,2) NOT NULL DEFAULT 0,
  created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY UQ_vendor_credit_balances_vendor_id (vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const createTransactionsSql = `
CREATE TABLE IF NOT EXISTS credit_transactions (
  id varchar(36) NOT NULL,
  vendor_id varchar(36) NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'USD',
  type enum('purchase','usage','refund','bonus','deduction') NOT NULL,
  status enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id varchar(255) NULL,
  stripe_refund_id varchar(255) NULL,
  description text NULL,
  metadata text NULL,
  created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY IDX_credit_transactions_vendor_status (vendor_id, status),
  KEY IDX_credit_transactions_type_status (type, status),
  KEY IDX_credit_transactions_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function main() {
  await prisma.$executeRawUnsafe(createVendorBalancesSql);
  await prisma.$executeRawUnsafe(createTransactionsSql);
  console.log("Credit tables created or already present.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
