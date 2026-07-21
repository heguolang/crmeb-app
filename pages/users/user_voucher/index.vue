<template>
	<view class="voucher-page" :data-theme="theme">
		<view class="off-tip" v-if="loaded && !asset.switchOn">功能暂未开启，请稍后再试</view>

		<!-- 资产总览 -->
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-inner">
				<view class="hero-title">我的资产</view>
				<view class="asset-grid">
					<view class="asset-cell">
						<view class="asset-num">{{ asset.integral || 0 }}</view>
						<view class="asset-label">积分</view>
					</view>
					<view class="asset-cell">
						<view class="asset-num">{{ formatMoney(asset.consumeVoucher) }}</view>
						<view class="asset-label">消费券</view>
					</view>
					<view class="asset-cell">
						<view class="asset-num">{{ formatMoney(asset.warrant) }}</view>
						<view class="asset-label">权证</view>
					</view>
					<view class="asset-cell">
						<view class="asset-num">{{ formatMoney(asset.nowMoney) }}</view>
						<view class="asset-label">余额</view>
					</view>
				</view>
				<view class="rate-row">
					<view class="rate-chip">{{ asset.integralToVoucherRatio || '-' }}积分 = 1消费券</view>
					<view class="rate-chip">{{ asset.voucherToBalanceRatio || '-' }}消费券 = 1元</view>
					<view class="rate-chip">{{ asset.warrantNeedIntegral || '-' }}积分 = 1权证</view>
					<view class="rate-chip">{{ asset.warrantNeedVoucher || '-' }}消费券 = 1权证</view>
				</view>
			</view>
		</view>

		<!-- 兑换 -->
		<view class="panel" :class="{ disabled: !asset.switchOn }">
			<view class="panel-head">
				<view class="panel-title">兑换中心</view>
				<view class="panel-sub">按后台比例即时兑换</view>
			</view>
			<view class="seg">
				<view
					v-for="(item, index) in exchangeTabs"
					:key="index"
					class="seg-item"
					:class="{ on: exchangeTab === index }"
					@click="exchangeTab = index"
				>{{ item }}</view>
			</view>

			<!-- 积分 → 消费券 -->
			<view class="form" v-if="exchangeTab === 0">
				<view class="field">
					<view class="field-label">兑换积分</view>
					<input class="field-input" type="number" :disabled="!asset.switchOn" v-model="integralNum" placeholder="请输入积分数" @input="onIntegralInput" />
				</view>
				<view class="preview-box" v-if="integralCalc.show">
					<view class="preview-main">
						预计获得 <text class="preview-num">{{ integralCalc.voucher }}</text> 消费券
					</view>
					<view class="preview-sub">
						比例 {{ integralCalc.ratio }} 积分 = 1 消费券，
						实际扣除 <text class="preview-num">{{ integralCalc.useIntegral }}</text> 积分
						<text v-if="integralCalc.remain > 0">（余 {{ integralCalc.remain }} 不兑换）</text>
					</view>
					<view class="preview-warn" v-if="integralCalc.voucher <= 0">
						至少需要 {{ integralCalc.ratio }} 积分才能兑换 1 消费券
					</view>
				</view>
				<button class="primary-btn" :disabled="!asset.switchOn" @click="onIntegralToVoucher">立即兑换</button>
			</view>

			<!-- 消费券 → 余额 -->
			<view class="form" v-if="exchangeTab === 1">
				<view class="field">
					<view class="field-label">兑换消费券</view>
					<input class="field-input" type="digit" :disabled="!asset.switchOn" v-model="voucherNum" placeholder="请输入消费券数量" @input="onVoucherInput" />
				</view>
				<view class="preview-box" v-if="balanceCalc.show">
					<view class="preview-main">
						预计到账 <text class="preview-num">￥{{ balanceCalc.balance }}</text>
					</view>
					<view class="preview-sub">
						比例 {{ balanceCalc.ratio }} 消费券 = 1 元，
						实际扣除 <text class="preview-num">{{ balanceCalc.useVoucher }}</text> 消费券
						<text v-if="balanceCalc.remain > 0">（余 {{ balanceCalc.remain }} 不兑换）</text>
					</view>
					<view class="preview-warn" v-if="Number(balanceCalc.balance) <= 0">
						至少需要 {{ balanceCalc.ratio }} 消费券才能兑换 1 元余额
					</view>
				</view>
				<button class="primary-btn" :disabled="!asset.switchOn" @click="onVoucherToBalance">立即兑换</button>
			</view>

			<!-- 积分 → 权证 -->
			<view class="form" v-if="exchangeTab === 2">
				<view class="field">
					<view class="field-label">兑换积分</view>
					<input class="field-input" type="number" :disabled="!asset.switchOn" v-model="warrantIntegralNum" placeholder="请输入积分数" @input="onWarrantIntegralInput" />
				</view>
				<view class="preview-box" v-if="warrantByIntegralCalc.show">
					<view class="preview-main">
						预计获得 <text class="preview-num">{{ warrantByIntegralCalc.warrant }}</text> 权证
					</view>
					<view class="preview-sub">
						比例 {{ warrantByIntegralCalc.ratio }} 积分 = 1 权证，
						实际扣除 <text class="preview-num">{{ warrantByIntegralCalc.useIntegral }}</text> 积分
						<text v-if="warrantByIntegralCalc.remain > 0">（余 {{ warrantByIntegralCalc.remain }} 不兑换）</text>
					</view>
					<view class="preview-warn" v-if="warrantByIntegralCalc.warrant <= 0">
						至少需要 {{ warrantByIntegralCalc.ratio }} 积分才能兑换 1 权证
					</view>
				</view>
			</view>

			<!-- 消费券 → 权证 -->
			<view class="form" v-if="exchangeTab === 3">
				<view class="field">
					<view class="field-label">兑换消费券</view>
					<input class="field-input" type="digit" :disabled="!asset.switchOn" v-model="warrantVoucherNum" placeholder="请输入消费券数量" @input="onWarrantVoucherInput" />
				</view>
				<view class="preview-box" v-if="warrantByVoucherCalc.show">
					<view class="preview-main">
						预计获得 <text class="preview-num">{{ warrantByVoucherCalc.warrant }}</text> 权证
					</view>
					<view class="preview-sub">
						比例 {{ warrantByVoucherCalc.ratio }} 消费券 = 1 权证，
						实际扣除 <text class="preview-num">{{ warrantByVoucherCalc.useVoucher }}</text> 消费券
						<text v-if="warrantByVoucherCalc.remain > 0">（余 {{ warrantByVoucherCalc.remain }} 不兑换）</text>
					</view>
					<view class="preview-warn" v-if="Number(warrantByVoucherCalc.warrant) <= 0">
						至少需要 {{ warrantByVoucherCalc.ratio }} 消费券才能兑换 1 权证
					</view>
				</view>
			</view>
		</view>

		<!-- 权证地址：仅兑权证时展示，与兑换一并提交 -->
		<view class="panel address-panel" v-if="isWarrantExchange" :class="{ disabled: !asset.switchOn }">
			<view class="panel-head">
				<view class="panel-title">权证地址</view>
				<view class="panel-sub">兑换权证时需一并填写第三方地址</view>
			</view>
			<view class="field">
				<view class="field-label">第三方地址</view>
				<input class="field-input" type="text" :disabled="!asset.switchOn" v-model="warrantAddress" placeholder="请输入第三方地址" />
			</view>
			<view class="bound" v-if="asset.warrantAddress">
				<view class="bound-label">已绑定</view>
				<view class="bound-val">{{ asset.warrantAddress }}</view>
				<view class="bound-time" v-if="asset.warrantAddressTime">{{ asset.warrantAddressTime }}</view>
			</view>
			<view class="warrant-hold">
				当前权证 <text class="preview-num">{{ formatMoney(asset.warrant) }}</text>
			</view>
			<button class="primary-btn" :disabled="!asset.switchOn" @click="onSubmitWarrantExchange">提交兑换</button>
		</view>

		<!-- 明细 -->
		<view class="panel record-panel">
			<view class="seg record-seg">
				<view class="seg-item" :class="{ on: tab === 0 }" @click="switchTab(0)">消费券明细</view>
				<view class="seg-item" :class="{ on: tab === 1 }" @click="switchTab(1)">权证明细</view>
			</view>
			<view class="record-list">
				<view class="record-item" v-for="(item, index) in recordList" :key="index">
					<view class="record-left">
						<view class="record-title">{{ item.title }}</view>
						<view class="record-time">{{ item.updateTime }}</view>
					</view>
					<view class="record-num" :class="item.type === 1 ? 'plus' : 'minus'" v-if="tab === 0">
						{{ item.type === 1 ? '+' : '-' }}{{ item.voucher }}
					</view>
					<view class="record-num" :class="item.type === 1 ? 'plus' : 'minus'" v-else>
						{{ item.type === 1 ? '+' : '-' }}{{ item.warrant }}
					</view>
				</view>
				<view class="footer-tip" v-if="recordList.length">{{ loadTitle }}</view>
				<view class="footer-tip empty" v-if="!recordList.length && !loading">暂无记录</view>
			</view>
		</view>
	</view>
