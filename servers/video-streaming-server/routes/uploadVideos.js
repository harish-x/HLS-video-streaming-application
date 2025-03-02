import express from 'express';
import {uploadVideo,validateUpload} from '../controllers/videoUpload.js';
const router = express.Router();

router.route('/request-upload-url').post(uploadVideo);
router.route('/verify-upload').post(validateUpload);

export default router;