// controllers/Mobile/mobilePostController.js
'use strict';

const { Op } = require('sequelize');
const db = require('../../models');

// ✨ Socket.IO emit helpers
const { emitToGroup, emitToPost } = require('../../socket');

const {
  PostGroup,
  PostGroupMember,
  PostGroupPost,
  PostGroupPostImage,
  PostGroupPostComment,
  PostGroupPostRead,
  PostGroupAuditLog,
  User,
  MobileNotification,
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

// ✅ commentDto now includes editedAt
const commentDto = (c) => ({
  id: c.id,
  author: c.author?.fullName || c.author?.username || 'Unknown',
  authorId: c.authorId,
  body: c.body,
  createdAt: c.created_at || c.createdAt,
  editedAt: c.editedAt || c.edited_at || null,
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
// NOTIFICATION HELPERS
// ================================================================
const safeNotify = async (fn) => {
  try {
    return await fn();
  } catch (e) {
    console.error('❌ post notification failed:', e.message);
  }
};

const getGroupMemberIdsExcept = async (groupId, excludeIds = []) => {
  const excludeSet = new Set(
    (Array.isArray(excludeIds) ? excludeIds : [excludeIds])
      .filter((id) => id != null)
      .map((id) => String(id))
  );

  const rows = await PostGroupMember.findAll({
    where: { groupId, status: 'active' },
    attributes: ['userId'],
    raw: true,
  });

  return rows
    .map((r) => r.userId)
    .filter((id) => !excludeSet.has(String(id)));
};

// Safe socket emit wrapper — never crash the request
const safeEmit = (fn) => {
  try {
    fn();
  } catch (e) {
    console.warn('[socket] emit failed:', e.message);
  }
};

// ================================================================
// 1. LIST POSTS IN GROUP
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
          raw: true,
        })
      : [];
    const readSet = new Set(readRows.map((r) => String(r.postId)));

    const commentCounts = postIds.length
      ? await PostGroupPostComment.findAll({
          attributes: [
            ['post_id', 'postId'],
            [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'cnt'],
          ],
          where: { postId: { [Op.in]: postIds } },
          group: ['post_id'],
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
//    emits: post:new
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
    const dto = postDto(full, { commentCount: 0, unread: true });

    safeEmit(() => emitToGroup(groupId, 'post:new', dto));

    await safeNotify(async () => {
      const recipientIds = await getGroupMemberIdsExcept(groupId, [userId]);
      if (recipientIds.length === 0) return;

      const group = await PostGroup.findByPk(groupId, {
        attributes: ['id', 'name'],
      });
      const author = await User.findByPk(userId, { attributes: USER_ATTRS });
      const authorName = author?.fullName || author?.username || 'Someone';

      await MobileNotification.posts.postSubmitted({
        recipientIds,
        postId: post.id,
        groupId: Number(groupId),
        groupName: group?.name || 'a group',
        authorName,
        title: post.title,
      });
    });

    res.status(201).json({ success: true, data: dto });
  } catch (err) {
    await t.rollback();
    console.error('❌ createPost:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 4. DELETE POST
//    emits: post:deleted
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

    const deletedGroupId = p.groupId;
    const deletedPostId = p.id;

    await PostGroupPost.destroy({ where: { id: p.id }, transaction: t });
    await audit({
      actorId: userId,
      action: 'post.delete',
      targetType: 'post',
      targetId: p.id,
      groupId: p.groupId,
    });
    await t.commit();

    safeEmit(() =>
      emitToGroup(deletedGroupId, 'post:deleted', { id: deletedPostId })
    );

    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    await t.rollback();
    console.error('❌ deletePost:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 5. APPROVE POST
//    emits: post:updated
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
    const dto = postDto(full);

    safeEmit(() => emitToGroup(p.groupId, 'post:updated', dto));

    await safeNotify(async () => {
      if (Number(p.authorId) === Number(userId)) return;

      const group = await PostGroup.findByPk(p.groupId, {
        attributes: ['id', 'name'],
      });

      await MobileNotification.posts.postApproved({
        recipientId: p.authorId,
        postId: p.id,
        groupId: Number(p.groupId),
        groupName: group?.name || 'a group',
        title: p.title,
        note: String(note).trim(),
      });
    });

    res.json({ success: true, data: dto });
  } catch (err) {
    await t.rollback();
    console.error('❌ approvePost:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 6. DECLINE POST
//    emits: post:updated
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
    const dto = postDto(full);

    safeEmit(() => emitToGroup(p.groupId, 'post:updated', dto));

    await safeNotify(async () => {
      if (Number(p.authorId) === Number(userId)) return;

      const group = await PostGroup.findByPk(p.groupId, {
        attributes: ['id', 'name'],
      });

      await MobileNotification.posts.postDeclined({
        recipientId: p.authorId,
        postId: p.id,
        groupId: Number(p.groupId),
        groupName: group?.name || 'a group',
        title: p.title,
        reason: String(reason).trim(),
      });
    });

    res.json({ success: true, data: dto });
  } catch (err) {
    await t.rollback();
    console.error('❌ declinePost:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 7. MARK POST AS READ
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
//    emits: comment:new (post room + group room)
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
    const dto = commentDto(fresh);

    safeEmit(() => {
      const payload = { postId: Number(postId), comment: dto };
      emitToPost(postId, 'comment:new', payload);
      emitToGroup(post.groupId, 'comment:new', payload);
    });

    await safeNotify(async () => {
      const recipientIds = await getGroupMemberIdsExcept(post.groupId, [userId]);
      if (recipientIds.length === 0) return;

      const group = await PostGroup.findByPk(post.groupId, {
        attributes: ['id', 'name'],
      });
      const me = await User.findByPk(userId, { attributes: USER_ATTRS });
      const commenterName = me?.fullName || me?.username || 'Someone';
      const trimmed = String(body).trim();
      const snippet =
        trimmed.length > 80 ? trimmed.slice(0, 77).trimEnd() + '…' : trimmed;

      await MobileNotification.notifyMany(recipientIds, {
        purchaseType: 'posts',
        type: 'posts.post_comment',
        title: '💬 New comment',
        body: `${commenterName} commented on "${post.title}" in ${
          group?.name || 'a group'
        }: "${snippet}"`,
        referenceId: post.id,
        referenceType: 'post_group_post',
        metadata: {
          postId: post.id,
          groupId: Number(post.groupId),
          groupName: group?.name,
          commenterName,
        },
      });
    });

    res.status(201).json({ success: true, data: dto });
  } catch (err) {
    console.error('❌ addComment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 10. ANNOTATE POST IMAGE
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

    const oldUrl = original.url;

    await original.update(
      {
        url: `/uploads/posts/${file.filename}`,
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

    safeEmit(() =>
      emitToGroup(post.groupId, 'post:image-updated', {
        postId: Number(postId),
        image: imageDto(original),
      })
    );

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

// ================================================================
// 11. EDIT COMMENT
//     PATCH /api/mobile/posts/:postId/comments/:commentId
//     body: { body }
//     emits: comment:updated (post room + group room)
// ================================================================
exports.editComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId, commentId } = req.params;
    const { body } = req.body;

    if (!body || !String(body).trim()) {
      return res.status(400).json({ success: false, error: 'Body required' });
    }

    const comment = await PostGroupPostComment.findOne({
      where: { id: commentId, postId },
    });
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // Only the author can edit
    if (Number(comment.authorId) !== Number(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Only the author can edit this comment',
      });
    }

    const post = await PostGroupPost.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const trimmed = String(body).trim();
    if (trimmed === comment.body) {
      const fresh = await PostGroupPostComment.findByPk(comment.id, {
        include: [{ model: User, as: 'author', attributes: USER_ATTRS }],
      });
      return res.json({ success: true, data: commentDto(fresh) });
    }

    await comment.update({
      body: trimmed,
      editedAt: new Date(),
    });

    await audit({
      actorId: userId,
      action: 'comment.edit',
      targetType: 'comment',
      targetId: comment.id,
      groupId: post.groupId,
    });

    const fresh = await PostGroupPostComment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: USER_ATTRS }],
    });
    const dto = commentDto(fresh);

    safeEmit(() => {
      const payload = { postId: Number(postId), comment: dto };
      emitToPost(postId, 'comment:updated', payload);
      emitToGroup(post.groupId, 'comment:updated', payload);
    });

    res.json({ success: true, data: dto });
  } catch (err) {
    console.error('❌ editComment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 12. DELETE COMMENT
//     DELETE /api/mobile/posts/:postId/comments/:commentId
//     emits: comment:deleted (post room + group room)
// ================================================================
exports.deleteComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId, commentId } = req.params;

    const comment = await PostGroupPostComment.findOne({
      where: { id: commentId, postId },
    });
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    const post = await PostGroupPost.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const isAuthor = Number(comment.authorId) === Number(userId);
    const isOwner = await isOwnerOfGroup(post.groupId, userId);
    const canDelete = isManager(req) || isOwner || isAuthor;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'You cannot delete this comment',
      });
    }

    const deletedCommentId = comment.id;
    const deletedGroupId = post.groupId;

    await comment.destroy();

    await audit({
      actorId: userId,
      action: 'comment.delete',
      targetType: 'comment',
      targetId: deletedCommentId,
      groupId: deletedGroupId,
    });

    safeEmit(() => {
      const payload = {
        postId: Number(postId),
        commentId: Number(deletedCommentId),
      };
      emitToPost(postId, 'comment:deleted', payload);
      emitToGroup(deletedGroupId, 'comment:deleted', payload);
    });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    console.error('❌ deleteComment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};