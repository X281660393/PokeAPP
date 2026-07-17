<script setup lang="ts">
defineOptions({ name: "HelpAuthor" });

import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import { ArrowIcon } from "@/components";
import { APP_CONFIG } from "@/config";

const router = useRouter();

const sponsor = APP_CONFIG.sponsor;
const donateEnabled = sponsor.enabled && sponsor.donate.enabled;
const adEnabled = sponsor.enabled && sponsor.ad.enabled;

function goBack() {
  router.back();
}

/* ===== 捐款弹窗 ===== */
const donateOpen = ref(false);
const payMethod = ref<"wechat" | "alipay">("wechat");

/** 当前支付方式对应的收款码地址（为空则用内置示例二维码） */
const currentQr = computed(() =>
  payMethod.value === "wechat"
    ? sponsor.donate.wechatQr
    : sponsor.donate.alipayQr,
);

function openDonate() {
  donateOpen.value = true;
}
function closeDonate() {
  donateOpen.value = false;
}
function confirmDonate() {
  donateOpen.value = false;
  showToast("感谢你的支持，爱你哟 ❤");
}

/* ===== 观看广告（预留接口） ===== */

/** 广告状态 */
const adOpen = ref(false);

/**
 * 广告接口 —— 预留后续接入真实激励视频 SDK（如穿山甲 / AdMob）
 *
 * 接入方式：
 *   1. 引入 SDK 初始化代码（在 main.ts 或 App.vue 中初始化）
 *   2. 在此处调用 SDK 的 showRewardedAd() 方法
 *   3. 监听回调：onReward → 调用 onAdRewarded()
 *                     onClose  → 调用 closeAdModal()
 *                     onError  → 调用 onAdError(err)
 */
function openAd() {
  // TODO: 替换为真实 SDK 调用，示例：
  //   const sdk = await loadAdSDK();
  //   sdk.showRewardedAd({
  //     unitId: '你的广告位ID',
  //     onReward: () => onAdRewarded(),
  //     onClose:  () => { /* 用户关闭 */ },
  //     onError:  (err) => onAdError(err),
  //   });
  // 目前显示占位弹窗
  adOpen.value = true;
}

function closeAdModal() {
  adOpen.value = false;
}

/** 广告激励回调 —— 接入真实 SDK 后由 SDK 内部调用 */
function onAdRewarded() {
  adOpen.value = false;
  showToast("感谢观看，已为作者送上支持 ❤");
}

/** 广告错误回调（预留：接入 SDK 时取消注释）
 * function onAdError(err: unknown) {
 *   console.warn("[Ad]", err);
 *   adOpen.value = false;
 *   showToast("广告加载失败，请稍后再试");
 * }
 */
</script>

