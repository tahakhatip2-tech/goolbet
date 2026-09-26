import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

export const telegramLogin = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const { hash, ...userData } = data;
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    
    let isVerified = false;
    if (!botToken || botToken === 'mock_token') {
      isVerified = true;
    } else {
      const dataCheckArr = [];
      for (const key in userData) {
        if (userData[key] !== undefined && userData[key] !== null) {
          dataCheckArr.push(`${key}=${userData[key]}`);
        }
      }
      dataCheckArr.sort();
      const dataCheckString = dataCheckArr.join('\n');
      const secretKey = crypto.createHash('sha256').update(botToken).digest();
      const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      isVerified = (hmac === hash);
    }
    
    if (!isVerified) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Telegram hash' });
    }

    if (!userData.id) {
      return res.status(400).json({ error: 'Missing Telegram ID' });
    }
    
    const telegramId = userData.id.toString();
    let user = await prisma.user.findUnique({ where: { telegramId } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          telegramUsername: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          wallet: { create: { balance: 0, lockedBalance: 0 } }
        }
      });
    } else {
      if (user.telegramUsername !== userData.username || user.firstName !== userData.first_name) {
        user = await prisma.user.update({
          where: { telegramId },
          data: {
            telegramUsername: userData.username,
            firstName: userData.first_name,
            lastName: userData.last_name,
          }
        });
      }
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role, telegramUsername: user.telegramUsername }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { password, firstName, lastName } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    const username = req.body.username?.trim().toLowerCase();
    
    if (!username) return res.status(400).json({ error: 'Username is required' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    
    if (existingUser) {
      if (existingUser.email === email) return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
      if (existingUser.username === username) return res.status(400).json({ error: 'اسم المستخدم مأخوذ، يرجى اختيار اسم آخر' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        firstName,
        lastName,
        passwordHash,
        role: 'USER',
        wallet: { create: { balance: 0, lockedBalance: 0 } }
      }
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'تم التسجيل بنجاح',
      token,
      user: { id: user.id, email: user.email, username: user.username, firstName: user.firstName, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// تسجيل أكاديمية جديدة
export const registerAcademy = async (req: Request, res: Response) => {
  try {
    const { password, email, username, academyName, city, country, phone, description } = req.body;

    if (!email || !password || !username || !academyName) {
      return res.status(400).json({ error: 'جميع الحقول الأساسية مطلوبة' });
    }
    if (password.length < 6) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: email.trim().toLowerCase() }, { username: username.trim().toLowerCase() }] }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        firstName: academyName,
        passwordHash,
        role: 'ACADEMY',
        wallet: { create: { balance: 0, lockedBalance: 0 } },
        academy: {
          create: {
            name: academyName,
            city: city || null,
            country: country || null,
            phone: phone || null,
            description: description || null,
            isVerified: false
          }
        }
      },
      include: { academy: true }
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'تم تسجيل الأكاديمية بنجاح. في انتظار موافقة الإدارة.',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        academy: user.academy
      }
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const identifier = req.body.email?.trim().toLowerCase();
    
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
      include: { academy: true }
    });

    if (!user || !user.passwordHash) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    if (!user.isActive) return res.status(403).json({ error: 'الحساب موقوف مؤقتاً' });

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        academy: user.academy || null
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        academy: {
          select: {
            id: true,
            name: true,
            logo: true,
            coverImage: true,
            isVerified: true,
            isActive: true,
            city: true,
            country: true,
            description: true,
            phone: true,
            website: true,
          }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
