const express = require("express");
const path = require("node:path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDirectory = path.join(__dirname, "public");
const questionsFile = path.join(__dirname, "data", "questions.json");

app.use(express.static(publicDirectory));

app.get("/api/questions", (request, response, next) => {
  response.sendFile(questionsFile, (error) => {
    if (error) {
      next(error);
    }
  });
});

app.use((error, request, response, next) => {
  console.error("Request failed:", error);
  if (response.headersSent) {
    return next(error);
  }
  response.status(500).send("The requested resource could not be served.");
});

app.listen(port, () => {
  console.log(`Cloud Architect Mock Exam is running at http://localhost:${port}`);
});
