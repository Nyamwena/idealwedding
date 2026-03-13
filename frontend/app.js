process.env.NODE_ENV = "production";

// Let cPanel assign the port
const port = process.env.PORT || 3000;

require("next/dist/bin/next");