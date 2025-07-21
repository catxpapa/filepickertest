const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const app = express();

// 中间件配置
app.use(express.json());
app.use(express.static('web'));

// 文件存储配置 - 支持 var 和 cache 两种存储方式
const createStorage = (storageType) => {
    const storagePath = storageType === 'var' ? '/lzcapp/var/uploads' : '/lzcapp/cache/uploads';
    
    return multer.diskStorage({
        destination: async (req, file, cb) => {
            try {
                await fs.mkdir(storagePath, { recursive: true });
                cb(null, storagePath);
            } catch (error) {
                cb(error);
            }
        },
        filename: (req, file, cb) => {
            const timestamp = Date.now();
            const uniqueName = `${timestamp}-${file.originalname}`;
            cb(null, uniqueName);
        }
    });
};

// 文件类型验证
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'doc', 'docx', 'zip', 'rar'];
    const fileExt = path.extname(file.originalname).slice(1).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
        cb(null, true);
    } else {
        cb(new Error(`不支持的文件类型: ${fileExt}`), false);
    }
};

// 创建上传中间件
const uploadToVar = multer({ 
    storage: createStorage('var'), 
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const uploadToCache = multer({ 
    storage: createStorage('cache'), 
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// API 路由

// 获取懒猫环境信息
app.get('/api/lazycat-env', (req, res) => {
    try {
        const environment = {
            boxName: process.env.LAZYCAT_BOX_NAME || 'kagee',
            boxDomain: process.env.LAZYCAT_BOX_DOMAIN || 'kagee.heiyu.space',
            appDomain: process.env.LAZYCAT_APP_DOMAIN || 'filepickertest.kagee.heiyu.space',
            appId: process.env.LAZYCAT_APP_ID || 'cloud.lazycat.app.filepickertest',
            filePickerDomain: `https://file.${process.env.LAZYCAT_BOX_NAME || 'kagee'}.heiyu.space`
        };

        res.json({
            success: true,
            environment,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取用户信息
app.get('/api/user-info', (req, res) => {
    res.json({
        success: true,
        user: {
            id: 'admin', // 实际应用中应从认证系统获取
            role: 'ADMIN'
        }
    });
});

// 文件上传到 var 目录
app.post('/api/upload/var', uploadToVar.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: '没有上传文件'
            });
        }

        const uploadedFiles = req.files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            storagePath: file.path,
            storageType: 'var',
            uploadTime: new Date().toISOString()
        }));

        res.json({
            success: true,
            message: `成功上传 ${uploadedFiles.length} 个文件到 var 目录`,
            files: uploadedFiles,
            storageInfo: {
                type: 'var',
                path: '/lzcapp/var',
                uploadPath: '/lzcapp/var/uploads'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 文件上传到 cache 目录
app.post('/api/upload/cache', uploadToCache.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: '没有上传文件'
            });
        }

        const uploadedFiles = req.files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            storagePath: file.path,
            storageType: 'cache',
            uploadTime: new Date().toISOString()
        }));

        res.json({
            success: true,
            message: `成功上传 ${uploadedFiles.length} 个文件到 cache 目录`,
            files: uploadedFiles,
            storageInfo: {
                type: 'cache',
                path: '/lzcapp/cache',
                uploadPath: '/lzcapp/cache/uploads'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取已上传文件列表
app.get('/api/files/:storageType', async (req, res) => {
    try {
        const { storageType } = req.params;
        const storagePath = storageType === 'var' ? '/lzcapp/var/uploads' : '/lzcapp/cache/uploads';
        
        try {
            const files = await fs.readdir(storagePath);
            const fileList = await Promise.all(
                files.map(async (filename) => {
                    const filePath = path.join(storagePath, filename);
                    const stats = await fs.stat(filePath);
                    return {
                        filename,
                        size: stats.size,
                        uploadTime: stats.mtime.toISOString(),
                        storageType
                    };
                })
            );
            
            res.json({
                success: true,
                files: fileList,
                storageType
            });
        } catch (error) {
            res.json({
                success: true,
                files: [],
                storageType,
                message: '目录不存在或为空'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 删除文件
app.delete('/api/files/:storageType/:filename', async (req, res) => {
    try {
        const { storageType, filename } = req.params;
        const storagePath = storageType === 'var' ? '/lzcapp/var/uploads' : '/lzcapp/cache/uploads';
        const filePath = path.join(storagePath, filename);
        
        await fs.unlink(filePath);
        
        res.json({
            success: true,
            message: `文件 ${filename} 已删除`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== 网盘文件操作 API ====================

/**
 * 构建网盘文件的绝对路径
 * @param {string} filename - 文件相对路径
 * @param {string} username - 用户名，默认为 'admin'
 * @returns {string} 绝对路径
 */
function getCloudFilePath(filename, username = 'admin') {
    // 网盘文件的绝对路径：/lzcapp/run/mnt/home/{用户名}/{文件路径}
    return path.join('/lzcapp/run/mnt/home', username, filename);
}

// 网盘文件预览API
app.get('/api/cloud-file/preview', async (req, res) => {
    try {
        const { file, type } = req.query;
        
        if (!file) {
            return res.status(400).json({ error: '缺少文件参数' });
        }

        // 构建网盘文件的绝对路径
        const filePath = getCloudFilePath(file);
        
        console.log(`[网盘文件预览] 请求文件: ${file}`);
        console.log(`[网盘文件预览] 绝对路径: ${filePath}`);
        
        // 检查文件是否存在
        try {
            await fs.access(filePath);
        } catch (error) {
            console.log(`[网盘文件预览] 文件不存在: ${filePath}`);
            return res.status(404).json({ error: '文件不存在' });
        }

        // 根据类型返回不同的响应
        if (type === 'image') {
            // 图片预览
            const stat = await fs.stat(filePath);
            const fileStream = require('fs').createReadStream(filePath);
            
            // 根据文件扩展名设置正确的 Content-Type
            const ext = path.extname(file).toLowerCase();
            let contentType = 'image/*';
            switch (ext) {
                case '.jpg':
                case '.jpeg':
                    contentType = 'image/jpeg';
                    break;
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.gif':
                    contentType = 'image/gif';
                    break;
                case '.webp':
                    contentType = 'image/webp';
                    break;
            }
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            
            fileStream.pipe(res);
        } else {
            // 其他文件类型
            const content = await fs.readFile(filePath);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.send(content);
        }
    } catch (error) {
        console.error('[网盘文件预览] 错误:', error);
        res.status(500).json({ error: '文件预览失败' });
    }
});

// 网盘文件内容API（用于文本预览）
app.get('/api/cloud-file/content', async (req, res) => {
    try {
        const { file } = req.query;
        
        if (!file) {
            return res.status(400).json({ error: '缺少文件参数' });
        }

        // 构建网盘文件的绝对路径
        const filePath = getCloudFilePath(file);
        
        console.log(`[网盘文件内容] 请求文件: ${file}`);
        console.log(`[网盘文件内容] 绝对路径: ${filePath}`);
        
        // 检查文件是否存在
        try {
            await fs.access(filePath);
        } catch (error) {
            console.log(`[网盘文件内容] 文件不存在: ${filePath}`);
            return res.json({ content: '文件不存在' });
        }

        // 检查文件大小，避免加载过大的文件
        const stat = await fs.stat(filePath);
        if (stat.size > 1024 * 1024) { // 1MB限制
            return res.json({ content: '文件过大，无法预览（限制1MB）' });
        }

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            res.json({ content });
        } catch (error) {
            // 如果UTF-8读取失败，尝试其他编码或返回二进制提示
            res.json({ content: '文件内容无法以文本格式显示（可能是二进制文件）' });
        }
    } catch (error) {
        console.error('[网盘文件内容] 错误:', error);
        res.status(500).json({ error: '文件内容读取失败' });
    }
});

// 网盘文件下载API
app.get('/api/cloud-file/download', async (req, res) => {
    try {
        const { file } = req.query;
        
        if (!file) {
            return res.status(400).json({ error: '缺少文件参数' });
        }

        // 构建网盘文件的绝对路径
        const filePath = getCloudFilePath(file);
        const fileName = path.basename(file);
        
        console.log(`[网盘文件下载] 请求文件: ${file}`);
        console.log(`[网盘文件下载] 绝对路径: ${filePath}`);
        console.log(`[网盘文件下载] 文件名: ${fileName}`);
        
        // 检查文件是否存在
        try {
            await fs.access(filePath);
        } catch (error) {
            console.log(`[网盘文件下载] 文件不存在: ${filePath}`);
            return res.status(404).json({ error: '文件不存在' });
        }

        // 设置下载响应头
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        // 流式传输文件
        const fileStream = require('fs').createReadStream(filePath);
        fileStream.pipe(res);
        
        console.log(`[网盘文件下载] 开始传输文件: ${fileName}`);
        
    } catch (error) {
        console.error('[网盘文件下载] 错误:', error);
        res.status(500).json({ error: '文件下载失败' });
    }
});

// 调试API - 列出网盘目录内容（仅用于开发调试）
app.get('/api/debug/cloud-files', async (req, res) => {
    try {
        const username = req.query.user || 'admin';
        const cloudPath = `/lzcapp/run/mnt/home/${username}`;
        
        console.log(`[调试] 列出网盘目录: ${cloudPath}`);
        
        try {
            const files = await fs.readdir(cloudPath, { withFileTypes: true });
            const fileList = await Promise.all(
                files.map(async (dirent) => {
                    const fullPath = path.join(cloudPath, dirent.name);
                    const stats = await fs.stat(fullPath);
                    return {
                        name: dirent.name,
                        isDirectory: dirent.isDirectory(),
                        size: stats.size,
                        mtime: stats.mtime.toISOString(),
                        absolutePath: fullPath
                    };
                })
            );
            
            res.json({
                success: true,
                path: cloudPath,
                files: fileList
            });
        } catch (error) {
            res.json({
                success: false,
                error: `无法访问目录: ${cloudPath}`,
                details: error.message
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`懒猫文件选择器测试应用运行在端口 ${PORT}`);
    console.log(`上传文件存储路径: /lzcapp/var/uploads 和 /lzcapp/cache/uploads`);
    console.log(`网盘文件访问路径: /lzcapp/run/mnt/home/{用户名}/`);
});