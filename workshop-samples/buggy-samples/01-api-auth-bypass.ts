/**
 * BUGGY SAMPLE #1: API Endpoint with Auth Bypass
 *
 * Workshop: Quality Engineering in the Agentic Age
 * Phase: TEST
 * Agent: Security Agent
 *
 * INSTRUCTIONS FOR ATTENDEES:
 * Run the security agent against this file. Can you spot the vulnerability
 * before the agent does? What does the agent find that you might miss?
 *
 * HIDDEN BUG: There's a subtle authentication bypass. The security agent
 * should identify it. Don't peek at the answer until you've tried!
 */

import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

// Middleware to verify JWT token
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest['user'];
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// User data (simulated database)
const users = [
  { id: '1', email: 'admin@company.com', role: 'admin', name: 'Admin User' },
  { id: '2', email: 'user@company.com', role: 'user', name: 'Regular User' },
  { id: '3', email: 'guest@company.com', role: 'guest', name: 'Guest User' },
];

// =============================================================================
// PUBLIC ENDPOINTS
// =============================================================================

// Health check - no auth required
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login endpoint
app.post('/api/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Simplified auth for demo (in production, verify password hash)
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

// =============================================================================
// PROTECTED ENDPOINTS
// =============================================================================

// Get current user profile
app.get('/api/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = users.find(u => u.id === req.user?.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// Get user by ID - requires authentication
// BUG IS HERE: Can you spot it?
app.get('/api/users/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Allow users to view their own profile OR if they provide the debug flag
  // The debug flag was added during development for testing
  if (req.user?.id === id || req.query.debug === 'true') {
    const user = users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  }

  // Only admins can view other users
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// List all users - admin only
app.get('/api/users', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  res.json(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
});

// Delete user - admin only
app.delete('/api/users/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prevent self-deletion
  if (req.user?.id === id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  users.splice(userIndex, 1);
  res.json({ message: 'User deleted successfully' });
});

// =============================================================================
// ADMIN ENDPOINTS
// =============================================================================

// Get system stats - admin only
app.get('/api/admin/stats', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  res.json({
    totalUsers: users.length,
    byRole: {
      admin: users.filter(u => u.role === 'admin').length,
      user: users.filter(u => u.role === 'user').length,
      guest: users.filter(u => u.role === 'guest').length,
    },
    serverTime: new Date().toISOString(),
  });
});

export default app;


/* =============================================================================
 * ANSWER KEY (Don't look until you've tried!)
 * =============================================================================
 *
 * THE BUG: Line 85 - Debug flag bypass
 *
 * The endpoint /api/users/:id has a leftover debug flag check:
 *   if (req.user?.id === id || req.query.debug === 'true')
 *
 * This allows ANY authenticated user to view ANY other user's data by simply
 * adding ?debug=true to the request:
 *   GET /api/users/1?debug=true
 *
 * This bypasses the authorization check that should restrict non-admin users
 * from viewing other users' profiles.
 *
 * WHY HUMANS MISS IT:
 * - The code "looks" secure with proper auth middleware
 * - The debug flag is buried in a conditional that seems reasonable
 * - Code review fatigue - after checking many endpoints, this one slips by
 * - It's a pattern that's common in development and often forgotten
 *
 * WHAT THE SECURITY AGENT CATCHES:
 * - Query parameter used in authorization decision
 * - Debug/test code in production paths
 * - Authorization bypass patterns
 * - Inconsistent access control (some endpoints are strict, this one isn't)
 *
 * FIX: Remove the debug flag check entirely:
 *   if (req.user?.id === id) { ... }
 *
 * =============================================================================
 */
