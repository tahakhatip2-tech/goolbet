import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { uploadFile } from '../utils/supabaseStorage';
import fs from 'fs';

// جلب ملف الأكاديمية الخاص بالمستخدم الحالي
export const getMyAcademy = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const academy = await prisma.academy.findUnique({
      where: { userId },
      include: {
        streams: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true, title: true, streamType: true, status: true,
            scheduledAt: true, startedAt: true, endedAt: true,
            thumbnailUrl: true, team1Name: true, team2Name: true,
            team1Score: true, team2Score: true
          }
        }
      }
    });

    if (!academy) return res.status(404).json({ error: 'Academy not found' });
    res.json(academy);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// تحديث ملف الأكاديمية
export const updateMyAcademy = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, description, city, country, phone, website } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    let logo: string | undefined;
    let coverImage: string | undefined;

    if (files?.logo?.[0]) {
      const f = files.logo[0];
      logo = await uploadFile(f.path, f.filename, f.mimetype);
    }
    if (files?.coverImage?.[0]) {
      const f = files.coverImage[0];
      coverImage = await uploadFile(f.path, f.filename, f.mimetype);
    }

    const academy = await prisma.academy.update({
      where: { userId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website }),
        ...(logo && { logo }),
        ...(coverImage && { coverImage }),
      }
    });

    res.json({ message: 'تم تحديث الأكاديمية بنجاح', academy });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// جلب كل الأكاديميات (عام)