</template>

<script>
import {
	getVoucherAsset,
	integralToVoucherApi,
	voucherToBalanceApi,
	exchangeWarrantApi,
	getVoucherRecord,
	getWarrantRecord
} from '@/api/user.js';

let app = getApp();

export default {
	data() {
		return {
			theme: (app && app.globalData && app.globalData.theme) || '',
			asset: { switchOn: true },
			loaded: false,
			integralNum: '',
			voucherNum: '',
			warrantIntegralNum: '',
			warrantVoucherNum: '',
			warrantAddress: '',
			exchangeTab: 0,
			exchangeTabs: ['积分兑券', '券兑余额', '积分兑权证', '券兑权证'],
			tab: 0,
			recordList: [],
			page: 1,
			limit: 20,
			loading: false,
			loadend: false,
			loadTitle: '加载更多'
		};
	},
	computed: {
		isWarrantExchange() {
			return this.exchangeTab === 2 || this.exchangeTab === 3;
		},
		integralCalc() {
			const ratio = Number(this.asset.integralToVoucherRatio) || 0;
			const raw = String(this.integralNum || '').trim();
			const integral = parseInt(raw, 10);
			if (!raw || !integral || integral <= 0 || ratio <= 0) {
				return { show: false };
			}
			const voucher = Math.floor(integral / ratio);
			const useIntegral = voucher * ratio;
			return {
				show: true,
				ratio,
				voucher,
				useIntegral,
				remain: integral - useIntegral
			};
		},
		balanceCalc() {
			const ratio = Number(this.asset.voucherToBalanceRatio) || 0;
			const raw = String(this.voucherNum || '').trim();
			const voucher = parseFloat(raw);
			if (!raw || !voucher || voucher <= 0 || ratio <= 0) {
				return { show: false };
			}
			const times = Math.floor(voucher / ratio);
			const useVoucher = times * ratio;
			return {
				show: true,
				ratio,
				balance: times.toFixed(2),
				useVoucher: useVoucher.toFixed(2),
				remain: Number((voucher - useVoucher).toFixed(2))
			};
		},
		warrantByIntegralCalc() {
			const ratio = Number(this.asset.warrantNeedIntegral) || 0;
			const raw = String(this.warrantIntegralNum || '').trim();
			const integral = parseInt(raw, 10);
			if (!raw || !integral || integral <= 0 || ratio <= 0) {
				return { show: false };
			}
			const warrant = Math.floor(integral / ratio);
			const useIntegral = warrant * ratio;
			return {
				show: true,
				ratio,
				warrant,
				useIntegral,
				remain: integral - useIntegral
			};
		},
		warrantByVoucherCalc() {
			const ratio = Number(this.asset.warrantNeedVoucher) || 0;
			const raw = String(this.warrantVoucherNum || '').trim();
			const voucher = parseFloat(raw);
			if (!raw || !voucher || voucher <= 0 || ratio <= 0) {
				return { show: false };
			}
			const times = Math.floor(voucher / ratio);
			const useVoucher = times * ratio;
			return {
				show: true,
				ratio,
				warrant: times.toFixed(2),
				useVoucher: useVoucher.toFixed(2),
				remain: Number((voucher - useVoucher).toFixed(2))
			};
		}
	},
	onShow() {
		this.loadAsset();
		this.resetAndLoadRecord();
	},
	onReachBottom() {
		this.loadRecord();
	},
	methods: {
		formatMoney(val) {
			const n = Number(val);
			if (Number.isNaN(n)) return '0.00';
			return n.toFixed(2);
		},
		onIntegralInput(e) {
			this.integralNum = (e && e.detail && e.detail.value) || this.integralNum;
		},
		onVoucherInput(e) {
			this.voucherNum = (e && e.detail && e.detail.value) || this.voucherNum;
		},
		onWarrantIntegralInput(e) {
			this.warrantIntegralNum = (e && e.detail && e.detail.value) || this.warrantIntegralNum;
		},
		onWarrantVoucherInput(e) {
			this.warrantVoucherNum = (e && e.detail && e.detail.value) || this.warrantVoucherNum;
		},
		tipError(err) {
			const title = typeof err === 'string' ? err : (err && (err.message || err.msg)) || '操作失败';
			this.$util.Tips({ title });
		},
		loadAsset() {
			getVoucherAsset()
				.then((res) => {
					this.asset = (res && res.data) || { switchOn: true };
					if (typeof this.asset.switchOn === 'undefined') {
						this.asset.switchOn = true;
					}
					this.warrantAddress = this.asset.warrantAddress || '';
					this.loaded = true;
				})
				.catch((err) => {
					this.loaded = true;
					this.tipError(err);
				});
		},
		switchTab(index) {
			this.tab = index;
			this.resetAndLoadRecord();
		},
		resetAndLoadRecord() {
			this.page = 1;
			this.loadend = false;
			this.recordList = [];
			this.loadRecord();
		},
		loadRecord() {
			if (this.loading || this.loadend) {
				return;
			}
			this.loading = true;
			this.loadTitle = '加载中...';
			const api = this.tab === 0 ? getVoucherRecord : getWarrantRecord;
			api({ page: this.page, limit: this.limit })
				.then((res) => {
					const list = (res && res.data && res.data.list) || [];
					this.recordList = this.recordList.concat(list);
					this.loadend = list.length < this.limit;
					this.loadTitle = this.loadend ? '没有更多了' : '加载更多';
					this.page += 1;
				})
				.catch((err) => {
					this.loadTitle = '加载失败';
					this.tipError(err);
				})
				.finally(() => {
					this.loading = false;
				});
		},
		ensureSwitchOn() {
			if (this.asset && this.asset.switchOn === false) {
				this.$util.Tips({ title: '功能暂未开启' });
				return false;
			}
			return true;
		},
		onIntegralToVoucher() {
			if (!this.ensureSwitchOn()) return;
			const integral = parseInt(this.integralNum, 10);
			if (!integral || integral <= 0) {
				return this.$util.Tips({ title: '请输入有效积分数' });
			}
			integralToVoucherApi({ integral })
				.then(() => {
					this.$util.Tips({ title: '兑换成功' });
					this.integralNum = '';
					this.loadAsset();
					this.resetAndLoadRecord();
				})
				.catch((err) => this.tipError(err));
		},
		onVoucherToBalance() {
			if (!this.ensureSwitchOn()) return;
			const voucher = parseFloat(this.voucherNum);
			if (!voucher || voucher <= 0) {
				return this.$util.Tips({ title: '请输入有效消费券数量' });
			}
			voucherToBalanceApi({ voucher })
				.then(() => {
					this.$util.Tips({ title: '兑换成功' });
					this.voucherNum = '';
					this.loadAsset();
					this.resetAndLoadRecord();
				})
				.catch((err) => this.tipError(err));
		},
		onIntegralToWarrant() {
			if (!this.ensureSwitchOn()) return;
			const amount = parseInt(this.warrantIntegralNum, 10);
			if (!amount || amount <= 0) {
				return this.$util.Tips({ title: '请输入有效积分数' });
			}
			const address = this.getWarrantAddress();
			if (!address) return;
			exchangeWarrantApi({ payType: 'integral', amount, address })
				.then(() => {
					this.$util.Tips({ title: '兑换成功' });
					this.warrantIntegralNum = '';
					this.loadAsset();
					this.resetAndLoadRecord();
				})
				.catch((err) => this.tipError(err));
		},
		onVoucherToWarrant() {
			if (!this.ensureSwitchOn()) return;
			const amount = parseFloat(this.warrantVoucherNum);
			if (!amount || amount <= 0) {
				return this.$util.Tips({ title: '请输入有效消费券数量' });
			}
			const address = this.getWarrantAddress();
			if (!address) return;
			exchangeWarrantApi({ payType: 'voucher', amount, address })
				.then(() => {
					this.$util.Tips({ title: '兑换成功' });
					this.warrantVoucherNum = '';
					this.loadAsset();
					this.resetAndLoadRecord();
				})
				.catch((err) => this.tipError(err));
		},
		getWarrantAddress() {
			const address = (this.warrantAddress || '').trim();
			if (!address) {
				this.$util.Tips({ title: '请输入权证地址' });
				return '';
			}
			if (address.length > 255) {
				this.$util.Tips({ title: '地址长度不能超过255' });
				return '';
			}
			return address;
		},
		onSubmitWarrantExchange() {
			if (this.exchangeTab === 2) {
				this.onIntegralToWarrant();
				return;
			}
			if (this.exchangeTab === 3) {
				this.onVoucherToWarrant();
			}
		}
	}
};
</script>

