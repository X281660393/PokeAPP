/**
 * 全局通用配置
 * ------------------------------------------------------------
 * 整个 App 的通用信息集中在此维护：应用名、版本、作者、赞助开关等。
 * 修改这里即可全局生效，无需再去各页面里逐个改动。
 */

/** 赞助 / 帮助作者相关配置 */
export interface SponsorConfig {
  /** 赞助总开关：关闭后「设置」里的「帮助作者」入口会被隐藏 */
  enabled: boolean
  /** 捐款支持 */
  donate: {
    enabled: boolean
    /** 微信收款码图片地址（放在 public/ 下，留空则显示内置示例二维码） */
    wechatQr: string
    /** 支付宝收款码图片地址（留空则显示内置示例二维码） */
    alipayQr: string
    /** 弹窗里的一句提示语 */
    tip: string
  }
  /** 观看广告支持 */
  ad: {
    enabled: boolean
    /** 激励视频倒计时秒数 */
    duration: number
  }
}

/** 检测更新相关配置（接口预留在 config 内修改） */
export interface UpdateConfig {
  /** 是否显示「检测更新」入口；关闭后设置页不展示该模块 */
  enabled: boolean
  /** 检测更新接口地址（后端返回 { appVersion, dataVersion, downloadUrl, dataNote } 等）。
   *  留空则点击「检测更新」只展示本地版本与配置提示，不做联网检测。 */
  checkUrl: string
  /** 有新版本时跳转的下载/更新页地址；接口也可在返回里覆盖 */
  downloadUrl: string
}

/** App 全局配置 */
export interface AppConfig {
  /** 应用显示名 */
  name: string
  /** 版本号 */
  version: string
  /** 作者 */
  author: string
  /** 联系邮箱 */
  email: string
  /** 数据来源 */
  dataSource: string
  /** 当前数据包版本（与 app 版本独立，便于单独更新数据） */
  dataVersion: string
  /** 更新配置 */
  update: UpdateConfig
  /** 赞助配置 */
  sponsor: SponsorConfig
}

export const APP_CONFIG: AppConfig = {
  name: '宝可梦小图鉴',
  version: '1.0.2',
  author: '悄悄取名',
  email: '281660393@qq.com',
  dataSource: 'PokeAPI',
  dataVersion: '2026.07.19',
  update: {
    enabled: true,
    checkUrl: '',
    downloadUrl: '',
  },
  sponsor: {
    enabled: true,
    donate: {
      enabled: true,
      wechatQr: '',
      alipayQr: '',
      tip: '扫码或选择支付方式，金额随意 ❤',
    },
    ad: {
      enabled: true,
      duration: 5,
    },
  },
}

export default APP_CONFIG
