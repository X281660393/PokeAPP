import { createApp } from 'vue'
import { createPinia } from 'pinia'
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
