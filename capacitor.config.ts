import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.example.androidvueapp',
  appName: '宝可梦小图鉴',
  webDir: 'dist',

  // Android 配置
  android: {
    allowMixedContent: true,
    // 最低 API 级别
    minWebViewVersion: '60',
  },

  // 开发服务器配置（用于热更新调试）
  server: {
    // 开发时取消注释，指向你的电脑 IP
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,
  },
}

export default config
