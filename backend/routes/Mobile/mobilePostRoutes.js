// routes/Mobile/mobilePostRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const c = require('../../controllers/Mobile/mobilePostController');
const { authMiddleware } = require('../../middleware/authMiddleware');
const {
  uploadPostImagesMiddleware,
  uploadSinglePostImageMiddleware,
} = require('../../middleware/uploadMiddleware');

// All routes require authentication
router.use(authMiddleware());

// ================================================================
// GROUP-SCOPED POSTS
// ================================================================

// GET /api/mobile/posts/groups/:groupId/posts?status=&search=&page=&limit=
router.get('/groups/:groupId/posts', c.listGroupPosts);

// POST /api/mobile/posts/groups/:groupId/posts
// multipart/form-data: title, body?, images[] (up to 10)
router.post(
  '/groups/:groupId/posts',
  uploadPostImagesMiddleware,
  c.createPost
);

// ================================================================
// POST-SCOPED
// ================================================================

// GET /api/mobile/posts/:id
router.get('/:id', c.getPost);

// DELETE /api/mobile/posts/:id
router.delete('/:id', c.deletePost);

// POST /api/mobile/posts/:id/read
router.post('/:id/read', c.markPostRead);

// POST /api/mobile/posts/:id/approve
// body: { note }
router.post('/:id/approve', c.approvePost);

// POST /api/mobile/posts/:id/decline
// body: { reason }
router.post('/:id/decline', c.declinePost);

// ================================================================
// COMMENTS
// ================================================================

// GET /api/mobile/posts/:id/comments
router.get('/:id/comments', c.listComments);

// POST /api/mobile/posts/:id/comments
// body: { body }
router.post('/:id/comments', c.addComment);

// ================================================================
// IMAGE ANNOTATION
// ================================================================

// POST /api/mobile/posts/:id/images/:imageId/annotate
// multipart/form-data: image (single file)
router.post(
  '/:id/images/:imageId/annotate',
  uploadSinglePostImageMiddleware,
  c.annotatePostImage
);

module.exports = router;