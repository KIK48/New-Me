import { Router } from "express";
import { prisma } from "../../../../packages/db/src/prisma";
import { startOfWeekMonday } from "../utils/dates";

const router = Router();

// CREATE habit
router.post("/", async (req, res) => {
  const { name, notes } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }

  const habit = await prisma.habit.create({
    data: {
      name: name.trim(),
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      startWeek: startOfWeekMonday(new Date()),
      endWeek: null,
    },
  });

  res.status(201).json(habit);
});


// READ Getting all habits
router.get("/", async (_req, res) => { // req == request, res == response
    const habits = await prisma.habit.findMany({
        orderBy: {createdAt: "desc"},
    });
    res.json(habits);
});

// UPDATE habit (name, notes, isActive)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, notes, isActive } = req.body;

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

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  try {
    const updated = await prisma.habit.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch {
    res.status(404).json({ error: "Habit not found" });
  }
});

// DELETE habit
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.habit.delete({ where: { id } });
    res.status(204).send(); // 204 = No Content (successful delete)
  } catch (err) {
    res.status(404).json({ error: "Habit not found" });
  }
});

// TEMP DELETE LATER
router.post("/debug/seed-habits", async (_req, res) => {
  const habits = await prisma.habit.createMany({
    data: [
      {
        name: "Gym",
        notes: "Leg day",
        startWeek: new Date("2026-01-19T00:00:00.000Z"),
      },
      {
        name: "Read",
        notes: "20 minutes",
        startWeek: new Date("2026-01-19T00:00:00.000Z"),
      },
      {
        name: "Meditate",
        notes: null,
        startWeek: new Date("2026-01-26T00:00:00.000Z"), // next week
      },
    ],
  });

  res.json({ inserted: habits.count });
});

export default router;