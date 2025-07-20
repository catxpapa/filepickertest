const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');

const app = express();
const port = 3000;

// 获取懒猫微服环境变量 [citation](4)
const LAZYCAT_BOX_NAME = process.env.LAZYCAT_BOX_NAME || 'kagee';
const LAZYCAT_BOX_DOMAIN = process.env.LAZYCAT_BOX_DOMAIN || 'kagee.heiyu.space';
const LAZYCAT_APP_DOMAIN = process.env.LAZYCAT_APP_DOMAIN || 'filepickertest.kagee.heiyu.space';
const LAZYCAT_APP_ID = process.env.LAZYCAT_APP_ID || 'cloud.lazycat.app.filepickertest';

// 构建正确的文件选择器域名
const FILE_PICKER_DOMAIN = `https://file.${LAZYCAT_BOX_NAME}.heiyu.space`;

console.log('懒猫微服环境信息:');
console.log('- 设备名称:', LAZYCAT_BOX_NAME);
console.log('- 设备域名:', LAZYCAT_BOX_DOMAIN);
console.log('- 应用域名:', LAZYCAT_APP_DOMAIN);
console.log('- 应用ID:', LAZYCAT_APP_ID);
console.log('- 文件选择器域名:', FILE_PICKER_DOMAIN);

// 中间件配置
app.use(cors());
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 关键修正：在这里创建 API 路由器
const apiRouter = express.Router();

// 存储路径映射
const getStoragePath = (storageType, userId = null) => {
    const storageMap = {
        'var': '/lzcapp/var',
        'cache': '/lzcapp/cache',
        'home': userId ? `/lzcapp/run/mnt/home/${userId}` : '/lzcapp/run/mnt/home',
        'temp': '/tmp'
    };
    return storageMap[storageType] || storageMap['var'];
};

// 配置 multer 文件上传
const createMulterConfig = (storageType, userId = null) => {
    const uploadPath = path.join(getStoragePath(storageType, userId), 'uploads');
    
    const storage = multer.diskStorage({
        destination: async (req, file, cb) => {
            try {
                await fs.ensureDir(uploadPath);
                cb(null, uploadPath);
            } catch (error) {
                console.error('创建上传目录失败:', error);
                cb(error);
            }
        },
        filename: (req, file, cb) => {
            // 生成唯一文件名：时间戳-原始名称
            const timestamp = Date.now();
            const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const uniqueName = `${timestamp}-${originalName}`;
            cb(null, uniqueName);
        }
    });

    const fileFilter = (req, file, cb) => {
        // 允许的文件类型
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'text/plain', 'text/csv',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip', 'application/x-zip-compressed'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB 限制
            files: 5 // 最多5个文件
        }
    });
};

// 现在可以安全地定义 API 路由

// 健康检查接口
apiRouter.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: '懒猫文件选择器测试应用后端服务运行正常',
        timestamp: new Date().toISOString(),
        environment: {
            boxName: LAZYCAT_BOX_NAME,
            boxDomain: LAZYCAT_BOX_DOMAIN,
            appDomain: LAZYCAT_APP_DOMAIN,
            appId: LAZYCAT_APP_ID
        }
    });
});

// 获取懒猫微服环境信息接口
apiRouter.get('/lazycat-env', (req, res) => {
    res.json({
        success: true,
        environment: {
            boxName: LAZYCAT_BOX_NAME,
            boxDomain: LAZYCAT_BOX_DOMAIN,
            appDomain: LAZYCAT_APP_DOMAIN,
            appId: LAZYCAT_APP_ID,
            filePickerDomain: FILE_PICKER_DOMAIN
        }
    });
});

// 获取用户信息的API接口 [citation](4)
apiRouter.get('/user-info', (req, res) => {
    // 从请求头中获取用户ID
    const userId = req.headers['x-hc-user-id'] || 'default';
    const userRole = req.headers['x-hc-user-role'] || 'USER';
    
    console.log('获取用户信息:', { userId, userRole });
    
    res.json({
        success: true,
        user: {
            id: userId,
            role: userRole,
            name: userId // 可以根据需要扩展
        }
    });
});

// 文件上传接口
apiRouter.post('/upload', (req, res) => {
    const storageType = req.body.storageType || req.query.storageType || 'var';
    const userId = req.headers['x-hc-user-id']; // 获取当前用户ID
    
    const upload = createMulterConfig(storageType, userId);
    
    upload.array('files', 5)(req, res, async (err) => {
        if (err) {
            console.error('文件上传错误:', err);
            return res.status(400).json({
                success: false,
                error: err.message
            });
        }

        try {
            const uploadedFiles = req.files.map(file => ({
                originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
                filename: file.filename,
                size: file.size,
                mimetype: file.mimetype,
                storagePath: file.path,
                storageType: storageType,
                uploadTime: new Date().toISOString()
            }));

            console.log(`成功上传 ${uploadedFiles.length} 个文件到 ${storageType} 存储`);

            res.json({
                success: true,
                message: `成功上传 ${uploadedFiles.length} 个文件`,
                files: uploadedFiles,
                storageInfo: {
                    type: storageType,
                    path: getStoragePath(storageType, userId),
                    uploadPath: path.join(getStoragePath(storageType, userId), 'uploads')
                }
            });
        } catch (error) {
            console.error('处理上传文件时出错:', error);
            res.status(500).json({
                success: false,
                error: '处理上传文件时出错'
            });
        }
    });
});

