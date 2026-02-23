import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecretkey',
    });
  }

  async validate(payload: any) {
    // כאן הקסם קורה: אנחנו מעבירים את ה-role מהטוקן לתוך הבקשה
    // כך ש-req.user.role יהיה זמין בקונטרולר
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
