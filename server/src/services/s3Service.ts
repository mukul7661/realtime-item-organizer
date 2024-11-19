import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = process.env.AWS_S3_BUCKET!;
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      const key = `icons-test/${Date.now()}-${file.originalname}`;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: "max-age=31536000", // 1 year cache
        })
      );

      // Return the full URL
      return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      console.error("Failed to upload file to S3:", error);
      throw new Error("Failed to upload file");
    }
  }

  async getSignedUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      // Generate a signed URL that's valid for 1 hour
      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      console.error("Failed to generate signed URL:", error);
      throw new Error("Failed to generate signed URL");
    }
  }
}
