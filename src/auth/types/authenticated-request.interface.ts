export interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    username: string;
    userType: string;
  };
}
