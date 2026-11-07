import express from 'express';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { profileSchema } from '../schemas/validationSchemas.js';

const router = express.Router();

// GET /api/profile
router.get('/', authMiddleware, (req, res) => {
  const profile = db.findOne('profiles', p => String(p.userId) === String(req.user.id));
  if (!profile) {
    return res.json({
      success: true,
      message: 'No profile found. Please create one.',
      data: null
    });
  }
  return res.json({
    success: true,
    data: profile
  });
});

// GET /api/profile/exists
router.get('/exists', authMiddleware, (req, res) => {
  const profile = db.findOne('profiles', p => String(p.userId) === String(req.user.id));
  return res.json({
    success: true,
    data: {
      exists: !!profile,
      isComplete: profile ? !!profile.profileComplete : false
    }
  });
});

// POST or PUT /api/profile
const saveProfileHandler = (req, res) => {
  try {
    const userId = req.user.id;
    const {
      category,
      state,
      district,
      occupation,
      incomeRange,
      educationLevel,
      course,
      currentYear,
      instituteName,
      farmingType,
      cropActivity,
      landArea,
      landOwnership,
      businessType,
      businessStage,
      msmeStatus,
      businessDescription,
      disabilityStatus,
      inHandDocuments
    } = req.body;

    const existingProfile = db.findOne('profiles', p => String(p.userId) === String(userId));

    const profileData = {
      userId,
      category,
      state: state.trim(),
      district: district ? district.trim() : null,
      occupation: occupation ? occupation.trim() : null,
      incomeRange,
      educationLevel: educationLevel || null,
      course: course || null,
      currentYear: currentYear ? Number(currentYear) : null,
      instituteName: instituteName || null,
      farmingType: farmingType || null,
      cropActivity: cropActivity || null,
      landArea: landArea !== undefined && landArea !== null ? parseFloat(landArea) : null,
      landOwnership: landOwnership || null,
      businessType: businessType || null,
      businessStage: businessStage || null,
      msmeStatus: msmeStatus || null,
      businessDescription: businessDescription || null,
      disabilityStatus: disabilityStatus || 'NONE',
      inHandDocuments: inHandDocuments || [],
      profileComplete: true,
      updatedAt: new Date().toISOString()
    };

    let result;
    if (existingProfile) {
      result = db.update('profiles', existingProfile.id, profileData);
    } else {
      result = db.insert('profiles', profileData);
    }

    // Invalidate cached recommendations for this user so fresh ones are computed
    const userRecs = db.find('recommendations', r => String(r.userId) === String(userId));
    userRecs.forEach(r => db.delete('recommendations', r.id));

    return res.json({
      success: true,
      message: 'Citizen profile saved successfully',
      data: result
    });
  } catch (err) {
    console.error('[Profile] Save error:', err);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Server error while saving profile'
    });
  }
};

router.post('/', authMiddleware, validate(profileSchema), saveProfileHandler);
router.put('/', authMiddleware, validate(profileSchema), saveProfileHandler);

export default router;
