import { Router } from "express";
import { videoInfoController } from "#controllers/videoInfoController.js";
import { handleValidationErrors } from "#middlewares/validation.js";

const router: Router = Router();

router.post(
  "/info",
  videoInfoController.videoInfoValidation,
  handleValidationErrors,
  videoInfoController.getVideoInfo.bind(videoInfoController),
);

export default router;
