const StoreSettings = require('../models/StoreSettings');

// GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne({
      uuid: 'store-settings-singleton',
    })
      .select('-__v')
      .lean();

    // If no settings exist yet, create default
    if (!settings) {
      settings = await StoreSettings.create({
        uuid: 'store-settings-singleton',
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    const settings = await StoreSettings.findOneAndUpdate(
      { uuid: 'store-settings-singleton' },
      {
        ...req.body,
        uuid: 'store-settings-singleton', // Prevent uuid change
        updatedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};