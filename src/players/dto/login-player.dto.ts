import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginPlayerDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
