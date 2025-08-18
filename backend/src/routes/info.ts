import { Router } from "express";
import { videoInfoController } from "#controllers/videoInfoController.js";
import { handleValidationErrors } from "#middlewares/validation.js";

const router: Router = Router();

router.post(
  "/video",
  videoInfoController.videoInfoValidation,
  handleValidationErrors,
  videoInfoController.getVideoInfo.bind(videoInfoController),
);

router.post(
  "/playlist",
  videoInfoController.playlistInfoValidation,
  handleValidationErrors,
  videoInfoController.getPlaylistInfo.bind(videoInfoController),
);

export default router;
