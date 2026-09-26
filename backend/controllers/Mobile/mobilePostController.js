// controllers/Mobile/mobilePostController.js
'use strict';

const { Op } = require('sequelize');
const db = require('../../models');
const {
  PostGroup,
  PostGroupMember,
  PostGroupPost,
  PostGroupPostImage,
  PostGroupPostComment,
  PostGroupPostRead,
  PostGroupAuditLog,
  User,
} = db;

// ================================================================
// HELPERS
// ================================================================
const USER_ATTRS = ['userId', 'fullName', 'username'];
const DELETE_WINDOW_MS = 5 * 60 * 1000;

const audit = (payload) =>
  PostGroupAuditLog.create(payload).catch((e) =>
    console.error('audit log failed:', e.message)
  );

const isManager = (req) => {
  if (req.user?.isAdmin) return true;
  const r = String(req.user?.role || '').toLowerCase();
  return ['admin', 'administrator', 'superadmin', 'manager'].includes(r);
};

const isOwnerOfGroup = async (groupId, userId) => {
  const g = await PostGroup.findByPk(groupId, { attributes: ['createdBy'] });
  return g && Number(g.createdBy) === Number(userId);
};

const isActiveMember = async (groupId, userId) => {
  const m = await PostGroupMember.findOne({
    where: { groupId, userId, status: 'active' },
  });
  return !!m;
};

const imageDto = (i) => ({
  id: i.id,
  url: i.url,
  orderIndex: i.orderIndex,
  annotatedFromId: i.annotatedFromId,
});

const commentDto = (c) => ({
  id: c.id,
  author: c.author?.fullName || c.author?.username || 'Unknown',
  authorId: c.authorId,
  body: c.body,
  createdAt: c.created_at || c.createdAt,
});

const postDto = (p, opts = {}) => ({
  id: p.id,
  groupId: p.groupId,
  title: p.title,
  body: p.body,
  status: p.status,
  reviewNote: p.reviewNote,
  reviewedBy: p.reviewedBy,
  reviewedAt: p.reviewedAt,
  author: p.author?.fullName || p.author?.username || 'Unknown',
  authorId: p.authorId,
  createdAt: p.created_at || p.createdAt,
  images: (p.images || []).map(imageDto),
  commentCount: opts.commentCount ?? 0,
  unread: opts.unread ?? false,
});

const postIncludes = () => [
  { model: PostGroupPostImage, as: 'images' },
  { model: User, as: 'author', attributes: USER_ATTRS },
];