// 获取文件列表接口
apiRouter.get('/files', async (req, res) => {
    try {
        const storageType = req.query.storageType || 'var';
        const userId = req.headers['x-hc-user-id'];
        const uploadDir = path.join(getStoragePath(storageType, userId), 'uploads');
        
        await fs.ensureDir(uploadDir);
        
        const files = await fs.readdir(uploadDir);
        const fileList = await Promise.all(files.map(async (filename) => {
            const filePath = path.join(uploadDir, filename);
            const stats = await fs.stat(filePath);
            return {
                name: filename,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                path: filePath,
                storageType: storageType
            };
        }));
        
        res.json({
            success: true,
            files: fileList,
            storageInfo: {
                type: storageType,
                path: getStoragePath(storageType, userId),
                uploadPath: uploadDir,
                totalFiles: fileList.length,
                totalSize: fileList.reduce((sum, file) => sum + file.size, 0)
            }
        });
    } catch (error) {
        console.error('获取文件列表失败:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// 下载文件接口
apiRouter.get('/download/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const storageType = req.query.storageType || 'var';
        const userId = req.headers['x-hc-user-id'];
        const filePath = path.join(getStoragePath(storageType, userId), 'uploads', filename);
        
        if (await fs.pathExists(filePath)) {
            const stats = await fs.stat(filePath);
            const originalName = filename.replace(/^\d+-/, ''); // 移除时间戳前缀
            
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
            res.setHeader('Content-Length', stats.size);
            
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        } else {
            res.status(404).json({
                success: false,
                error: '文件不存在'
            });
        }
    } catch (error) {
        console.error('下载文件失败:', error);
        res.status(500).json({
            success: false,
            error: '下载文件失败'
        });
    }
});

// 删除文件接口
apiRouter.delete('/files/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const storageType = req.query.storageType || 'var';
        const userId = req.headers['x-hc-user-id'];
        const filePath = path.join(getStoragePath(storageType, userId), 'uploads', filename);
        
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
            res.json({
                success: true,
                message: `文件 ${filename} 已删除`
            });
        } else {
            res.status(404).json({
                success: false,
                error: '文件不存在'
            });
        }
    } catch (error) {
        console.error('删除文件失败:', error);
        res.status(500).json({
            success: false,
            error: '删除文件失败'
        });
    }
});

// 清空文件接口
apiRouter.delete('/files', async (req, res) => {
    try {
        const storageType = req.query.storageType || 'var';
        const userId = req.headers['x-hc-user-id'];
        const uploadDir = path.join(getStoragePath(storageType, userId), 'uploads');
        
        if (await fs.pathExists(uploadDir)) {
            await fs.emptyDir(uploadDir);
            res.json({
                success: true,
                message: `${storageType} 存储目录已清空`
            });
        } else {
            res.json({
                success: true,
                message: '目录不存在，无需清空'
            });
        }
    } catch (error) {
        console.error('清空文件失败:', error);
        res.status(500).json({
            success: false,
            error: '清空文件失败'
        });
    }
});

// 应用信息接口
apiRouter.get('/info', (req, res) => {
    res.json({
        name: '懒猫文件选择器测试应用',
        version: '1.0.0',
        description: '懒猫官方文件选择器插件功能测试',
        features: [
            '文件选择功能测试',
            '目录选择功能测试', 
            '文件保存功能测试',
            '本地文件上传功能',
            '多种文件类型支持',
            '文件上传下载测试',
            '网盘集成测试'
        ],
        environment: {
            boxName: LAZYCAT_BOX_NAME,
            correctFilePickerDomain: FILE_PICKER_DOMAIN
        }
    });
});

// 挂载API路由器到 /api 路径
app.use('/api', apiRouter);

// 静态文件服务
app.use(express.static(path.join(__dirname, '../web')));

// 根路径重定向
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../web/index.html'));
});

// 启动服务器
app.listen(port, '0.0.0.0', () => {
    console.log(`懒猫文件选择器测试应用后端服务启动成功，端口: ${port}`);
    console.log('API 端点:');
    console.log('  GET /api/health - 健康检查');
    console.log('  GET /api/info - 应用信息');
    console.log('  GET /api/lazycat-env - 环境变量');
    console.log('  GET /api/user-info - 用户信息');
    console.log('  POST /api/upload - 文件上传');
    console.log('  GET /api/files - 文件列表');
    console.log('  GET /api/download/:filename - 文件下载');
    console.log('  DELETE /api/files/:filename - 删除文件');
    console.log('  DELETE /api/files - 清空文件');
});