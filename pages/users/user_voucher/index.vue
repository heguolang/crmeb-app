<template>
	<view class="voucher-page">
		<view class="off-tip" v-if="loaded && !asset.switchOn">功能暂未开启，请稍后再试</view>

		<view class="header">
			<view class="row">
				<view class="item">
					<view class="num">{{ asset.integral || 0 }}</view>
					<view class="label">积分</view>
				</view>
				<view class="item">
					<view class="num">{{ asset.consumeVoucher || 0 }}</view>
					<view class="label">消费券</view>
				</view>
				<view class="item">
					<view class="num">{{ asset.warrant || 0 }}</view>
					<view class="label">权证</view>
				</view>
				<view class="item">
					<view class="num">{{ asset.nowMoney || 0 }}</view>
					<view class="label">余额</view>
				</view>
			</view>
			<view class="tips">
				比例：{{ asset.integralToVoucherRatio || '-' }}积分=1消费券；
				{{ asset.voucherToBalanceRatio || '-' }}消费券=1元余额；
				{{ asset.warrantNeedVoucher || '-' }}消费券+{{ asset.warrantNeedIntegral || '-' }}积分=1权证
			</view>
		</view>

		<view class="card" :class="{ disabled: !asset.switchOn }">
			<view class="title">积分兑换消费券</view>
			<input class="input" type="number" :disabled="!asset.switchOn" v-model="integralNum" placeholder="请输入积分数" />
			<button class="btn" :disabled="!asset.switchOn" @click="onIntegralToVoucher">立即兑换</button>
		</view>

		<view class="card" :class="{ disabled: !asset.switchOn }">
			<view class="title">消费券兑换余额</view>
			<input class="input" type="digit" :disabled="!asset.switchOn" v-model="voucherNum" placeholder="请输入消费券数量" />
			<button class="btn" :disabled="!asset.switchOn" @click="onVoucherToBalance">立即兑换</button>
		</view>

		<view class="card" :class="{ disabled: !asset.switchOn }">
			<view class="title">兑换权证（仅展示）</view>
			<input class="input" type="number" :disabled="!asset.switchOn" v-model="warrantQty" placeholder="请输入兑换份数" />
			<button class="btn" :disabled="!asset.switchOn" @click="onExchangeWarrant">立即兑换</button>
		</view>

		<view class="card address-card" :class="{ disabled: !asset.switchOn }">
			<view class="title">输入您的地址：</view>
			<input class="input" type="text" :disabled="!asset.switchOn" v-model="warrantAddress" placeholder="请输入第三方地址" />
			<view class="bound" v-if="asset.warrantAddress">
				已绑定：{{ asset.warrantAddress }}
				<text v-if="asset.warrantAddressTime">（{{ asset.warrantAddressTime }}）</text>
			</view>
			<view class="hint">提示：当前权证为 <text class="hint-num">{{ asset.warrant || 0 }}</text></view>
			<button class="btn submit-btn" :disabled="!asset.switchOn" @click="onBindAddress">立即提交</button>
		</view>

		<view class="tabs">
			<view class="tab" :class="{ on: tab === 0 }" @click="switchTab(0)">消费券明细</view>
			<view class="tab" :class="{ on: tab === 1 }" @click="switchTab(1)">权证明细</view>
		</view>
		<view class="list">
			<view class="line" v-for="(item, index) in recordList" :key="index">
				<view>
					<view class="state">{{ item.title }}</view>
					<view class="time">{{ item.updateTime }}</view>
				</view>
				<view class="num" v-if="tab === 0">{{ item.type === 1 ? '+' : '-' }}{{ item.voucher }}</view>
				<view class="num" v-else>{{ item.type === 1 ? '+' : '-' }}{{ item.warrant }}</view>
			</view>
			<view class="loading-tip" v-if="recordList.length">{{ loadTitle }}</view>
			<view class="empty" v-if="!recordList.length && !loading">暂无记录</view>
		</view>
	</view>
</template>

<script>
import {
	getVoucherAsset,
	integralToVoucherApi,
	voucherToBalanceApi,
	exchangeWarrantApi,
	bindWarrantAddressApi,
	getVoucherRecord,
	getWarrantRecord
} from '@/api/user.js';

