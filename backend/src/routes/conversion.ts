import { Router } from "express";
import { conversionController } from "#controllers/conversionController.js";
import { handleValidationErrors } from "#middlewares/validation.js";
import { conversionLimiter, downloadLimiter } from "#middlewares/limiter.js";

const router: Router = Router();

// Start conversion
router.post(
  "/",
  conversionLimiter,
  conversionController.convertValidation,
  handleValidationErrors,
  conversionController.convert.bind(conversionController),
);

// Get conversion status
router.get(
  "/:conversionId/status",
  conversionController.conversionIdValidation,
  handleValidationErrors,
  conversionController.getStatus.bind(conversionController),
);

// Download converted file
router.get(
  "/:conversionId/download",
  downloadLimiter,
  conversionController.conversionIdValidation,
  handleValidationErrors,
  conversionController.download.bind(conversionController),
);

// Delete conversion
// router.delete(
//   "/:conversionId",
//   conversionIdValidation,
//   handleValidationErrors,
//   conversionController.deleteConversion.bind(conversionController),
// );

// router.get(
//   "/",
//   conversionController.getAllConversions.bind(conversionController),
// );

export default router;
