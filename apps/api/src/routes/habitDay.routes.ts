import { Router } from "express";
import { prisma } from "../../../../packages/db/src/prisma";

const router = Router();

// CREATE habit day
router.post("/", async (req, res) => {
  const { id, date, status } = req.body;

  if (!id || typeof id !== "string" || !id.trim()) {
    return res.status(400).json({ error: "name is required" });
  }

  const habitDay = await prisma.habitDay.create({
    data: {
      habitId: id.trim(),
      date: date,
      status: status,
    },
  });

  res.status(201).json(habitDay);
});

router.get('/', async (_req, res) => {
    const habitDay = await prisma.habitDay.findMany({
        orderBy: {date: "desc"},
    });
    res.json(habitDay);
})

// GET week status for one habit: /habit-days/week?habitId=...&start=2026-05-19
router.get('/week', async (req, res) => {
  const { habitId, start } = req.query;

  if (!habitId || !start) {
    return res.status(400).json({ error: "habitId and start are required" });
  }

  const startDate = new Date(start as string);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const rows = await prisma.habitDay.findMany({
    where: {
      habitId: habitId as string,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  });

  res.json({
    habitID: habitId,
    weekID: start,
    end: endDate.toISOString().split("T")[0],
    days: rows.map(r => ({
      date: r.date.toISOString().split("T")[0],
      status: r.status,
    })),
  });
})

// UPSERT habit day status
router.put("/", async (req, res) => {
  const { habitId, date, status } = req.body;

  if (!habitId || !date || !status) {
    return res.status(400).json({ error: "habitId, date, and status are required" });
  }

  const habitDay = await prisma.habitDay.upsert({
    where: { habitId_date: { habitId, date: new Date(date) } },
    update: { status },
    create: { habitId, date: new Date(date), status },
  });

  res.json(habitDay);
});

export default router;