<template>
  <div class="help-page page-gradient">
    <!-- 顶部导航 -->
    <header class="help-nav">
      <button
        class="nav-back"
        type="button"
        @click="goBack"
        aria-label="返回"
      >
        <ArrowIcon
          dir="left"
          :size="20"
          color="#fff"
        />
      </button>
      <span class="nav-title">帮助作者</span>
      <span class="nav-placeholder" />
    </header>

    <!-- 头部横幅 -->
    <div class="help-hero">
      <div class="hero-ball">
        <svg
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="#fff"
            stroke="#fff"
            stroke-width="4"
          />
          <path
            d="M4 50 H96"
            stroke="#ff4459"
            stroke-width="4"
          />
          <path
            d="M50 4 A46 46 0 0 1 96 50 H4 A46 46 0 0 1 50 4 Z"
            fill="#ff4459"
          />
          <circle
            cx="50"
            cy="50"
            r="14"
            fill="#fff"
            stroke="#ff4459"
            stroke-width="3.5"
          />
          <circle
            cx="50"
            cy="50"
            r="5"
            fill="#ff4459"
          />
        </svg>
      </div>
      <h2 class="hero-title">支持 {{ APP_CONFIG.name }}</h2>
      <p class="hero-sub">
        本应用完全免费、无强制广告。<br />若它对你有帮助，欢迎请作者喝杯奶茶 ☕
      </p>
    </div>

    <div class="help-body">
      <!-- 捐款支持 -->
      <button
        v-if="donateEnabled && false"
        class="support-card"
        @click="openDonate"
      >
        <span class="support-icon support-icon--donate">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"
            />
          </svg>
        </span>
        <div class="support-text">
          <span class="support-title">捐款支持</span>
          <span class="support-desc">请作者喝杯奶茶 ☕</span>
        </div>
        <span class="support-tag">微信 / 支付宝</span>
      </button>

      <!-- 观看广告 -->
      <button
        v-if="adEnabled"
        class="support-card"
        @click="openAd"
      >
        <span class="support-icon support-icon--ad">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />
            <path
              d="M10 9l5 3-5 3z"
              fill="currentColor"
              stroke="none"
            />
          </svg>
        </span>
        <div class="support-text">
          <span class="support-title">观看广告</span>
          <span class="support-desc">看一段广告也能帮到我们</span>
        </div>
        <span class="support-tag">约 {{ sponsor.ad.duration }} 秒</span>
      </button>

      <!-- 都关闭时的兜底提示 -->
      <p
        v-if="!donateEnabled && !adEnabled"
        class="empty-tip"
      >
        作者暂未开启赞助入口，感谢你的关注 ❤
      </p>

      <p class="help-note">
        你的每一份支持都是持续更新的动力，感谢有你 💗<br />
        —— {{ APP_CONFIG.author }}
      </p>
    </div>

    <!-- 捐款弹窗 -->
    <transition name="fade">
      <div
        v-if="donateOpen"
        class="overlay"
        @click.self="closeDonate"
      >
        <div class="modal">
          <button
            class="modal-close"
            @click="closeDonate"
            aria-label="关闭"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <h3 class="modal-title">请作者喝杯奶茶</h3>
          <p class="modal-sub">{{ sponsor.donate.tip }}</p>

          <!-- 支付方式切换 -->
          <div class="pay-tabs">
            <button
              class="pay-tab"
              :class="{ on: payMethod === 'wechat' }"
              @click="payMethod = 'wechat'"
            >
              微信
            </button>
            <button
              class="pay-tab"
              :class="{ on: payMethod === 'alipay' }"
              @click="payMethod = 'alipay'"
            >
              支付宝
            </button>
          </div>

          <!-- 二维码：配置了图片则显示图片，否则内置示例码 -->
          <div class="qr-box">
            <img
              v-if="currentQr"
              :src="currentQr"
              class="qr-img"
              alt="收款码"
            />
            <svg
              v-else
              viewBox="0 0 100 100"
              class="qr-svg"
              aria-hidden="true"
            >
              <rect
                x="2"
                y="2"
                width="96"
                height="96"
                rx="6"
                fill="#fff"
              />
              <g fill="#2b2d42">
                <rect
                  x="10"
                  y="10"
                  width="22"
                  height="22"
                />
                <rect
                  x="14"
                  y="14"
                  width="14"
                  height="14"
                  fill="#fff"
                />
                <rect
                  x="17"
                  y="17"
                  width="8"
                  height="8"
                  fill="#2b2d42"
                />
                <rect
                  x="68"
                  y="10"
                  width="22"
                  height="22"
                />
                <rect
                  x="72"
                  y="14"
                  width="14"
                  height="14"
                  fill="#fff"
                />
                <rect
                  x="75"
                  y="17"
                  width="8"
                  height="8"
                  fill="#2b2d42"
                />
                <rect
                  x="10"
                  y="68"
                  width="22"
                  height="22"
                />
                <rect
                  x="14"
                  y="72"
                  width="14"
                  height="14"
                  fill="#fff"
                />
                <rect
                  x="17"
                  y="75"
                  width="8"
                  height="8"
                  fill="#2b2d42"
                />
                <rect
                  x="40"
                  y="12"
                  width="6"
                  height="6"
                />
                <rect
                  x="52"
                  y="12"
                  width="6"
                  height="6"
                />
                <rect
                  x="40"
                  y="24"
                  width="6"
                  height="6"
                />
                <rect
                  x="60"
                  y="40"
                  width="6"
                  height="6"
                />
                <rect
                  x="72"
                  y="40"
                  width="6"
                  height="6"
                />
                <rect
                  x="84"
                  y="52"
                  width="6"
                  height="6"
                />
                <rect
                  x="40"
                  y="52"
                  width="6"
                  height="6"
                />
                <rect
                  x="52"
                  y="64"
                  width="6"
                  height="6"
                />
                <rect
                  x="64"
                  y="76"
                  width="6"
                  height="6"
                />
                <rect
                  x="76"
                  y="68"
                  width="6"
                  height="6"
                />
                <rect
                  x="84"
                  y="80"
                  width="6"
                  height="6"
                />
                <rect
                  x="40"
                  y="76"
                  width="6"
                  height="6"
                />
              </g>
            </svg>
            <p class="qr-tip">
              {{ payMethod === "wechat" ? "微信" : "支付宝" }}收款码{{
                currentQr ? "" : "（示例）"
              }}
            </p>
          </div>

          <button
            class="modal-btn"
            @click="confirmDonate"
          >
            我已支付
          </button>
        </div>
      </div>
    </transition>

    <!-- 广告弹窗（预留接口：后续替换为 SDK 回调驱动） -->
    <transition name="fade">
      <div
        v-if="adOpen"
        class="overlay"
        @click.self="closeAdModal"
      >
        <div class="ad-modal">
          <!-- 广告位区域 —— 接入 SDK 后在此挂载广告容器 -->
          <div class="ad-slot">
            <span class="ad-slot-badge">广告</span>
            <div class="ad-slot-body">
              <div class="ad-tv-icon">📺</div>
              <p class="ad-slot-text">嘻嘻没有广告</p>
              <p class="ad-slot-hint">暂未接入激励视频，敬请期待</p>
            </div>
          </div>

          <div class="ad-modal-footer">
            <button
              class="ad-modal-btn ad-modal-btn--ghost"
              @click="closeAdModal"
            >
              知道了
            </button>
            <!-- 接入真实 SDK 后，此按钮在 SDK onReward 回调后自动触发 -->
            <button
              class="ad-modal-btn ad-modal-btn--primary"
              @click="onAdRewarded"
            >
              领取奖励 ❤
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.help-page {
  min-height: 100vh;
  padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 16px);
  background: var(--poke-cream);
  position: relative;
  z-index: 1;
}
.help-page > * {
  position: relative;
  z-index: 1;
}

