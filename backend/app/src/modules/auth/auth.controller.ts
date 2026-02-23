import { Controller, Post, Body, Get, Query, Res, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }

  @Post('register')
  signUp(@Body() body: any) {
    return this.authService.register(body.email, body.password, body.name);
  }
  
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
      await this.authService.verifyEmail(token);
      // הפניה לדף הלוגין עם פרמטר הצלחה
      return res.redirect('https://webhook.botomat.co.il/login?verified=true');
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: any) { return this.authService.forgotPassword(body.email); }

  @Get('validate-reset-token/:token')
  validateToken(@Param('token') token: string) { return this.authService.validateResetToken(token); }

  @Post('reset-password')
  resetPassword(@Body() body: any) { return this.authService.resetPassword(body.token, body.password); }
}
