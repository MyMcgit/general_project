import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";
const instance = axios.create({
  baseURL,
  timeout: 1000,
  headers: { "content-type": "aplication/json" },
});

// 添加请求拦截器
instance.interceptors.request.use(
  function (config) {
    // 在发送请求之前，需要获取本地token，添加到请求头中
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      //跳转到登录页
    }
    return config;
  },
  function (error) {
    // 对请求错误做些什么(比如突然断网了，导致DNS解析失败，token没找到主动抛出错误等)
    return Promise.reject(error);
  },
);

// 添加响应拦截器
instance.interceptors.response.use(
  function (response) {
    // 2xx 范围内的状态码都会触发该函数。特殊的：304（协商缓存）也会触发该函数，并自动拿出之前的缓存，前端不需要做任何处理（99%的场景都不用管）
    // 拿出响应数据
    return response.data;
  },
  function (error) {
    // 超出 2xx 范围的状态码都会触发该函数。
    if (error.response.status === 401) {
      //先获取最新的token，如果还是不行，就跳转到登录页
    } else {
      //其他错误
    }
    // 对响应错误做点什么
    return Promise.reject(error);
  },
);

export default instance;

// 大文件上传
export const largeUploadRequest = (
  url: string,
  file: File,
  callback: (percent: number) => void,
  errorCallback: (error: string) => void,
) => {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB 分片
  if (!file) {
    // 提示需要选择上传的文件
    return;
  }
  // 总计分片
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE); //总片数
  let completedNum = 0; //完成进度，每片上传完成后加一，用于计算上传进度百分比，数据是为上传的片数
  let postCount = 0; //已发起的上传分片数量，上传之前加一
  const maxConnection = 5; //最大并发数为5

  // 封装一个函数，可以发起请求，并在完成后发起对应的下一个分片请求
  // 函数内具体做的事：
  // 参数为chunkIndex和重试次数。
  // 会根据chunkIndex拼接请求头，然后发起请求，
  // 如果失败，重试3次。
  // 如果成功，且已发起上传的分片数小于总分片数，就发起下一个请求。

  function uploadChunks(chunkIndex: number, num = 0) {
    // 截取文件分片
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    // 把文件放到formData里发送
    const formData = new FormData();
    formData.append("chunk", chunk);
    // 配置请求头，参数都放到请求头里
    const headers = {
      "Content-Type": "multipart/form-data",
      chunk_index: chunkIndex,
      chunk_size: chunk.size,
      total_size: file.size,
      total_chunks: totalChunks,
    };
    // 记录已发起的上传分片数量
    postCount++;

    axios
      .post(url, formData, { headers })
      .then(() => {
        // 上传成功，更新上传进度
        completedNum++;
        const percent = Math.round((completedNum / totalChunks) * 100);
        callback(percent);
        // 如果还有分片未上传，就发起请求
        if (postCount < totalChunks) {
          uploadChunks(chunkIndex + 1);
        }
      })
      .catch(() => {
        // 失败重试，最多重试3次
        if (num < 3) {
          completedNum--;
          postCount--;
          uploadChunks(chunkIndex, num + 1);
        } else {
          errorCallback("上传失败");
        }
      });
  }
  // 使用函数，批量调用函数发起请求，并发5个请求
  for (let i = 0; i < maxConnection; i++) {
    uploadChunks(i);
  }
};
