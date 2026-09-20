import { Request, Response } from 'express';
import prisma from '../config/db';
import { MatchStatus } from '@prisma/client';
import { uploadFileToSupabase } from '../utils/supabaseStorage';
import fs from 'fs';
import { notifyUser } from '../utils/notificationUtils';

// Get Dashboard Stats
export const getStats = async (req: Request, res: Response) => {
  try {
    const usersCount = await prisma.user.count();
    const betsCount = await prisma.bet.count();
    const activeMatches = await prisma.match.count({
      where: { status: { in: ['UPCOMING', 'LIVE'] } }
    });

    res.json({ usersCount, betsCount, activeMatches });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching stats' });
  }
};

// Get Match Bets (for settlement table)
export const getMatchBets = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const bets = await prisma.bet.findMany({
      where: { matchId: id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        settlement: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching match bets' });
  }
};

// Get All Users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        wallet: { select: { balance: true, lockedBalance: true, bonusBalance: true, lockedBonusBalance: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching users' });
  }
};

// Get All Bets
export const getAllBets = async (req: Request, res: Response) => {
  try {
    const bets = await prisma.bet.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        match: { select: { team1Name: true, team2Name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // limit to recent 100 for performance
    });
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching all bets' });
  }
};

// Create a Match
export const createMatch = async (req: Request, res: Response) => {
  try {
    let { team1Name, team1Logo, team2Name, team2Logo, league, matchDate, status, description, odds, team1Score, team2Score, streamUrl, isStreamActive } = req.body;
    
    // Parse odds if sent as a JSON string from form-data
    if (typeof odds === 'string') {
      try {
        odds = JSON.parse(odds);
      } catch (e) {}
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files && files['team1Logo']) {
      const file = files['team1Logo'][0];
      try {
        team1Logo = await uploadFileToSupabase(file.path, file.filename, file.mimetype);
      } finally {
        // Clean up temp file
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }
    if (files && files['team2Logo']) {
      const file = files['team2Logo'][0];
      try {
        team2Logo = await uploadFileToSupabase(file.path, file.filename, file.mimetype);
      } finally {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    const match = await prisma.match.create({
      data: {
        team1Name: team1Name as string,
        team1Logo: team1Logo as string | undefined,
        team2Name: team2Name as string,
        team2Logo: team2Logo as string | undefined,
        team1Score: team1Score ? parseInt(team1Score, 10) : 0,
        team2Score: team2Score ? parseInt(team2Score, 10) : 0,
        league: league as string,
        matchDate: new Date(matchDate as string),
        status: status as MatchStatus,
        description: description as string | undefined,
        streamUrl: streamUrl as string | undefined,
        isStreamActive: isStreamActive === true || isStreamActive === 'true',
        odds: {
          create: {
            team1Win: odds?.team1Win || 1.0,
            draw: odds?.draw || 1.0,
            team2Win: odds?.team2Win || 1.0,
          }
        }
      },
      include: { odds: true }
    });

    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating match' });
  }
};

// Update a Match
export const updateMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    let { team1Name, team1Logo, team2Name, team2Logo, league, matchDate, status, description, odds, team1Score, team2Score, streamUrl, isStreamActive } = req.body;

    // Parse odds if sent as a JSON string from form-data
    if (typeof odds === 'string') {
      try {
        odds = JSON.parse(odds);
      } catch (e) {}
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files && files['team1Logo']) {
      const file = files['team1Logo'][0];
      try {
        team1Logo = await uploadFileToSupabase(file.path, file.filename, file.mimetype);
      } finally {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }
    if (files && files['team2Logo']) {
      const file = files['team2Logo'][0];
      try {
        team2Logo = await uploadFileToSupabase(file.path, file.filename, file.mimetype);
      } finally {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    // Check if match exists and is not finished
    const existingMatch = await prisma.match.findUnique({ where: { id } });
    if (!existingMatch) return res.status(404).json({ error: 'Match not found' });
    if (existingMatch.status === 'FINISHED') return res.status(400).json({ error: 'Cannot edit a finished match' });

    const match = await prisma.match.update({
      where: { id },
      data: {
        team1Name: team1Name as string,
        team1Logo: team1Logo as string | undefined,
        team2Name: team2Name as string,
        team2Logo: team2Logo as string | undefined,
        team1Score: team1Score !== undefined ? parseInt(team1Score, 10) : undefined,
        team2Score: team2Score !== undefined ? parseInt(team2Score, 10) : undefined,
        league: league as string,
        matchDate: new Date(matchDate as string),
        status: status as MatchStatus,
        description: description as string | undefined,
        streamUrl: streamUrl as string | undefined,
        isStreamActive: isStreamActive !== undefined ? (isStreamActive === true || isStreamActive === 'true') : undefined,
        odds: {
          updateMany: {
            where: { matchId: id },
            data: {
              team1Win: odds?.team1Win || 1.0,
              draw: odds?.draw || 1.0,
              team2Win: odds?.team2Win || 1.0,
            }
          }
        }
      },
      include: { odds: true }
    });

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating match' });
  }
};

// Start a Match (UPCOMING → LIVE)
export const startMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.status !== 'UPCOMING' && match.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Match must be UPCOMING or DRAFT to start' });
    }

    const updated = await prisma.match.update({
      where: { id },
      data: {
        status: 'LIVE',
        matchPhase: 'FIRST_HALF',
        startedAt: new Date(),
        liveUpdate: 'انطلقت المباراة!'
      }
    });

    res.json({ message: 'Match started successfully', match: updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error starting match' });
  }
};

// Update Live Match (scores, phase, live text, extra time, penalties)
export const updateLiveMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const {
      team1Score,
      team2Score,
      matchPhase,
      liveUpdate,
      isKnockout,
      extraTimeTeam1,
      extraTimeTeam2,
      penaltiesTeam1,
      penaltiesTeam2,
      status
    } = req.body;

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.status === 'FINISHED') {
      return res.status(400).json({ error: 'Cannot update a finished match' });
    }

    const updateData: any = {};
    if (team1Score !== undefined) updateData.team1Score = parseInt(team1Score, 10);
    if (team2Score !== undefined) updateData.team2Score = parseInt(team2Score, 10);
    if (matchPhase !== undefined) updateData.matchPhase = matchPhase;
    if (liveUpdate !== undefined) updateData.liveUpdate = liveUpdate;
    if (isKnockout !== undefined) updateData.isKnockout = isKnockout;
    if (extraTimeTeam1 !== undefined) updateData.extraTimeTeam1 = parseInt(extraTimeTeam1, 10);
    if (extraTimeTeam2 !== undefined) updateData.extraTimeTeam2 = parseInt(extraTimeTeam2, 10);
    if (penaltiesTeam1 !== undefined) updateData.penaltiesTeam1 = parseInt(penaltiesTeam1, 10);
    if (penaltiesTeam2 !== undefined) updateData.penaltiesTeam2 = parseInt(penaltiesTeam2, 10);
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.match.update({ where: { id }, data: updateData });
    res.json({ message: 'Match updated successfully', match: updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating live match' });
  }
};

// Settle Match (determine outcome and pay bets)
export const settleMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const match = await prisma.match.findUnique({
      where: { id },
      include: { bets: { where: { status: 'PENDING' } } }
    });

    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.status === 'FINISHED') return res.status(400).json({ error: 'Match already finished' });

    // --- Determine final result for bet settlement ---
    // For knockout matches with a draw at 90 min, use extra time / penalties to find winner
    // But bets are ALWAYS settled on 90-minute result for DRAW bets,
    // and on the final winner for WIN bets.
    
    const t1 = match.team1Score;
    const t2 = match.team2Score;
    let resultAt90: 'TEAM_1_WIN' | 'DRAW' | 'TEAM_2_WIN';

    if (t1 > t2) resultAt90 = 'TEAM_1_WIN';
    else if (t2 > t1) resultAt90 = 'TEAM_2_WIN';
    else resultAt90 = 'DRAW';

    // Determine the final outcome for the match record
    // (used for display/history, not for bet settlement)
    let finalResult: 'TEAM_1_WIN' | 'DRAW' | 'TEAM_2_WIN' = resultAt90;

    if (match.isKnockout && resultAt90 === 'DRAW') {
      // Check extra time scores
      const et1 = (match.team1Score + match.extraTimeTeam1);
      const et2 = (match.team2Score + match.extraTimeTeam2);

      if (et1 > et2) {
        finalResult = 'TEAM_1_WIN';
      } else if (et2 > et1) {
        finalResult = 'TEAM_2_WIN';
      } else {
        // Still draw after extra time → use penalties
        const p1 = match.penaltiesTeam1;
        const p2 = match.penaltiesTeam2;
        if (p1 > p2) finalResult = 'TEAM_1_WIN';
        else if (p2 > p1) finalResult = 'TEAM_2_WIN';
        else finalResult = 'DRAW'; // Should not happen in real football
      }
    }

    // Bets placed as TEAM_1_WIN or TEAM_2_WIN are settled on resultAt90
    // Exception: if isKnockout and resultAt90 is DRAW,
    // then WIN bets use finalResult, and DRAW bets lose.
    const getBetResult = (selection: string): boolean => {
      if (!match.isKnockout) {
        return selection === resultAt90;
      }
      // Knockout: DRAW bets always lose (no draw allowed in knockout)
      // WIN bets are settled against finalResult
      if (selection === 'DRAW') return resultAt90 === 'DRAW' && finalResult === 'DRAW';
      return selection === finalResult;
    };

    const winningBets: { userId: string, payout: number }[] = [];

    // Transaction for settlement
    await prisma.$transaction(async (tx) => {
      // 1. Update Match status and result
      await tx.match.update({
        where: { id },
        data: {
          status: 'FINISHED',
          result: finalResult,
          resultAt90,
          endedAt: new Date(),
          liveUpdate: 'انتهت المباراة!'
        }
      });

      // 2. Process all pending bets
      for (const bet of match.bets) {
        const isWin = getBetResult(bet.selection);

        if (isWin) {
          let profit = bet.potentialPayout - bet.stake;
          if (profit < 0) profit = 0;
          
          let payoutToReal = 0;
          let updateWalletData: any = {};
          
          if (bet.isBonus) {
            payoutToReal = profit; // convert bonus profit to real balance
            updateWalletData = {
              balance: { increment: payoutToReal },
              lockedBonusBalance: { decrement: bet.stake }
            };
          } else {
            payoutToReal = bet.potentialPayout;
            updateWalletData = {
              balance: { increment: payoutToReal },
              lockedBalance: { decrement: bet.stake }
            };
          }

          winningBets.push({ userId: bet.userId, payout: payoutToReal });
          await tx.bet.update({ where: { id: bet.id }, data: { status: 'WON' } });
          await tx.settlement.create({
            data: { matchId: match.id, betId: bet.id, amount: payoutToReal, isWin: true }
          });
          await tx.wallet.update({
            where: { userId: bet.userId },
            data: updateWalletData
          });
          await tx.walletTransaction.create({
            data: {
              userId: bet.userId,
              type: 'BET_WON',
              amount: payoutToReal,
              details: bet.isBonus ? `Won bonus bet on match ${match.team1Name} vs ${match.team2Name} (Profit)` : `Won bet on match ${match.team1Name} vs ${match.team2Name}`
            }
          });
        } else {
          // Loss
          let updateWalletData: any = {};
          if (bet.isBonus) {
            updateWalletData = { lockedBonusBalance: { decrement: bet.stake } };
          } else {
            updateWalletData = { lockedBalance: { decrement: bet.stake } };
          }
          
          await tx.wallet.update({
            where: { userId: bet.userId },
            data: updateWalletData
          });

          await tx.bet.update({ where: { id: bet.id }, data: { status: 'LOST' } });
          await tx.settlement.create({
            data: { matchId: match.id, betId: bet.id, amount: 0, isWin: false }
          });
        }
      }
    });

    // Send notifications outside transaction
    for (const win of winningBets) {
      await notifyUser(
        win.userId,
        'لقد فزت بالرهان! 🎉',
        `تهانينا! لقد ربحت $${win.payout} من رهانك على مباراة ${match.team1Name} ضد ${match.team2Name}`,
        'BET',
        '/profile'
      );
    }

    res.json({ message: 'Match settled successfully', resultAt90, finalResult });
  } catch (error) {
    res.status(500).json({ error: 'Server error settling match' });
  }
};

