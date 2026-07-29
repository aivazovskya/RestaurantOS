import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserJwtPayload {
  sub: string;
  userId: string;
  role: string;
  organizationId?: string;
  branchIds: string[];
  courierId?: string;
  email?: string;
  fullName?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserJwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserJwtPayload;
    return data ? user?.[data] : user;
  },
);
