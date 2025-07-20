/**
 * 环境管理器
 * 负责加载和管理懒猫微服环境信息
 */
export class EnvironmentManager {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.lazycatEnv = null;
        this.currentUser = null;
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
     * 加载环境信息
     */
    async loadEnvironment() {
        try {
            // 并行加载环境信息和用户信息
            const [envResult, userResult] = await Promise.allSettled([
                this.loadLazycatEnvironment(),
                this.loadUserInfo()
            ]);

            if (envResult.status === 'fulfilled') {
                this.emit('environmentLoaded', this.lazycatEnv);
            } else {
                console.error('环境信息加载失败:', envResult.reason);
                this.useDefaultEnvironment();
            }

            if (userResult.status === 'rejected') {
                console.warn('用户信息加载失败，使用默认用户:', userResult.reason);
            }

        } catch (error) {
            console.error('加载环境信息时出错:', error);
            this.useDefaultEnvironment();
        }
    }

    /**
     * 加载懒猫微服环境信息 [citation](5)
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
                console.log('懒猫微服环境信息:', this.lazycatEnv);
                
                // 验证 boxName 是否正确设置
                if (!this.lazycatEnv.boxName || this.lazycatEnv.boxName === 'undefined') {
                    console.error('boxName 未正确设置:', this.lazycatEnv.boxName);
                    throw new Error('boxName 配置错误，请检查环境变量');
                }
                
                console.log('文件选择器域名:', `https://file.${this.lazycatEnv.boxName}.heiyu.space`);
                return this.lazycatEnv;
            } else {
                throw new Error('无法获取环境信息');
            }
        } catch (error) {
            console.error('加载环境信息失败:', error);
            throw error;
        }
    }

    /**
     * 加载用户信息 [citation](5)
     */
    async loadUserInfo() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/user-info`);
            
            if (response.ok) {
                const result = await response.json();
                this.currentUser = result.user;
                console.log('当前用户信息:', this.currentUser);
                return this.currentUser;
            } else {
                // 使用默认用户信息
                this.currentUser = {
                    id: 'default',
                    name: 'Default User',
                    role: 'USER'
                };
                return this.currentUser;
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
            this.currentUser = {
                id: 'default',
                name: 'Default User',
                role: 'USER'
            };
            return this.currentUser;
        }
    }

    /**
     * 使用默认环境信息作为备用
     */
    useDefaultEnvironment() {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        
        if (parts.length >= 3) {
            const boxName = parts[1]; // 从域名中提取 boxName
            const domain = parts.slice(2).join('.');
            
            this.lazycatEnv = {
                boxName: boxName,
                boxDomain: `${boxName}.${domain}`,
                appDomain: hostname,
                appId: 'cloud.lazycat.app.filepickertest',
                filePickerDomain: `https://file.${boxName}.heiyu.space`
            };
            
            console.log('使用默认环境配置:', this.lazycatEnv);
            this.emit('environmentLoaded', this.lazycatEnv);
        } else {
            console.error('无法从域名中提取环境信息');
            this.emit('environmentError', new Error('无法获取环境信息'));
        }
    }

    /**
     * 获取当前环境信息
     */
    getEnvironment() {
        return this.lazycatEnv;
    }

    /**
     * 获取当前用户信息
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 调试环境信息
     */
    getDebugInfo() {
        return {
            '懒猫微服环境': this.lazycatEnv,
            '当前用户': this.currentUser,
            '浏览器信息': {
                'User Agent': navigator.userAgent,
                '当前URL': window.location.href,
                '域名': window.location.hostname
            }
        };
    }

    /**
     * 测试连接
     */
    async testConnection() {
        if (!this.lazycatEnv || !this.lazycatEnv.boxName) {
            throw new Error('boxName 未设置');
        }
        
        const testUrl = `https://file.${this.lazycatEnv.boxName}.heiyu.space`;
        
        return {
            '测试URL': testUrl,
            'boxName': this.lazycatEnv.boxName,
            '状态': '域名配置正确',
            '说明': '实际连接测试需要在文件选择器中进行'
        };
    }
}