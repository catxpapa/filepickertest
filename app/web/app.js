/**
 * 懒猫文件选择器测试应用 - 完整修正版本
 * 解决所有语法错误和功能缺陷
 */
class OptimizedFilePickerTester {
    constructor() {
        // 基础配置
        this.apiBaseUrl = '/api';
        this.currentStorageType = 'var';
        this.selectedFiles = [];
        this.currentPicker = null;
        this.lazycatEnv = null;
        this.currentUser = null;
        
        // 文件选择器类型定义
        this.pickerTypes = {
            file: { title: '文件选择器', description: '选择单个或多个文件' },
            dir: { title: '目录选择器', description: '选择文件夹' },
            saveAs: { title: '文件保存器', description: '保存文件到网盘' }
        };
        
        // 启动应用
        this.initApp();
    }

    /**
     * 初始化应用
     */
    async initApp() {
        try {
            console.log('正在初始化懒猫文件选择器测试应用...');
            
            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.continueInit();
                });
            } else {
                this.continueInit();
            }
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.updateStatus(`应用初始化失败: ${error.message}`);
        }
    }

    /**
     * 继续初始化流程
     */
    async continueInit() {
        try {
            // 加载环境信息
            await this.loadLazycatEnvironment();
            await this.loadUserInfo();
            
            // 初始化UI事件监听器
            this.initEventListeners();
            
            // 更新存储显示
            this.updateStorageDisplay();
            
            // 更新状态
            this.updateStatus('文件选择器测试应用已初始化 - 按需加载模式');
            
            console.log('懒猫文件选择器测试应用初始化完成');
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.updateStatus(`应用初始化失败: ${error.message}`);
            this.useDefaultEnvironment();
        }
    }

    /**
     * 加载懒猫微服环境信息 [citation](3)
     */
    async loadLazycatEnvironment() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/lazycat-env`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.lazycatEnv = result.environment;
                this.displayEnvironmentInfo();
                console.log('懒猫微服环境信息:', this.lazycatEnv);
                
                // 验证 boxName 是否正确设置
                if (!this.lazycatEnv.boxName || this.lazycatEnv.boxName === 'undefined') {
                    console.error('boxName 未正确设置:', this.lazycatEnv.boxName);
                    throw new Error('boxName 配置错误，请检查环境变量');
                }
                
                console.log('文件选择器域名:', `https://file.${this.lazycatEnv.boxName}.heiyu.space`);
            } else {
                throw new Error('无法获取环境信息');
            }
        } catch (error) {
            console.error('加载环境信息失败:', error);
            this.useDefaultEnvironment();
        }
    }

    /**
     * 加载用户信息 [citation](3)
     */
    async loadUserInfo() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/user-info`);
            
            if (response.ok) {
                const result = await response.json();
                this.currentUser = result.user;
                console.log('当前用户信息:', this.currentUser);
            } else {
                this.currentUser = {
                    id: 'default',
                    name: 'Default User',
                    role: 'USER'
                };
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
            this.currentUser = {
                id: 'default',
                name: 'Default User',
                role: 'USER'
            };
        }
    }

    /**
     * 使用默认环境信息作为备用
     */
    useDefaultEnvironment() {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        
        if (parts.length >= 3) {
            const boxName = parts[1];
            const domain = parts.slice(2).join('.');
            
            this.lazycatEnv = {
                boxName: boxName,
                boxDomain: `${boxName}.${domain}`,
                appDomain: hostname,
                appId: 'cloud.lazycat.app.filepickertest',
                filePickerDomain: `https://file.${boxName}.heiyu.space`
            };
            
            console.log('使用默认环境配置:', this.lazycatEnv);
            this.displayEnvironmentInfo();
        } else {
            console.error('无法从域名中提取环境信息');
        }
    }

    /**
     * 显示环境信息
     */
    displayEnvironmentInfo() {
        const envInfoDiv = document.getElementById('envInfo');
        if (this.lazycatEnv) {
            envInfoDiv.innerHTML = `
                <div class="env-details">
                    <p><strong>设备名称:</strong> ${this.lazycatEnv.boxName}</p>
                    <p><strong>设备域名:</strong> ${this.lazycatEnv.boxDomain}</p>
                    <p><strong>应用域名:</strong> ${this.lazycatEnv.appDomain}</p>
                    <p><strong>文件选择器域名:</strong> ${this.lazycatEnv.filePickerDomain}</p>
                </div>
            `;
        } else {
            envInfoDiv.innerHTML = '<p class="error">环境信息加载失败</p>';
        }
    }

    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        console.log('正在初始化事件监听器...');
        
        // 懒猫文件选择器类型按钮
        this.bindPickerButtons();
        
        // 本地文件上传相关按钮
        this.bindFileUploadButtons();
        
        // 文件管理按钮
        this.bindFileManagementButtons();
        
        // 存储类型切换
        this.bindStorageTypeControls();
        
        // 调试按钮
        this.bindDebugButtons();
        
        // 拖拽上传支持
        this.bindDragAndDrop();
        
        console.log('事件监听器初始化完成');
    }

    /**
     * 绑定文件选择器按钮事件
     */
    bindPickerButtons() {
        const testFileSelector = document.getElementById('testFileSelector');
        const testDirSelector = document.getElementById('testDirSelector');
        const testFileSaver = document.getElementById('testFileSaver');
        const closePicker = document.getElementById('closePicker');
        
        if (testFileSelector) {
            testFileSelector.addEventListener('click', () => {
                console.log('点击了文件选择器按钮');
                this.createFilePicker('file');
            });
        }
        
        if (testDirSelector) {
            testDirSelector.addEventListener('click', () => {
                console.log('点击了目录选择器按钮');
                this.createFilePicker('dir');
            });
        }
        
        if (testFileSaver) {
            testFileSaver.addEventListener('click', () => {
                console.log('点击了文件保存器按钮');
                this.createFilePicker('saveAs');
            });
        }
        
        if (closePicker) {
            closePicker.addEventListener('click', () => {
                this.closePicker();
            });
        }
    }

    /**
     * 绑定文件上传按钮事件 - 修正版本
     */
    bindFileUploadButtons() {
        const selectFilesBtn = document.getElementById('selectFilesBtn');
        const localFileInput = document.getElementById('localFileInput');
        const uploadFilesBtn = document.getElementById('uploadFilesBtn');
        const clearSelectionBtn = document.getElementById('clearSelectionBtn');
        
        console.log('绑定文件上传按钮事件...');
        console.log('selectFilesBtn:', selectFilesBtn);
        console.log('localFileInput:', localFileInput);
        
        if (selectFilesBtn && localFileInput) {
            console.log('正在绑定本地文件选择按钮事件...');
            
            // 移除可能存在的旧事件监听器
            selectFilesBtn.replaceWith(selectFilesBtn.cloneNode(true));
            const newSelectFilesBtn = document.getElementById('selectFilesBtn');
            
            // 绑定新的事件监听器
            newSelectFilesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('点击了选择本地文件按钮，准备打开文件选择框');
                
                // 确保文件输入框存在且可用
                const fileInput = document.getElementById('localFileInput');
                if (fileInput) {
                    console.log('触发文件输入框点击');
                    fileInput.click();
                } else {
                    console.error('找不到文件输入框元素');
                }
            });
            
            // 文件选择变化事件
            localFileInput.addEventListener('change', (e) => {
                console.log('文件选择发生变化:', e.target.files);
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFileSelection(e.target.files);
                }
            });
        } else {
            console.error('找不到文件上传相关元素:', {
                selectFilesBtn: !!selectFilesBtn,
                localFileInput: !!localFileInput
            });
        }
        
        // 上传文件按钮
        if (uploadFilesBtn) {
            uploadFilesBtn.addEventListener('click', () => {
                console.log('点击了上传文件按钮');
                this.uploadSelectedFiles();
            });
        }
        
        // 清空选择按钮
        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', () => {
                console.log('点击了清空选择按钮');
                this.clearFileSelection();
            });
        }
    }

    /**
     * 绑定文件管理按钮
     */
    bindFileManagementButtons() {
        const refreshFileList = document.getElementById('refreshFileList');
        const clearAllFiles = document.getElementById('clearAllFiles');
        
        if (refreshFileList) {
            refreshFileList.addEventListener('click', () => {
                this.refreshUploadedFilesList();
            });
        }
        
        if (clearAllFiles) {
            clearAllFiles.addEventListener('click', () => {
                this.clearAllUploadedFiles();
            });
        }
    }

    /**
     * 绑定存储类型控制
     */
    bindStorageTypeControls() {
        // 存储类型单选框切换
        document.querySelectorAll('input[name="storageType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                console.log('存储类型单选框变化:', e.target.value);
                this.currentStorageType = e.target.value;
                
                // 同步下拉框
                const storageSelect = document.getElementById('storageTypeSelect');
                if (storageSelect) {
                    storageSelect.value = e.target.value;
                }
                
                this.updateStorageDisplay();
                this.updateStatus(`已切换到存储目录: ${this.getCurrentStoragePath()}`);
            });
        });
        
        // 存储类型下拉框切换
        const storageTypeSelect = document.getElementById('storageTypeSelect');
        if (storageTypeSelect) {
            storageTypeSelect.addEventListener('change', (e) => {
                console.log('存储类型下拉框变化:', e.target.value);
                this.currentStorageType = e.target.value;
                
                // 同步单选框
                const radio = document.querySelector(`input[name="storageType"][value="${e.target.value}"]`);
                if (radio) {
                    radio.checked = true;
                }
                
                this.updateStorageDisplay();
                this.refreshUploadedFilesList();
            });
        }
    }

    /**
     * 绑定调试按钮
     */
    bindDebugButtons() {
        const debugEnv = document.getElementById('debugEnv');
        const testConnection = document.getElementById('testConnection');
        
        if (debugEnv) {
            debugEnv.addEventListener('click', () => {
                this.debugEnvironment();
            });
        }
        
        if (testConnection) {
            testConnection.addEventListener('click', () => {
                this.testConnection();
            });
        }
    }

    /**
     * 绑定拖拽上传支持
     */
    bindDragAndDrop() {
        const uploadArea = document.querySelector('.upload-test-area');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                console.log('拖拽文件:', e.dataTransfer.files);
                this.handleFileSelection(e.dataTransfer.files);
            });
        }
    }

    /**
     * 创建文件选择器 [citation](5)
     */
    createFilePicker(type) {
        if (!this.lazycatEnv || !this.lazycatEnv.boxName) {
            this.updateResults({
                success: false,
                message: '环境信息未加载',
                error: '请等待环境信息加载完成'
            });
            return;
        }

        console.log('创建文件选择器:', {
            type: type,
            boxName: this.lazycatEnv.boxName,
            storageType: this.currentStorageType
        });

        // 清理之前的选择器
        this.destroyCurrentPicker();
        
        const pickerWrapper = document.getElementById('pickerWrapper');
        const pickerContainer = document.getElementById('pickerContainer');
        const pickerTitle = document.getElementById('pickerTitle');
        
        if (!pickerWrapper || !pickerContainer || !pickerTitle) {
            console.error('找不到文件选择器容器元素');
            return;
        }

        // 创建新的文件选择器元素 [citation](1)
        const picker = document.createElement('lzc-file-picker');
        picker.id = `picker-${type}-${Date.now()}`;
        picker.setAttribute('type', type);
        picker.setAttribute('title', this.pickerTypes[type].title);
        picker.setAttribute('confirm-button-title', '确认选择');
        picker.setAttribute('breadcrumb-root-title', '根目录');
        
        // 关键修正：确保 box-id 正确设置 [citation](1)
        picker.setAttribute('box-id', this.lazycatEnv.boxName);
        console.log(`设置 ${type} 选择器的 box-id:`, this.lazycatEnv.boxName);
        
        // 特殊配置
        if (type === 'saveAs') {
            picker.setAttribute('write-file-content', '');
        }
        
        // 添加事件监听器
        picker.addEventListener('submit', (e) => {
            const result = e.detail[0];
            this.updateResults({
                success: true,
                message: `${this.pickerTypes[type].title}操作成功`,
                details: result
            });
            console.log(`${type} 选择结果:`, result);
        });
        
        picker.addEventListener('close', () => {
            this.closePicker();
        });
        
        picker.addEventListener('done', (e) => {
            const result = e.detail[0];
            this.updateResults({
                success: true,
                message: `${this.pickerTypes[type].title}保存完成`,
                details: result
            });
            console.log(`${type} 保存结果:`, result);
        });
        
        // 添加到容器
        pickerWrapper.innerHTML = ''; // 确保容器为空
        pickerWrapper.appendChild(picker);
        this.currentPicker = picker;
        
        // 显示容器
        pickerTitle.textContent = this.pickerTypes[type].title;
        pickerContainer.style.display = 'block';
        
        // 延迟初始化，确保元素完全加载
        setTimeout(() => {
            this.initializePicker(picker, type);
        }, 200);
    }

    /**
     * 初始化文件选择器 [citation](5)
     */
    initializePicker(picker, type) {
        try {
            if (!picker._instance || !picker._instance.exposed) {
                setTimeout(() => this.initializePicker(picker, type), 100);
                return;
            }
            
            const ctx = picker._instance.exposed;
            const diskPath = this.getCurrentStoragePath();
            
            console.log(`初始化 ${type} 选择器，磁盘路径:`, diskPath);
            console.log('box-id:', this.lazycatEnv.boxName);
            
            ctx.init(diskPath);
            
            // 如果是保存器，设置测试内容 [citation](5)
            if (type === 'saveAs') {
                const content = JSON.stringify({
                    title: '测试数据文件',
                    timestamp: new Date().toISOString(),
                    environment: this.lazycatEnv,
                    storageType: this.currentStorageType,
                    storagePath: diskPath,
                    testData: {
                        message: '这是一个测试文件',
                        deviceName: this.lazycatEnv?.boxName || 'unknown'
                    }
                }, null, 2);
                
                ctx.sendSaveAsData(content, 'json', `测试文件-${this.lazycatEnv?.boxName || 'unknown'}-${Date.now()}`);
            }
            
            ctx.open();
            
            this.updateResults({
                success: true,
                message: `${this.pickerTypes[type].title}初始化成功`,
                details: {
                    '类型': type,
                    '磁盘路径': diskPath,
                    '存储类型': this.currentStorageType,
                    'box-id': this.lazycatEnv.boxName,
                    '文件选择器域名': `https://file.${this.lazycatEnv.boxName}.heiyu.space`
                }
            });
            
        } catch (error) {
            console.error(`${type} 选择器初始化失败:`, error);
            this.updateResults({
                success: false,
                message: `${type} 选择器初始化失败`,
                error: error.message
            });
        }
    }

    /**
     * 销毁当前选择器
     */
    destroyCurrentPicker() {
        if (this.currentPicker) {
            const pickerWrapper = document.getElementById('pickerWrapper');
            if (pickerWrapper) {
                pickerWrapper.innerHTML = '';
            }
            this.currentPicker = null;
            console.log('已销毁当前文件选择器');
        }
    }

    /**
     * 关闭选择器
     */
    closePicker() {
        const pickerContainer = document.getElementById('pickerContainer');
        if (pickerContainer) {
            pickerContainer.style.display = 'none';
        }
        this.destroyCurrentPicker();
        this.updateStatus('文件选择器已关闭');
    }

    /**
     * 处理文件选择
     */
    handleFileSelection(files) {
        console.log('处理文件选择:', files);
        
        if (files.length === 0) {
            this.clearFileSelection();
            return;
        }

        const fileArray = Array.from(files);
        const validFiles = [];
        const invalidFiles = [];

        // 验证文件
        fileArray.forEach(file => {
            if (this.validateFile(file)) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file);
            }
        });

        if (invalidFiles.length > 0) {
            this.updateResults({
                success: false,
                message: '部分文件不符合要求',
                details: {
                    '无效文件': invalidFiles.map(f => `${f.name} (${f.type || '未知类型'}, ${(f.size / 1024 / 1024).toFixed(2)}MB)`),
                    '要求': '支持图片、PDF、文档、压缩包，单文件最大10MB'
                }
            });
        }

        if (validFiles.length > 0) {
            this.selectedFiles = validFiles;
            this.displaySelectedFiles();
            
            const uploadBtn = document.getElementById('uploadFilesBtn');
            if (uploadBtn) {
                uploadBtn.disabled = false;
            }
            
            this.updateResults({
                success: true,
                message: `已选择 ${validFiles.length} 个有效文件`,
                details: validFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`)
            });
        }
    }

    /**
     * 验证文件
     */
    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip'
        ];

        return file.size <= maxSize && allowedTypes.includes(file.type);
    }

    /**
     * 显示选择的文件 - 完整版本
     */
    displaySelectedFiles() {
        const previewContainer = document.getElementById('selectedFilesPreview');
        const previewList = document.getElementById('filePreviewList');
        
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            previewContainer.style.display = 'none';
            return;
        }

        const fileItems = this.selectedFiles.map((file, index) => `
            <div class="file-preview-item">
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span class="file-type">${file.type}</span>
                </div>
                <button class="btn btn-small btn-danger" onclick="app.removeSelectedFile(${index})">移除</button>
            </div>
        `).join('');

        previewList.innerHTML = fileItems;
        previewContainer.style.display = 'block';
    }

    /**
     * 移除选中的文件
     */
    removeSelectedFile(index) {
        if (index >= 0 && index < this.selectedFiles.length) {
            this.selectedFiles.splice(index, 1);
            this.displaySelectedFiles();
            
            if (this.selectedFiles.length === 0) {
                const uploadBtn = document.getElementById('uploadFilesBtn');
                if (uploadBtn) {
                    uploadBtn.disabled = true;
                }
            }
            
            this.updateResults({
                success: true,
                message: `已移除文件，剩余 ${this.selectedFiles.length} 个文件`
            });
        }
    }

    /**
     * 清空文件选择
     */
    clearFileSelection() {
        this.selectedFiles = [];
        const previewContainer = document.getElementById('selectedFilesPreview');
        const localFileInput = document.getElementById('localFileInput');
        const uploadBtn = document.getElementById('uploadFilesBtn');
        
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        
        if (localFileInput) {
            localFileInput.value = '';
        }
        
        if (uploadBtn) {
            uploadBtn.disabled = true;
        }
        
        this.updateResults({
            success: true,
            message: '已清空文件选择'
        });
    }

    /**
     * 上传选中的文件
     */
    async uploadSelectedFiles() {
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            this.updateResults({
                success: false,
                message: '没有选择文件',
                error: '请先选择要上传的文件'
            });
            return;
        }

        // 关键判断：home 目录必须使用文件保存器
        if (this.currentStorageType === 'home') {
            this.updateResults({
                success: false,
                message: '安全限制：home 目录需要使用文件保存器',
                details: {
                    '说明': 'home 目录是用户网盘同步目录，出于安全考虑不支持直接上传',
                    '正确方式': '请点击"文件保存器"按钮，然后选择要保存的文件',
                    '技术原因': '懒猫微服的安全架构限制应用直接写入用户网盘目录'
                }
            });
            
            // 自动引导用户使用文件保存器
            this.showFileSaverGuide();
            return;
        }

        // 对于 var、cache、temp 目录，使用直接上传
        await this.performDirectUpload();
    }

    /**
     * 引导用户使用文件保存器
     */
    showFileSaverGuide() {
        const result = confirm(
            '要保存文件到用户网盘，需要使用文件保存器。\n' +
            '点击"确定"自动打开文件保存器，或点击"取消"手动操作。'
        );
        
        if (result) {
            // 自动为每个选中的文件创建保存器
            this.saveFilesToHomeUsingPicker();
        }
    }

    /**
     * 使用文件保存器保存文件到 home 目录 [citation](5)
     */
    async saveFilesToHomeUsingPicker() {
        for (let i = 0; i < this.selectedFiles.length; i++) {
            const file = this.selectedFiles[i];
            console.log(`正在保存第 ${i + 1}/${this.selectedFiles.length} 个文件:`, file.name);
            
            try {
                await this.saveFileUsingPicker(file);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 间隔1秒
            } catch (error) {
                console.error('保存文件失败:', error);
                this.updateResults({
                    success: false,
                    message: `保存文件 ${file.name} 失败`,
                    error: error.message
                });
            }
        }
    }

    /**
     * 使用文件保存器保存单个文件 [citation](5)
     */
    async saveFileUsingPicker(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                // 创建文件保存器 [citation](5)
                const picker = document.createElement('lzc-file-picker');
                picker.setAttribute('type', 'saveAs');
                picker.setAttribute('box-id', this.lazycatEnv.boxName);
                picker.setAttribute('write-file-content', '');
                picker.setAttribute('title', `保存文件: ${file.name}`);
                picker.setAttribute('confirm-button-title', '保存到网盘');
                picker.setAttribute('breadcrumb-root-title', '根目录');
                
                // 监听保存完成事件 [citation](5)
                picker.addEventListener('done', (event) => {
                    const result = event.detail[0];
                    console.log('文件保存成功:', result);
                    
                    this.updateResults({
                        success: true,
                        message: `文件 ${file.name} 已保存到用户网盘`,
                        details: {
                            '文件名': file.name,
                            '保存结果': result,
                            '保存位置': '用户网盘目录'
                        }
                    });
                    
                    // 清理选择器
                    picker.remove();
                    resolve(result);
                });
                
                picker.addEventListener('close', () => {
                    console.log('用户取消保存');
                    picker.remove();
                    reject(new Error('用户取消保存'));
                });
                
                // 添加到页面
                document.body.appendChild(picker);
                
                // 初始化选择器 [citation](5)
                setTimeout(() => {
                    try {
                        const ctx = picker._instance.exposed;
                        ctx.init('/lzcapp/run/mnt/home'); // 初始化到 home 目录
                        
                        // 发送文件内容 [citation](5)
                        const fileExtension = file.name.split('.').pop() || 'txt';
                        const fileName = file.name.replace(/\.[^/.]+$/, ""); // 移除扩展名
                        
                        // 根据文件类型处理内容
                        let content;
                        if (file.type.startsWith('text/')) {
                            content = e.target.result;
                        } else {
                            // 对于二进制文件，使用 base64 编码
                            content = e.target.result.split(',')[1]; // 移除 data:xxx;base64, 前缀
                        }
                        
                        ctx.sendSaveAsData(content, fileExtension, fileName);
                        ctx.open();
                    } catch (error) {
                        console.error('初始化文件保存器失败:', error);
                        picker.remove();
                        reject(error);
                    }
                }, 300);
            };
            
            reader.onerror = () => {
                reject(new Error('读取文件失败'));
            };
            
            // 根据文件类型选择读取方式
            if (file.type.startsWith('text/')) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    }

    /**
     * 直接上传到非 home 目录
     */
    async performDirectUpload() {
        // 获取当前选中的存储类型
        const actualStorageType = this.currentStorageType;
        
        console.log('=== 直接文件上传调试信息 ===');
        console.log('存储类型:', actualStorageType);
        console.log('文件数量:', this.selectedFiles.length);

        const formData = new FormData();
        formData.append('storageType', actualStorageType);
        
        this.selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            this.showUploadProgress();
            
            const response = await fetch(`${this.apiBaseUrl}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.updateResults({
                    success: true,
                    message: `成功上传 ${result.files.length} 个文件到 ${actualStorageType} 存储`,
                    details: {
                        '存储类型': actualStorageType,
                        '存储路径': result.storageInfo.uploadPath,
                        '上传文件': result.files.map(f => ({
                            '原始名称': f.originalName,
                            '存储名称': f.filename,
                            '文件大小': `${(f.size / 1024 / 1024).toFixed(2)} MB`
                        }))
                    }
                });
                
                this.clearFileSelection();
                this.refreshUploadedFilesList();
            } else {
                throw new Error(result.error || '上传失败');
            }
            
        } catch (error) {
            console.error('文件上传失败:', error);
            this.updateResults({
                success: false,
                message: '文件上传失败',
                error: error.message
            });
        } finally {
            this.hideUploadProgress();
        }
    }

    /**
     * 显示上传进度
     */
    showUploadProgress() {
        const progressContainer = document.getElementById('uploadProgressContainer');
        const progressBar = document.getElementById('uploadProgressBar');
        const uploadStatus = document.getElementById('uploadStatus');
        
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        
        if (uploadStatus) {
            uploadStatus.textContent = '正在上传文件...';
        }
        
        // 模拟进度更新
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 100);
    }

    /**
     * 隐藏上传进度
     */
    hideUploadProgress() {
        const progressContainer = document.getElementById('uploadProgressContainer');
        const progressBar = document.getElementById('uploadProgressBar');
        const uploadStatus = document.getElementById('uploadStatus');
        
        if (progressBar) {
            progressBar.style.width = '100%';
        }
        
        if (uploadStatus) {
            uploadStatus.textContent = '上传完成';
        }
        
        setTimeout(() => {
            if (progressContainer) {
                progressContainer.style.display = 'none';
            }
        }, 1000);
    }

    /**
     * 获取当前存储路径
     */
    getCurrentStoragePath() {
        const storageMap = {
            'var': '/lzcapp/var',
            'cache': '/lzcapp/cache',
            'home': '/lzcapp/run/mnt/home',
            'temp': '/tmp'
        };
        return storageMap[this.currentStorageType] || storageMap['var'];
    }

    /**
     * 更新存储显示
     */
    updateStorageDisplay() {
        const currentPath = this.getCurrentStoragePath();
        const uploadPath = `${currentPath}/uploads`;
        
        // 更新显示
        const currentStorageSpan = document.getElementById('currentStorage');
        const uploadTargetPath = document.getElementById('uploadTargetPath');
        
        if (currentStorageSpan) {
            currentStorageSpan.textContent = currentPath;
        }
        
        if (uploadTargetPath) {
            uploadTargetPath.textContent = uploadPath;
        }
        
        console.log('存储配置更新:', {
            '当前存储类型': this.currentStorageType,
            '存储路径': currentPath,
            '上传路径': uploadPath
        });
    }

    /**
     * 刷新已上传文件列表
     */
    async refreshUploadedFilesList() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/files?storageType=${this.currentStorageType}`);
            const result = await response.json();
            
            const storageInfo = document.getElementById('storageInfo');
            const uploadedFilesList = document.getElementById('uploadedFilesList');
            
            if (result.success) {
                // 显示存储信息
                storageInfo.innerHTML = `
                    <div class="storage-summary">
                        <p><strong>存储类型:</strong> ${result.storageInfo.type}</p>
                        <p><strong>存储路径:</strong> ${result.storageInfo.uploadPath}</p>
                        <p><strong>文件总数:</strong> ${result.storageInfo.totalFiles}</p>
                        <p><strong>总大小:</strong> ${(result.storageInfo.totalSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                `;
                
                // 显示文件列表
                if (result.files.length === 0) {
                    uploadedFilesList.innerHTML = '<p class="placeholder">当前存储目录中没有文件</p>';
                } else {
                    const fileItems = result.files.map(file => `
                        <div class="file-item">
                            <div class="file-details">
                                <span class="file-name">${file.name}</span>
                                <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <span class="file-date">${new Date(file.created).toLocaleString()}</span>
                            </div>
                            <div class="file-actions">
                                <a href="${this.apiBaseUrl}/download/${file.name}?storageType=${this.currentStorageType}" 
                                   class="btn btn-small btn-primary" download>下载</a>
                                <button class="btn btn-small btn-danger" 
                                        onclick="app.deleteFile('${file.name}')">删除</button>
                            </div>
                        </div>
                    `).join('');
                    
                    uploadedFilesList.innerHTML = fileItems;
                }
            } else {
                uploadedFilesList.innerHTML = `<p class="error">加载文件列表失败: ${result.error}</p>`;
            }
        } catch (error) {
            console.error('刷新文件列表失败:', error);
            const uploadedFilesList = document.getElementById('uploadedFilesList');
            uploadedFilesList.innerHTML = `<p class="error">加载文件列表失败: ${error.message}</p>`;
        }
    }

    /**
     * 删除文件
     */
    async deleteFile(filename) {
        if (!confirm(`确定要删除文件 "${filename}" 吗？`)) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/files/${filename}?storageType=${this.currentStorageType}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.updateResults({
                    success: true,
                    message: result.message
                });
                this.refreshUploadedFilesList();
            } else {
                this.updateResults({
                    success: false,
                    message: '删除文件失败',
                    error: result.error
                });
            }
        } catch (error) {
            console.error('删除文件失败:', error);
            this.updateResults({
                success: false,
                message: '删除文件失败',
                error: error.message
            });
        }
    }

    /**
     * 清空所有文件
     */
    async clearAllUploadedFiles() {
        if (!confirm(`确定要清空 ${this.currentStorageType} 存储目录中的所有文件吗？此操作不可恢复！`)) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/files?storageType=${this.currentStorageType}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.updateResults({
                    success: true,
                    message: result.message
                });
                this.refreshUploadedFilesList();
            } else {
                this.updateResults({
                    success: false,
                    message: '清空文件失败',
                    error: result.error
                });
            }
        } catch (error) {
            console.error('清空文件失败:', error);
            this.updateResults({
                success: false,
                message: '清空文件失败',
                error: error.message
            });
        }
    }

    /**
     * 调试环境信息
     */
    debugEnvironment() {
        const debugInfo = {
            '懒猫微服环境': this.lazycatEnv,
            '当前用户': this.currentUser,
            '当前存储类型': this.currentStorageType,
            '存储路径': this.getCurrentStoragePath(),
            '浏览器信息': {
                'User Agent': navigator.userAgent,
                '当前URL': window.location.href,
                '域名': window.location.hostname
            }
        };
        
        this.updateResults({
            success: true,
            message: '环境调试信息',
            details: debugInfo
        });
        
        console.log('环境调试信息:', debugInfo);
    }

    /**
     * 测试连接
     */
    async testConnection() {
        if (!this.lazycatEnv || !this.lazycatEnv.boxName) {
            this.updateResults({
                success: false,
                message: 'boxName 未设置',
                error: '无法进行连接测试'
            });
            return;
        }
        
        const testUrl = `https://file.${this.lazycatEnv.boxName}.heiyu.space`;
        
        this.updateResults({
            success: true,
            message: '连接测试信息',
            details: {
                '测试URL': testUrl,
                'boxName': this.lazycatEnv.boxName,
                '状态': '域名配置正确',
                '说明': '实际连接测试需要在文件选择器中进行'
            }
        });
    }

    /**
     * 更新结果显示
     */
    updateResults(result) {
        const resultsDiv = document.getElementById('results');
        const timestamp = new Date().toLocaleString();
        
        let resultHtml = `
            <div class="result-item ${result.success ? 'success' : 'error'}">
                <div class="result-header">
                    <span class="result-status">${result.success ? '✅ 成功' : '❌ 失败'}</span>
                    <span class="result-time">${timestamp}</span>
                </div>
                <div class="result-message">${result.message}</div>
        `;
        
        if (result.error) {
            resultHtml += `<div class="result-error">错误: ${result.error}</div>`;
        }
        
        if (result.details) {
            resultHtml += '<div class="result-details"><strong>详细信息:</strong>';
            if (typeof result.details === 'object') {
                resultHtml += '<pre>' + JSON.stringify(result.details, null, 2) + '</pre>';
            } else {
                resultHtml += `<p>${result.details}</p>`;
            }
            resultHtml += '</div>';
        }
        
        resultHtml += '</div>';
        
        resultsDiv.innerHTML = resultHtml + resultsDiv.innerHTML;
    }

    /**
     * 更新状态信息
     */
    updateStatus(message) {
        const statusDiv = document.getElementById('status');
        const timestamp = new Date().toLocaleString();
        
        const statusHtml = `
            <div class="status-item">
                <span class="status-time">${timestamp}</span>
                <span class="status-message">${message}</span>
            </div>
        `;
        
        statusDiv.innerHTML = statusHtml + statusDiv.innerHTML;
        console.log(`[状态] ${message}`);
    }
}

// 全局变量，供HTML中的onclick事件使用
let app;

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    app = new OptimizedFilePickerTester();
});