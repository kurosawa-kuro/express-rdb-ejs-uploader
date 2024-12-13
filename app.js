const express = require('express');
const asyncHandler = require('express-async-handler');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
require('dotenv').config();

// アップロードの設定を管理するクラス
class UploadConfig {
  static storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  static upload = multer({
    storage: this.storage,
    limits: {
      fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
      }
    }
  });
}

// サーバー設定を管理するクラス
class ServerConfig {
  static configureServer(app) {
    const logFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms :request-body';
    morgan.token('request-body', (req) => JSON.stringify(req.body));

    app.use(morgan(logFormat));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(helmet({
      contentSecurityPolicy: false
    }));

    app.use('/uploads', express.static('uploads'));
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
  }
}

// ヘルスチェックを管理するクラス
class HealthController {
  constructor(prisma) {
    this.prisma = prisma;
  }

  checkHealth = asyncHandler(async (req, res) => {
    res.json({ status: 'healthy' });
  });

  checkDbHealth = asyncHandler(async (req, res) => {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'healthy' });
    } catch (err) {
      console.error('Database health check failed:', err);
      res.status(500).json({ status: 'unhealthy', error: err.message });
    }
  });
}

// Micropostの操作を管理するクラス
class MicropostController {
  constructor(prisma) {
    this.prisma = prisma;
  }

  getMicroposts = asyncHandler(async (req, res) => {
    const microposts = await this.prisma.micropost.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(microposts);
  });

  createMicropost = asyncHandler(async (req, res) => {
    const { title } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const micropost = await this.prisma.micropost.create({
      data: { title, imageUrl }
    });
    
    res.status(201).json(micropost);
  });

  showIndex = asyncHandler(async (req, res) => {
    const microposts = await this.prisma.micropost.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.render('index', { microposts });
  });

  createMicropostWeb = asyncHandler(async (req, res) => {
    const { title } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    await this.prisma.micropost.create({
      data: { title, imageUrl }
    });
    res.redirect('/');
  });
}

// ルーティングを管理するクラス
class Router {
  static setupRoutes(app, healthController, micropostController, upload) {
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

// アプリケーションのメインクラス
class Application {
  constructor() {
    this.prisma = new PrismaClient();
    this.app = express();
    this.port = process.env.PORT || 3001;
  }

  async initialize() {
    this.ensureUploadDirectory();
    ServerConfig.configureServer(this.app);
    
    const healthController = new HealthController(this.prisma);
    const micropostController = new MicropostController(this.prisma);
    
    Router.setupRoutes(
      this.app,
      healthController,
      micropostController,
      UploadConfig.upload
    );

    this.setupErrorHandler();
  }

  ensureUploadDirectory() {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
  }

  setupErrorHandler() {
    this.app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ error: err.message });
    });
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
const app = new Application();
app.start().catch((err) => {
  console.error('アプリケーション起動エラー:', err);
  process.exit(1);
});

// クリーンアップ処理
process.on('beforeExit', async () => {
  await app.cleanup();
});