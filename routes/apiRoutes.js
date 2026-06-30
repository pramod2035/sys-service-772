import express from 'express';
import * as walletController from '../controllers/walletController.js';
import * as rewardController from '../controllers/rewardController.js';
import idempotency from '../middleware/idempotency.js';

const router = express.Router();

router.get('/v1/wallets/:playerId', walletController.getWallet);
router.post('/v1/wallets/:playerId/credit', idempotency, walletController.creditWallet);
router.post('/v1/wallets/:playerId/purchase', idempotency, walletController.purchaseItem);
router.post('/v1/rewards/:rewardId/claim', idempotency, rewardController.claimReward);

export default router;
