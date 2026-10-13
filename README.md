# Cloud Certified Architect Foundation Mock Exam

A responsive, 200-question multiple-choice practice exam served by Express.

## Run locally

```sh
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Set the `PORT` environment variable to use a different port.

## Question bank

Questions are stored in `data/questions.json` and served from `GET /api/questions`. Each entry has a `category`, `question`, four `options`, an `answerIndex` (zero-based), and an `explanation`.

The browser lets users select an option and evaluates it only after they submit their answer. Selections and submitted answers persist while navigating, and submitted answers display feedback and the correct choice. A category panel shows each topic's percentage of the question bank and highlights the current question's category.