export const getAllAcademies = async (_req: AuthRequest, res: Response) => {
  try {
    const academies = await prisma.academy.findMany({
      where: { isVerified: true, isActive: true },
      select: {
        id: true, name: true, logo: true, coverImage: true,
        city: true, country: true, description: true,
        _count: { select: { streams: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(academies);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// جلب أكاديمية واحدة بالمعرف
export const getAcademyById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const academy = await prisma.academy.findUnique({
      where: { id },
      include: {
        streams: {
          where: { status: { in: ['LIVE', 'SCHEDULED'] } },
          orderBy: { scheduledAt: 'asc' },
          select: {
            id: true, title: true, streamType: true, status: true,
            scheduledAt: true, thumbnailUrl: true,
            team1Name: true, team2Name: true, team1Score: true, team2Score: true
          }
        }
      }
    });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });
    res.json(academy);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── إدارة البثوث من قِبَل الأكاديمية ───────────────────────────────────────

// جلب بثوث الأكاديمية الخاصة
export const getMyStreams = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const streams = await prisma.stream.findMany({
      where: { academyId: academy.id },
      include: {
        charityPool: { include: { options: { include: { charity: true } } } },
        _count: { select: { bets: true, comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(streams);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// إنشاء بث جديد
export const createStream = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });
    if (!academy.isVerified) return res.status(403).json({ error: 'الأكاديمية بانتظار التحقق من الإدارة' });

    const {
      title, description, streamType, scheduledAt,
      team1Name, team2Name, hostName, guestNames,
      charityIds // array of charity IDs for the pool
    } = req.body;

    let odds = req.body.odds;
    if (typeof odds === 'string') { try { odds = JSON.parse(odds); } catch {} }
    let charityIdsArr: string[] = [];
    if (typeof charityIds === 'string') { try { charityIdsArr = JSON.parse(charityIds); } catch {} }
    else if (Array.isArray(charityIds)) { charityIdsArr = charityIds; }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let thumbnailUrl: string | undefined;
    let team1Logo: string | undefined;
    let team2Logo: string | undefined;

    if (files?.thumbnail?.[0]) {
      const f = files.thumbnail[0];
      thumbnailUrl = await uploadFile(f.path, f.filename, f.mimetype);
    }
    if (files?.team1Logo?.[0]) {
      const f = files.team1Logo[0];
      team1Logo = await uploadFile(f.path, f.filename, f.mimetype);
    }
    if (files?.team2Logo?.[0]) {
      const f = files.team2Logo[0];
      team2Logo = await uploadFile(f.path, f.filename, f.mimetype);
    }

    const stream = await prisma.stream.create({
      data: {
        academyId: academy.id,
        title,
        description: description || null,
        streamType: streamType || 'MATCH',
        status: 'SCHEDULED',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        thumbnailUrl: thumbnailUrl || null,
        team1Name: team1Name || null,
        team1Logo: team1Logo || null,
        team2Name: team2Name || null,
        team2Logo: team2Logo || null,
        hostName: hostName || null,
        guestNames: guestNames || null,
        // إنشاء أوزان الرهانات فقط للمباريات
        ...(streamType === 'MATCH' && odds ? {
          odds: {
            create: {
              team1Win: parseFloat(odds.team1Win) || 1.5,
              draw: parseFloat(odds.draw) || 3.0,
              team2Win: parseFloat(odds.team2Win) || 2.0,
            }
          }
        } : {}),
        // إنشاء تجمع الجمعيات الخيرية
        ...(charityIdsArr.length > 0 ? {
          charityPool: {
            create: {
              options: {
                create: charityIdsArr.map((charityId: string) => ({ charityId }))
              }
            }
          }
        } : {})
      },
      include: {
        odds: true,
        charityPool: { include: { options: { include: { charity: true } } } }
      }
    });

    res.status(201).json({ message: 'تم إنشاء البث بنجاح', stream });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// تحديث بيانات بث
export const updateStream = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params as { id: string };

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const stream = await prisma.stream.findFirst({ where: { id, academyId: academy.id } });
    if (!stream) return res.status(404).json({ error: 'Stream not found' });
    if (stream.status === 'ENDED') return res.status(400).json({ error: 'لا يمكن تعديل بث منتهٍ' });

    const { title, description, scheduledAt, streamUrl, team1Name, team2Name, hostName, guestNames } = req.body;
    let odds = req.body.odds;
    if (typeof odds === 'string') { try { odds = JSON.parse(odds); } catch {} }

    const updated = await prisma.stream.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(streamUrl !== undefined && { streamUrl }),
        ...(team1Name && { team1Name }),
        ...(team2Name && { team2Name }),
        ...(hostName !== undefined && { hostName }),
        ...(guestNames !== undefined && { guestNames }),
        ...(odds ? {
          odds: {
            updateMany: {
              where: { streamId: id },
              data: {
                team1Win: parseFloat(odds.team1Win) || 1.5,
                draw: parseFloat(odds.draw) || 3.0,
                team2Win: parseFloat(odds.team2Win) || 2.0,
              }
            }
          }
        } : {})
      },
      include: { odds: true }
    });

    res.json({ message: 'تم تحديث البث', stream: updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// بدء البث الحي
export const startStream = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params as { id: string };
    const { streamUrl } = req.body;

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const stream = await prisma.stream.findFirst({ where: { id, academyId: academy.id } });
    if (!stream) return res.status(404).json({ error: 'Stream not found' });
    if (!['SCHEDULED', 'DRAFT'].includes(stream.status)) {
      return res.status(400).json({ error: 'البث يجب أن يكون مجدولاً لبدئه' });
    }

    const updated = await prisma.stream.update({
      where: { id },
      data: {
        status: 'LIVE',
        isStreamActive: true,
        startedAt: new Date(),
        matchPhase: stream.streamType === 'MATCH' ? 'FIRST_HALF' : 'LIVE',
        liveUpdate: stream.streamType === 'MATCH' ? 'انطلقت المباراة! 🏟️' : 'البث مباشر الآن 🔴',
        ...(streamUrl && { streamUrl })
      }
    });

    res.json({ message: 'انطلق البث! 🔴', stream: updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// تحديث نتيجة المباراة (للمباريات فقط)
export const updateScore = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params as { id: string };
    const { team1Score, team2Score, matchPhase, liveUpdate, extraTimeTeam1, extraTimeTeam2, penaltiesTeam1, penaltiesTeam2 } = req.body;

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const stream = await prisma.stream.findFirst({ where: { id, academyId: academy.id } });
    if (!stream) return res.status(404).json({ error: 'Stream not found' });
    if (stream.status !== 'LIVE') return res.status(400).json({ error: 'البث ليس مباشراً' });

    const updateData: any = {};
    if (team1Score !== undefined) updateData.team1Score = parseInt(team1Score);
    if (team2Score !== undefined) updateData.team2Score = parseInt(team2Score);
    if (matchPhase) updateData.matchPhase = matchPhase;
    if (liveUpdate) updateData.liveUpdate = liveUpdate;
    if (extraTimeTeam1 !== undefined) updateData.extraTimeTeam1 = parseInt(extraTimeTeam1);
    if (extraTimeTeam2 !== undefined) updateData.extraTimeTeam2 = parseInt(extraTimeTeam2);
    if (penaltiesTeam1 !== undefined) updateData.penaltiesTeam1 = parseInt(penaltiesTeam1);
    if (penaltiesTeam2 !== undefined) updateData.penaltiesTeam2 = parseInt(penaltiesTeam2);

    const updated = await prisma.stream.update({ where: { id }, data: updateData });
    res.json({ message: 'تم تحديث النتيجة', stream: updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// إنهاء البث
export const endStream = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params as { id: string };

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const stream = await prisma.stream.findFirst({ where: { id, academyId: academy.id } });
    if (!stream) return res.status(404).json({ error: 'Stream not found' });

    const updated = await prisma.stream.update({
      where: { id },
      data: {
        status: 'ENDED',
        isStreamActive: false,
        endedAt: new Date(),
        liveUpdate: stream.streamType === 'MATCH' ? 'انتهت المباراة! 🏁' : 'انتهى البث'
      }
    });

    res.json({ message: 'انتهى البث', stream: updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// حذف بث
export const deleteStream = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params as { id: string };

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const stream = await prisma.stream.findFirst({ where: { id, academyId: academy.id } });
    if (!stream) return res.status(404).json({ error: 'Stream not found' });
    if (stream.status === 'LIVE') return res.status(400).json({ error: 'لا يمكن حذف بث مباشر' });

    await prisma.stream.delete({ where: { id } });
    res.json({ message: 'تم حذف البث' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// إحصائيات الأكاديمية
export const getAcademyStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const [totalStreams, liveStreams, totalBets, recentStreams] = await Promise.all([
      prisma.stream.count({ where: { academyId: academy.id } }),
      prisma.stream.count({ where: { academyId: academy.id, status: 'LIVE' } }),
      prisma.bet.count({ where: { stream: { academyId: academy.id } } }),
      prisma.stream.findMany({
        where: { academyId: academy.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, streamType: true, status: true, startedAt: true, endedAt: true }
      })
    ]);

    res.json({ totalStreams, liveStreams, totalBets, recentStreams });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
