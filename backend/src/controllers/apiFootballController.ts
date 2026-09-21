import { Request, Response } from 'express';
import { apiFootballService } from '../services/apiFootballService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCountries = async (req: Request, res: Response) => {
  try {
    const countries = await apiFootballService.getCountries();
    res.json(countries);
  } catch (error) {
    console.error('Error in getCountries:', error);
    res.status(500).json({ message: 'Error fetching countries from API' });
  }
};

export const getLeagues = async (req: Request, res: Response) => {
  try {
    const { country } = req.query;
    const leagues = await apiFootballService.getLeagues(country as string);
    res.json(leagues);
  } catch (error) {
    console.error('Error in getLeagues:', error);
    res.status(500).json({ message: 'Error fetching leagues from API' });
  }
};

export const getFixtures = async (req: Request, res: Response) => {
  try {
    const { date, league, season, from, to, next } = req.query;
    
    // Construct params dynamically
    const queryParams: any = {};
    if (league) queryParams.league = league as string;
    if (season) queryParams.season = season as string;
    if (next) queryParams.next = next as string;

    if (from && to) {
      queryParams.from = from as string;
      queryParams.to = to as string;
    } else if (date) {
      queryParams.date = date as string;
    }

    const fixtures = await apiFootballService.getFixtures(queryParams);
    res.json(fixtures);
  } catch (error: any) {
    console.error('Error in getFixtures:', error);
    res.status(500).json({ message: error.message || 'Error fetching fixtures from API' });
  }
};

export const getFixtureDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const details = await apiFootballService.getFixtureDetails(id as string);
    res.json(details);
  } catch (error) {
    console.error('Error in getFixtureDetails:', error);
    res.status(500).json({ message: 'Error fetching fixture details' });
  }
};

export const importMatch = async (req: Request, res: Response) => {
  try {
    const { 
      team1Name, team1Logo, 
      team2Name, team2Logo, 
      league, matchDate, status, apiFixtureId 
    } = req.body;

    if (!team1Name || !team2Name || !matchDate) {
      return res.status(400).json({ message: 'Missing required match data' });
    }

    // Check if match already exists by apiFixtureId to avoid duplicates
    if (apiFixtureId) {
      const existing = await prisma.match.findUnique({ where: { apiFixtureId: Number(apiFixtureId) } });
      if (existing) {
        return res.status(400).json({ message: 'This match has already been imported.' });
      }
    }

    const newMatch = await prisma.match.create({
      data: {
        team1Name,
        team1Logo,
        team1Score: 0,
        team2Name,
        team2Logo,
        team2Score: 0,
        league: league || 'Unknown League',
        matchDate: new Date(matchDate),
        status: status || 'UPCOMING',
        isStreamActive: false,
        apiFixtureId: apiFixtureId ? Number(apiFixtureId) : null,
        odds: {
          create: {
            team1Win: 1.5,
            draw: 3.0,
            team2Win: 2.5
          }
        }
      },
      include: {
        odds: true
      }
    });

    res.status(201).json(newMatch);
  } catch (error) {
    console.error('Error in importMatch:', error);
    res.status(500).json({ message: 'Error importing match to database' });
  }
};
