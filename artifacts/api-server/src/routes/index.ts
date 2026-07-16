import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import announcementsRouter from "./announcements";
import requestsRouter from "./requests";
import timeEntriesRouter from "./time-entries";
import shiftsRouter from "./shifts";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(announcementsRouter);
router.use(requestsRouter);
router.use(timeEntriesRouter);
router.use(shiftsRouter);
router.use(dashboardRouter);

export default router;
