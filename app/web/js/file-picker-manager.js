/**
 * 懒猫文件选择器管理器
 * 负责管理文件选择器的创建、初始化和事件处理
 */
export class FilePickerManager {
    constructor() {
        this.currentPicker = null;
        this.lazycatEnv = null;
        this.pickerTypes = {
            file: { title: '文件选择器', description: '选择单个或多个文件' },
            dir: { title: '目录选择器', description: '选择文件夹' },
            saveAs: { title: '文件保存器', description: '保存文件到网盘' }
        };
        this.eventListeners = new Map();
    }

    /**
     * 事件监听器管理
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }

    /**
     * 设置环境信息
     */
    setEnvironment(env) {
        this.lazycatEnv = env;
        console.log('文件选择器管理器已设置环境信息:', env);
    }

    /**
     * 创建文件选择器 [citation](2)
     */
    createPicker(type, diskPath) {
        if (!this.lazycatEnv || !this.lazycatEnv.boxName) {
            console.error('环境信息未设置，无法创建文件选择器');
            this.emit('pickerResult', {
                success: false,
                message: '环境信息未设置',
                error: 'boxName 未配置'
            });
            return;
        }

        // 清理之前的选择器
        this.destroyCurrentPicker();
        
        const pickerWrapper = document.getElementById('pickerWrapper');
        const pickerContainer = document.getElementById('pickerContainer');
        const pickerTitle = document.getElementById('pickerTitle');
        
        if (!pickerWrapper || !pickerContainer || !pickerTitle) {
            console.error('找不到文件选择器容器元素');
            return;
        }

        // 创建新的文件选择器元素 [citation](2)
        const picker = document.createElement('lzc-file-picker');
        picker.id = `picker-${type}`;
        picker.setAttribute('type', type);
        picker.setAttribute('title', this.pickerTypes[type].title);
        picker.setAttribute('confirm-button-title', '确认选择');
        picker.setAttribute('breadcrumb-root-title', '根目录');
        
        // 关键设置：确保 box-id 正确设置 [citation](1)
        picker.setAttribute('box-id', this.lazycatEnv.boxName);
        console.log(`设置 ${type} 选择器的 box-id:`, this.lazycatEnv.boxName);
        
        // 特殊配置
        if (type === 'saveAs') {
            picker.setAttribute('write-file-content', '');
        }
        
        // 添加事件监听器
        picker.addEventListener('submit', (e) => {
            const result = e.detail[0];
            this.emit('pickerResult', {
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
            this.emit('pickerResult', {
                success: true,
                message: `${this.pickerTypes[type].title}保存完成`,
                details: result
            });
            console.log(`${type} 保存结果:`, result);
        });
        
        // 添加到容器
        pickerWrapper.appendChild(picker);
        this.currentPicker = picker;
        
        // 显示容器
        pickerTitle.textContent = this.pickerTypes[type].title;
        pickerContainer.style.display = 'block';
        
        // 初始化选择器
        setTimeout(() => {
            this.initializePicker(picker, type, diskPath);
        }, 100);
    }

    /**
     * 初始化文件选择器 [citation](2)
     */
    initializePicker(picker, type, diskPath) {
        try {
            if (!picker._instance || !picker._instance.exposed) {
                setTimeout(() => this.initializePicker(picker, type, diskPath), 100);
                return;
            }
            
            const ctx = picker._instance.exposed;
            
            console.log(`初始化 ${type} 选择器，磁盘路径:`, diskPath);
            console.log('box-id:', this.lazycatEnv.boxName);
            
            ctx.init(diskPath);
            
            // 如果是保存器，设置测试内容
            if (type === 'saveAs') {
                const content = JSON.stringify({
                    title: '测试数据文件',
                    timestamp: new Date().toISOString(),
                    environment: this.lazycatEnv,
                    storagePath: diskPath,
                    testData: {
                        message: '这是一个测试文件',
                        deviceName: this.lazycatEnv?.boxName || 'unknown'
                    }
                }, null, 2);
                
                ctx.sendSaveAsData(content, 'json', `测试文件-${this.lazycatEnv?.boxName || 'unknown'}-${Date.now()}`);
            }
            
            ctx.open();
            
            this.emit('pickerResult', {
                success: true,
                message: `${this.pickerTypes[type].title}初始化成功`,
                details: {
                    '类型': type,
                    '磁盘路径': diskPath,
                    'box-id': this.lazycatEnv.boxName,
                    '文件选择器域名': `https://file.${this.lazycatEnv.boxName}.heiyu.space`
                }
            });
            
        } catch (error) {
            console.error(`${type} 选择器初始化失败:`, error);
            this.emit('pickerResult', {
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
        this.emit('pickerClosed');
    }
}