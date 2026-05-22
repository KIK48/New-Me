import express from "express";
import cors from "cors";

import habitsRouter from "./routes/habits.routes";
import habitDay from "./routes/habitDay.routes";

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/habits", habitsRouter);
app.use("/habit-days", habitDay);

app.listen(4000, () => console.log("Server running on http://localhost:4000"));


/* to call the post api for habit-days
fetch("http://localhost:4000/habit-days", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: "cmkoyv0nq0000sgf1tl7cokw9",
    date: "2026-01-21T00:00:00.000Z",
    status: "DONE",
  }),
})
  .then(res => res.json())
  .then(data => console.log("Created habit day:", data))
  .catch(console.error);
*/