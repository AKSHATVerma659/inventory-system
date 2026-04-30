// routes/importRoutes.js
const express = require("express");
const router = express.Router();

const upload = require("../middlewares/importUpload");
const importController = require("../controllers/importController");

// Upload routes
router.post("/products/upload", upload.single("file"), importController.uploadProductFile);
router.post("/opening-inventory/upload", upload.single("file"), importController.uploadOpeningInventoryFile);
router.post("/purchases", upload.single("file"), importController.uploadPurchaseFile);

// Read routes
router.get("/", importController.listImportJobs);
router.get("/:id", importController.getImportJob);

// ✅ Error file download (CRITICAL FIX)
router.get("/:id/error-file", importController.downloadErrorFile);

module.exports = router;
