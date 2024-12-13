const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');

// テスト用のモックPrismaClientを作成
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $queryRaw: jest.fn(),
      $disconnect: jest.fn()
    }))
  };
});

describe('Health Check Endpoints', () => {
  let app;
  let prisma;
  
  beforeEach(() => {
    // 各テストの前にExpressアプリケーションを新規作成
    const application = new (require('../app').Application)();
    prisma = new PrismaClient();
    return application.initialize().then(() => {
      app = application.app;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 and healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy'
      });
    });
  });

  describe('GET /health-db', () => {
    it('should return 200 and healthy status when database is connected', async () => {
      // データベース接続成功のモック
      prisma.$queryRaw.mockResolvedValueOnce([{ 1: 1 }]);

      const response = await request(app)
        .get('/health-db')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy'
      });
    });
  });
}); 