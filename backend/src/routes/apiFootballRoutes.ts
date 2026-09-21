import { Router } from 'express';
import { getCountries, getLeagues, getFixtures, getFixtureDetails, importMatch } from '../controllers/apiFootballController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// All routes here should be protected by admin middleware (except maybe details if users need them, but for now let's keep it admin, wait! Users need fixture details!)
// Actually, getFixtureDetails should be public or authenticated user.
// Let's create a separate public router or just apply auth middleware per route.
// For now, I will export router and apply middleware per route.

router.get('/countries', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), getCountries);
router.get('/leagues', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), getLeagues);
router.get('/fixtures', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), getFixtures);
router.post('/import', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), importMatch);

// Fixture details can be viewed by normal users as well for the Match Center
router.get('/fixtures/:id', authenticate, getFixtureDetails);

export default router;
