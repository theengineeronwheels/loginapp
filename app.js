import express from "express";
const app = express();

// ... your middleware and routes here ...

// Only start the server if not running as a serverless function
if (process.env.NODE_ENV !== "production" || !process.env.NETLIFY) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;
