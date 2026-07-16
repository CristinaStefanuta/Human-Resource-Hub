import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    avatarUrl: user.avatarUrl,
    shiftPreferences: user.shiftPreferences,
  });
});

export default router;
