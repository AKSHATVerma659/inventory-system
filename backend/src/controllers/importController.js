// controllers/importController.js
const fs = require("fs");
const path = require("path");
const ImportJob = require("../models/ImportJob");
const {
  processProductImport,
} = require("../services/productImportService");
const {
  processOpeningInventoryImport,
} = require("../services/openingInventoryImportService");
const {
  processPurchaseImport,
} = require("../services/purchaseImportService");

/* ================= LIST IMPORT JOBS ================= */
exports.listImportJobs = async (req, res) => {
  try {
    const jobs = await ImportJob.findAll({
      order: [["created_at", "DESC"]],
    });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load import jobs" });
  }
};

/* ================= GET IMPORT JOB ================= */
exports.getImportJob = async (req, res) => {
  try {
    const job = await ImportJob.findByPk(req.params.id);
    if (!job) return res.status(404).json({ message: "Import job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Failed to load import job" });
  }
};

/* ================= DOWNLOAD ERROR FILE ================= */
exports.downloadErrorFile = async (req, res) => {
  try {
    const job = await ImportJob.findByPk(req.params.id);

    if (!job || !job.error_file_path) {
      return res.status(404).json({ message: "Error file not found" });
    }

    const absolutePath = path.resolve(job.error_file_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "File does not exist" });
    }

    return res.download(absolutePath);
  } catch (err) {
    console.error("Error downloading import error file:", err);
    res.status(500).json({ message: "Download failed" });
  }
};

/* ================= PRODUCT UPLOAD ================= */
exports.uploadProductFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const job = await ImportJob.create({
    type: "PRODUCT",
    file_name: req.file.originalname,
    file_path: req.file.path,
    status: "UPLOADED",
    created_by: req.user?.id || null,
  });

  processProductImport(job.id).catch(console.error);

  res.status(201).json({ importJobId: job.id });
};

/* ================= OPENING INVENTORY UPLOAD ================= */
exports.uploadOpeningInventoryFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const job = await ImportJob.create({
    type: "OPENING_INVENTORY",
    file_name: req.file.originalname,
    file_path: req.file.path,
    status: "UPLOADED",
    created_by: req.user?.id || null,
  });

  processOpeningInventoryImport(job.id).catch(console.error);

  res.status(201).json({ importJobId: job.id });
};

/* ================= PURCHASE UPLOAD ================= */
exports.uploadPurchaseFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const job = await ImportJob.create({
    type: "PURCHASE",
    file_name: req.file.originalname,
    file_path: req.file.path,
    status: "UPLOADED",
    created_by: req.user?.id || null,
  });

  processPurchaseImport(job.id).catch(console.error);

  res.status(201).json({ importJobId: job.id });
};
