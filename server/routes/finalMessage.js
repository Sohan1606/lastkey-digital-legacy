const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Capsule = require('../models/Capsule');

// Store a final message as a capsule with metadata
router.post('/', protect, async (req, res) => {
  try {
    const { beneficiaryId, message, attachedAssetIds, attachedCapsuleIds, triggerType, triggerDate } = req.body;

    // Calculate unlock date based on trigger type
    let unlockAt;
    if (triggerType === 'date' && triggerDate) {
      unlockAt = new Date(triggerDate);
    } else {
      // For inactivity trigger, set a far future date (will be updated when triggered)
      unlockAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years from now
    }

    const capsule = await Capsule.create({
      userId: req.user._id,
      title: 'Final Message',
      message: message,
      content: message,
      recipient: beneficiaryId,
      isFinalMessage: true,
      attachedAssets: attachedAssetIds || [],
      attachedCapsules: attachedCapsuleIds || [],
      triggerType: triggerType || 'inactivity',
      unlockAt: unlockAt,
      isReleased: false,
    });

    res.status(201).json({ success: true, data: capsule });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get all final messages for the current user
router.get('/', protect, async (req, res) => {
  try {
    const finalMessages = await Capsule.find({
      userId: req.user._id,
      isFinalMessage: true
    }).populate('recipient', 'name email relationship').sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: finalMessages });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete a final message
router.delete('/:id', protect, async (req, res) => {
  try {
    const capsule = await Capsule.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
      isFinalMessage: true
    });

    if (!capsule) {
      return res.status(404).json({ success: false, message: 'Final message not found' });
    }

    res.status(200).json({ success: true, message: 'Final message deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
