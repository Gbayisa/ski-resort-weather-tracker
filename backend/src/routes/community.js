import { Router } from 'express';
import * as community from '../services/community.js';
import { seasonStatus } from '../data/seasons.js';

const router = Router();

/** Attaches req.rider from "Authorization: Bearer <token>". */
function auth(required = true) {
  return async (req, res, next) => {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    try {
      req.rider = await community.riderFromToken(token);
    } catch (err) {
      console.error('Auth lookup failed:', err);
      return res.status(503).json({ error: 'unavailable', message: 'Please try again in a moment' });
    }
    if (required && !req.rider) return res.status(401).json({ error: 'auth_required', message: 'Create a profile first' });
    next();
  };
}

/** Wraps a handler so CommunityErrors become clean JSON responses. */
const handle = (fn) => async (req, res) => {
  try {
    const out = await fn(req, res);
    if (!res.headersSent) res.json(out ?? { ok: true });
  } catch (err) {
    if (err instanceof community.CommunityError) {
      return res.status(err.status).json({ error: err.code, message: err.message, ...err.extra });
    }
    console.error('Community error:', err);
    res.status(500).json({ error: 'server_error', message: 'Something went wrong' });
  }
};

const id = (v) => Number.parseInt(v, 10);

router.get('/me', auth(false), handle((req) => (req.rider ? community.me(req.rider) : { rider: null })));

router.post(
  '/profile',
  auth(false),
  handle(async (req) => {
    const { rider, token } = await community.saveProfile(req.rider, req.body);
    return { ...(await community.me(await community.riderById(rider.id))), token };
  })
);

router.delete('/profile', auth(), handle((req) => community.deleteRider(req.rider.id)));

router.post(
  '/checkin',
  auth(),
  handle(async (req) => {
    const { lat, lon, intents, note, devResortId } = req.body || {};
    return { checkin: await community.checkIn(req.rider, { lat: Number(lat), lon: Number(lon), intents, note, devResortId }) };
  })
);
router.patch('/checkin', auth(), handle(async (req) => ({ checkin: await community.updateCheckin(req.rider, req.body || {}) })));
router.delete('/checkin', auth(), handle((req) => community.checkOut(req.rider.id)));

router.get('/resorts/:id/riders', auth(), handle(async (req) => ({ riders: await community.ridersAt(req.rider, id(req.params.id)) })));

router.get('/connections', auth(), handle(async (req) => ({ connections: await community.listConnections(req.rider) })));
router.post(
  '/connections',
  auth(),
  handle(async (req) => ({
    connection: await community.requestConnection(req.rider, { toRiderId: id(req.body?.toRiderId), intent: req.body?.intent }),
  }))
);
router.post(
  '/connections/:id/respond',
  auth(),
  handle(async (req) => ({ connection: await community.respondConnection(req.rider, id(req.params.id), !!req.body?.accept) }))
);
router.get(
  '/connections/:id/messages',
  auth(),
  handle(async (req) => ({ messages: await community.listMessages(req.rider, id(req.params.id), id(req.query.after) || 0) }))
);
router.post(
  '/connections/:id/messages',
  auth(),
  handle(async (req) => ({ message: await community.sendMessage(req.rider, id(req.params.id), req.body?.body) }))
);

router.post('/block', auth(), handle((req) => community.blockRider(req.rider, id(req.body?.riderId))));
router.post('/report', auth(), handle((req) => community.reportRider(req.rider, id(req.body?.riderId), req.body?.reason)));

// Development only: lets you try the meet flow without being at a resort
if (process.env.NODE_ENV !== 'production') {
  router.get(
    '/dev/resorts',
    handle(async () => ({
      resorts: await community.devCheckinOptions((r) => seasonStatus(r, new Date().toISOString().slice(0, 10)).inSeason),
    }))
  );
}

export default router;
