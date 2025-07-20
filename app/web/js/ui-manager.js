/**
 * UI管理器
 * 负责用户界面的更新、事件处理和状态显示
 */
export class UIManager {
    constructor() {
        this.eventListeners = new Map();
        this.selectedFiles = [];
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
     * 初始化事件监听器
     */
    initEventListeners() {
        console.log('正在初始化UI事件监听器...');
        
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
        
        console.log('UI事件监听器初始化完成');
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
                this.emit('createPicker', 'file');
            });
        }
        
        if (testDirSelector) {
            testDirSelector.addEventListener('click', () => {
                console.log('点击了目录选择器按钮');
                this.emit('createPicker', 'dir');
            });
        }
        
        if (testFileSaver) {
            testFileSaver.addEventListener('click', () => {
                console.log('点击了文件保存器按钮');
                this.emit('createPicker', 'saveAs');
            });
        }
        
        if (closePicker) {
            closePicker.addEventListener('click', () => {
                this.emit('closePicker');
            });
        }
    }

    /**
     * 绑定文件上传按钮事件
     */
    bindFileUploadButtons() {
        const selectFilesBtn = document.getElementById('selectFilesBtn');
        const localFileInput = document.getElementById('localFileInput');
        const uploadFilesBtn = document.getElementById('uploadFilesBtn');
        const clearSelectionBtn = document.getElementById('clearSelectionBtn');
        
        if (selectFilesBtn && localFileInput) {
            console.log('正在绑定本地文件选择按钮事件...');
            
            // 点击按钮触发文件选择框
            selectFilesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击了选择本地文件按钮');
                localFileInput.click();
            });
            
            // 文件选择变化事件
            localFileInput.addEventListener('change', (e) => {
                console.log('文件选择发生变化:', e.target.files);
                this.emit('filesSelected', e.target.files);
            });
        } else {
            console.error('找不到本地文件选择相关元素');
        }
        
        // 上传文件按钮
        if (uploadFilesBtn) {
            uploadFilesBtn.addEventListener('click', () => {
                console.log('点击了上传文件按钮');
                this.emit('uploadRequested');
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
     * 绑定文件管理按钮事件
     */
    bindFileManagementButtons() {
        const refreshFileList = document.getElementById('refreshFileList');
        const clearAllFiles = document.getElementById('clearAllFiles');
        
        if (refreshFileList) {
            refreshFileList.addEventListener('click', () => {
                this.emit('refreshFileList');
            });
        }
        
        if (clearAllFiles) {
            clearAllFiles.addEventListener('click', () => {
                if (confirm('确定要清空所有文件吗？此操作不可恢复。')) {
                    this.emit('clearAllFiles');
                }
            });
        }
    }

    /**
     * 绑定存储类型控制事件
     */
    bindStorageTypeControls() {
        // 存储类型单选框切换
        document.querySelectorAll('input[name="storageType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                console.log('存储类型单选框变化:', e.target.value);
                this.emit('storageTypeChanged', e.target.value);
                
                // 同步下拉框
                const storageSelect = document.getElementById('storageTypeSelect');
                if (storageSelect) {
                    storageSelect.value = e.target.value;
                }
            });
        });
        
        // 存储类型下拉框切换
        const storageTypeSelect = document.getElementById('storageTypeSelect');
        if (storageTypeSelect) {
            storageTypeSelect.addEventListener('change', (e) => {
                console.log('存储类型下拉框变化:', e.target.value);
                this.emit('storageTypeChanged', e.target.value);
                
                // 同步单选框
                const radio = document.querySelector(`input[name="storageType"][value="${e.target.value}"]`);
                if (radio) {
                    radio.checked = true;
                }
            });
        }
    }

    /**
     * 绑定调试按钮事件
     */
    bindDebugButtons() {
        const debugEnv = document.getElementById('debugEnv');
        const testConnection = document.getElementById('testConnection');
        
        if (debugEnv) {
            debugEnv.addEventListener('click', () => {
                this.emit('debugEnvironment');
            });
        }
        
        if (testConnection) {
            testConnection.addEventListener('click', () => {
                this.emit('testConnection');
            });
        }
    }

    /**
     * 绑定拖拽上传事件
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
                this.emit('filesSelected', e.dataTransfer.files);
            });
        }
    }

    /**
     * 显示环境信息
     */
    displayEnvironmentInfo(env) {
        const envInfoDiv = document.getElementById('envInfo');
        if (envInfoDiv && env) {
            envInfoDiv.innerHTML = `
                <div class="env-details">
                    <p><strong>设备名称:</strong> ${env.boxName}</p>
                    <p><strong>设备域名:</strong> ${env.boxDomain}</p>
                    <p><strong>应用域名:</strong> ${env.appDomain}</p>
                    <p><strong>文件选择器域名:</strong> ${env.filePickerDomain}</p>
                </div>
            `;
        } else if (envInfoDiv) {
            envInfoDiv.innerHTML = '<p class="error">环境信息加载失败</p>';
        }
    }

    /**
     * 显示选择的文件
     */
    displaySelectedFiles(files) {
        this.selectedFiles = files;
        const previewContainer = document.getElementById('selectedFilesPreview');
        const previewList = document.getElementById('filePreviewList');
        const uploadBtn = document.getElementById('uploadFilesBtn');
        
        if (!files || files.length === 0) {
            if (previewContainer) {
                previewContainer.style.display = 'none';
            }
            if (uploadBtn) {
                uploadBtn.disabled = true;
            }
            return;
        }

        const fileItems = Array.from(files).map((file, index) => `
            <div class="file-preview-item">
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span class="file-type">${file.type || '未知类型'}</span>
                </div>
                <button class="btn btn-sm btn-danger" onclick="window.app.removeSelectedFile(${index})">移除</button>
            </div>
        `).join('');

        if (previewList) {
            previewList.innerHTML = fileItems;
        }
        
        if (previewContainer) {
            previewContainer.style.display = 'block';
        }
        
        if (uploadBtn) {
            uploadBtn.disabled = false;
        }
    }

    /**
     * 清空文件选择
     */
    clearFileSelection() {
        this.selectedFiles = [];
        const localFileInput = document.getElementById('localFileInput');
        const previewContainer = document.getElementById('selectedFilesPreview');
        const uploadBtn = document.getElementById('uploadFilesBtn');
        
        if (localFileInput) {
            localFileInput.value = '';
        }
        
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        
        if (uploadBtn) {
            uploadBtn.disabled = true;
        }
        
        console.log('已清空文件选择');
    }

    /**
     * 移除选中的文件
     */
    removeSelectedFile(index) {
        if (index >= 0 && index < this.selectedFiles.length) {
            this.selectedFiles.splice(index, 1);
            this.displaySelectedFiles(this.selectedFiles);
            
            if (this.selectedFiles.length === 0) {
                this.clearFileSelection();
            }
        }
    }

    /**
     * 更新上传进度
     */
    updateUploadProgress(progressData) {
        const progressContainer = document.getElementById('uploadProgressContainer');
        const progressBar = document.getElementById('uploadProgressBar');
        const uploadStatus = document.getElementById('uploadStatus');
        
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        
        if (progressBar) {
            progressBar.style.width = `${progressData.progress}%`;
        }
        
        if (uploadStatus) {
            uploadStatus.textContent = progressData.status;
        }
        
        // 上传完成后隐藏进度条
        if (progressData.progress >= 100) {
            setTimeout(() => {
                if (progressContainer) {
                    progressContainer.style.display = 'none';
                }
            }, 2000);
        }
    }

    /**
     * 更新结果显示
     */
    updateResults(result) {
        const resultsDiv = document.getElementById('results');
        if (!resultsDiv) return;
        
        const timestamp = new Date().toLocaleString();
        
        const resultHtml = `
            <div class="result-item ${result.success ? 'success' : 'error'}">
                <h4>${result.success ? '✅' : '❌'} ${result.message}</h4>
                <p><strong>时间:</strong> ${timestamp}</p>
                ${result.details ? `<pre>${JSON.stringify(result.details, null, 2)}</pre>` : ''}
                ${result.error ? `<p class="error"><strong>错误:</strong> ${result.error}</p>` : ''}
            </div>
        `;
        
        resultsDiv.innerHTML = resultHtml + resultsDiv.innerHTML;
    }

    /**
     * 更新状态显示
     */
    updateStatus(message) {
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            const timestamp = new Date().toLocaleString();
            statusDiv.innerHTML = `<p>[${timestamp}] ${message}</p>`;
        }
    }

    /**
     * 更新存储路径显示
     */
    updateStorageDisplay(currentPath) {
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
    }

    /**
     * 显示文件列表
     */
    displayFileList(fileListData) {
        const uploadedFilesList = document.getElementById('uploadedFilesList');
        const storageInfo = document.getElementById('storageInfo');
        
        if (storageInfo && fileListData.storageInfo) {
            const info = fileListData.storageInfo;
            storageInfo.innerHTML = `
                <div class="storage-summary">
                    <p><strong>存储类型:</strong> ${info.type}</p>
                    <p><strong>存储路径:</strong> ${info.uploadPath}</p>
                    <p><strong>文件总数:</strong> ${info.totalFiles}</p>
                    <p><strong>总大小:</strong> ${(info.totalSize / 1024 / 1024).toFixed(2)} MB</p>
                </div>
            `;
        }
        
        if (uploadedFilesList) {
            if (fileListData.files.length === 0) {
                uploadedFilesList.innerHTML = '<p class="placeholder">暂无上传文件</p>';
            } else {
                const fileItems = fileListData.files.map(file => `
                    <div class="file-item">
                        <div class="file-info">
                            <h4>${file.name}</h4>
                            <p>大小: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            <p>创建时间: ${new Date(file.created).toLocaleString()}</p>
                            <p>修改时间: ${new Date(file.modified).toLocaleString()}</p>
                        </div>
                        <div class="file-actions">
                            <a href="/api/download/${file.name}?storageType=${file.storageType}" 
                               class="btn btn-sm btn-info" download>下载</a>
                            <button class="btn btn-sm btn-danger" 
                                    onclick="window.app.deleteFile('${file.name}', '${file.storageType}')">删除</button>
                        </div>
                    </div>
                `).join('');
                
                uploadedFilesList.innerHTML = fileItems;
            }
        }
    }
}