<style scoped lang="scss">
.voucher-page {
	min-height: 100vh;
	background: #f6f7f9;
	padding-bottom: 48rpx;
}

.off-tip {
	background: #fff8e8;
	color: #c47a00;
	font-size: 24rpx;
	padding: 18rpx 24rpx;
	text-align: center;
}

.hero {
	position: relative;
	padding: 28rpx 24rpx 48rpx;
	overflow: hidden;
}
.hero-bg {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 40rpx;
	background: linear-gradient(145deg, #ff5a45 0%, #e93323 55%, #d42218 100%);
	border-radius: 0 0 40rpx 40rpx;
}
.hero-inner {
	position: relative;
	z-index: 1;
}
.hero-title {
	color: rgba(255, 255, 255, 0.92);
	font-size: 26rpx;
	margin-bottom: 20rpx;
	letter-spacing: 2rpx;
}
.asset-grid {
	display: flex;
	flex-wrap: wrap;
	background: rgba(255, 255, 255, 0.14);
	border-radius: 20rpx;
	backdrop-filter: blur(6px);
	overflow: hidden;
}
.asset-cell {
	width: 50%;
	box-sizing: border-box;
	padding: 28rpx 12rpx;
	text-align: center;
	color: #fff;
	border-right: 1px solid rgba(255, 255, 255, 0.12);
	border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}
.asset-cell:nth-child(2n) {
	border-right: none;
}
.asset-cell:nth-child(n + 3) {
	border-bottom: none;
}
.asset-num {
	font-size: 40rpx;
	font-weight: 700;
	line-height: 1.2;
}
.asset-label {
	margin-top: 10rpx;
	font-size: 22rpx;
	opacity: 0.88;
}
.rate-row {
	display: flex;
	flex-wrap: wrap;
	margin-top: 20rpx;
	gap: 12rpx;
}
.rate-chip {
	background: rgba(255, 255, 255, 0.18);
	color: #fff;
	font-size: 20rpx;
	padding: 8rpx 16rpx;
	border-radius: 999rpx;
	line-height: 1.4;
}

.panel {
	margin: -12rpx 24rpx 24rpx;
	background: #fff;
	border-radius: 24rpx;
	padding: 28rpx 28rpx 32rpx;
	box-shadow: 0 8rpx 28rpx rgba(20, 20, 40, 0.04);
}
.panel.disabled {
	opacity: 0.7;
}
.panel-head {
	margin-bottom: 22rpx;
}
.panel-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #1f2329;
}
.panel-sub {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #8a9199;
}