export default {
	data() {
		return {
			asset: { switchOn: true },
			loaded: false,
			integralNum: '',
			voucherNum: '',
			warrantQty: '1',
			warrantAddress: '',
			tab: 0,
			recordList: [],
			page: 1,
			limit: 20,
			loading: false,
			loadend: false,
			loadTitle: '加载更多'
		};
	},
	onShow() {
		this.loadAsset();
		this.resetAndLoadRecord();
	},
	onReachBottom() {
		this.loadRecord();
	},
	methods: {
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
		onExchangeWarrant() {
			if (!this.ensureSwitchOn()) return;
			const quantity = parseInt(this.warrantQty, 10);
			if (!quantity || quantity <= 0) {
				return this.$util.Tips({ title: '请输入有效份数' });
			}
			exchangeWarrantApi({ quantity })
				.then(() => {
					this.$util.Tips({ title: '兑换成功' });
					this.loadAsset();
					this.resetAndLoadRecord();
				})
				.catch((err) => this.tipError(err));
		},
		onBindAddress() {
			if (!this.ensureSwitchOn()) return;
			const address = (this.warrantAddress || '').trim();
			if (!address) {
				return this.$util.Tips({ title: '请输入地址' });
			}
			if (address.length > 255) {
				return this.$util.Tips({ title: '地址长度不能超过255' });
			}
			bindWarrantAddressApi({ address })
				.then(() => {
					this.$util.Tips({ title: '提交成功' });
					this.loadAsset();
				})
				.catch((err) => this.tipError(err));
		}
	}
};
</script>

<style scoped>
.voucher-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 40rpx;
}
.off-tip {
	background: #fff7e6;
	color: #d48806;
	font-size: 24rpx;
	padding: 16rpx 24rpx;
	text-align: center;
}
.header {
	background: #e93323;
	color: #fff;
	padding: 40rpx 24rpx 30rpx;
}
.row {
	display: flex;
	justify-content: space-between;
}
.item {
	text-align: center;
	flex: 1;
}
.num {
	font-size: 36rpx;
	font-weight: 600;
}
.label {
	font-size: 22rpx;
	margin-top: 8rpx;
	opacity: 0.9;
}
.tips {
	margin-top: 24rpx;
	font-size: 22rpx;
	line-height: 1.5;
	opacity: 0.9;
}
.card {
	margin: 24rpx;
	background: #fff;
	border-radius: 16rpx;
	padding: 24rpx;
}
.card.disabled {
	opacity: 0.65;
}
.title {
	font-size: 28rpx;
	font-weight: 600;
	margin-bottom: 16rpx;
}
.input {
	border: 1px solid #eee;
	border-radius: 8rpx;
	height: 72rpx;
	padding: 0 20rpx;
	margin-bottom: 16rpx;
}
.bound {
	font-size: 22rpx;
	color: #666;
	margin-bottom: 12rpx;
	word-break: break-all;
}
.btn {
	background: #e93323;
	color: #fff;
	font-size: 28rpx;
	border-radius: 8rpx;
}
.btn[disabled] {
	opacity: 0.5;
}
.hint {
	font-size: 24rpx;
	color: #666;
	margin: -4rpx 0 20rpx;
}
.hint-num {
	color: #e93323;
	font-weight: 600;
}
.submit-btn {
	background: linear-gradient(90deg, #e93323, #ff6a3d);
	border-radius: 44rpx;
	height: 88rpx;
	line-height: 88rpx;
}
.tabs {
	display: flex;
	margin: 0 24rpx;
	background: #fff;
	border-radius: 16rpx 16rpx 0 0;
}
.tab {
	flex: 1;
	text-align: center;
	padding: 24rpx 0;
	font-size: 28rpx;
	color: #666;
}
.tab.on {
	color: #e93323;
	font-weight: 600;
	border-bottom: 4rpx solid #e93323;
}
.list {
	margin: 0 24rpx;
	background: #fff;
	border-radius: 0 0 16rpx 16rpx;
	padding: 0 24rpx 24rpx;
}
.line {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1px solid #f0f0f0;
}
.state {
	font-size: 28rpx;
	color: #333;
}
.time {
	font-size: 22rpx;
	color: #999;
	margin-top: 8rpx;
}
.list .num {
	font-size: 30rpx;
	color: #e93323;
}
.empty,
.loading-tip {
	text-align: center;
	color: #999;
	padding: 40rpx 0 20rpx;
	font-size: 26rpx;
}
</style>
