import { Request, Response, NextFunction } from 'express';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { logger } from '../utils/logger';

const OPERATOR_WALLETS = (process.env.OPERATOR_WALLETS || '').split(',').filter(Boolean);
const REQUIRE_OPERATOR_AUTH = process.env.REQUIRE_OPERATOR_AUTH === 'true';
const NODE_ENV = process.env.NODE_ENV || 'development';

export interface AuthenticatedRequest extends Request {
  operatorWallet?: string;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next();
};

export const operatorAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers['x-signature'] as string;
    const publicKey = req.headers['x-public-key'] as string;
    const timestamp = req.headers['x-timestamp'] as string;
    
    if (!signature || !publicKey || !timestamp) {
      return res.status(401).json({
        success: false,
        error: 'Missing authentication headers (x-signature, x-public-key, x-timestamp)',
      });
    }
    
    const timestampNum = parseInt(timestamp);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (isNaN(timestampNum) || Math.abs(now - timestampNum) > fiveMinutes) {
      return res.status(401).json({
        success: false,
        error: 'Request timestamp expired or invalid',
      });
    }
    
    const message = `${req.method}:${req.originalUrl}:${timestamp}`;
    const messageBytes = new TextEncoder().encode(message);
    
    let signatureBytes: Uint8Array;
    let publicKeyBytes: Uint8Array;
    
    try {
      signatureBytes = bs58.decode(signature);
      publicKeyBytes = bs58.decode(publicKey);
    } catch (e) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature or public key format',
      });
    }
    
    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }
    
    if (OPERATOR_WALLETS.length > 0 && !OPERATOR_WALLETS.includes(publicKey)) {
      logger.warn(`Unauthorized operator attempt from: ${publicKey}`);
      return res.status(403).json({
        success: false,
        error: 'Wallet is not authorized as operator',
      });
    }
    
    req.operatorWallet = publicKey;
    logger.info(`Authenticated operator request from: ${publicKey.slice(0, 8)}...`);
    
    next();
  } catch (error) {
    logger.error('Operator auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

export const developmentOnlyAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (NODE_ENV === 'production') {
    return operatorAuthMiddleware(req, res, next);
  }
  
  const publicKey = req.headers['x-public-key'] as string;
  
  if (publicKey) {
    return operatorAuthMiddleware(req, res, next);
  }
  
  const clientIp = req.ip || req.connection.remoteAddress || '';
  const isLocalhost = clientIp === '127.0.0.1' || 
                      clientIp === '::1' || 
                      clientIp === '::ffff:127.0.0.1' ||
                      clientIp.includes('localhost');
  
  if (!isLocalhost && REQUIRE_OPERATOR_AUTH) {
    logger.warn(`Non-localhost request without auth from: ${clientIp}`);
    return res.status(401).json({
      success: false,
      error: 'Operator authentication required for non-localhost requests',
    });
  }
  
  logger.warn(`DEV MODE: Unauthenticated admin request from ${clientIp} - THIS MUST BE DISABLED IN PRODUCTION`);
  next();
};
