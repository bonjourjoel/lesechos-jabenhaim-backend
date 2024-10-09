export interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    username: string;
    userType: string; // ou Enum si tu as un type spécifique pour le rôle
  };
}