.seg {
	display: flex;
	flex-wrap: wrap;
	background: #f3f4f6;
	border-radius: 14rpx;
	padding: 6rpx;
	margin-bottom: 28rpx;
}
.seg-item {
	width: 50%;
	box-sizing: border-box;
	text-align: center;
	font-size: 26rpx;
	color: #666;
	padding: 16rpx 8rpx;
	border-radius: 12rpx;
	transition: all 0.2s ease;
}
.seg-item.on {
	background: #fff;
	color: #e93323;
	font-weight: 600;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.04);
}

.form {
	padding-top: 4rpx;
}
.field {
	margin-bottom: 20rpx;
}
.field-label {
	font-size: 24rpx;
	color: #666;
	margin-bottom: 12rpx;
}
.field-input {
	height: 84rpx;
	padding: 0 24rpx;
	background: #f7f8fa;
	border-radius: 14rpx;
	font-size: 28rpx;
	color: #333;
	border: 1px solid transparent;
}
.field-input:focus {
	border-color: rgba(233, 51, 35, 0.35);
	background: #fff;
}

.preview-box {
	background: #fff5f4;
	border: 1px solid rgba(233, 51, 35, 0.12);
	border-radius: 14rpx;
	padding: 20rpx 22rpx;
	margin-bottom: 24rpx;
}
.preview-main {
	font-size: 28rpx;
	color: #333;
	font-weight: 600;
}
.preview-sub {
	margin-top: 10rpx;
	font-size: 22rpx;
	color: #888;
	line-height: 1.5;
}
.preview-warn {
	margin-top: 10rpx;
	font-size: 22rpx;
	color: #e93323;
}
.preview-num {
	color: #e93323;
	font-weight: 700;
	padding: 0 4rpx;
}
.warrant-hold {
	font-size: 24rpx;
	color: #666;
	margin-bottom: 22rpx;
}

