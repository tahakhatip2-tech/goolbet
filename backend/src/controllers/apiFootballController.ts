import { Request, Response } from 'express';
import { apiFootballService } from '../services/apiFootballService';
import prisma from '../config/db';

export const getCountries = async (_req: Request, res: Response) => {
  try {
    const countries = await apiFootballService.getCountries();
    res.json(countries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching countries from API' });
  }
};

export const getLeagues = async (req: Request, res: Response) => {
  try {
    const { country } = req.query;
    const leagues = await apiFootballService.getLeagues(country as string);
    res.json(leagues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leagues from API' });
  }
};

export const getFixtures = async (req: Request, res: Response) => {
  try {
    const { date, league, season, from, to, next } = req.query;
    const queryParams: any = {};
    if (league) queryParams.league = league as string;
    if (season) queryParams.season = season as string;
    if (next) queryParams.next = next as string;
    if (from && to) { queryParams.from = from as string; queryParams.to = to as string; }
    else if (date) { queryParams.date = date as string; }
    const fixtures = await apiFootballService.getFixtures(queryParams);
    res.json(fixtures);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching fixtures from API' });
  }
};

export const getFixtureDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const details = await apiFootballService.getFixtureDetails(id as string);
    res.json(details);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fixture details' });
  }
};

// استيراد مباراة من API Football وإنشاؤها كـ Stream
export const importMatch = async (req: Request, res: Response) => {
  try {
    const { team1Name, team1Logo, team2Name, team2Logo, league, matchDate, status, apiFixtureId, academyId } = req.body;

    if (!team1Name || !team2Name || !matchDate) {
      return res.status(400).json({ message: 'Missing required match data' });
    }

    // تحقق من عدم الاستيراد المكرر
    if (apiFixtureId) {
      const existing = await prisma.stream.findFirst({ where: { apiFixtureId: Number(apiFixtureId) } });
      if (existing) return res.status(400).json({ message: 'This match has already been imported.' });
    }

    // إذا لم تُحدد أكاديمية، استخدم أول أكاديمية متحقق منها
    let targetAcademyId = academyId;
    if (!targetAcademyId) {
      const firstAcademy = await prisma.academy.findFirst({ where: { isVerified: true } });
      if (!firstAcademy) return res.status(400).json({ message: 'No verified academy found. Please specify academyId.' });
      targetAcademyId = firstAcademy.id;
    }

    const newStream = await prisma.stream.create({
      data: {
        academyId: targetAcademyId,
        title: `${team1Name} vs ${team2Name}`,
        streamType: 'MATCH',
        status: 'SCHEDULED',
        scheduledAt: new Date(matchDate),
        team1Name,
        team1Logo: team1Logo || null,
        team1Score: 0,
        team2Name,
        team2Logo: team2Logo || null,
        team2Score: 0,
        apiFixtureId: apiFixtureId ? Number(apiFixtureId) : null,
        odds: {
          create: { team1Win: 1.5, draw: 3.0, team2Win: 2.5 }
        }
      },
      include: { odds: true }
    });

    res.status(201).json(newStream);
  } catch (error) {
    console.error('Error in importMatch:', error);
    res.status(500).json({ message: 'Error importing match to database' });
  }
};
