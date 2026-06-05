class ApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async getDevice(deviceId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/device/${deviceId}`);
      if (!response.ok) throw new Error('Device not found');
      return await response.json();
    } catch (error) {
      console.error(`获取设备 ${deviceId} 数据失败:`, error);
      return null;
    }
  }

  async getAllDevices() {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices`);
      if (!response.ok) throw new Error('Failed to fetch devices');
      return await response.json();
    } catch (error) {
      console.error('获取所有设备数据失败:', error);
      return {};
    }
  }

  async startDataPolling(callback, interval = 3000) {
    const fetchData = async () => {
      const data = await this.getAllDevices();
      callback(data);
    };
    
    fetchData();
    return setInterval(fetchData, interval);
  }

  stopDataPolling(intervalId) {
    clearInterval(intervalId);
  }
}

export default new ApiClient();
