const { PastorGift } = require('../models');

// Add pastor gift for a week
exports.addPastorGift = async (req, res) => {
  try {
    const { weekDate, amount, notes } = req.body;
    
    // Calculate week start (Sunday) from the provided date
    const date = new Date(weekDate);
    const day = date.getDay();
    const diff = date.getDate() - day;
    const weekStart = new Date(date.setDate(diff));
    const weekStartString = weekStart.toISOString().split('T')[0];
    
    // Check if pastor gift already exists for this week
    const existing = await PastorGift.findOne({
      where: { weekDate: weekStartString }
    });
    
    if (existing) {
      return res.status(400).json({ 
        error: 'Pastor gift already recorded for this week. Please update the existing record.' 
      });
    }
    
    const pastorGift = await PastorGift.create({
      weekDate: weekStartString,
      amount: parseFloat(amount),
      notes: notes || '',
      enteredBy: req.user.id
    });
    
    res.status(201).json({
      message: 'Pastor gift recorded successfully',
      pastorGift
    });
  } catch (error) {
    console.error('Error adding pastor gift:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get pastor gifts for a date range
exports.getPastorGifts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.weekDate = {
        [require('sequelize').Op.between]: [startDate, endDate]
      };
    }
    
    const pastorGifts = await PastorGift.findAll({
      where: whereClause,
      order: [['weekDate', 'DESC']]
    });
    
    res.json(pastorGifts);
  } catch (error) {
    console.error('Error fetching pastor gifts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update pastor gift
exports.updatePastorGift = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;
    
    const pastorGift = await PastorGift.findByPk(id);
    if (!pastorGift) {
      return res.status(404).json({ error: 'Pastor gift not found' });
    }
    
    await pastorGift.update({
      amount: parseFloat(amount),
      notes: notes || pastorGift.notes
    });
    
    res.json({
      message: 'Pastor gift updated successfully',
      pastorGift
    });
  } catch (error) {
    console.error('Error updating pastor gift:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete pastor gift
exports.deletePastorGift = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pastorGift = await PastorGift.findByPk(id);
    if (!pastorGift) {
      return res.status(404).json({ error: 'Pastor gift not found' });
    }
    
    await pastorGift.destroy();
    
    res.json({ message: 'Pastor gift deleted successfully' });
  } catch (error) {
    console.error('Error deleting pastor gift:', error);
    res.status(500).json({ error: error.message });
  }
};