// resumeModule.js
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const DB = require("../db/db.js");

// Configure AWS S3 Client (v3)
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION || "us-west-1",
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "aipplynow-resumes";

async function uploadResume(fileBuffer, userId, originalFileName) {
  const resumeId = uuidv4();
  const key = `${userId}/${resumeId}/${originalFileName}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: "application/pdf",
    ServerSideEncryption: "AES256",
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    
    const s3Url = `https://${BUCKET_NAME}.s3.us-west-1.amazonaws.com/${key}`;
    
    const resumeMetadata = {
      resume_id: resumeId,
      user_id: userId,
      s3_key: key,
      original_name: originalFileName,
      upload_date: new Date().toISOString(),
      s3_url: s3Url,
    };
    await DB.insertResumeMetadata(resumeMetadata);
    return resumeId;
  } catch (error) {
    console.error("Error uploading resume to S3:", error);
    throw error;
  }
}

async function getResumeFile(resumeId, userId) {
  try {
    const resume = await DB.getResumeMetadata(resumeId, userId);
    if (!resume) throw new Error("Resume not found");

    const params = {
      Bucket: BUCKET_NAME,
      Key: resume.s3_key,
    };

    const command = new GetObjectCommand(params);
    const s3Object = await s3Client.send(command);
    
    // Use transformToByteArray to convert the stream to a Buffer
    const byteArray = await s3Object.Body.transformToByteArray(); // Returns Uint8Array
    const buffer = Buffer.from(byteArray);

    return {
      buffer: buffer,
      originalName: resume.original_name,
    };
  } catch (error) {
    console.error("Error retrieving resume from S3:", error);
    throw error;
  }
}

async function deleteResume(resumeId, userId) {
  try {
    const resume = await DB.getResumeMetadata(resumeId, userId);
    if (!resume) throw new Error("Resume not found");

    const params = {
      Bucket: BUCKET_NAME,
      Key: resume.s3_key,
    };

    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    await DB.deleteResumeMetadata(resumeId, userId);
    return true;
  } catch (error) {
    console.error("Error deleting resume:", error);
    throw error;
  }
}

module.exports = {
  uploadResume,
  getResumeFile,
  deleteResume,
};