import { Router } from "express";
import { prisma } from "../../../../packages/db/src/prisma";
import { startOfWeekMonday } from "../utils/dates";
import type { AuthRequest } from "../middleware/requireAuth";

const router = Router();

// CREATE habit — always owned by the authenticated user
router.post("/", async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  const { name, notes, frequency } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }

  const validFrequencies = ["DAILY", "WEEKDAYS", "THREE_PER_WEEK", "TWO_PER_WEEK"];
  const resolvedFrequency =
    typeof frequency === "string" && validFrequencies.includes(frequency)
      ? frequency
      : "DAILY";

  const habit = await prisma.habit.create({
    data: {
      userId,
      name: name.trim(),
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      frequency: resolvedFrequency as any,
      startWeek: startOfWeekMonday(new Date()),
      endWeek: null,
    },
  });

  res.status(201).json(habit);
});


// READ — only habits belonging to the current user
router.get("/", async (req, res) => {
  const { userId } = (req as AuthRequest).user;

  const habits = await prisma.habit.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(habits);
});

// UPDATE habit (name, notes) — user must own the habit
router.put("/:id", async (req, res) => {
  const { userId } = (req as unknown as AuthRequest).user;
  const { id } = req.params;
  const { name, notes, frequency } = req.body;

  // Type the update data using Prisma's generated args type
  type UpdateData = Parameters<typeof prisma.habit.update>[0]["data"];
  const data: UpdateData = {};

  if (typeof name === "string") {
    const trimmed = name.trim();
    if (!trimmed) {
      return res.status(400).json({ error: "name cannot be empty" });
    }
    data.name = trimmed;
  }

  if (typeof notes === "string") {
    const trimmedNotes = notes.trim();
    data.notes = trimmedNotes ? trimmedNotes : null;
  } else if (notes === null) {
    data.notes = null;
  }

  const validFrequencies = ["DAILY", "WEEKDAYS", "THREE_PER_WEEK", "TWO_PER_WEEK"];
  if (typeof frequency === "string" && validFrequencies.includes(frequency)) {
    data.frequency = frequency as any;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  try {
    // where includes userId so a user can't modify another user's habit
    const updated = await prisma.habit.update({
      where: { id, userId },
      data,
    });

    res.json(updated);
  } catch {
    res.status(404).json({ error: "Habit not found" });
  }
});

// DELETE habit — user must own the habit
router.delete("/:id", async (req, res) => {
  const { userId } = (req as unknown as AuthRequest).user;
  const { id } = req.params;

  try {
    // where includes userId so a user can't delete another user's habit
    await prisma.habit.delete({ where: { id, userId } });
    res.status(204).send(); // 204 = No Content (successful delete)
  } catch (err) {
    res.status(404).json({ error: "Habit not found" });
  }
});

// TEMP DELETE LATER
router.post("/debug/seed-habits", async (req, res) => {
  const { userId } = (req as AuthRequest).user;

  const habits = await prisma.habit.createMany({
    data: [
      {
        userId,
        name: "Gym",
        notes: "Leg day",
        startWeek: new Date("2026-01-19T00:00:00.000Z"),
      },
      {
        userId,
        name: "Read",
        notes: "20 minutes",
        startWeek: new Date("2026-01-19T00:00:00.000Z"),
      },
      {
        userId,
        name: "Meditate",
        notes: null,
        startWeek: new Date("2026-01-26T00:00:00.000Z"), // next week
      },
    ],
  });

  res.json({ inserted: habits.count });
});

export default router;
