const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            next();
        } catch (error) { res.status(401).json({ message: 'Not authorized' }); }
    } else { res.status(401).json({ message: 'Not authorized, no token' }); }
};

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', protect, notificationController.getNotifications);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, notificationController.markAsRead);

// @route   DELETE /api/notifications/all-read
// @desc    Delete all read notifications
// @access  Private
router.delete('/all-read', protect, notificationController.deleteReadNotifications);

// @route   DELETE /api/notifications/:id
// @desc    Delete single notification
// @access  Private
router.delete('/:id', protect, notificationController.deleteNotification);

module.exports = router;