.primary-btn {
	margin-top: 8rpx;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 44rpx;
	background: linear-gradient(90deg, #ff5a45, #e93323);
	color: #fff;
	font-size: 30rpx;
	font-weight: 600;
	border: none;
}
.primary-btn.soft {
	background: linear-gradient(90deg, #ff7a45, #f04a2f);
}
.primary-btn[disabled] {
	opacity: 0.45;
}

.address-panel {
	margin-top: 0;
}
.bound {
	background: #fafafa;
	border-radius: 14rpx;
	padding: 20rpx 22rpx;
	margin-bottom: 16rpx;
}
.bound-label {
	font-size: 22rpx;
	color: #999;
}
.bound-val {
	margin-top: 8rpx;
	font-size: 26rpx;
	color: #333;
	word-break: break-all;
}
.bound-time {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #aaa;
}

.record-panel {
	padding-top: 20rpx;
}
.record-seg {
	margin-bottom: 8rpx;
}
.record-seg .seg-item {
	width: 50%;
}
.record-list {
	padding-top: 8rpx;
}
.record-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 26rpx 4rpx;
	border-bottom: 1px solid #f2f3f5;
}
.record-item:last-child {
	border-bottom: none;
}
.record-title {
	font-size: 28rpx;
	color: #303133;
}
.record-time {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #a8abb2;
}
.record-num {
	font-size: 32rpx;
	font-weight: 700;
}
.record-num.plus {
	color: #e93323;
}
.record-num.minus {
	color: #303133;
}
.footer-tip {
	text-align: center;
	color: #a8abb2;
	font-size: 24rpx;
	padding: 28rpx 0 8rpx;
}
.footer-tip.empty {
	padding: 56rpx 0 24rpx;
}
</style>
