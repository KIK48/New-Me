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

export default router;