const express = require('express');
const { protect } = require('../middleware/auth');
const Memoir = require('../models/Memoir');

const router = express.Router();

// Get all memoir chapters for user
router.get('/', protect, async (req, res) => {
  try {
    const chapters = await Memoir.find({ userId: req.user._id }).sort({ createdAt: 1 });
    res.json({
      success: true,
      data: chapters
    });
  } catch (error) {
    console.error('Get memoir chapters error:', error);
    res.status(500).json({ error: 'Failed to fetch memoir chapters' });
  }
});

// Save new memoir chapter
router.post('/', protect, async (req, res) => {
  try {
    const { title, stage, chapter, wordCount } = req.body;
    
    const newChapter = new Memoir({
      userId: req.user._id,
      title,
      stage,
      chapter,
      wordCount: wordCount || 0
    });
    
    await newChapter.save();
    
    res.status(201).json({
      success: true,
      data: newChapter
    });
  } catch (error) {
    console.error('Save memoir chapter error:', error);
    res.status(500).json({ error: 'Failed to save memoir chapter' });
  }
});

// Update memoir chapter
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, stage, chapter, wordCount } = req.body;
    
    const updatedChapter = await Memoir.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { 
        title, 
        stage, 
        chapter, 
        wordCount: wordCount || 0,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedChapter) {
      return res.status(404).json({ error: 'Memoir chapter not found' });
    }
    
    res.json({
      success: true,
      data: updatedChapter
    });
  } catch (error) {
    console.error('Update memoir chapter error:', error);
    res.status(500).json({ error: 'Failed to update memoir chapter' });
  }
});

// Delete memoir chapter
router.delete('/:id', protect, async (req, res) => {
  try {
    const deletedChapter = await Memoir.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!deletedChapter) {
      return res.status(404).json({ error: 'Memoir chapter not found' });
    }
    
    res.json({
      success: true,
      message: 'Memoir chapter deleted successfully'
    });
  } catch (error) {
    console.error('Delete memoir chapter error:', error);
    res.status(500).json({ error: 'Failed to delete memoir chapter' });
  }
});

module.exports = router;
