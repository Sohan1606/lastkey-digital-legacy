const express = require('express');
const { protect } = require('../middleware/auth');
const Timeline = require('../models/Timeline');

const router = express.Router();

// Get all timeline events for user
router.get('/', protect, async (req, res) => {
  try {
    const events = await Timeline.find({ userId: req.user._id }).sort({ date: 1 });
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get timeline events error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline events' });
  }
});

// Create new timeline event
router.post('/', protect, async (req, res) => {
  try {
    const { title, date, description, category, location, photos } = req.body;
    
    const newEvent = new Timeline({
      userId: req.user._id,
      title,
      date,
      description,
      category,
      location,
      photos: photos || []
    });
    
    await newEvent.save();
    
    res.status(201).json({
      success: true,
      data: newEvent
    });
  } catch (error) {
    console.error('Create timeline event error:', error);
    res.status(500).json({ error: 'Failed to create timeline event' });
  }
});

// Update timeline event
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, date, description, category, location, photos } = req.body;
    
    const updatedEvent = await Timeline.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { 
        title, 
        date, 
        description, 
        category, 
        location, 
        photos: photos || [],
        updatedAt: new Date()
      },
      { returnDocument: 'after' }
    );
    
    if (!updatedEvent) {
      return res.status(404).json({ error: 'Timeline event not found' });
    }
    
    res.json({
      success: true,
      data: updatedEvent
    });
  } catch (error) {
    console.error('Update timeline event error:', error);
    res.status(500).json({ error: 'Failed to update timeline event' });
  }
});

// Delete timeline event
router.delete('/:id', protect, async (req, res) => {
  try {
    const deletedEvent = await Timeline.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!deletedEvent) {
      return res.status(404).json({ error: 'Timeline event not found' });
    }
    
    res.json({
      success: true,
      message: 'Timeline event deleted successfully'
    });
  } catch (error) {
    console.error('Delete timeline event error:', error);
    res.status(500).json({ error: 'Failed to delete timeline event' });
  }
});

module.exports = router;
