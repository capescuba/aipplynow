// resumeModule.js
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const DB = require("../db/db.js");
const config = require("../config/startup_properties.js");

// Configure AWS S3 Client (v3)
function getS3Client() {
  const accessKeyId = config.getProperty('AWS_ACCESS_KEY_ID');
  const secretAccessKey = config.getProperty('AWS_SECRET_ACCESS_KEY');
  const region = config.getProperty('AWS_REGION') || "us-west-1";

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not found in config');
  }

  return new S3Client({
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    region,
  });
}

const BUCKET_NAME = config.getProperty('AWS_BUCKET_NAME') || "aipplynow-resumes";

async function uploadResume(file, userId) {
  const s3Client = getS3Client();
  try {
    const fileExtension = file.originalname.split('.').pop();
    const key = `${userId}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    const resumeId = await DB.saveResumeMetadata({
      userId,
      originalName: file.originalname,
      s3Key: key,
      fileType: file.mimetype,
      size: file.size,
    });

    return resumeId;
  } catch (error) {
    console.error("Error uploading resume:", error);
    throw error;
  }
}

async function getResumeFile(userId, resumeId) {
  const s3Client = getS3Client();
  const metadata = await DB.getResumeMetadata(resumeId, userId);
  if (!metadata) {
    throw new Error("Resume not found");
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadata.s3Key,
    });
    const response = await s3Client.send(command);
    return response.Body;
  } catch (error) {
    console.error("Error downloading resume:", error);
    throw error;
  }
}

async function deleteResume(resumeId, userId) {
  const s3Client = getS3Client();
  try {
    const resume = await DB.getResumeMetadata(resumeId, userId);
    if (!resume) {
      throw new Error("Resume not found");
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: resume.s3Key,
    });

    await s3Client.send(command);
    await DB.deleteResumeMetadata(resumeId, userId);
  } catch (error) {
    console.error("Error deleting resume:", error);
    throw error;
  }
}

async function getResumeMetadata(resumeId, userId) {
  const s3Client = getS3Client();
  try {
    const resume = await DB.getResumeMetadata(resumeId, userId);
    if (!resume) {
      throw new Error("Resume not found");
    }

    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: resume.s3Key,
    });

    const metadata = await s3Client.send(command);
    return {
      ...resume,
      size: metadata.ContentLength,
      lastModified: metadata.LastModified,
      contentType: metadata.ContentType,
    };
  } catch (error) {
    console.error("Error getting resume metadata:", error);
    throw error;
  }
}

module.exports = {
  uploadResume,
  getResumeFile,
  deleteResume,
  getResumeMetadata,
};