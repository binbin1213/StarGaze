export const getWorkerUrl = () => {
  // 强制优先使用自定义域名，避免 .workers.dev 在国内被墙
  const customDomain = 'https://api.binbino.cn';
  const envUrl = process.env.NEXT_PUBLIC_WORKER_URL;
  
  // 如果环境变量是 workers.dev，也强制改用自定义域名
  if (!envUrl || envUrl.includes('workers.dev')) {
    return customDomain;
  }
  return envUrl;
};

export const getR2Url = () => {
  return process.env.NEXT_PUBLIC_R2_URL || 'https://r2.binbino.cn';
};
