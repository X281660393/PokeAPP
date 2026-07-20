import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import router from './router'
import App from './App.vue'

// Vant 组件按需注册
import {
  Switch,
  Icon,
  Slider,
  Stepper,
  Radio,
  RadioGroup,
  Checkbox,
  Button,
  DropdownMenu,
  DropdownItem,
  Tag,
  Empty,
  Search,
  Popup,
  Field,
  Tabs,
  Tab,
  Sticky,
  Loading,
} from 'vant'

// Vant 样式
import 'vant/lib/index.css'
import './styles/global.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 注册 Vant 组件（使用 template 中的 van-xxx 全局标签）
app.use(Switch)
app.use(Icon)
app.use(Slider)
app.use(Stepper)
app.use(Radio)
app.use(RadioGroup)
app.use(Checkbox)
app.use(Button)
app.use(DropdownMenu)
app.use(DropdownItem)
app.use(Tag)
app.use(Empty)
app.use(Search)
app.use(Popup)
app.use(Field)
app.use(Tabs)
app.use(Tab)
app.use(Sticky)
app.use(Loading)

app.mount('#app')

// ===== Android 硬件返回键 / 侧滑返回手势处理 =====
// Capacitor 默认行为是 webView.goBack()，但在 hash 路由 + 部分国产 ROM 下不可靠。
// 这里显式监听 backButton 事件，用 Vue Router 控制返回逻辑：
//   - 有浏览历史（非根页面）→ router.back() 回退一页
//   - 无浏览历史（已在根页面）→ exitApp() 退出应用
if (Capacitor.isNativePlatform()) {
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      CapApp.exitApp()
    }
  })
}
