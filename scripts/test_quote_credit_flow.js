const jwt = require("../backend/quote-service/node_modules/jsonwebtoken");
const { PrismaClient } = require("../frontend/node_modules/@prisma/client");

const prisma = new PrismaClient();

async function run() {
  const token = jwt.sign(
    { sub: "couple-user-01", email: "couple@example.com", role: "user" },
    "dev_jwt_secret_123",
    { expiresIn: "1h" },
  );

  const response = await fetch("http://localhost:3004/api/v1/quotes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      serviceCategory: "photography",
      requirements: { coverage: "full-day" },
      eventLocation: { city: "London", latitude: 51.5, longitude: -0.12 },
      vendorIds: [
        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      ],
    }),
  });

  const responseBody = await response.text();
  const credits = await prisma.$queryRawUnsafe(
    "SELECT id, credit_balance FROM vendors WHERE id IN (?, ?) ORDER BY id",
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  );

  console.log("quoteCreateStatus", response.status);
  console.log("quoteCreateBody", responseBody);
  console.log("credits", JSON.stringify(credits));
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
