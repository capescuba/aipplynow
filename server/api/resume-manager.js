// resumeModule.js
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const DB = require("../db/db.js");

let s3Client = null;

async function initializeS3Client() {
    try {
        const config = await DB.getConfig();
        if (!config || !config.AWSAccessKeyId || !config.AWSSecretAccessKey) {
            throw new Error('AWS credentials not found in database');
        }
        
        s3Client = new S3Client({
            region: "us-west-1",
            credentials: {
                accessKeyId: config.AWSAccessKeyId,
                secretAccessKey: config.AWSSecretAccessKey
            }
        });
    } catch (error) {
        console.error('Error initializing S3 client:', error);
        throw error;
    }
}

const BUCKET_NAME = "aipplynow-resumes";

async function uploadResume(file, userId) {
  try {
    if (!s3Client) await initializeS3Client();
    
    const resumeId = uuidv4();
    const key = `${userId}/${resumeId}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    const metadata = {
      resume_id: resumeId,
      user_id: userId,
      s3_key: key,
      original_name: file.originalname,
      upload_date: new Date(),
      s3_url: `https://${BUCKET_NAME}.s3.us-west-1.amazonaws.com/${key}`
    };

    await DB.insertResumeMetadata(metadata);
    return metadata;
  } catch (error) {
    console.error("Error uploading resume:", error);
    throw error;
  }
}

async function getResumeFile(resumeId, userId) {
  try {
    if (!s3Client) await initializeS3Client();
    
    const metadata = await DB.getResumeMetadata(resumeId, userId);
    if (!metadata) {
      throw new Error("Resume not found");
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadata.s3_key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return { url, metadata };
  } catch (error) {
    console.error("Error getting resume:", error);
    throw error;
  }
}

async function deleteResume(resumeId, userId) {
  try {
    if (!s3Client) await initializeS3Client();
    
    const metadata = await DB.getResumeMetadata(resumeId, userId);
    if (!metadata) {
      throw new Error("Resume not found");
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadata.s3_key,
    });

    await s3Client.send(command);
    await DB.deleteResumeMetadata(resumeId, userId);
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