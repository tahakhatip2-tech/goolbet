import { PrismaClient, MatchStatus } from '@prisma/client';
import { apiFootballService } from '../services/apiFootballService';

const prisma = new PrismaClient();

// This function will be called every minute to sync live matches
export const syncLiveMatches = async (io: any) => {
  try {
    // 1. Get all matches that have apiFixtureId and are in LIVE or UPCOMING status
    // UPCOMING matches should be checked around their start time to flip to LIVE
    // For simplicity, we check matches that are LIVE, or UPCOMING and within 15 minutes of starting
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60000); // Max match duration approx

    const matchesToSync = await prisma.match.findMany({
      where: {
        apiFixtureId: { not: null },
        OR: [
          { status: 'LIVE' },
          { 
            status: 'UPCOMING',
            matchDate: { lte: now, gte: threeHoursAgo } // Match should have started
          }
        ]
      }
    });

    if (matchesToSync.length === 0) return;

    for (const match of matchesToSync) {
      // API-football allows fetching by id
      const details = await apiFootballService.getFixtureDetails(match.apiFixtureId!.toString());
      if (!details) continue;

      const fixture = details.fixture;
      const goals = details.goals;

      let newStatus: MatchStatus = match.status;
      
      if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(fixture.status.short)) {
        newStatus = 'LIVE';
      } else if (['FT', 'AET', 'PEN'].includes(fixture.status.short)) {
        newStatus = 'FINISHED';
      } else if (['CANC', 'PST'].includes(fixture.status.short)) {
        newStatus = 'CANCELLED';
      }

      const team1Score = goals.home ?? 0;
      const team2Score = goals.away ?? 0;
      const liveUpdate = fixture.status.elapsed ? `${fixture.status.elapsed}'` : fixture.status.short;

      // Update DB if there is a change
      if (
        match.status !== newStatus || 
        match.team1Score !== team1Score || 
        match.team2Score !== team2Score ||
        match.liveUpdate !== liveUpdate
      ) {
        const updatedMatch = await prisma.match.update({
          where: { id: match.id },
          data: {
            status: newStatus,
            team1Score,
            team2Score,
            liveUpdate,
            matchPhase: fixture.status.short,
          }
        });

        // Emit socket event to clients
        io.emit('matchUpdated', updatedMatch);
      }
    }
  } catch (error) {
    console.error('Error in live sync cron:', error);
  }
};
