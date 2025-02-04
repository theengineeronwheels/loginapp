const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../../models/User");

const router = express.Router();

// Show register form
router.get("/register", (req, res) => {
  res.render("register", { messages: req.flash("error") });
});

// Register user
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    req.flash("error", "All fields are required.");
    return res.redirect("/register");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await User.create({ username, email, password: hashedPassword });
    res.redirect("/login");
  } catch (error) {
    req.flash("error", "User already exists.");
    res.redirect("/register");
  }
});

// Show login form
router.get("/login", (req, res) => {
  res.render("login", { messages: req.flash("error") });
});

// Login user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    req.flash("error", "Invalid credentials.");
    return res.redirect("/login");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    req.flash("error", "Invalid credentials.");
    return res.redirect("/login");
  }

  req.session.user = user;
  res.redirect("/dashboard");
});

// Dashboard (Protected Route)
router.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("dashboard", { user: req.session.user });
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

module.exports = router;