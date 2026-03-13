const { PrismaClient } = require("../frontend/node_modules/@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const quoteId = process.argv[2];
  if (!quoteId) {
    console.error("Usage: node scripts/check_quote_exists.js <quoteId>");
    process.exit(1);
  }

  const rows = await prisma.$queryRawUnsafe(
    "SELECT id, user_id, vendor_id, service_category FROM quotes WHERE id = ?",
    quoteId,
  );
  console.log(JSON.stringify(rows[0] || null));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
