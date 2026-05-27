import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";
const instance = axios.create({
  baseURL,
  timeout: 1000,
  headers: { 'content-type': 'aplication/json' }
});

// 添加请求拦截器
instance.interceptors.request.use(function (config) {
  // 在发送请求之前，需要获取本地token，添加到请求头中
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    //跳转到登录页
  }
  return config;
}, function (error) {
  // 对请求错误做些什么(比如突然断网了，导致DNS解析失败，token没找到主动抛出错误等)
  return Promise.reject(error);
});

// 添加响应拦截器
instance.interceptors.response.use(function (response) {
  // 2xx 范围内的状态码都会触发该函数。特殊的：304（协商缓存）也会触发该函数，并自动拿出之前的缓存，前端不需要做任何处理（99%的场景都不用管）
  // 拿出响应数据
  return response.data;
}, function (error) {
  // 超出 2xx 范围的状态码都会触发该函数。
  if (error.response.status === 401) {
    //跳转到登录页
  } else {
    //其他错误
  }
  // 对响应错误做点什么
  return Promise.reject(error);
});

export default instance

export const largeUploadRequest = (url:string,file:File,callback:(percent:number) => void, errorCallback:(error:string) => void) => {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB 分片
  if (!file) {
    alert('请先选择文件');
    return;
  }
  // 总计分片
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  async function uploadChunks() {
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      try {
        const res = await axios.post(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'chunk_index': chunkIndex,
            'chunk_size': chunk.size,
            'total_size': file.size,
            'total_chunks': totalChunks
          }
        })

        if (res.status !== 200) {
          throw new Error(`分片 ${chunkIndex + 1} 上传失败`);
        }

        // 更新上传进度
        const percent = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        callback(percent);
      } catch (error) {
        console.error('上传错误:', error);
        errorCallback('上传失败');
        return;
      }
    }
  }
  uploadChunks();
}