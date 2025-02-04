import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import csurf from "csurf";
import cookieParser from "cookie-parser"; // ✅ REQUIRED for CSRF with cookies

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Use Helmet for security
app.use(helmet());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware to serve static files
app.use(express.static(path.join(__dirname, "public")));

// Body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Use Cookie Parser BEFORE CSRF Middleware
app.use(cookieParser());

// ✅ Session Middleware (MUST BE BEFORE CSRF)
// Ensure CSRF protection is applied after body parser and session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000, // 1 hour
    },
  })
);

// CSRF protection middleware (one version should be used)
const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

// Database connection (using sqlite3)
const dbPath =
  process.env.DB_PATH || path.join(__dirname, "database/database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Helper function to query the database (using promises for async/await)
function dbQuery(query, params) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Route to render login page with CSRF token
app.get("/login", (req, res) => {
  const messages = req.query.message ? { error: [req.query.message] } : {}; // Add error messages if any
  res.render("login", { csrfToken: req.csrfToken(), messages });
});

// Login route
app.post("/login", csrfProtection, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await dbQuery("SELECT * FROM users WHERE email = ?", [email]);
    if (!user.length) {
      return res.redirect("/login?message=No user found");
    }

    const match = await bcrypt.compare(password, user[0].password);
    if (match) {
      req.session.userId = user[0].id;
      req.session.email = user[0].email;
      return res.redirect("/members");
    } else {
      return res.redirect("/login?message=Incorrect password.");
    }
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).send("Error during login.");
  }
});

app.get("/", (req, res) => {
  res.redirect("/login"); // Redirect to login page
});

// Route to render register page with CSRF token
app.get("/register", (req, res) => {
  res.render("register", { csrfToken: req.csrfToken() });
});

// Handle registration POST request
app.post("/register", csrfProtection, async (req, res) => {
  const { firstName, lastName, email, password, permitType } = req.body;

  // Hash the password using bcrypt
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).send("Error hashing password.");

    // Insert the user into the database, including the permitType
    const insertQuery = `
      INSERT INTO users (firstName, lastName, email, password, permitType)
      VALUES (?, ?, ?, ?, ?);
    `;

    db.run(
      insertQuery,
      [firstName, lastName, email, hashedPassword, permitType],
      function (err) {
        if (err) {
          console.error("Error inserting into the database:", err.message);
          return res.status(500).send("Error registering user.");
        }
        return res.redirect("/login");
      }
    );
  });
});

// Ensure the user is authenticated before accessing the /members route
const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.redirect("/login?message=Please log in first");
};

app.get("/members", ensureAuthenticated, (req, res, next) => {
  getUserData(req, res).catch(next);
});

// Fetch user data for members page (without getRenewedCount)
async function getUserData(req, res) {
  try {
    const user = await dbQuery(
      "SELECT firstName, lastName, permitType FROM users WHERE email = ?",
      [req.session.email]
    );

    if (!user.length) {
      console.error("User not found.");
      return res.status(404).send("User not found.");
    }

    const userData = user[0];

    const prices = {
      "Local Senior": 2000,
      "Local Adult": 5000,
      "Visiting Adult": 10000,
      "Visiting Senior": 5000,
    };
    const renewalPrice = prices[userData.permitType] || 0;

    res.render("members", {
      firstName: userData.firstName,
      lastName: userData.lastName,
      permitType: userData.permitType,
      renewalPrice: (renewalPrice / 100).toFixed(2),
      displayPaymentOption: renewalPrice > 0,
    });
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).send("Error fetching user data.");
  }
}

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`)
);