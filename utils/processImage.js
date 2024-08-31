const axios = require("axios");
const cloudinary = require("cloudinary");

const processImage = async (img_Url) => {
  img_Url = img_Url.trim();
  const result = await axios({
    url: img_Url,
    responseType: "arraybuffer",
  });
  const img_Buffer = Buffer.from(result.data, "binary");

  // upload img to cloudinay with 50% compression
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder: "skyne",
          transformation: [{ quality: "50" }],
          overwrite: true,
          allowed_formats: ["jpg", "png", "jpeg"],
        },
        (error, uploadResult) => {
          if (error) {
            return reject(error);
          }
          resolve(uploadResult.url);
        }
      )
      .end(img_Buffer);
  });
};

module.exports = processImage;
