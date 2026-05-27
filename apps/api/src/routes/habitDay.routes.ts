import { Router } from "express";
import { prisma } from "../../../../packages/db/src/prisma";
import type { AuthRequest } from "../middleware/requireAuth";

const router = Router();

// Helper: confirms the habit exists AND belongs to the current user.
// Returns null if the habit isn't found or is owned by someone else.
async function getOwnedHabit(habitId: string, userId: string) {
  return prisma.habit.findFirst({ where: { id: habitId, userId } });
}

// CREATE habit day
router.post("/", async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  const { id, date, status } = req.body;

  if (!id || typeof id !== "string" || !id.trim()) {
    return res.status(400).json({ error: "name is required" });
  }

  // Ensure the habit belongs to the current user before creating a day record
  const habit = await getOwnedHabit(id.trim(), userId);
  if (!habit) return res.status(404).json({ error: "Habit not found" });

  const habitDay = await prisma.habitDay.create({
    data: {
      habitId: id.trim(),
      date: date,
      status: status,
    },
  });

  res.status(201).json(habitDay);
});

router.get('/', async (req, res) => {
  const { userId } = (req as AuthRequest).user;

  // Only return days for habits owned by this user
  const habitDay = await prisma.habitDay.findMany({
    where: { habit: { userId } },
    orderBy: { date: "desc" },
  });
  res.json(habitDay);
})

// GET week status for one habit: /habit-days/week?habitId=...&start=2026-05-19
router.get('/week', async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  const { habitId, start } = req.query;

  if (!habitId || !start) {
    return res.status(400).json({ error: "habitId and start are required" });
  }

  // Verify ownership before returning day data
  const habit = await getOwnedHabit(habitId as string, userId);
  if (!habit) return res.status(404).json({ error: "Habit not found" });

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
    days: rows.map((r: { date: Date; status: string }) => ({
      date: r.date.toISOString().split("T")[0],
      status: r.status,
    })),
  });
})

// UPSERT habit day status
router.put("/", async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  const { habitId, date, status } = req.body;

  if (!habitId || !date || !status) {
    return res.status(400).json({ error: "habitId, date, and status are required" });
  }

  // Verify ownership before writing day status
  const habit = await getOwnedHabit(habitId, userId);
  if (!habit) return res.status(404).json({ error: "Habit not found" });

  const habitDay = await prisma.habitDay.upsert({
    where: { habitId_date: { habitId, date: new Date(date) } },
    update: { status },
    create: { habitId, date: new Date(date), status },
  });

  res.json(habitDay);
});

export default router;
