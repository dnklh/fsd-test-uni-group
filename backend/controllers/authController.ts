import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { AuthService } from '../services/authService';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Basic validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters long',
        });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
        });
      }

      const { user, token } = await authService.register(email, password);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.message === 'User with this email already exists') {
        return res.status(409).json({ error: error.message });
      }

      res.status(500).json({
        error: 'Internal server error during registration',
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Basic validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
        });
      }

      const { user, token } = await authService.login(email, password);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.message === 'Invalid email or password') {
        return res.status(401).json({ error: error.message });
      }

      res.status(500).json({
        error: 'Internal server error during login',
      });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      // User is available from auth middleware
      const user = (req as any).user;

      res.json({
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}
