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

async function uploadResume(fileBuffer, userId, name, description = '') {
  const s3Client = getS3Client();
  try {
    console.log(`[DEBUG] Uploading resume for user ${userId} with name "${name}"`);
    
    const fileExtension = name.split('.').pop();
    const key = `${userId}/${uuidv4()}.${fileExtension}`;
    console.log(`[DEBUG] Generated S3 key: ${key}`);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: 'application/pdf',
    });

    console.log(`[DEBUG] Uploading to S3 bucket: ${BUCKET_NAME}`);
    await s3Client.send(command);
    console.log(`[DEBUG] Successfully uploaded to S3`);

    console.log(`[DEBUG] Inserting resume metadata into database`);
    const resumeId = await DB.insertResumeMetadata({
      userId,
      name,
      s3Key: key,
      fileType: 'application/pdf',
      size: fileBuffer.length,
      description
    });
    console.log(`[DEBUG] Successfully inserted resume metadata with ID: ${resumeId}`);

    return resumeId;
  } catch (error) {
    console.error("[DEBUG] Error uploading resume:", error);
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
    
    // Use a promise to handle the stream
    return await new Promise((resolve, reject) => {
      const chunks = [];
      
      response.Body.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });

      response.Body.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      response.Body.on('error', (err) => {
        console.error("Stream error:", err);
        reject(new Error("Failed to read resume file stream"));
      });
    });
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