// Get Pending Transactions (Deposits and Withdrawals)
export const getPendingTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.walletTransaction.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching transactions' });
  }
};

// Get Global Transaction Stats for Dashboard
export const getTransactionStats = async (req: Request, res: Response) => {
  try {
    const totalTransactions = await prisma.walletTransaction.count();
    const depositCount = await prisma.walletTransaction.count({ where: { type: 'DEPOSIT' } });
    const withdrawCount = await prisma.walletTransaction.count({ where: { type: 'WITHDRAWAL' } });
    
    const depositAgg = await prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { type: 'DEPOSIT', status: 'COMPLETED' }
    });
    
    const withdrawAgg = await prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { type: 'WITHDRAWAL', status: 'COMPLETED' }
    });

    const totalAmount = (depositAgg._sum.amount || 0) + Math.abs(withdrawAgg._sum.amount || 0);

    res.json({
      totalCount: totalTransactions,
      depositCount,
      withdrawCount,
      totalAmount
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({ error: 'Server error fetching transaction stats' });
  }
};

// Get Pending Transactions Count
export const getPendingTransactionsCount = async (req: Request, res: Response) => {
  try {
    const count = await prisma.walletTransaction.count({
      where: { status: 'PENDING' }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching pending transactions count' });
  }
};

// Process Transaction (Approve/Reject)
export const processTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { action } = req.body; // 'APPROVE' or 'REJECT'

    const transaction = await prisma.walletTransaction.findUnique({ where: { id } });
    if (!transaction || transaction.status !== 'PENDING') {
      return res.status(404).json({ error: 'Transaction not found or already processed' });
    }

    await prisma.$transaction(async (tx) => {
      if (action === 'APPROVE') {
        await tx.walletTransaction.update({
          where: { id },
          data: { status: 'COMPLETED' }
        });

        if (transaction.type === 'DEPOSIT') {
          await tx.wallet.update({
            where: { userId: transaction.userId },
            data: { balance: { increment: transaction.amount } }
          });
        } else if (transaction.type === 'WITHDRAWAL') {
          // Release locked balance completely
          await tx.wallet.update({
            where: { userId: transaction.userId },
            data: { lockedBalance: { decrement: transaction.amount } }
          });
        }
      } else if (action === 'REJECT') {
        await tx.walletTransaction.update({
          where: { id },
          data: { status: 'FAILED' }
        });

        if (transaction.type === 'WITHDRAWAL') {
          // Return locked balance to main balance
          await tx.wallet.update({
            where: { userId: transaction.userId },
            data: { 
              lockedBalance: { decrement: transaction.amount },
              balance: { increment: transaction.amount }
            }
          });
        }
      }
    });

    const isDeposit = transaction.type === 'DEPOSIT';
    const statusText = action === 'APPROVE' ? 'تمت الموافقة على' : 'تم رفض';
    
    await notifyUser(
      transaction.userId,
      `تحديث حالة ${isDeposit ? 'الإيداع' : 'السحب'}`,
      `${statusText} طلب ${isDeposit ? 'إيداع' : 'سحب'} بمبلغ $${transaction.amount}`,
      'TRANSACTION',
      '/wallet'
    );

    res.json({ message: `Transaction ${action.toLowerCase()}ed successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Server error processing transaction' });
  }
};

// Delete a Match
export const deleteMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    // Delete related records to prevent foreign key constraint errors
    await prisma.$transaction([
      prisma.odds.deleteMany({ where: { matchId: id } }),
      prisma.settlement.deleteMany({ where: { matchId: id } }),
      prisma.bet.deleteMany({ where: { matchId: id } }),
      prisma.match.delete({ where: { id } })
    ]);

    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting match' });
  }
};

// Manage Bonus Balance
export const manageBonus = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params as { id: string };
    const { action, amount } = req.body; // action: 'ADD' or 'DEDUCT'

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return res.status(404).json({ error: 'User wallet not found' });
    }

    if (action === 'DEDUCT' && wallet.bonusBalance < amount) {
      return res.status(400).json({ error: 'Insufficient bonus balance to deduct' });
    }

    await prisma.$transaction(async (tx) => {
      // Update wallet
      await tx.wallet.update({
        where: { userId },
        data: {
          bonusBalance: action === 'ADD' ? { increment: amount } : { decrement: amount }
        }
      });

      // Create transaction log
      await tx.walletTransaction.create({
        data: {
          userId,
          type: action === 'ADD' ? 'DEPOSIT' : 'WITHDRAWAL', // Re-use existing enums
          amount: action === 'ADD' ? amount : -amount,
          status: 'COMPLETED',
          details: `Bonus ${action === 'ADD' ? 'Granted' : 'Deducted'} by Admin`
        }
      });
    });

    res.json({ message: `Bonus ${action === 'ADD' ? 'added' : 'deducted'} successfully` });
  } catch (error) {
    console.error('Error managing bonus:', error);
    res.status(500).json({ error: 'Server error managing bonus' });
  }
};

// --- Leagues Management ---

// Get all leagues
export const getLeagues = async (req: Request, res: Response) => {
  try {
    const leagues = await prisma.league.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(leagues);
  } catch (error) {
    console.error('Error fetching leagues:', error);
    res.status(500).json({ error: 'Server error fetching leagues' });
  }
};

// Create a league
export const createLeague = async (req: Request, res: Response) => {
  try {
    const { name, country } = req.body;
    let logo = req.body.logo;
    
    if (req.file) {
      // Build full URL based on req
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      logo = `${baseUrl}/uploads/${req.file.filename}`;
    }

    if (!name) return res.status(400).json({ error: 'League name is required' });

    // Check if league exists
    const existing = await prisma.league.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: 'League with this name already exists' });

    const league = await prisma.league.create({
      data: { name, logo, country }
    });
    res.status(201).json(league);
  } catch (error) {
    console.error('Error creating league:', error);
    res.status(500).json({ error: 'Server error creating league' });
  }
};

// Delete a league
export const deleteLeague = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.league.delete({ where: { id } });
    res.json({ message: 'League deleted successfully' });
  } catch (error) {
    console.error('Error deleting league:', error);
    res.status(500).json({ error: 'Server error deleting league' });
  }
};
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Server error toggling user status' });
  }
};

export const manageWallet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { amount, type, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'المبلغ يجب أن يكون أكبر من 0' });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: id } });
    if (!wallet) {
      return res.status(404).json({ error: 'لم يتم العثور على محفظة لهذا المستخدم' });
    }

    if (type === 'WITHDRAW' && wallet.balance < amount) {
      return res.status(400).json({ error: 'الرصيد غير كافٍ للخصم' });
    }

    const updatedWallet = await prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { userId: id },
        data: {
          balance: type === 'DEPOSIT' ? { increment: Number(amount) } : { decrement: Number(amount) }
        }
      });

      // Log the transaction in history
      await tx.walletTransaction.create({
        data: {
          userId: id,
          type: type === 'DEPOSIT' ? 'DEPOSIT' : 'WITHDRAWAL',
          amount: type === 'DEPOSIT' ? Number(amount) : -Number(amount),
          status: 'COMPLETED',
          details: note ? `تعديل يدوي بواسطة الأدمن: ${note}` : 'تعديل يدوي بواسطة الأدمن'
        }
      });

      return updated;
    });

    res.json({ message: 'تم تحديث الرصيد بنجاح', wallet: updatedWallet });
  } catch (error) {
    console.error('Error managing wallet:', error);
    res.status(500).json({ error: 'خطأ في الخادم أثناء تعديل الرصيد' });
  }
};

// Toggle Stream Active Status
export const toggleStream = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { isStreamActive, streamUrl } = req.body;

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const updated = await prisma.match.update({
      where: { id },
      data: {
        isStreamActive: isStreamActive !== undefined ? Boolean(isStreamActive) : !match.isStreamActive,
        ...(streamUrl !== undefined ? { streamUrl } : {})
      }
    });

    res.json({ message: 'Stream status updated', match: updated });
  } catch (error) {
    console.error('Error toggling stream:', error);
    res.status(500).json({ error: 'Server error toggling stream' });
  }
};
