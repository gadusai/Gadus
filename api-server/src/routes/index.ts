import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gadusRouter from "./gadus";

const router: IRouter = Router();

router.use(healthRouter);
router.use(gadusRouter);

export default router;
