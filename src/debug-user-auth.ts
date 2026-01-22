import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function bootstrap() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const email = 'aaronchua13@gmail.com';
    let user: any = await usersService.findOneByEmail(email);

    if (!user) {
      console.log(`User ${email} not found. Creating...`);
      user = await usersService.create({
        email,
        password: 'aaron123',
        first_name: 'Aaron',
        last_name: 'Chua',
      });
      console.log('User created:', user._id);
    } else {
      console.log('User found:', user._id);
    }

    if (!user) {
      console.log('User still null, aborting');
      await app.close();
      return;
    }

    // Debug credential retrieval
    console.log('Attempting to retrieve credentials for user:', user._id);

    // Try via service method (current implementation)
    const creds1 = await usersService.findCredentialsByUserId(user._id);
    console.log(
      'Service findCredentialsByUserId result:',
      creds1 ? 'Found' : 'Not Found',
    );

    // Try direct model access
    const userCredentialModel = (usersService as any).userCredentialModel;

    // Query with 'userId' (property name)
    const creds2 = await userCredentialModel
      .findOne({ userId: user._id })
      .exec();
    console.log(
      'Query with { userId: ... } result:',
      creds2 ? 'Found' : 'Not Found',
    );

    // Query with 'user_id' (DB field name)
    const creds3 = await userCredentialModel
      .findOne({ user_id: user._id })
      .exec();
    console.log(
      'Query with { user_id: ... } result:',
      creds3 ? 'Found' : 'Not Found',
    );

    await app.close();
  } catch (e) {
    console.error(e);
  }
}
bootstrap();
