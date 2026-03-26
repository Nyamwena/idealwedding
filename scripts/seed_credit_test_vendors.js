const { PrismaClient } = require("../frontend/node_modules/@prisma/client");

const prisma = new PrismaClient();

const vendors = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    userId: "11111111-1111-1111-1111-111111111111",
    name: "QA Vendor Credit",
    email: "v1@example.com",
    credit: 2,
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    userId: "22222222-2222-2222-2222-222222222222",
    name: "QA Vendor NoCredit",
    email: "v2@example.com",
    credit: 0,
  },
];

async function upsertVendor(vendor) {
  await prisma.$executeRawUnsafe(
    `
    INSERT INTO vendors (
      id,
      user_id,
      business_name,
      business_description,
      category,
      location,
      contact_info,
      services,
      is_approved,
      is_visible,
      is_featured,
      rating,
      total_reviews,
      portfolio,
      credit_balance,
      created_at,
      updated_at
    ) VALUES (
      ?,
      ?,
      ?,
      'QA vendor',
      'photography',
      ?,
      ?,
      '[]',
      1,
      1,
      0,
      4.5,
      10,
      '[]',
      ?,
      NOW(),
      NOW()
    )
    ON DUPLICATE KEY UPDATE
      business_name = VALUES(business_name),
      is_approved = 1,
      is_visible = 1,
      credit_balance = VALUES(credit_balance),
      updated_at = NOW()
  `,
    vendor.id,
    vendor.userId,
    vendor.name,
    JSON.stringify({ city: "London", latitude: 51.5, longitude: -0.12 }),
    JSON.stringify({ phone: "+44 7000 000000", email: vendor.email }),
    vendor.credit,
  );
}

async function main() {
  for (const vendor of vendors) {
    await upsertVendor(vendor);
  }
  const seeded = await prisma.$queryRawUnsafe(
    "SELECT id, credit_balance FROM vendors WHERE id IN (?, ?) ORDER BY id",
    vendors[0].id,
    vendors[1].id,
  );
  console.log(JSON.stringify(seeded, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
