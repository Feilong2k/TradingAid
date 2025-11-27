import { google } from 'googleapis';
import stream from 'stream';

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '1CH4mUh-gHZ_Waao6r6hz0trTMTBVp65Y';
    this.initializeDrive();
  }

  initializeDrive() {
    try {
      // For service account authentication
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      this.drive = google.drive({ version: 'v3', auth });
      console.log('Google Drive service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error.message);
      // In development, we can continue without Google Drive
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  /**
   * Upload a base64 image to Google Drive
   * @param {string} base64Image - Base64 encoded image string
   * @param {string} filename - Name for the file
   * @param {string} mimeType - MIME type of the image
   * @returns {Promise<{fileId: string, webViewLink: string}>}
   */
  async uploadBase64Image(base64Image, filename, mimeType = 'image/png') {
    if (!this.drive) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      // Remove data URL prefix if present
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      const fileMetadata = {
        name: `${filename}_${Date.now()}.png`,
        parents: [this.folderId],
        mimeType: mimeType,
      };

      const media = {
        mimeType: mimeType,
        body: bufferStream,
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink',
      });

      console.log(`Uploaded screenshot to Google Drive: ${response.data.id}`);

      // Make the file publicly viewable
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return {
        fileId: response.data.id,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
      };
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      throw new Error(`Failed to upload image to Google Drive: ${error.message}`);
    }
  }

  /**
   * Delete a file from Google Drive
   * @param {string} fileId - Google Drive file ID
   */
  async deleteFile(fileId) {
    if (!this.drive) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      await this.drive.files.delete({
        fileId: fileId,
      });
      console.log(`Deleted file from Google Drive: ${fileId}`);
    } catch (error) {
      console.error('Error deleting file from Google Drive:', error);
      throw new Error(`Failed to delete file from Google Drive: ${error.message}`);
    }
  }

  /**
   * Get file metadata from Google Drive
   * @param {string} fileId - Google Drive file ID
   * @returns {Promise<Object>}
   */
  async getFileMetadata(fileId) {
    if (!this.drive) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime',
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file metadata from Google Drive:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Check if Google Drive service is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.drive !== null;
  }

  /**
   * Get the folder URL for the configured folder
   * @returns {string}
   */
  getFolderUrl() {
    return `https://drive.google.com/drive/folders/${this.folderId}`;
  }
}

// Create singleton instance
const googleDriveService = new GoogleDriveService();

export default googleDriveService;
