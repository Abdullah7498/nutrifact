import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Put,
  Req,
  UseGuards,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  uploadProfilePhoto,
  profilePhotoUrl,
  deleteProfilePhoto,
} from './photo.storage.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import {
  buildDietGuidance,
  estimatePlan,
  planSchema,
  saveSchema,
  validateProfile,
} from './profile.logic.js';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(userModel) {
    this.userModel = userModel;
  }

  @Get()
  async get(request) {
    const user = await this.userModel
      .findById(request.user.sub)
      .select('nutritionProfile photoKey');
    return {
      profile: user?.nutritionProfile ?? null,
      photoUrl: await profilePhotoUrl(user?.photoKey),
    };
  }

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('photo', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async uploadPhoto(request, file, body) {
    if (!file && body?.imageBase64) {
      const encoded = body.imageBase64;
      if (
        typeof encoded !== 'string' ||
        encoded.length > 7 * 1024 * 1024 ||
        encoded.length % 4 !== 0 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
      ) {
        throw new BadRequestException('Invalid photo data');
      }
      file = { buffer: Buffer.from(encoded, 'base64') };
    }
    const user = await this.userModel
      .findById(request.user.sub)
      .select('photoKey');
    if (!user) throw new BadRequestException('Account not found');
    const key = await uploadProfilePhoto(request.user.sub, file);
    const previous = user.photoKey;
    try {
      await this.userModel.findByIdAndUpdate(request.user.sub, {
        photoKey: key,
      });
    } catch (error) {
      await deleteProfilePhoto(key).catch(() => {});
      throw error;
    }
    if (previous) await deleteProfilePhoto(previous).catch(() => {});
    return { photoUrl: await profilePhotoUrl(key) };
  }

  @Post('estimate')
  estimate(body) {
    try {
      return { plan: estimatePlan(body), guidance: buildDietGuidance(body) };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put()
  async save(request, body) {
    try {
      const parsed = saveSchema.parse(body);
      validateProfile(parsed);
      const profile = {
        ...parsed,
        plan: planSchema.parse(parsed.plan),
        guidance: buildDietGuidance(parsed),
        completedAt: new Date(),
      };
      await this.userModel.findByIdAndUpdate(request.user.sub, {
        nutritionProfile: profile,
      });
      return { profile };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
Inject(getModelToken('User'))(ProfileController, undefined, 0);
Req()(ProfileController.prototype, 'get', 0);
Body()(ProfileController.prototype, 'estimate', 0);
Req()(ProfileController.prototype, 'save', 0);
Body()(ProfileController.prototype, 'save', 1);

Req()(ProfileController.prototype, 'uploadPhoto', 0);
UploadedFile()(ProfileController.prototype, 'uploadPhoto', 1);
Body()(ProfileController.prototype, 'uploadPhoto', 2);
