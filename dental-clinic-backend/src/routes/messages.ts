import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as messageController from '../controllers/messages';
import { authenticate, isStaff } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all messages for current user
router.get(
  '/',
  [
    query('type').optional().isIn(['inbox', 'sent']),
    query('isRead').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  messageController.getMessages
);

// Get available contacts for messaging
router.get('/contacts', messageController.getMessageContacts);

// Get unread count
router.get('/unread/count', messageController.getUnreadCount);

// Get message by ID
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Valid message ID is required')],
  messageController.getMessageById
);

// Send message
router.post(
  '/',
  [
    body('recipientId').isUUID().withMessage('Valid recipient ID is required'),
    body('subject').notEmpty().trim().withMessage('Subject is required'),
    body('content').notEmpty().trim().withMessage('Content is required'),
    body('parentId').optional().isUUID(),
  ],
  messageController.sendMessage
);

// Mark message as read
router.patch(
  '/:id/read',
  [param('id').isUUID().withMessage('Valid message ID is required')],
  messageController.markAsRead
);

// Delete message
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Valid message ID is required')],
  messageController.deleteMessage
);

export default router;
