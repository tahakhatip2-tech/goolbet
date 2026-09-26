import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

// ─── Helper: خوارزمية توليد القرعة ─────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** توليد جدول دوري (كل فريق يلعب ضد كل فريق مرة واحدة) */
function generateLeaguePairs(teamIds: string[]) {
  const matches: { homeTeamId: string; awayTeamId: string; round: string }[] = [];
  const teams = [...teamIds];
  // إذا عدد الفرق فردي نضيف فريق وهمي
  if (teams.length % 2 !== 0) teams.push('BYE');

  const n = teams.length;
  const rounds = n - 1;
  const half = n / 2;

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const home = teams[i];
      const away = teams[n - 1 - i];
      if (home !== 'BYE' && away !== 'BYE') {
        matches.push({ homeTeamId: home, awayTeamId: away, round: `الجولة ${r + 1}` });
      }
    }
    // تدوير الفرق (الأول ثابت)
    const last = teams.pop()!;
    teams.splice(1, 0, last);
  }
  return matches;
}

/** توليد جدول إقصائي (Knockout) */
function generateKnockoutPairs(teamIds: string[], roundName: string) {
  const teams = shuffle(teamIds);
  const matches: { homeTeamId: string; awayTeamId: string; round: string }[] = [];
  for (let i = 0; i < teams.length - 1; i += 2) {
    matches.push({ homeTeamId: teams[i], awayTeamId: teams[i + 1], round: roundName });
  }
  return matches;
}

/** توليد نظام مجموعات */
function generateGroupPairs(teamIds: string[], teamsPerGroup: number = 4) {
  const shuffled = shuffle(teamIds);
  const groups: string[][] = [];
  for (let i = 0; i < shuffled.length; i += teamsPerGroup) {
    groups.push(shuffled.slice(i, i + teamsPerGroup));
  }

  const matches: { homeTeamId: string; awayTeamId: string; round: string; groupName: string }[] = [];
  groups.forEach((group, gIdx) => {
    const groupName = String.fromCharCode(65 + gIdx); // A, B, C...
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        matches.push({
          homeTeamId: group[i],
          awayTeamId: group[j],
          round: 'دور المجموعات',
          groupName: `المجموعة ${groupName}`
        });
      }
    }
  });
  return matches;
}

// ─── جلب اسم الجولة الإقصائية ───────────────────────────────────────────────
function getKnockoutRoundName(teamsCount: number): string {
  if (teamsCount === 2) return 'النهائي';
  if (teamsCount === 4) return 'نصف النهائي';
  if (teamsCount === 8) return 'ربع النهائي';
  if (teamsCount === 16) return 'دور الـ 16';
  return `دور الـ ${teamsCount}`;
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/** إنشاء بطولة جديدة (للأكاديمية المنظِّمة) */
export const createTournament = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });
    if (!academy.isVerified) return res.status(403).json({ error: 'الأكاديمية غير موثقة' });

    const {
      name, description, sport, format, maxTeams, minTeams,
      registrationDeadline, startDate, endDate, prizeInfo,
      entryFee, isPublic, city, country, venue
    } = req.body;

    if (!name) return res.status(400).json({ error: 'اسم البطولة مطلوب' });
    if (!maxTeams || maxTeams < 2) return res.status(400).json({ error: 'العدد الأقصى للفرق يجب أن يكون 2 على الأقل' });

    const tournament = await prisma.tournament.create({
      data: {
        organizerAcademyId: academy.id,
        name,
        description: description || null,
        sport: sport || 'FOOTBALL',
        format: format || 'KNOCKOUT',
        status: 'DRAFT',
        maxTeams: parseInt(maxTeams),
        minTeams: parseInt(minTeams) || 2,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        prizeInfo: prizeInfo || null,
        entryFee: parseFloat(entryFee) || 0,
        isPublic: isPublic !== false,
        city: city || null,
        country: country || null,
        venue: venue || null,
      },
      include: { organizer: { select: { name: true, logo: true } } }
    });

    res.status(201).json({ message: 'تم إنشاء البطولة بنجاح', tournament });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/** تحديث بيانات البطولة */
