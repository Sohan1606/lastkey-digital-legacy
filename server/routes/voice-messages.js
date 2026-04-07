const express = require('express');
const { protect } = require('../middleware/auth');
const VoiceMessage = require('../models/VoiceMessage');

const router = express.Router();

// Get all voice messages for user
router.get('/', protect, async (req, res) => {
  try {
    const messages = await VoiceMessage.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get voice messages error:', error);
    res.status(500).json({ error: 'Failed to fetch voice messages' });
  }
});

// Save new voice message
router.post('/', protect, async (req, res) => {
  try {
    const { title, recipient, text, voice, emotion, audioUrl, duration } = req.body;
    
    const newMessage = new VoiceMessage({
      userId: req.user._id,
      title,
      recipient,
      text,
      voice,
      emotion,
      audioUrl,
      duration
    });
    
    await newMessage.save();
    
    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    console.error('Save voice message error:', error);
    res.status(500).json({ error: 'Failed to save voice message' });
  }
});

// Update voice message
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, recipient, text, voice, emotion, audioUrl, duration } = req.body;
    
    const updatedMessage = await VoiceMessage.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { 
        title, 
        recipient, 
        text, 
        voice, 
        emotion, 
        audioUrl, 
        duration,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedMessage) {
      return res.status(404).json({ error: 'Voice message not found' });
    }
    
    res.json({
      success: true,
      data: updatedMessage
    });
  } catch (error) {
    console.error('Update voice message error:', error);
    res.status(500).json({ error: 'Failed to update voice message' });
  }
});

// Delete voice message
router.delete('/:id', protect, async (req, res) => {
  try {
    const deletedMessage = await VoiceMessage.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!deletedMessage) {
      return res.status(404).json({ error: 'Voice message not found' });
    }
    
    res.json({
      success: true,
      message: 'Voice message deleted successfully'
    });
  } catch (error) {
    console.error('Delete voice message error:', error);
    res.status(500).json({ error: 'Failed to delete voice message' });
  }
});

module.exports = router;
