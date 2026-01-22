import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function bootstrap() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const userModel = (usersService as any).userModel;
    if (userModel) {
      const user = await userModel
        .findOne({ email: 'admin_v2@badmintoner.com' })
        .exec();
      if (user) {
        user.role = 'admin';
        await user.save();
        console.log('User admin_v2@badmintoner.com promoted to admin.');
      } else {
        console.log('User not found.');
      }
    }

    await app.close();
  } catch (e) {
    console.error(e);
  }
}
bootstrap();
