const FileData = require("../models/FileData");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { v4: uuidv4 } = require("uuid");
const csv = require("csv-parser");
const cloudinary = require("cloudinary");
const csvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const processImage = require("../utils/processImage");

const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

const WEBHOOK_URL = `${process.env.BACKEND_URL}/api/v1/webhook`;

exports.processCSVFile = catchAsyncError(async (req, res, next) => {
  const file = req.file;
  if (!file) return next(new ErrorHandler("Please add a CSV file", 400));

  const requestId = uuidv4();
  const filePath = path.join(__dirname, "..", "uploads", file.filename);

  const products = [];
  const promises = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", async (row) => {
      const inputImageUrls = row["Input Image Urls"].split(",");

      inputImageUrls.forEach((url) => {
        url.trim();
      });

      const key = Object.keys(row).find(
        (k) => k.trim().toLowerCase() === "s. no."
      );

      // Collect promises for image processing
      const image_Promises = inputImageUrls.map(async (url) => {
        return processImage(url);
      });

      const product_Promise = Promise.all(image_Promises).then((urls) => {
        products.push({
          s_No: row[key],
          p_Name: row["Product Name"],
          input_imgUrls: inputImageUrls,
          output_imgUrls: urls,
        });
      });

      promises.push(product_Promise);
    })
    .on("end", async () => {
      try {
        await Promise.all(promises);
        // trigger web-hook with all the informations
        axios.post(WEBHOOK_URL, {
          requestId: requestId,
          products: products,
        });
      } catch (error) {
        console.log(error);
      } finally {
        fs.unlink(filePath, (err) => {
          if (err) console.log(err);
          console.log("File deleted successfully");
        });
      }
    });

  await FileData.create({
    requestID: requestId,
    status: "In-progress",
  });

  res.status(200).json({
    success: true,
    requestId: requestId,
    status: "In-progress",
  });
});

exports.customWebhook = catchAsyncError(async (req, res, next) => {
  //   console.log("Webhook triggered");
  if (!req.body) return next(new ErrorHandler("No data found", 404));

  const { requestId, products } = req.body;
  const fileData = await FileData.findOne({ requestID: requestId });
  if (!fileData) return next(new ErrorHandler("File not found", 404));

  // write data to csv file
  const csvFilePath = path.join(__dirname, "..", "uploads", `${requestId}.csv`);
  const writer = csvWriter({
    path: csvFilePath,
    header: [
      { id: "s_No", title: "S. No." },
      { id: "p_Name", title: "Product Name" },
      { id: "inputImageUrls", title: "Input Image Urls" },
      { id: "outputImageUrls", title: "Output Image Urls" },
    ],
  });

  const records = products.map((product) => ({
    s_No: product.s_No,
    p_Name: product.p_Name,
    inputImageUrls: product.input_imgUrls.join(", "),
    outputImageUrls: product.output_imgUrls.join(", "),
  }));

  await writer.writeRecords(records);

  // upload csv file to cloudinary
  const cloudinaryResult = await cloudinary.v2.uploader.upload(csvFilePath, {
    resource_type: "auto",
    folder: "skyne",
    transformation: [{ quality: "50" }],
    overwrite: true,
    allowed_formats: ["csv"],
  });

  fileData.details = products;
  fileData.output_CSVUrl.public_id = cloudinaryResult.public_id;
  fileData.output_CSVUrl.url = cloudinaryResult.url;
  fileData.status = "completed";

  // delete csv file
  fs.unlink(csvFilePath, (err) => {
    if (err) console.log(err);
    console.log("CSV deleted successfully");
  });

  await fileData.save();

  res.status(200).json({
    success: true,
    message: "Webhook triggered successfully",
  });
});

exports.processRequestID = catchAsyncError(async (req, res, next) => {
  const { requestId } = req.body;

  const fileData = await FileData.findOne({
    requestID: requestId,
  }).lean();
  if (!fileData) return next(new ErrorHandler("Invalid Request ID", 404));

  if (fileData.status === "In-progress") {
    res.status(200).json({
      success: true,
      requestId,
      status: fileData.status,
    });
  } else {
    res.status(200).json({
      success: true,
      fileData,
    });
  }
});
