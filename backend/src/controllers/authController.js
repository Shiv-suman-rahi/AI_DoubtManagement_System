import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { FacultyProfile } from '../models/FacultyProfile.js';
import { generateTokens, verifyRefreshToken } from '../utils/token.js';
import { logAudit } from '../services/auditService.js';
import { AUDIT_ACTIONS, ROLES } from '../config/constants.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status}. Please contact the college administrator.`
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    const tokens = generateTokens(user);

    // Retrieve profile details based on role
    let profile = null;
    if (user.role === ROLES.STUDENT) {
      profile = await StudentProfile.findOne({ user: user._id }).populate('currentClassroom');
    } else if (user.role === ROLES.FACULTY) {
      profile = await FacultyProfile.findOne({ user: user._id }).populate('department');
    }

    await logAudit({
      actorId: user._id,
      action: AUDIT_ACTIONS.USER_LOGIN,
      modelName: 'User',
      resourceId: user._id,
      details: { role: user.role, email: user.email },
      req
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        profile
      },
      tokens
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    const tokens = generateTokens(user);
    res.json({ success: true, tokens });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = req.user;
    let profile = null;

    if (user.role === ROLES.STUDENT) {
      profile = await StudentProfile.findOne({ user: user._id }).populate('currentClassroom');
    } else if (user.role === ROLES.FACULTY) {
      profile = await FacultyProfile.findOne({ user: user._id }).populate('department');
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res) {
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  // Generic safe message to avoid email enumeration
  res.json({
    success: true,
    message: 'If the provided email belongs to an active account, a password reset procedure has been initiated.'
  });
}
