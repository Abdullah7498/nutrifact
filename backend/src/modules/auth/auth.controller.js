import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { registerSchema } from './validations/register-schema.js';
import { loginSchema } from './validations/login-schema.js';
import { refreshSchema } from './validations/refresh-schema.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  @Post('register')
  register(body) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(body) {
    return this.authService.login(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(body) {
    return this.authService.refresh(body);
  }
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(request) {
    return this.authService.logout(request.user);
  }
}

Body(new ZodValidationPipe(registerSchema))(
  AuthController.prototype,
  'register',
  0,
);
Body(new ZodValidationPipe(loginSchema))(AuthController.prototype, 'login', 0);
Body(new ZodValidationPipe(refreshSchema))(
  AuthController.prototype,
  'refresh',
  0,
);
Req()(AuthController.prototype, 'logout', 0);

Inject(AuthService)(AuthController, undefined, 0);
