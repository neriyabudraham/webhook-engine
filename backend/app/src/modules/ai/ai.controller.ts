import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate')
  async generate(@Body() body: { prompt: string, sample: any }) {
    return this.aiService.generateFilter(body.prompt, body.sample);
  }
}
