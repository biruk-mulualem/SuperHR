// super-app/src/stores/mobilePostsPostService.js
import api from './interceptor';

// ============================================================================
// HELPER — build multipart config that works with the global interceptor
// ============================================================================
// The shared axios instance in interceptor.js sets a default
// `Content-Type: application/json`. When we send a FormData, we must let the
// platform set `multipart/form-data; boundary=...` itself, or multer on the
// server cannot parse the body. This helper:
//   1. Removes the JSON content type for this specific request.
//   2. Prevents axios from JSON-stringifying the FormData.
//   3. Leaves everything else (auth, baseURL, etc.) to the interceptor.
const multipartConfig = () => ({
  // Delete the default header — the platform will fill in the correct
  // multipart value WITH the boundary on its own.
  headers: { 'Content-Type': undefined },
  transformRequest: (data) => data,
});

export const mobilePostsPostService = {
  // ==========================================================================
  // POSTS
  // ==========================================================================

  /**
   * List posts in a group.
   * GET {API_BASE}/mobile/posts/groups/:groupId/posts
   */
  listGroupPosts: async (groupId, opts = {}) => {
    const { status, search = '', page = 1, limit = 20 } = opts;
    const params = { search, page, limit };
    if (status) params.status = status;
    const response = await api.get(`/mobile/posts/groups/${groupId}/posts`, {
      params,
    });
    return response.data;
  },

  /**
   * Get a single post (includes comments).
   * GET {API_BASE}/mobile/posts/:id
   */
  getPost: async (postId) => {
    const response = await api.get(`/mobile/posts/${postId}`);
    return response.data;
  },

  /**
   * Create a post with optional images (multipart).
   * POST {API_BASE}/mobile/posts/groups/:groupId/posts
   *
   * @param {number|string} groupId
   * @param {{ title: string, body?: string, images?: Array<{ uri: string, name?: string, type?: string }> }} payload
   */
  createPost: async (groupId, payload) => {
    const form = new FormData();
    form.append('title', payload.title);
    if (payload.body) form.append('body', payload.body);

    const files = payload.images || [];
    files.forEach((file, i) => {
      form.append('images', {
        uri: file.uri,
        name: file.name || `image_${i}.jpg`,
        type: file.type || 'image/jpeg',
      });
    });

    const response = await api.post(
      `/mobile/posts/groups/${groupId}/posts`,
      form,
      multipartConfig()
    );
    return response.data;
  },

  /**
   * Delete a post (author within 5 min, or owner, or manager).
   * DELETE {API_BASE}/mobile/posts/:id
   */
  deletePost: async (postId) => {
    const response = await api.delete(`/mobile/posts/${postId}`);
    return response.data;
  },

  /**
   * Approve a post (manager only, note required).
   * POST {API_BASE}/mobile/posts/:id/approve
   */
  approvePost: async (postId, note) => {
    const response = await api.post(`/mobile/posts/${postId}/approve`, { note });
    return response.data;
  },

  /**
   * Decline a post (manager only, reason required).
   * POST {API_BASE}/mobile/posts/:id/decline
   */
  declinePost: async (postId, reason) => {
    const response = await api.post(`/mobile/posts/${postId}/decline`, {
      reason,
    });
    return response.data;
  },

  /**
   * Mark a post as read by the current user.
   * POST {API_BASE}/mobile/posts/:id/read
   */
  markPostRead: async (postId) => {
    const response = await api.post(`/mobile/posts/${postId}/read`);
    return response.data;
  },

  // ==========================================================================
  // COMMENTS
  // ==========================================================================

  /**
   * List comments on a post.
   * GET {API_BASE}/mobile/posts/:id/comments
   */
  listComments: async (postId) => {
    const response = await api.get(`/mobile/posts/${postId}/comments`);
    return response.data;
  },

  /**
   * Add a comment to a post.
   * POST {API_BASE}/mobile/posts/:id/comments
   */
  addComment: async (postId, body) => {
    const response = await api.post(`/mobile/posts/${postId}/comments`, {
      body,
    });
    return response.data;
  },

  // ==========================================================================
  // IMAGE ANNOTATION
  // ==========================================================================

  /**
   * Attach an annotated version of a post image (manager only).
   * POST {API_BASE}/mobile/posts/:id/images/:imageId/annotate
   *
   * @param {number|string} postId
   * @param {number|string} imageId
   * @param {{ uri: string, name?: string, type?: string }} file
   */
  annotatePostImage: async (postId, imageId, file) => {
    const form = new FormData();
    form.append('image', {
      uri: file.uri,
      name: file.name || 'annotated.jpg',
      type: file.type || 'image/jpeg',
    });

    const response = await api.post(
      `/mobile/posts/${postId}/images/${imageId}/annotate`,
      form,
      multipartConfig()
    );
    return response.data;
  },
};

export default mobilePostsPostService;