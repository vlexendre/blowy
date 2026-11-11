import { Controller, Get, Inject, Post, Put, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../../shared/auth.guard';
import { DomainError } from '../../shared/errors';
import { STORAGE } from '../../shared/tokens';
import type { MemoryStorage } from './memory-storage';

/** Envoi et lecture des médias en mode mémoire (développement local et tests) : imite les URL signées. */
@Public()
@Controller('dev')
export class DevMediaController {
  constructor(@Inject(STORAGE) private readonly storage: MemoryStorage) {}

  @Put('uploads/*path')
  upload(@Req() req: Request): { ok: true } {
    return this.receive(req);
  }

  @Post('uploads/*path')
  uploadPost(@Req() req: Request): { ok: true } {
    return this.receive(req);
  }

  @Get('media/*path')
  media(@Req() req: Request, @Res() res: Response): void {
    const file = this.storage.read(pathAfter(req, '/dev/media/'), tokenOf(req));
    if (!file) throw new DomainError('not_found');
    res.setHeader('content-type', file.contentType);
    res.setHeader('cache-control', 'private, max-age=3600');
    res.send(file.bytes);
  }

  private receive(req: Request): { ok: true } {
    const body: unknown = req.body;
    if (!Buffer.isBuffer(body) || body.length === 0) throw new DomainError('invalid', 'Le fichier est vide.');
    const contentType = req.headers['content-type'] ?? 'application/octet-stream';
    if (!this.storage.put(pathAfter(req, '/dev/uploads/'), tokenOf(req), { bytes: body, contentType })) {
      throw new DomainError('forbidden', 'Ce lien d’envoi n’est plus valable.');
    }
    return { ok: true };
  }
}

const pathAfter = (req: Request, prefix: string): string => req.path.slice(prefix.length).split('/').map(decodeURIComponent).join('/');
const tokenOf = (req: Request): string => (typeof req.query.token === 'string' ? req.query.token : '');
