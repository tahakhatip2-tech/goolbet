import api from './axios';

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  sport: string;
  format: 'LEAGUE' | 'KNOCKOUT' | 'GROUP_KNOCKOUT';
  status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  minTeams: number;
  maxTeams: number;
  registrationDeadline?: string;
  startDate?: string;
  endDate?: string;
  prizeInfo?: string;
  entryFee: number;
  isPublic: boolean;
  city?: string;
  country?: string;
  venue?: string;
  drawGeneratedAt?: string;
  createdAt: string;
  organizer?: { name: string; logo?: string; city?: string };
  _count?: { teams: number; matches: number };
  teams?: TournamentTeam[];
  matches?: TournamentMatch[];
  standings?: TournamentStanding[];
}

export interface TournamentTeam {
  id: string;
  tournamentId: string;
  academyId?: string;
  teamName: string;
  teamLogo?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  registeredAt: string;
  academy?: { name: string; logo?: string };
  players?: TournamentPlayer[];
  _count?: { homeMatches: number; awayMatches: number };
}

export interface TournamentPlayer {
  id: string;
  teamId: string;
  name: string;
  position?: string;
  jerseyNumber?: number;
  photoUrl?: string;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  round: string;
  groupName?: string;
  scheduledAt?: string;
  streamId?: string;
  homeScore: number;
  awayScore: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  winnerId?: string;
  homeTeam?: { id: string; teamName: string; teamLogo?: string };
  awayTeam?: { id: string; teamName: string; teamLogo?: string };
  winner?: { id: string; teamName: string };
  stream?: { id: string; status: string; streamUrl?: string };
}

export interface TournamentStanding {
  id: string;
  tournamentId: string;
  teamId: string;
  groupName?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  team?: { id: string; teamName: string; teamLogo?: string };
}

// ─── API Functions ─────────────────────────────────────────────────────────────

export const getPublicTournaments = async (params?: {
  status?: string;
  sport?: string;
  format?: string;
}): Promise<Tournament[]> => {
  const { data } = await api.get('/tournaments', { params });
  return data;
};

export const getTournamentById = async (id: string): Promise<Tournament> => {
  const { data } = await api.get(`/tournaments/${id}`);
  return data;
};

export const createTournament = async (tournamentData: Partial<Tournament>): Promise<{ tournament: Tournament }> => {
  const { data } = await api.post('/tournaments', tournamentData);
  return data;
};

export const updateTournament = async (id: string, tournamentData: Partial<Tournament>): Promise<{ tournament: Tournament }> => {
  const { data } = await api.put(`/tournaments/${id}`, tournamentData);
  return data;
};

export const deleteTournament = async (id: string): Promise<void> => {
  await api.delete(`/tournaments/${id}`);
};

export const getMyOrganizedTournaments = async (): Promise<Tournament[]> => {
  const { data } = await api.get('/tournaments/my/organized');
  return data;
};

export const getMyRegisteredTournaments = async (): Promise<Tournament[]> => {
  const { data } = await api.get('/tournaments/my/registered');
  return data;
};

export const registerTeam = async (
  tournamentId: string,
  teamData: { teamName: string; teamLogo?: string }
): Promise<{ team: TournamentTeam }> => {
  const { data } = await api.post(`/tournaments/${tournamentId}/teams`, teamData);
  return data;
};

export const approveTeam = async (
  tournamentId: string,
  teamId: string,
  status: 'APPROVED' | 'REJECTED'
): Promise<{ team: TournamentTeam }> => {
  const { data } = await api.put(`/tournaments/${tournamentId}/teams/${teamId}/approve`, { status });
  return data;
};

export const addPlayerToTeam = async (
  teamId: string,
  playerData: { name: string; position?: string; jerseyNumber?: number; photoUrl?: string }
): Promise<{ player: TournamentPlayer }> => {
  const { data } = await api.post(`/tournaments/teams/${teamId}/players`, playerData);
  return data;
};

export const removePlayer = async (teamId: string, playerId: string): Promise<void> => {
  await api.delete(`/tournaments/teams/${teamId}/players/${playerId}`);
};

export const generateDraw = async (tournamentId: string): Promise<{
  message: string;
  matchesCount: number;
  matches: TournamentMatch[];
}> => {
  const { data } = await api.post(`/tournaments/${tournamentId}/generate-draw`);
  return data;
};

export const updateMatchResult = async (
  tournamentId: string,
  matchId: string,
  result: { homeScore: number; awayScore: number; status?: string }
): Promise<{ match: TournamentMatch }> => {
  const { data } = await api.put(`/tournaments/${tournamentId}/matches/${matchId}/result`, result);
  return data;
};

export const linkMatchToStream = async (
  tournamentId: string,
  matchId: string,
  streamId: string | null
): Promise<{ match: TournamentMatch }> => {
  const { data } = await api.put(`/tournaments/${tournamentId}/matches/${matchId}/link-stream`, { streamId });
  return data;
};
