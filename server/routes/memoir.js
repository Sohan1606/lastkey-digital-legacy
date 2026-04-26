const express = require('express');
const { protect } = require('../middleware/auth');
const Memoir = require('../models/Memoir');

const router = express.Router();

// GET all chapters for user
router.get('/', protect, async (req, res) => {
  try {
    const chapters = await Memoir
      .find({ owner: req.user._id })
      .sort({ order: 1, createdAt: 1 })
      .lean()
    
    return res.status(200).json({
      status: 'success',
      data: chapters
    })
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

// POST create new chapter
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, wordCount } = req.body
    
    const chapterCount = await Memoir.countDocuments({
      owner: req.user._id
    })
    
    const chapter = await Memoir.create({
      owner: req.user._id,
      title: title || `Chapter ${chapterCount + 1}`,
      content: content || '',
      wordCount: wordCount || 0,
      order: chapterCount
    })
    
    return res.status(201).json({
      status: 'success',
      data: chapter
    })
  } catch (error) {
    console.error('Create chapter error:', error.message)
    return res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

// PUT update chapter
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, content, wordCount } = req.body
    
    const chapter = await Memoir.findOneAndUpdate(
      { 
        _id: req.params.id, 
        owner: req.user._id 
      },
      { 
        title,
        content,
        wordCount: wordCount || 0
      },
      { returnDocument: 'after' }
    )
    
    if (!chapter) {
      return res.status(404).json({
        status: 'fail',
        message: 'Chapter not found'
      })
    }
    
    return res.status(200).json({
      status: 'success',
      data: chapter
    })
  } catch (error) {
    console.error('Update chapter error:', error.message)
    return res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

// DELETE chapter
router.delete('/:id', protect, async (req, res) => {
  try {
    await Memoir.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    })
    
    return res.status(200).json({
      status: 'success',
      message: 'Chapter deleted'
    })
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

module.exports = router
