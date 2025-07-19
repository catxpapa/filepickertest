const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');

const app = express();
const port = 3000;

// 中间件配置
app.use(cors());
app.use(express.json());

// 提供静态文件服务
app.use(express.static(path.join(__dirname, '../web')));

// 文件上传配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        // 允许常见文件类型
        const allowedTypes = /jpeg|jpg|png|gif|pdf|txt|doc|docx|zip/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'));
        }
    }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: '懒猫文件选择器测试应用后端服务运行正常',
        timestamp: new Date().toISOString(),
        filepicker_info: '文件选择器在前端运行，后端提供文件管理服务'
    });
});

// 应用信息接口
app.get('/api/info', (req, res) => {
    res.json({
        name: '懒猫文件选择器测试应用',
        version: '1.0.0',
        description: '懒猫官方文件选择器插件功能测试',
        features: [
            '文件选择功能测试',
            '目录选择功能测试', 
            '文件保存功能测试',
            '多种文件类型支持',
            '文件上传下载测试',
            '网盘集成测试'
        ]
    });
});

// 文件上传接口
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有文件被上传' });
        }
        
        res.json({
            success: true,
            message: '文件上传成功',
            file: {
                originalName: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                path: req.file.path
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取上传文件列表
app.get('/api/files', async (req, res) => {
    try {
        const uploadDir = path.join(__dirname, '../uploads');
        await fs.ensureDir(uploadDir);
        
        const files = await fs.readdir(uploadDir);
        const fileList = await Promise.all(files.map(async (filename) => {
            const filePath = path.join(uploadDir, filename);
            const stats = await fs.stat(filePath);
            return {
                name: filename,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
        }));
        
        res.json({
            success: true,
            files: fileList
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 文件下载接口
app.get('/api/download/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../uploads', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '文件不存在' });
        }
        
        res.download(filePath, filename);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 删除文件接口
app.delete('/api/files/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../uploads', filename);
        
        if (!await fs.pathExists(filePath)) {
            return res.status(404).json({ error: '文件不存在' });
        }
        
        await fs.remove(filePath);
        res.json({
            success: true,
            message: '文件删除成功'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 默认路由 - 返回主页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../web/index.html'));
});

// 启动服务器
app.listen(port, () => {
    console.log(`懒猫文件选择器测试应用后端服务启动成功，端口: ${port}`);
    console.log('提供静态文件服务和文件管理API');
    console.log('API 端点:');
    console.log('  GET /api/health - 健康检查');
    console.log('  GET /api/info - 应用信息');
    console.log('  POST /api/upload - 文件上传');
    console.log('  GET /api/files - 获取文件列表');
    console.log('  GET /api/download/:filename - 文件下载');
    console.log('  DELETE /api/files/:filename - 删除文件');
});