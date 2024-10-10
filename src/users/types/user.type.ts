import { USER_TYPE } from 'src/common/enums/user-type.enum';

export interface IUser {
  id?: number;
  username: string;
  password: string;
  name?: string;
  address?: string;
  comment?: string;
  userType: USER_TYPE;
}
