const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

const adminRoutes = require("./routes/admin-routes");
const userRoutes = require("./routes/user-routes");

const app = express();

// CORS config
const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/user", userRoutes);

db().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
});
