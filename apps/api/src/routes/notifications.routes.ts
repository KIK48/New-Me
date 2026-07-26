import { Router } from "express";
import { prisma } from "../../../../packages/db/src/prisma";
import type { AuthRequest } from "../middleware/requireAuth";

const router = Router();

const VALID_CADENCES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

function validRule(body: any): body is { habitId?: string; cadence: string; hour: number; minute: number } {
  if (!VALID_CADENCES.includes(body.cadence)) return false;
  if (!Number.isInteger(body.hour) || body.hour < 0 || body.hour > 23) return false;
  if (!Number.isInteger(body.minute) || body.minute < 0 || body.minute > 59) return false;
  return true;
}

// GET /notifications — master toggle + all rules, everything the app needs
// to resync its local notification schedule in one call
router.get("/", async (req, res) => {
  const { userId } = (req as AuthRequest).user;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationsEnabled: true },
  });
  const rules = await prisma.notificationRule.findMany({
    where: { userId },
    include: { habit: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  res.json({ enabled: user?.notificationsEnabled ?? false, rules });
});

// PUT /notifications/settings — master on/off switch
router.put("/settings", async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  const { enabled } = req.body;

  if (typeof enabled !== "boolean") {
    return res.status(400).json({ error: "enabled must be a boolean" });
  }

  await prisma.user.update({ where: { id: userId }, data: { notificationsEnabled: enabled } });
  res.json({ enabled });
});

// POST /notifications/rules — add a reminder (habitId optional — omit for a
// general reminder not tied to any one habit, e.g. an end-of-day nudge)
router.post("/rules", async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  const { habitId, cadence, hour, minute } = req.body;

  if (!validRule(req.body)) {
    return res.status(400).json({ error: "cadence, hour (0-23), and minute (0-59) are required" });
  }

  if (habitId) {
    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) return res.status(404).json({ error: "Habit not found" });
  }

  const rule = await prisma.notificationRule.create({
    data: { userId, habitId: habitId ?? null, cadence, hour, minute },
    include: { habit: { select: { id: true, name: true } } },
  });
  res.status(201).json(rule);
});

// PUT /notifications/rules/:id — edit an existing rule (time, cadence, habit, or enabled)
router.put("/rules/:id", async (req, res) => {
  const { userId } = (req as unknown as AuthRequest).user;
  const { id } = req.params;
  const { habitId, cadence, hour, minute, enabled } = req.body;

  const existing = await prisma.notificationRule.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ error: "Rule not found" });

  if ((cadence !== undefined || hour !== undefined || minute !== undefined) &&
      !validRule({ cadence: cadence ?? existing.cadence, hour: hour ?? existing.hour, minute: minute ?? existing.minute })) {
    return res.status(400).json({ error: "cadence, hour (0-23), and minute (0-59) are required" });
  }

  if (habitId) {
    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) return res.status(404).json({ error: "Habit not found" });
  }

  const rule = await prisma.notificationRule.update({
    where: { id },
    data: {
      ...(habitId !== undefined && { habitId: habitId || null }),
      ...(cadence !== undefined && { cadence }),
      ...(hour !== undefined && { hour }),
      ...(minute !== undefined && { minute }),
      ...(enabled !== undefined && { enabled: Boolean(enabled) }),
    },
    include: { habit: { select: { id: true, name: true } } },
  });
  res.json(rule);
});

// DELETE /notifications/rules/:id
router.delete("/rules/:id", async (req, res) => {
  const { userId } = (req as unknown as AuthRequest).user;
  const { id } = req.params;

  const existing = await prisma.notificationRule.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ error: "Rule not found" });

  await prisma.notificationRule.delete({ where: { id } });
  res.status(204).send();
});

export default router;