export const updateTournament = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params as { id: string };

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const tournament = await prisma.tournament.findFirst({
      where: { id, organizerAcademyId: academy.id }
    });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (['IN_PROGRESS', 'COMPLETED'].includes(tournament.status)) {
      return res.status(400).json({ error: 'لا يمكن تعديل بطولة جارية أو منتهية' });
    }

    const {
      name, description, sport, format, maxTeams, minTeams,
      registrationDeadline, startDate, endDate, prizeInfo,
      entryFee, isPublic, city, country, venue, status
    } = req.body;

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(sport && { sport }),
        ...(format && { format }),
        ...(maxTeams && { maxTeams: parseInt(maxTeams) }),
        ...(minTeams && { minTeams: parseInt(minTeams) }),
        ...(registrationDeadline !== undefined && { registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(prizeInfo !== undefined && { prizeInfo }),
        ...(entryFee !== undefined && { entryFee: parseFloat(entryFee) }),
        ...(isPublic !== undefined && { isPublic }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(venue !== undefined && { venue }),
        ...(status && { status }),
      },
      include: { organizer: { select: { name: true, logo: true } }, _count: { select: { teams: true } } }
    });

    res.json({ message: 'تم تحديث البطولة', tournament: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/** جلب بطولات أكاديميتي (كمنظِّم) */
export const getMyTournaments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const tournaments = await prisma.tournament.findMany({
      where: { organizerAcademyId: academy.id },
      include: {
        _count: { select: { teams: true, matches: true } },
        organizer: { select: { name: true, logo: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/** جلب البطولات التي سجّلت فيها أكاديميتي كمشارك */
export const getMyRegisteredTournaments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const teams = await prisma.tournamentTeam.findMany({
      where: { academyId: academy.id },
      include: {
        tournament: {
          include: {
            organizer: { select: { name: true, logo: true } },
            _count: { select: { teams: true } }
          }
        }
      },
      orderBy: { registeredAt: 'desc' }
    });

    res.json(teams.map(t => ({ ...t.tournament, myTeam: { id: t.id, teamName: t.teamName, status: t.status } })));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/** جلب كل البطولات العامة */
export const getPublicTournaments = async (req: AuthRequest, res: Response) => {
  try {
    const { status, sport, format } = req.query;
    const where: any = { isPublic: true };
    if (status) where.status = status;
    if (sport) where.sport = sport;
    if (format) where.format = format;

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        organizer: { select: { name: true, logo: true, city: true } },
        _count: { select: { teams: true, matches: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/** جلب تفاصيل بطولة واحدة */
export const getTournamentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, logo: true, coverImage: true, city: true, country: true } },
        teams: {
          include: {
            academy: { select: { name: true, logo: true } },
            players: true,
            _count: { select: { homeMatches: true, awayMatches: true } }
          },
          orderBy: { registeredAt: 'asc' }
        },
        matches: {
          include: {
            homeTeam: { select: { id: true, teamName: true, teamLogo: true } },
            awayTeam: { select: { id: true, teamName: true, teamLogo: true } },
            winner: { select: { id: true, teamName: true } },
            stream: { select: { id: true, status: true, streamUrl: true } }
          },
          orderBy: [{ round: 'asc' }, { scheduledAt: 'asc' }]
        },
        standings: {
          include: { team: { select: { id: true, teamName: true, teamLogo: true } } },
          orderBy: [{ points: 'desc' }, { goalDifference: 'desc' }, { goalsFor: 'desc' }]
        }
      }
    });

    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/** تسجيل فريق في بطولة (أكاديمية مشاركة) */
export const registerTeam = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: tournamentId } = req.params as { id: string };
    const { teamName, teamLogo } = req.body;

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });
    if (!academy.isVerified) return res.status(403).json({ error: 'الأكاديمية غير موثقة' });

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.status !== 'OPEN') return res.status(400).json({ error: 'التسجيل مغلق لهذه البطولة' });

    // تحقق من الحد الأقصى للفرق
    const teamsCount = await prisma.tournamentTeam.count({
      where: { tournamentId, status: { in: ['APPROVED', 'PENDING'] } }
    });
    if (teamsCount >= tournament.maxTeams) {
      return res.status(400).json({ error: 'اكتمل عدد الفرق في هذه البطولة' });
    }

    // تحقق من عدم التسجيل المسبق
    const existing = await prisma.tournamentTeam.findFirst({
      where: { tournamentId, academyId: academy.id }
    });
    if (existing) return res.status(400).json({ error: 'أكاديميتك مسجلة بالفعل في هذه البطولة' });

    // المنظِّم يُوافَق تلقائياً، باقي الأكاديميات تنتظر
    const isOrganizer = tournament.organizerAcademyId === academy.id;

    const team = await prisma.tournamentTeam.create({
      data: {
        tournamentId,
        academyId: academy.id,
        teamName: teamName || academy.name,
        teamLogo: teamLogo || academy.logo || null,
        status: isOrganizer ? 'APPROVED' : 'PENDING'
      }
    });

    // إذا اكتمل العدد → تغيير حالة البطولة تلقائياً
    const approvedCount = await prisma.tournamentTeam.count({
      where: { tournamentId, status: 'APPROVED' }
    });
    if (approvedCount >= tournament.maxTeams) {
      await prisma.tournament.update({ where: { id: tournamentId }, data: { status: 'OPEN' } });
    }

    res.status(201).json({ message: 'تم تسجيل الفريق بنجاح، في انتظار موافقة المنظِّم', team });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/** الموافقة/رفض تسجيل فريق (المنظِّم فقط) */
export const approveTeam = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: tournamentId, teamId } = req.params as { id: string; teamId: string };
    const { status } = req.body; // APPROVED | REJECTED

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const tournament = await prisma.tournament.findFirst({
      where: { id: tournamentId, organizerAcademyId: academy.id }
    });
    if (!tournament) return res.status(403).json({ error: 'ليس لديك صلاحية إدارة هذه البطولة' });

    const team = await prisma.tournamentTeam.update({
      where: { id: teamId },
      data: { status }
    });

    res.json({ message: `تم ${status === 'APPROVED' ? 'قبول' : 'رفض'} الفريق`, team });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/** إضافة لاعب لتشكيلة الفريق */
export const addPlayerToTeam = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { teamId } = req.params as { teamId: string };
    const { name, position, jerseyNumber, photoUrl } = req.body;

    if (!name) return res.status(400).json({ error: 'اسم اللاعب مطلوب' });

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const team = await prisma.tournamentTeam.findFirst({
      where: { id: teamId, academyId: academy.id }
    });
    if (!team) return res.status(403).json({ error: 'لا تملك صلاحية تعديل هذا الفريق' });

    const player = await prisma.tournamentPlayer.create({
      data: {
        teamId,
        name,
        position: position || null,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
        photoUrl: photoUrl || null
      }
    });

    res.status(201).json({ message: 'تم إضافة اللاعب', player });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/** حذف لاعب من التشكيلة */
export const removePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { teamId, playerId } = req.params as { teamId: string; playerId: string };

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const team = await prisma.tournamentTeam.findFirst({
      where: { id: teamId, academyId: academy.id }
    });
    if (!team) return res.status(403).json({ error: 'لا تملك صلاحية تعديل هذا الفريق' });

    await prisma.tournamentPlayer.delete({ where: { id: playerId } });
    res.json({ message: 'تم حذف اللاعب' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/** ⚡ توليد القرعة وجدول المباريات تلقائياً */
export const generateDraw = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: tournamentId } = req.params as { id: string };

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const tournament = await prisma.tournament.findFirst({
      where: { id: tournamentId, organizerAcademyId: academy.id },
      include: { teams: { where: { status: 'APPROVED' } } }
    });
    if (!tournament) return res.status(403).json({ error: 'ليس لديك صلاحية إدارة هذه البطولة' });

    const approvedTeams = tournament.teams;
    if (approvedTeams.length < tournament.minTeams) {
      return res.status(400).json({
        error: `يحتاج الجدول ${tournament.minTeams} فرق على الأقل. لديك حالياً ${approvedTeams.length}`
      });
    }

    // حذف المباريات القديمة إن وجدت
    await prisma.tournamentMatch.deleteMany({ where: { tournamentId } });
    await prisma.tournamentStanding.deleteMany({ where: { tournamentId } });

    const teamIds = approvedTeams.map(t => t.id);
    let matchesToCreate: { homeTeamId: string; awayTeamId: string; round: string; groupName?: string | null }[] = [];

    if (tournament.format === 'LEAGUE') {
      matchesToCreate = generateLeaguePairs(teamIds);
      // إنشاء جدول الترتيب
      await prisma.tournamentStanding.createMany({
        data: teamIds.map(teamId => ({ tournamentId, teamId, updatedAt: new Date() }))
      });
    } else if (tournament.format === 'KNOCKOUT') {
      const roundName = getKnockoutRoundName(approvedTeams.length);
      matchesToCreate = generateKnockoutPairs(teamIds, roundName);
    } else if (tournament.format === 'GROUP_KNOCKOUT') {
      const teamsPerGroup = 4;
      const groupMatches = generateGroupPairs(teamIds, teamsPerGroup);
      matchesToCreate = groupMatches;
      // إنشاء جدول الترتيب للمجموعات
      await prisma.tournamentStanding.createMany({
        data: teamIds.map(teamId => ({ tournamentId, teamId, updatedAt: new Date() }))
      });
    }

    // إنشاء المباريات في قاعدة البيانات
    await prisma.tournamentMatch.createMany({
      data: matchesToCreate.map(m => ({
        tournamentId,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        round: m.round,
        groupName: (m as any).groupName || null
      }))
    });

    // تحديث حالة البطولة
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'IN_PROGRESS', drawGeneratedAt: new Date() }
    });

    const matches = await prisma.tournamentMatch.findMany({
      where: { tournamentId },
      include: {
        homeTeam: { select: { id: true, teamName: true, teamLogo: true } },
        awayTeam: { select: { id: true, teamName: true, teamLogo: true } }
      },
      orderBy: [{ round: 'asc' }]
    });

    res.json({
      message: `✅ تم توليد القرعة! ${matches.length} مباراة في الجدول`,
      matchesCount: matches.length,
      matches
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/** تحديث نتيجة مباراة في البطولة */
export const updateMatchResult = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: tournamentId, matchId } = req.params as { id: string; matchId: string };
    const { homeScore, awayScore, status } = req.body;

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const tournament = await prisma.tournament.findFirst({
      where: { id: tournamentId, organizerAcademyId: academy.id }
    });
    if (!tournament) return res.status(403).json({ error: 'ليس لديك صلاحية إدارة هذه البطولة' });

    const match = await prisma.tournamentMatch.findFirst({
      where: { id: matchId, tournamentId }
    });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const hs = homeScore !== undefined ? parseInt(homeScore) : match.homeScore;
    const as_ = awayScore !== undefined ? parseInt(awayScore) : match.awayScore;
    const matchStatus = status || match.status;

    let winnerId: string | null = null;
    if (matchStatus === 'COMPLETED') {
      if (hs > as_) winnerId = match.homeTeamId;
      else if (as_ > hs) winnerId = match.awayTeamId;
      // في حالة التعادل لا يوجد فائز في نظام الإقصاء (يحتاج ركلات)
    }

    const updated = await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { homeScore: hs, awayScore: as_, status: matchStatus, winnerId },
      include: {
        homeTeam: { select: { id: true, teamName: true, teamLogo: true } },
        awayTeam: { select: { id: true, teamName: true, teamLogo: true } }
      }
    });

    // تحديث جدول الترتيب إذا كانت بطولة دوري أو مجموعات
    if (matchStatus === 'COMPLETED' && tournament.format !== 'KNOCKOUT') {
      await updateStandingsForMatch(tournamentId, match.homeTeamId, match.awayTeamId, hs, as_);
    }

    res.json({ message: 'تم تحديث النتيجة', match: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/** مساعد: تحديث جدول الترتيب */
async function updateStandingsForMatch(
  tournamentId: string,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number
) {
  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;
  const draw = homeScore === awayScore;

  await prisma.$transaction([
    prisma.tournamentStanding.update({
      where: { tournamentId_teamId: { tournamentId, teamId: homeTeamId } },
      data: {
        played: { increment: 1 },
        won: { increment: homeWon ? 1 : 0 },
        drawn: { increment: draw ? 1 : 0 },
        lost: { increment: awayWon ? 1 : 0 },
        goalsFor: { increment: homeScore },
        goalsAgainst: { increment: awayScore },
        goalDifference: { increment: homeScore - awayScore },
        points: { increment: homeWon ? 3 : draw ? 1 : 0 }
      }
    }),
    prisma.tournamentStanding.update({
      where: { tournamentId_teamId: { tournamentId, teamId: awayTeamId } },
      data: {
        played: { increment: 1 },
        won: { increment: awayWon ? 1 : 0 },
        drawn: { increment: draw ? 1 : 0 },
        lost: { increment: homeWon ? 1 : 0 },
        goalsFor: { increment: awayScore },
        goalsAgainst: { increment: homeScore },
        goalDifference: { increment: awayScore - homeScore },
        points: { increment: awayWon ? 3 : draw ? 1 : 0 }
      }
    })
  ]);
}

/** ربط مباراة ببث مباشر */
export const linkMatchToStream = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: tournamentId, matchId } = req.params as { id: string; matchId: string };
    const { streamId } = req.body;

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const tournament = await prisma.tournament.findFirst({
      where: { id: tournamentId, organizerAcademyId: academy.id }
    });
    if (!tournament) return res.status(403).json({ error: 'ليس لديك صلاحية' });

    const updated = await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { streamId: streamId || null }
    });

    res.json({ message: streamId ? 'تم ربط المباراة بالبث' : 'تم فصل البث', match: updated });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'هذا البث مرتبط بمباراة أخرى بالفعل' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

/** حذف بطولة */
export const deleteTournament = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params as { id: string };

    const academy = await prisma.academy.findUnique({ where: { userId } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const tournament = await prisma.tournament.findFirst({
      where: { id, organizerAcademyId: academy.id }
    });
    if (!tournament) return res.status(403).json({ error: 'ليس لديك صلاحية' });
    if (tournament.status === 'IN_PROGRESS') {
      return res.status(400).json({ error: 'لا يمكن حذف بطولة جارية' });
    }

    await prisma.tournament.delete({ where: { id } });
    res.json({ message: 'تم حذف البطولة' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
