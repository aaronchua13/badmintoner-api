import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const email = 'aaronchua13@gmail.com';
    const user: any = await usersService.findOneByEmail(email);

    if (user) {
      console.log(`User ${email} found. Resetting password...`);
      const userCredentialModel = (usersService as any).userCredentialModel;
      const credential = await userCredentialModel
        .findOne({ user_id: user._id })
        .exec();

      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash('aaron123', salt);

      if (credential) {
        credential.passwordHash = hash;
        await credential.save();
        console.log('Password updated.');
      } else {
        console.log('Credential not found. Creating new...');
        await userCredentialModel.create({
          userId: user._id,
          passwordHash: hash,
        });
        console.log('Credential created.');
      }
    } else {
      console.log('User not found. Creating fresh...');
      await usersService.create({
        email,
        password: 'aaron123',
        first_name: 'Aaron',
        last_name: 'Chua',
      });
      console.log('User created with password.');
    }

    await app.close();
  } catch (e) {
    console.error(e);
  }
}
bootstrap();
