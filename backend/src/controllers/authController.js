import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { logAudit } from '../services/auditService.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || email.trim() === '') {
      return res.status(400).json({ message: 'Please enter your email address.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (!password || password.trim() === '') {
      return res.status(400).json({ message: 'Please enter your password.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'enterprise_asset_management_jwt_super_secret_key_2026_xyz',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await logAudit({
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      details: `User logged in: ${user.email}`,
      performedBy: user.id
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    next(error);
  }
}
