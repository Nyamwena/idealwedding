const { PrismaClient } = require("../frontend/node_modules/@prisma/client");

const prisma = new PrismaClient();

const createGuestsSql = `
CREATE TABLE IF NOT EXISTS guests (
  id varchar(36) NOT NULL,
  user_id varchar(64) NOT NULL,
  full_name varchar(255) NOT NULL,
  email varchar(255) NULL,
  phone varchar(50) NULL,
  rsvp_status enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  dietary_requirements text NULL,
  plus_one tinyint(1) NOT NULL DEFAULT 0,
  notes text NULL,
  created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY IDX_guests_user_id (user_id),
  KEY IDX_guests_user_rsvp (user_id, rsvp_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function main() {
  await prisma.$executeRawUnsafe(createGuestsSql);
  console.log("Guests table created or already present.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
