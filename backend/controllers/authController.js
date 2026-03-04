const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, preferences } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      preferences: preferences || [],
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        avatar: user.avatar,
        onboardingCompleted: user.onboardingCompleted,
        explicitPreferences: user.explicitPreferences,
        interactionCount: user.interactionCount,
        categoryWeights: user.categoryWeights,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        avatar: user.avatar,
        onboardingCompleted: user.onboardingCompleted,
        explicitPreferences: user.explicitPreferences,
        interactionCount: user.interactionCount,
        categoryWeights: user.categoryWeights,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Google OAuth - login or auto-register
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'No Google credential provided' });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find existing user by email or googleId
    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (!user) {
      // New user — register them automatically via Google
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture || '',
        preferences: [],
      });
    } else {
      // Existing user — link their Google account if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
      }
      await user.save();
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      avatar: user.avatar,
      onboardingCompleted: user.onboardingCompleted,
      explicitPreferences: user.explicitPreferences,
      interactionCount: user.interactionCount,
      categoryWeights: user.categoryWeights,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    res.status(401).json({ message: 'Invalid Google credential' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleAuth,
};
