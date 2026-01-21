import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { Request } from 'express';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const usersService = app.get(UsersService);
  const jwtStrategy = app.get(JwtStrategy);
  
  // 1. Login
  console.log('--- Testing Login ---');
  const user = await usersService.findOneByEmail('aaronchua13@gmail.com');
  if (!user) { console.error('User not found'); return; }
  
  // Validate credentials
  const validatedUser = await authService.validateUser('aaronchua13@gmail.com', 'aaron123');
  if (!validatedUser) {
    console.error('Credentials validation failed');
    return;
  }
  console.log('Credentials valid.');
  
  const loginResult = await authService.login(user as any);
  const token = loginResult.access_token;
  console.log('Login successful. Token:', token.substring(0, 20) + '...');
  
  // 2. Verify Session via JwtStrategy
  console.log('\n--- Testing Session Verification ---');
  const mockReq = {
    headers: {
        authorization: `Bearer ${token}`
    }
  } as unknown as Request;
  
  const payload = { sub: user._id, email: user.email };
  
  try {
      const result = await jwtStrategy.validate(mockReq, payload);
      console.log('Session validation success:', result);
  } catch (e) {
      console.error('Session validation failed:', e.message);
  }
  
  // 3. Invalidate Session (Simulate expiry or deletion)
  console.log('\n--- Testing Invalid Session ---');
  const sessionModel = (authService as any).sessionModel;
  await sessionModel.deleteMany({ user_id: user._id });
  console.log('Sessions deleted for user.');
  
  try {
      await jwtStrategy.validate(mockReq, payload);
      console.log('Session validation success (UNEXPECTED)');
  } catch (e) {
      console.log('Session validation failed (EXPECTED):', e.message);
  }

  await app.close();
}
bootstrap();
