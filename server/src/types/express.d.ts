declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'client' | 'master' | 'platform_admin';
      };
    }
  }
}

export {};
