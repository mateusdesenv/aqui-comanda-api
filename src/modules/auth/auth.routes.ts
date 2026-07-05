import { Router } from 'express';
import { sendSuccess } from '../../common/utils/api-response';
import { asyncHandler } from '../../common/utils/async-handler';
import { AuthenticatedRequest } from '../../common/types/request';

const router = Router();

router.get('/me', asyncHandler(async (req: AuthenticatedRequest, res) => {
  sendSuccess(res, req.user);
}));

export const authRoutes = router;
