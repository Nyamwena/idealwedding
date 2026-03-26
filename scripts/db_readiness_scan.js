const { PrismaClient } = require("../frontend/node_modules/@prisma/client");

const prisma = new PrismaClient();
const DB_NAME = "ideaxrbb_idealweddings";

const REQUIRED_TABLES = [
  "user",
  "category",
  "news",
  "datafile",
  "vendors",
  "vendor_services",
  "quotes",
  "quote_responses",
  "guests",
  "credit_transactions",
  "vendor_credit_balances",
];

async function tableExists(tableName) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT TABLE_NAME
     FROM information_schema.tables
     WHERE table_schema = ? AND table_name = ?`,
    DB_NAME,
    tableName,
  );
  return rows.length > 0;
}

async function getMissingTables() {
  const missing = [];
  for (const table of REQUIRED_TABLES) {
    if (!(await tableExists(table))) {
      missing.push(table);
    }
  }
  return missing;
}

async function getTableCounts() {
  const counts = {};
  for (const table of REQUIRED_TABLES) {
    if (await tableExists(table)) {
      const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS c FROM \`${table}\``);
      counts[table] = Number(rows[0].c);
    }
  }
  return counts;
}

async function getForeignKeys() {
  return prisma.$queryRawUnsafe(
    `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ?
       AND REFERENCED_TABLE_NAME IS NOT NULL
     ORDER BY TABLE_NAME, COLUMN_NAME`,
    DB_NAME,
  );
}

async function getIndexes(tableName) {
  return prisma.$queryRawUnsafe(
    `SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME, SEQ_IN_INDEX
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
     ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
    DB_NAME,
    tableName,
  );
}

async function main() {
  const missingTables = await getMissingTables();
  const counts = await getTableCounts();
  const foreignKeys = await getForeignKeys();

  const coreIndexes = {
    quotes: await getIndexes("quotes"),
    quote_responses: await getIndexes("quote_responses"),
    vendors: await getIndexes("vendors"),
    guests: await getIndexes("guests"),
    credit_transactions: await getIndexes("credit_transactions"),
    vendor_credit_balances: await getIndexes("vendor_credit_balances"),
  };

  const result = {
    database: DB_NAME,
    requiredTables: REQUIRED_TABLES,
    missingTables,
    rowCounts: counts,
    foreignKeys,
    coreIndexes,
    ready: missingTables.length === 0,
  };

  console.log(
    JSON.stringify(
      result,
      (_, value) => (typeof value === "bigint" ? Number(value) : value),
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
