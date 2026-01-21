import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function bootstrap() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);
    
    const userModel = (usersService as any).userModel;
    if (userModel) {
        const latestUser = await userModel.find().sort({ _id: -1 }).limit(1).exec();
        console.log('Latest user:', latestUser[0]);
    }

    await app.close();
  } catch (e) {
    console.error(e);
  }
}
bootstrap();
