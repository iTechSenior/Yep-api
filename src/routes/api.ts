import { Request, Response } from 'express';
const express = require('express');
const router = express.Router();

// GET /api
router.get('/', (req: Request, res: Response) => {
  const name = req.query.name || 'World';
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
});

export default router;
