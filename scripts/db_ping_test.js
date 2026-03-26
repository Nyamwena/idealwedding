const { PrismaClient } = require("../frontend/node_modules/@prisma/client");

const prisma = new PrismaClient();

async function main() {
  let ok = 0;
  for (let i = 0; i < 20; i += 1) {
    await prisma.$queryRawUnsafe("SELECT 1 AS ok");
    ok += 1;
  }
  console.log(`db_ping ${ok}/20`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