// ================================================================
// 1. LIST POSTS IN GROUP
//    GET /api/mobile/posts/groups/:groupId/posts
// ================================================================
exports.listGroupPosts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const { status, search = '', page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const member = await isActiveMember(groupId, userId);
    if (!member && !isManager(req)) {
      return res.status(403).json({ success: false, error: 'Not a member' });
    }

    const where = { groupId };
    if (status === 'pending' || status === 'approved' || status === 'declined') {
      where.status = status;
    }
    if (search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.iLike]: q } },
        { body: { [Op.iLike]: q } },
      ];
    }

    const { count, rows } = await PostGroupPost.findAndCountAll({
      where,
      include: postIncludes(),
      order: [['created_at', 'DESC']],
      offset: (pageNum - 1) * pageSize,
      limit: pageSize,
      distinct: true,
    });

    const postIds = rows.map((r) => r.id);

    const readRows = postIds.length
      ? await PostGroupPostRead.findAll({
          where: { userId, postId: { [Op.in]: postIds } },
          attributes: ['postId'],
        })
      : [];
    const readSet = new Set(readRows.map((r) => String(r.postId)));

    const commentCounts = postIds.length
      ? await PostGroupPostComment.findAll({
          where: { postId: { [Op.in]: postIds } },
          attributes: [
            'postId',
            [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'cnt'],
          ],
          group: ['postId'],
          raw: true,
        })
      : [];
    const countMap = new Map(
      commentCounts.map((c) => [String(c.postId), Number(c.cnt)])
    );

    res.json({
      success: true,
      data: {
        items: rows.map((p) =>
          postDto(p, {
            unread: !readSet.has(String(p.id)),
            commentCount: countMap.get(String(p.id)) || 0,
          })
        ),
        total: count,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(count / pageSize) || 1,
      },
    });
  } catch (err) {
    console.error('❌ listGroupPosts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 2. GET POST
//    GET /api/mobile/posts/:id
// ================================================================
exports.getPost = async (req, res) => {
  try {
    const p = await PostGroupPost.findByPk(req.params.id, {
      include: [
        ...postIncludes(),
        {
          model: PostGroupPostComment,
          as: 'comments',
          include: [{ model: User, as: 'author', attributes: USER_ATTRS }],
        },
      ],
    });
    if (!p) return res.status(404).json({ success: false, error: 'Not found' });

    const dto = postDto(p, {
      commentCount: p.comments ? p.comments.length : 0,
    });
    dto.comments = (p.comments || []).map(commentDto);

    res.json({ success: true, data: dto });
  } catch (err) {
    console.error('❌ getPost:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 3. CREATE POST
//    POST /api/mobile/posts/groups/:groupId/posts
// ================================================================
exports.createPost = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const { title, body } = req.body;

    if (!title || !String(title).trim()) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Title required' });
    }

    const member = await isActiveMember(groupId, userId);
    if (!member) {
      await t.rollback();
      return res
        .status(403)
        .json({ success: false, error: 'Only members can post' });
    }

    const post = await PostGroupPost.create(
      {
        groupId,
        authorId: userId,
        title: String(title).trim(),
        body: body ? String(body).trim() : null,
        status: 'pending',
      },
      { transaction: t }
    );

    const files = req.files || [];
    if (files.length) {
      await PostGroupPostImage.bulkCreate(
        files.map((f, i) => ({
          postId: post.id,
          url: `/uploads/posts/${f.filename}`,
          orderIndex: i,
        })),
        { transaction: t }
      );
    }

    await PostGroup.update(
      { lastActivity: new Date() },
      { where: { id: groupId }, transaction: t }
    );

    await audit({
      actorId: userId,
      action: 'post.create',
      targetType: 'post',
      targetId: post.id,
      groupId,
    });

    await t.commit();

    const full = await PostGroupPost.findByPk(post.id, {
      include: postIncludes(),
    });
    res.status(201).json({ success: true, data: postDto(full) });
  } catch (err) {
    await t.rollback();
    console.error('❌ createPost:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 4. DELETE POST
//    DELETE /api/mobile/posts/:id
// ================================================================
exports.deletePost = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.userId;
    const p = await PostGroupPost.findByPk(req.params.id, { transaction: t });
    if (!p) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const isAuthor = Number(p.authorId) === Number(userId);
    const isOwner = await isOwnerOfGroup(p.groupId, userId);
    const ageMs = Date.now() - new Date(p.created_at || p.createdAt).getTime();
    const withinWindow = ageMs < DELETE_WINDOW_MS;

    const canDelete = isManager(req) || isOwner || (isAuthor && withinWindow);
    if (!canDelete) {
      await t.rollback();
      return res.status(403).json({ success: false, error: 'Not allowed' });
    }

    await PostGroupPost.destroy({ where: { id: p.id }, transaction: t });
    await audit({
      actorId: userId,
      action: 'post.delete',
      targetType: 'post',
      targetId: p.id,
      groupId: p.groupId,
    });
    await t.commit();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    await t.rollback();
    console.error('❌ deletePost:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 5. APPROVE POST
//    POST /api/mobile/posts/:id/approve  { note }
// ================================================================
exports.approvePost = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.userId;
    if (!isManager(req)) {
      await t.rollback();
      return res.status(403).json({ success: false, error: 'Manager only' });
    }
    const { note } = req.body;
    if (!note || !String(note).trim()) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Note required' });
    }

    const p = await PostGroupPost.findByPk(req.params.id, { transaction: t });
    if (!p) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    if (p.status === 'approved') {
      await t.rollback();
      return res.json({ success: true, message: 'Already approved' });
    }

    await p.update(
      {
        status: 'approved',
        reviewNote: String(note).trim(),
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      { transaction: t }
    );

    await audit({
      actorId: userId,
      action: 'post.approve',
      targetType: 'post',
      targetId: p.id,
      groupId: p.groupId,
      metadata: { note: String(note).trim() },
    });

    await t.commit();
    const full = await PostGroupPost.findByPk(p.id, {
      include: postIncludes(),
    });
    res.json({ success: true, data: postDto(full) });
  } catch (err) {
    await t.rollback();
    console.error('❌ approvePost:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 6. DECLINE POST
//    POST /api/mobile/posts/:id/decline  { reason }
// ================================================================
exports.declinePost = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.userId;
    if (!isManager(req)) {
      await t.rollback();
      return res.status(403).json({ success: false, error: 'Manager only' });
    }
    const { reason } = req.body;
    if (!reason || !String(reason).trim()) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Reason required' });
    }

    const p = await PostGroupPost.findByPk(req.params.id, { transaction: t });
    if (!p) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    if (p.status === 'declined') {
      await t.rollback();
      return res.json({ success: true, message: 'Already declined' });
    }

    await p.update(
      {
        status: 'declined',
        reviewNote: String(reason).trim(),
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      { transaction: t }
    );

    await audit({
      actorId: userId,
      action: 'post.decline',
      targetType: 'post',
      targetId: p.id,
      groupId: p.groupId,
      metadata: { reason: String(reason).trim() },
    });

    await t.commit();
    const full = await PostGroupPost.findByPk(p.id, {
      include: postIncludes(),
    });
    res.json({ success: true, data: postDto(full) });
  } catch (err) {
    await t.rollback();
    console.error('❌ declinePost:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 7. MARK POST AS READ
//    POST /api/mobile/posts/:id/read
// ================================================================
exports.markPostRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const postId = req.params.id;

    const existing = await PostGroupPostRead.findOne({
      where: { postId, userId },
    });
    if (!existing) {
      await PostGroupPostRead.create({ postId, userId });
    }
    res.json({ success: true, data: { postId: Number(postId), read: true } });
  } catch (err) {
    console.error('❌ markPostRead:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 8. LIST COMMENTS
//    GET /api/mobile/posts/:id/comments
// ================================================================
exports.listComments = async (req, res) => {
  try {
    const comments = await PostGroupPostComment.findAll({
      where: { postId: req.params.id },
      include: [{ model: User, as: 'author', attributes: USER_ATTRS }],
      order: [['created_at', 'ASC']],
    });
    res.json({ success: true, data: { items: comments.map(commentDto) } });
  } catch (err) {
    console.error('❌ listComments:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 9. ADD COMMENT
//    POST /api/mobile/posts/:id/comments  { body }
// ================================================================
exports.addComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const postId = req.params.id;
    const { body } = req.body;

    if (!body || !String(body).trim()) {
      return res.status(400).json({ success: false, error: 'Body required' });
    }

    const post = await PostGroupPost.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const member = await isActiveMember(post.groupId, userId);
    if (!member && !isManager(req)) {
      return res
        .status(403)
        .json({ success: false, error: 'Not a member of this group' });
    }

    const comment = await PostGroupPostComment.create({
      postId,
      authorId: userId,
      body: String(body).trim(),
    });

    await audit({
      actorId: userId,
      action: 'comment.create',
      targetType: 'comment',
      targetId: comment.id,
      groupId: post.groupId,
    });

    const fresh = await PostGroupPostComment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: USER_ATTRS }],
    });
    res.status(201).json({ success: true, data: commentDto(fresh) });
  } catch (err) {
    console.error('❌ addComment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 10. ANNOTATE POST IMAGE
//     POST /api/mobile/posts/:id/images/:imageId/annotate
//     multipart/form-data: image (single file)
// ================================================================
// ================================================================
// 10. ANNOTATE POST IMAGE
//     POST /api/mobile/posts/:id/images/:imageId/annotate
//     multipart/form-data: image (single file)
//
//     The new file REPLACES the original image row in place,
//     so the post keeps one image per slot — the annotated version.
// ================================================================
exports.annotatePostImage = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.userId;
    const { id: postId, imageId } = req.params;

    if (!isManager(req)) {
      await t.rollback();
      return res.status(403).json({ success: false, error: 'Manager only' });
    }

    const file = (req.files && req.files[0]) || req.file;
    if (!file) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: 'Annotated image required' });
    }

    const original = await PostGroupPostImage.findOne({
      where: { id: imageId, postId },
      transaction: t,
    });
    if (!original) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, error: 'Original image not found' });
    }

    const post = await PostGroupPost.findByPk(postId, { transaction: t });
    if (!post) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Remember the old file so we can delete it from disk after commit.
    const oldUrl = original.url;

    // ─── REPLACE IN PLACE ────────────────────────────────────────
    // Keep the same row id, keep the same orderIndex, keep the same
    // slot in the gallery. Only swap the file behind it.
    await original.update(
      {
        url: `/uploads/posts/${file.filename}`,
        // Clear any previous annotation link — this row is now the
        // canonical (already-annotated) image.
        annotatedFromId: null,
      },
      { transaction: t }
    );

    await audit({
      actorId: userId,
      action: 'image.annotate',
      targetType: 'image',
      targetId: original.id,
      groupId: post.groupId,
      metadata: { replaced: oldUrl },
    });

    await t.commit();

    // ─── CLEAN UP THE OLD FILE ───────────────────────────────────
    // Best-effort — if it fails, it's just a stray file on disk,
    // not a data integrity problem.
    if (oldUrl && oldUrl.startsWith('/uploads/posts/')) {
      const path = require('path');
      const fs = require('fs');
      const fileName = oldUrl.replace('/uploads/posts/', '');
      const fullPath = path.join(process.cwd(), 'uploads', 'posts', fileName);
      fs.unlink(fullPath, (err) => {
        if (err) {
          console.warn('Could not delete old post image:', fullPath, err.message);
        } else {
          console.log('🗑️ Deleted old post image:', fullPath);
        }
      });
    }

    res.status(200).json({
      success: true,
      data: imageDto(original),
    });
  } catch (err) {
    await t.rollback();
    console.error('❌ annotatePostImage:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};