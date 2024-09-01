# Image Data Processing System

## Setup Instructions

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Create the `config.env` in the config folder like this - `/config/config.env`.
4. Configure environment variables:
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `MONGO_URI`
   - `PORT`
   - `BACKEND_URL` (The url of local/deployed server) 
5. Start the server using `npm start`.
6. **The Input `CSV File` should have the same structure which was mentioned in the pdf**

### PostMan Collection Link - [https://documenter.getpostman.com/view/16780774/2sAXjM2rCm]

### Server Deployed Link - [https://my-server-1.adaptable.app]

## Components

- **Backend**: Node.js/Express.js API for processing CSV files and images.
- **Database**: MongoDB for storing details.
- **Cloudinary**: Storage for images and CSV files.
- **Webhook**: Notifies completion of image processing.

## API Documentation

### **1. Upload CSV File**

**Endpoint**: `POST /api/v1/upload`

**Description**: Uploads a CSV file for processing. The CSV should contain product details and image URLs.

- **Request**:

  - **Headers**: `Content-Type: multipart/form-data`
  - **Body**: The request body should include a file field for the CSV.

    ```bash
    curl -X POST https://my-server-1.adaptable.app/api/v1/upload \
    -H "Content-Type: multipart/form-data" \
    -F "file=@csvfile.csv"
    ```

- **Response**:
  - **200 OK**
    ```json
    {
      "success": true,
      "requestId": "uuid-generated-request-id",
      "status": "In-progress"
    }
    ```
  - **Errors**:
    - **400 Bad Request**: If the CSV file is missing.
    - **500 Internal Server Error**: If there’s a problem with the file processing.

### **2. Webhook Trigger**

**Endpoint**: `POST /api/v1/webhook`

**Description**: Triggered by the system once the image processing is completed. Sends product details and URLs of processed images to the webhook.

- **Request**:

  - **Headers**: `Content-Type: application/json`
  - **Body**:
    ```json
    {
      "requestId": "uuid-generated-request-id",
      "products": [
        {
          "s_No": "1",
          "p_Name": "Product 1",
          "input_imgUrls": ["http://example.com/image1.jpg"],
          "output_imgUrls": ["http://cloudinary.com/processed_image1.jpg"]
        }
      ]
    }
    ```

- **Response**:
  - **200 OK**
    ```json
    {
      "success": true,
      "message": "Webhook triggered successfully"
    }
    ```
  - **Errors**:
    - **404 Not Found**: If the request data is missing.
    - **500 Internal Server Error**: If there’s an issue with processing the data.

### **3. Check Request Status**

**Endpoint**: `POST /api/v1/processRequestID/:requestId`

**Description**: Allows users to check the status of a file processing request using the `requestId`.

- **Request**:

  - **Method**: GET
  - **URL**: `/api/v1/request/:requestId`
  - **Headers**: `Content-Type: application/json`

- **Example Request**:

  ```bash
  GET /api/v1/request/uuid-generated-request-id
  ```

- **Response**:
  - **200 OK** (In-progress)
    ```json
    {
      "success": true,
      "requestID": "uuid-generated-request-id",
      "status": "In-progress"
    }
    ```
  - **200 OK** (Completed)
    ```json
    {
      "success": true,
      "fileData": {
        "requestID": "uuid-generated-request-id",
        "status": "completed",
        "output_CSVUrl": {
          "public_id": "cloudinary-public-id",
          "url": "http://cloudinary.com/uploaded-file.csv"
        },
        "details": [...]
      }
    }
    ```
  - **Errors**:
    - **404 Not Found**: If the `requestID` is invalid or not found.
    - **500 Internal Server Error**: If there’s an issue retrieving the data.
