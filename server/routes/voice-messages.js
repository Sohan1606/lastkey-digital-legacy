const express = require('express');
const { protect } = require('../middleware/auth');
const VoiceMessage = require('../models/VoiceMessage');

const router = express.Router();

// GET all voice messages for user
router.get('/', protect, async (req, res) => {
  try {
    const messages = await VoiceMessage
      .find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .lean()
    
    return res.status(200).json({
      status: 'success',
      data: messages
    })
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

// POST create new voice message
router.post('/', protect, async (req, res) => {
  try {
    const { 
      title, 
      recipientName, 
      audioData,
      audioUrl,
      duration,
      mimeType,
      transcript
    } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Title is required'
      })
    }

    const voiceMessage = await VoiceMessage.create({
      owner: req.user._id,
      title: title.trim(),
      recipientName: recipientName || '',
      audioData: audioData || '',
      audioUrl: audioUrl || '',
      duration: duration || 0,
      mimeType: mimeType || 'audio/webm',
      transcript: transcript || ''
    })

    return res.status(201).json({
      status: 'success',
      data: voiceMessage
    })
  } catch (error) {
    console.error('Create voice message error:', 
      error.message)
    return res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

// DELETE voice message
router.delete('/:id', protect, async (req, res) => {
  try {
    await VoiceMessage.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    })
    
    return res.status(200).json({
      status: 'success',
      message: 'Voice message deleted'
    })
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

module.exports = router
