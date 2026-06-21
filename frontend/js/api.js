/**
 * API 调用模块
 * 封装所有后端接口请求，与 UI 逻辑解耦
 * 仅负责数据请求和响应格式化
 */

const DefectAPI = (function () {
    const BASE_URL = "";

    async function request(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    async function healthCheck() {
        const result = await request(`${BASE_URL}/api/health`);
        return result;
    }

    async function detect(imageFile, threshold = 0.5) {
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("threshold", threshold.toString());

        const result = await request(`${BASE_URL}/api/detect`, {
            method: "POST",
            body: formData
        });

        return result;
    }

    async function getImageInfo(imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const result = await request(`${BASE_URL}/api/image/info`, {
            method: "POST",
            body: formData
        });

        return result;
    }

    async function reloadModel(modelPath = null) {
        const result = await request(`${BASE_URL}/api/model/reload`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ model_path: modelPath })
        });

        return result;
    }

    return {
        healthCheck,
        detect,
        getImageInfo,
        reloadModel
    };
})();