/* ===== 顶部导航 ===== */
.help-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top, 0px) + 8px) 14px 6px;
}
.nav-back {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.nav-title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
}
.nav-placeholder {
  width: 32px;
}

/* ===== 头部横幅（紧凑） ===== */
.help-hero {
  text-align: center;
  padding: 4px 20px 16px;
}
.hero-ball {
  width: 44px;
  height: 44px;
  margin: 0 auto 8px;
  filter: drop-shadow(0 3px 10px rgba(224, 49, 74, 0.3));
}
.hero-title {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.16);
}
.hero-sub {
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.88);
  margin-top: 4px;
}

/* ===== 主体 ===== */
.help-body {
  padding: 0 14px 0;
}

/* ===== 支持卡片 ===== */
.support-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 14px;
  margin-bottom: 10px;
  border: none;
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  text-align: left;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}
.support-card:active {
  transform: scale(0.985);
  box-shadow: 0 1px 4px rgba(43, 45, 66, 0.08);
}

.support-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
}
.support-icon svg {
  width: 24px;
  height: 24px;
}
.support-icon--donate {
  background: #ffe3e7;
  color: #ff4459;
}
.support-icon--ad {
  background: #e6fcf5;
  color: #12b886;
}

.support-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.support-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--poke-ink);
}
.support-desc {
  font-size: 12px;
  color: var(--poke-ink-3);
  margin-top: 3px;
}
.support-tag {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--poke-red);
  background: var(--poke-red-soft);
  padding: 4px 10px;
  border-radius: 999px;
}

.empty-tip {
  text-align: center;
  font-size: 14px;
  color: var(--poke-ink-2);
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 28px 16px;
  margin-bottom: 14px;
}

.help-note {
  font-size: 12px;
  color: var(--poke-ink-3);
  text-align: center;
  margin-top: 12px;
  line-height: 1.8;
}

/* ===== 弹窗通用 ===== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 30, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 200;
}

.modal {
  position: relative;
  width: 100%;
  max-width: 320px;
  background: var(--poke-surface);
  border-radius: 20px;
  padding: 26px 22px 22px;
  text-align: center;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--poke-ink-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}
.modal-close svg {
  width: 20px;
  height: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--poke-ink);
  margin: 0 0 6px;
}
.modal-sub {
  font-size: 13px;
  color: var(--poke-ink-3);
  margin: 0 0 16px;
}

.pay-tabs {
  display: flex;
  gap: 8px;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 18px;
}
.pay-tab {
  flex: 1;
  border: none;
  background: transparent;
  padding: 9px 0;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 600;
  color: var(--poke-ink-2);
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.pay-tab.on {
  background: var(--poke-surface);
  color: var(--poke-red);
  box-shadow: 0 2px 6px rgba(43, 45, 66, 0.1);
}

.qr-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}
.qr-svg,
.qr-img {
  width: 160px;
  height: 160px;
  border-radius: 14px;
  border: 1px solid var(--poke-line);
  object-fit: cover;
}
.qr-tip {
  font-size: 12px;
  color: var(--poke-ink-3);
  margin: 10px 0 0;
}

.modal-btn {
  width: 100%;
  border: none;
  background: var(--poke-red);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  padding: 13px 0;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.modal-btn:active {
  background: var(--poke-red-deep);
}

/* ===== 广告弹窗（居中小卡片） ===== */
.ad-modal {
  position: relative;
  width: 100%;
  max-width: 300px;
  background: var(--poke-surface);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

/* 广告位展示区 —— 接入 SDK 后在此挂载容器 */
.ad-slot {
  position: relative;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  padding: 32px 20px 24px;
  text-align: center;
}
.ad-slot-badge {
  position: absolute;
  top: 8px;
  left: 10px;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.7);
  padding: 2px 7px;
  border-radius: 3px;
}
.ad-slot-body {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ad-tv-icon {
  font-size: 44px;
  margin-bottom: 10px;
}
.ad-slot-text {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}
.ad-slot-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

/* 底部按钮 */
.ad-modal-footer {
  display: flex;
  gap: 10px;
  padding: 14px 16px 16px;
}
.ad-modal-btn {
  flex: 1;
  border: none;
  font-size: 14px;
  font-weight: 600;
  padding: 11px 0;
  border-radius: 10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}
.ad-modal-btn--ghost {
  background: #f0f1f3;
  color: var(--poke-ink-2);
}
.ad-modal-btn--ghost:active {
  opacity: 0.75;
}
.ad-modal-btn--primary {
  background: var(--poke-red);
  color: #fff;
}
.ad-modal-btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* fade 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
