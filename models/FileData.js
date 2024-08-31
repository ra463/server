const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    requestID: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["In-progress", "completed", "failed"],
      default: "In-progress",
    },
    details: [
      {
        s_No: Number,
        p_Name: String,
        input_imgUrls: [],
        output_imgUrls: [],
      },
    ],
    output_CSVUrl: {
      public_id: String,
      url: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FileData", schema);
