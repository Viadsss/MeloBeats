import { Router } from "express";
import { videoInfoController } from "#controllers/videoInfoController.js";
import { handleValidationErrors } from "#middlewares/validation.js";
import { infoController } from "#controllers/infoController.js";

const router: Router = Router();

router.post(
  "/",
  infoController.infoValidation,
  handleValidationErrors,
  infoController.getInfo.bind(infoController),
);

export default router;
