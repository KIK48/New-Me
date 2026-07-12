import { Router } from "express";
import { prisma } from "../../../../packages/db/src/prisma";
import type { AuthRequest } from "../middleware/requireAuth";

const router = Router();

// Helper: confirms the habit exists AND belongs to the current user.
async function getOwnedHabit(habitId: string, userId: string) {
  return prisma.habit.findFirst({ where: { id: habitId, userId } });
}

// CREATE a completion — one row per instance (e.g. "eat 2x/day" gets 2 rows in a day)
router.post("/", async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  const { habitId, loggedAt } = req.body;

  if (!habitId || typeof habitId !== "string") {
    return res.status(400).json({ error: "habitId is required" });
  }

  const habit = await getOwnedHabit(habitId, userId);
  if (!habit) return res.status(404).json({ error: "Habit not found" });

  const log = await prisma.habitLog.create({
    data: {
      habitId,
      loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
    },
  });

  res.status(201).json(log);
});

// READ — only logs for habits owned by this user
router.get("/", async (req, res) => {
  const { userId } = (req as AuthRequest).user;

  const logs = await prisma.habitLog.findMany({
    where: { habit: { userId } },
    orderBy: { loggedAt: "desc" },
  });
  res.json(logs);
});

// DELETE a single log entry (undo one completion) — user must own the parent habit
router.delete("/:id", async (req, res) => {
  const { userId } = (req as unknown as AuthRequest).user;
  const { id } = req.params;

  const log = await prisma.habitLog.findFirst({
    where: { id, habit: { userId } },
  });
  if (!log) return res.status(404).json({ error: "Log not found" });

  await prisma.habitLog.delete({ where: { id } });
  res.status(204).send();
});

export default router;
