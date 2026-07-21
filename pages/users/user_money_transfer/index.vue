<template>
	<view class="transfer-page" :data-theme="theme">
		<view class="balance-box">
			<view class="label">当前余额</view>
			<view class="money">￥{{ nowMoney }}</view>
		</view>

		<view class="form-card">
			<view class="field">
				<view class="field-label">收款用户ID</view>
				<input class="field-input" type="number" v-model="toUid" placeholder="请输入对方用户ID" @blur="onCheckReceiver" />
			</view>
			<view class="receiver" v-if="receiver.uid">
				收款人：UID {{ receiver.uid }}（{{ receiver.nickname }}）
			</view>
			<view class="field">
				<view class="field-label">转账金额</view>
				<input class="field-input" type="digit" v-model="amount" placeholder="请输入转账金额" />
			</view>
			<view class="field">
				<view class="field-label">备注（选填）</view>
				<input class="field-input" type="text" v-model="mark" maxlength="50" placeholder="给对方的备注" />
			</view>
			<view class="tips">
				通过用户ID将余额即时转入对方账户，请仔细核对收款人ID。
			</view>
			<button class="primary-btn" :loading="submitting" @click="onSubmit">确认转账</button>
		</view>
	</view>
</template>

<script>
import { mapGetters } from 'vuex';
import { toLogin } from '@/libs/login.js';
import { checkMoneyTransferApi, moneyTransferApi, getuserDalance } from '@/api/user.js';

let app = getApp();
export default {
	data() {
		return {
			theme: (app && app.globalData && app.globalData.theme) || '',
			nowMoney: '0.00',
			toUid: '',
			amount: '',
			mark: '',
			receiver: {},
			submitting: false
		};
	},
	computed: mapGetters(['isLogin', 'userInfo']),
	onShow() {
		if (!this.isLogin) {
			toLogin();
			return;
		}
		this.loadBalance();
	},
	methods: {
		loadBalance() {
			getuserDalance()
				.then((res) => {
					const data = (res && res.data) || {};
					this.nowMoney = Number(data.nowMoney || this.userInfo.nowMoney || 0).toFixed(2);
				})
				.catch(() => {
					this.nowMoney = Number((this.userInfo && this.userInfo.nowMoney) || 0).toFixed(2);
				});
		},
		onCheckReceiver() {
			const uid = parseInt(this.toUid, 10);
			this.receiver = {};
			if (!uid || uid <= 0) {
				return;
			}
			checkMoneyTransferApi(uid)
				.then((res) => {
					this.receiver = (res && res.data) || {};
				})
				.catch((err) => {
					this.receiver = {};
					const title = typeof err === 'string' ? err : (err && err.message) || '收款用户无效';
					this.$util.Tips({ title });
				});
		},
		onSubmit() {
			if (this.submitting) return;
			const toUid = parseInt(this.toUid, 10);
			const amount = parseFloat(this.amount);
			if (!toUid || toUid <= 0) {
				return this.$util.Tips({ title: '请输入收款用户ID' });
			}
			if (!amount || amount <= 0) {
				return this.$util.Tips({ title: '请输入有效转账金额' });
			}
			if (Number(amount) > Number(this.nowMoney)) {
				return this.$util.Tips({ title: '余额不足' });
			}
			uni.showModal({
				title: '确认转账',
				content: `向用户ID ${toUid}${this.receiver.nickname ? '（' + this.receiver.nickname + '）' : ''} 转账 ￥${Number(amount).toFixed(2)}？`,
				success: (res) => {
					if (!res.confirm) return;
					this.doTransfer(toUid, amount);
				}
			});
		},
		doTransfer(toUid, amount) {
			this.submitting = true;
			moneyTransferApi({
				toUid,
				amount,
				mark: (this.mark || '').trim()
			})
				.then(() => {
					this.$util.Tips({ title: '转账成功' });
					this.amount = '';
					this.mark = '';
					this.loadBalance();
				})
				.catch((err) => {
					const title = typeof err === 'string' ? err : (err && err.message) || '转账失败';
					this.$util.Tips({ title });
				})
				.finally(() => {
					this.submitting = false;
				});
		}
	}
};
</script>

<style scoped lang="scss">
.transfer-page {
	min-height: 100vh;
	background: #f6f7f9;
	padding: 24rpx;
}
.balance-box {
	background: linear-gradient(145deg, #ff5a45 0%, #e93323 100%);
	border-radius: 20rpx;
	padding: 36rpx 32rpx;
	color: #fff;
	margin-bottom: 24rpx;
}
.balance-box .label {
	font-size: 26rpx;
	opacity: 0.9;
}
.balance-box .money {
	margin-top: 12rpx;
	font-size: 52rpx;
	font-weight: 600;
}
.form-card {
	background: #fff;
	border-radius: 20rpx;
	padding: 28rpx 24rpx 40rpx;
}
.field {
	margin-bottom: 24rpx;
}
.field-label {
	font-size: 26rpx;
	color: #666;
	margin-bottom: 12rpx;
}
.field-input {
	background: #f5f6f8;
	border-radius: 12rpx;
	height: 84rpx;
	padding: 0 24rpx;
	font-size: 28rpx;
}
.receiver {
	margin: -8rpx 0 24rpx;
	font-size: 24rpx;
	color: #e93323;
}
.tips {
	font-size: 24rpx;
	color: #999;
	line-height: 1.6;
	margin: 8rpx 0 32rpx;
}
.primary-btn {
	background: #e93323;
	color: #fff;
	border-radius: 44rpx;
	height: 88rpx;
	line-height: 88rpx;
	font-size: 30rpx;
	border: none;
}
.primary-btn[loading] {
	opacity: 0.8;
}
</style>
