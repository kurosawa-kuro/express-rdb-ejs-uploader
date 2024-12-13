const express = require('express');
const asyncHandler = require('express-async-handler');
const morgan = require('morgan');
const path = require('path');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
require('dotenv').config();
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

// ファイルアップロードの検証を担当するクラス
class FileValidator {
  static validateFileType(mimetype) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    return allowedTypes.includes(mimetype);
  }

  static getFileSize() {
    return 5 * 1024 * 1024; // 5MB
  }
}

// ファイル保存の責務を持つクラス
class FileStorage {
  static createS3Client() {
    return new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }

  static createStorage() {
    const s3 = this.createS3Client();
    
    return multerS3({
      s3: s3,
      bucket: process.env.AWS_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
    });
  }

  static createUploader() {
    return multer({
      storage: this.createStorage(),
      limits: {
        fileSize: FileValidator.getFileSize()
      },
      fileFilter: (req, file, cb) => {
        if (FileValidator.validateFileType(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
        }
      }
    });
  }
}

// ロギングの設定を担当するクラス
class LoggerConfig {
  static createLogger() {
    const logFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms :request-body';
    morgan.token('request-body', (req) => JSON.stringify(req.body));
    return morgan(logFormat);
  }
}

// Express設定を担当するクラス
class ExpressConfig {
  static configure(app) {
    app.use(LoggerConfig.createLogger());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/uploads', express.static('uploads'));
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
  }
}

// ヘルスチェックの責務を持つクラス
class HealthService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async checkDatabase() {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}

// ヘルスチェックのエンドポイントを担当するクラス
class HealthController {
  constructor(healthService) {
    this.healthService = healthService;
  }

  checkHealth = asyncHandler(async (req, res) => {
    res.json({ status: 'healthy' });
  });

  checkDbHealth = asyncHandler(async (req, res) => {
    try {
      await this.healthService.checkDatabase();
      res.json({ status: 'healthy' });
    } catch (err) {
      console.error('Database health check failed:', err);
      res.status(500).json({ status: 'unhealthy', error: err.message });
    }
  });
}

// Micropostのビジネスロジックを担当するクラス
class MicropostService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getAllMicroposts() {
    return await this.prisma.micropost.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async createMicropost(title, imageUrl) {
    return await this.prisma.micropost.create({
      data: { title, imageUrl }
    });
  }
}

// Micropostのエンドポイントを担当するクラス
class MicropostController {
  constructor(micropostService) {
    this.micropostService = micropostService;
  }

  getMicroposts = asyncHandler(async (req, res) => {
    const microposts = await this.micropostService.getAllMicroposts();
    res.json(microposts);
  });

  createMicropost = asyncHandler(async (req, res) => {
    const { title } = req.body;
    const imageUrl = req.file ? req.file.location : null;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const micropost = await this.micropostService.createMicropost(title, imageUrl);
    res.status(201).json(micropost);
  });

  showIndex = asyncHandler(async (req, res) => {
    const microposts = await this.micropostService.getAllMicroposts();
    res.render('index', { microposts });
  });

  createMicropostWeb = asyncHandler(async (req, res) => {
    const { title } = req.body;
    const imageUrl = req.file ? req.file.location : null;
    
    await this.micropostService.createMicropost(title, imageUrl);
    res.redirect('/');
  });
}

// ルーティングの設定を担当するクラス
class RouteConfig {
  static configure(app, healthController, micropostController, upload) {
    // APIルート
    app.get('/health', healthController.checkHealth);
    app.get('/health-db', healthController.checkDbHealth);
    app.get('/api/microposts', micropostController.getMicroposts);
    app.post('/api/microposts', upload.single('image'), micropostController.createMicropost);

    // Webルート
    app.get('/', micropostController.showIndex);
    app.post('/microposts', upload.single('image'), micropostController.createMicropostWeb);
  }
}

// エラーハンドリングを担当するクラス
class ErrorHandler {
  static configure(app) {
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ error: err.message });
    });
  }
}

// アプリケーションのライフサイクルを管理するクラス
class Application {
  constructor() {
    this.prisma = new PrismaClient();
    this.app = express();
    this.port = process.env.PORT || 3001;
  }

  ensureUploadDirectory() {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
  }

  async initialize() {
    this.ensureUploadDirectory();
    ExpressConfig.configure(this.app);
    
    const healthService = new HealthService(this.prisma);
    const healthController = new HealthController(healthService);
    
    const micropostService = new MicropostService(this.prisma);
    const micropostController = new MicropostController(micropostService);
    
    RouteConfig.configure(
      this.app,
      healthController,
      micropostController,
      FileStorage.createUploader()
    );

    ErrorHandler.configure(this.app);
  }

  async start() {
    await this.initialize();
    this.app.listen(this.port, () => {
      console.log(`APIサーバーが起動しました - ポート${this.port}`);
    });
  }

  async cleanup() {
    await this.prisma.$disconnect();
  }
}

// アプリケーションの起動
if (require.main === module) {
  const app = new Application();
  app.start().catch((err) => {
    console.error('アプリケーション起動エラー:', err);
    process.exit(1);
  });

  // クリーンアップ処理
  process.on('beforeExit', async () => {
    await app.cleanup();
  });
}

// テスト用にエクスポート
module.exports = {
  Application
};