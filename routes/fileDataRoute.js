const express = require("express");
const upload = require("../middlewares/multer");
const {
  processCSVFile,
  customWebhook,
  processRequestID,
} = require("../controllers/fileDataController");

const router = express.Router();

router.post("/upload", upload, processCSVFile);
router.post("/webhook", customWebhook);
router.get("/request/:requestId", processRequestID);

module.exports = router;
