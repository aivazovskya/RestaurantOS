import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy, JWT_SECRET } from './strategies/jwt.strategy';
import { LocalCredentialProvider } from './credential-providers/local-credential.provider';
import { LOCAL_CREDENTIAL_PROVIDER } from './auth.constants';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '2h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalCredentialProvider,
    {
      provide: LOCAL_CREDENTIAL_PROVIDER,
      useClass: LocalCredentialProvider,
    },
  ],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
