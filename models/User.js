const { Sequelize, DataTypes } = require("sequelize");

// Connect to SQLite database
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database/database.sqlite",
  logging: console.log, // Log SQL queries for debugging
});

// Define User model
const User = sequelize.define("User", {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
});

// Sync database (force recreate if needed)
sequelize
  .sync()
  .then(() => console.log("Database & tables created!"))
  .catch((err) => console.error("Database sync error:", err));

module.exports = { User, sequelize };