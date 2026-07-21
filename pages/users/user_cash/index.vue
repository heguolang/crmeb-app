<template>
	<view :data-theme="theme">
		<view class='cash-withdrawal'>
			<view class='source-nav acea-row'>
				<view class='source-item' :class="extractSource==='brokerage' ? 'on' : ''" @click="switchSource('brokerage')">佣金提现</view>
				<view class='source-item' :class="extractSource==='balance' ? 'on' : ''" @click="switchSource('balance')">余额提现</view>
			</view>
			<view class='nav acea-row'>
				<view v-for="(item,index) in navList" :key="index" class='item font-color' @click="swichNav(index)">
					<view class='line bg_color' :class='currentTab==index ? "on":""'></view>
					<view class='iconfont' :class='item.icon+" "+(currentTab==index ? "on":"")'></view>
					<view class="tab_text">{{item.name}}</view>
				</view>
			</view>
			<view class='wrapper'>
				<view class='tip disable-tip' v-if="extractSwitch!=='1'">当前{{extractSource==='balance'?'余额':'佣金'}}提现未开启</view>
				<view :hidden='currentTab != 0' class='list'>
					<form @submit="subCash" report-submit='true'>
						<view class='item acea-row row-between-wrapper'>
							<view class='name'>持卡人</view>
							<view class='input'>
								<input placeholder='请输入持卡人姓名' placeholder-class='placeholder' name="name" maxlength="20"></input>
							</view>
						</view>
						<view class='item acea-row row-between-wrapper'>
							<view class='name'>卡号</view>
							<view class='input'>
								<input type='number' placeholder='请填写卡号' placeholder-class='placeholder' name="cardum" maxlength="19"></input>
							</view>
						</view>
						<view class='item acea-row row-between-wrapper'>
							<view class='name'>银行</view>
							<view class='input'>
								<picker @change="bindPickerChange" :value="index" :range="array">
									<text class='Bank'>{{array[index]}}</text>
									<text class='iconfont icon-qiepian38'></text>
								</picker>
							</view>
						</view>
						<view class='item acea-row row-between-wrapper'>
							<view class='name'>提现</view>
							<view class='input'><input :placeholder='"最低提现金额"+minPrice' placeholder-class='placeholder' name="money" type='digit' @input="onMoneyInput"></input></view>
						</view>
						<view class='tip' v-if="extractSource==='brokerage'">
							当前可提现金额: <text class="price">￥{{commission.commissionCount}},</text>冻结佣金：￥{{commission.brokenCommission}}
						</view>
						<view class='tip' v-else>
							当前可提现余额: <text class="price">￥{{commission.commissionCount}}</text>
						</view>
						<view class='tip' v-if="Number(calcFee) > 0">
							手续费：<text class="price">￥{{calcFee}}</text>
							<text v-if="extractFeeType==='percent'">（{{extractFee}}%）</text>
							，预计实到：<text class="price">￥{{arrivePrice}}</text>
						</view>
						<view class='tip' v-if="extractSource==='brokerage'">
							说明: 每笔佣金的冻结期为{{commission.brokenDay}}天，到期后可提现；提现金额需大于手续费<span v-if="Number(extractMultiple)>0">；须为{{extractMultiple}}的倍数</span>
						</view>
						<view class='tip' v-else>
							说明: 提现金额需大于手续费；审核通过后线下到账<span v-if="Number(extractMultiple)>0">；须为{{extractMultiple}}的倍数</span>
						</view>
						<button formType="submit" class='bnt bg-color' :disabled="extractSwitch!=='1'">提现</button>
					</form>
				</view>
				<view :hidden='currentTab != 1' class='list'>
					<form @submit="subCash" report-submit='true'>
						<view class='item acea-row row-between-wrapper'>
							<view class='name'>账号</view>
							<view class='input'>
								<input placeholder='请填写您的微信账号' placeholder-class='placeholder' name="name" maxlength="20"></input>
							</view>
						</view>
						<view class='item acea-row row-between-wrapper'>
							<view class='name'>提现</view>
							<view class='input'>
								<input :placeholder='"最低提现金额"+minPrice' placeholder-class='placeholder' name="money" type='digit' maxlength="8" @input="onMoneyInput"></input>
							</view>
						</view>
						<view class='item acea-row row-top row-between'>
							<view class='name'>收款码</view>
							<view class="input acea-row">
								<view class="picEwm" v-if="qrcodeUrlW">
									<image :src="qrcodeUrlW"></image>
									<text class='iconfont icon-guanbi1 font-color' @click='DelPicW'></text>
								</view>
								<view class='pictrue acea-row row-center-wrapper row-column' @click='uploadpic("W")' v-else>
								  <text class='iconfont icon-icon25201'></text>
								  <view>上传图片</view>
								</view>
							</view>
						</view>
						<view class='tip' v-if="extractSource==='brokerage'">
							当前可提现金额: <text class="price">￥{{commission.commissionCount}},</text>冻结佣金：￥{{commission.brokenCommission}}
						</view>
						<view class='tip' v-else>
							当前可提现余额: <text class="price">￥{{commission.commissionCount}}</text>
						</view>
						<view class='tip' v-if="Number(calcFee) > 0">
							手续费：<text class="price">￥{{calcFee}}</text>
							<text v-if="extractFeeType==='percent'">（{{extractFee}}%）</text>
							，预计实到：<text class="price">￥{{arrivePrice}}</text>
						</view>
						<view class='tip' v-if="extractSource==='brokerage'">
							说明: 每笔佣金的冻结期为{{commission.brokenDay}}天，到期后可提现；提现金额需大于手续费<span v-if="Number(extractMultiple)>0">；须为{{extractMultiple}}的倍数</span>
						</view>
						<view class='tip' v-else>
							说明: 提现金额需大于手续费；审核通过后线下到账<span v-if="Number(extractMultiple)>0">；须为{{extractMultiple}}的倍数</span>
						</view>
						<button formType="submit" class='bnt bg-color' :disabled="extractSwitch!=='1'">提现</button>
					</form>
				</view>
				<view :hidden='currentTab != 2' class='list'>
					<form @submit="subCash" report-submit='true'>
						<view class='item acea-row row-between-wrapper'>
							<view class='name'>姓名</view>
							<view class='input'>
								<input placeholder='请填写您的真实姓名' placeholder-class='placeholder' name="name" maxlength="20"></input>
							</view>
						</view>
						<view class='item acea-row row-between-wrapper'>
							<view class='name'>账号</view>
							<view class='input'>
								<input placeholder='请填写您的支付宝账号' placeholder-class='placeholder' name="alipayCode" maxlength="50"></input>
							</view>
						</view>
						<view class='item acea-row row-between-wrapper'>
							<view class='name'>提现</view>
							<view class='input'>
								<input :placeholder='"最低提现金额"+minPrice' placeholder-class='placeholder' name="money" type='digit' maxlength="8" @input="onMoneyInput"></input>
							</view>
						</view>
						<view class='item acea-row row-top row-between'>
							<view class='name'>收款码</view>
							<view class="input acea-row">
								<view class="picEwm" v-if="qrcodeUrlZ">
									<image :src="qrcodeUrlZ"></image>
									<text class='iconfont icon-guanbi1 font-color' @click='DelPicZ'></text>
								</view>
								<view class='pictrue acea-row row-center-wrapper row-column' @click='uploadpic("Z")' v-else>
								  <text class='iconfont icon-icon25201'></text>
								  <view>上传图片</view>
								</view>
							</view>
						</view>
						<view class='tip' v-if="extractSource==='brokerage'">
							当前可提现金额: <text class="price">￥{{commission.commissionCount}},</text>冻结佣金：￥{{commission.brokenCommission}}
						</view>
						<view class='tip' v-else>
							当前可提现余额: <text class="price">￥{{commission.commissionCount}}</text>
						</view>
						<view class='tip' v-if="Number(calcFee) > 0">
							手续费：<text class="price">￥{{calcFee}}</text>
							<text v-if="extractFeeType==='percent'">（{{extractFee}}%）</text>
							，预计实到：<text class="price">￥{{arrivePrice}}</text>
						</view>
						<view class='tip' v-if="extractSource==='brokerage'">
							说明: 每笔佣金的冻结期为{{commission.brokenDay}}天，到期后可提现；提现金额需大于手续费<span v-if="Number(extractMultiple)>0">；须为{{extractMultiple}}的倍数</span>
						</view>
						<view class='tip' v-else>
							说明: 提现金额需大于手续费；审核通过后线下到账<span v-if="Number(extractMultiple)>0">；须为{{extractMultiple}}的倍数</span>
						</view>
						<button formType="submit" class='bnt bg-color' :disabled="extractSwitch!=='1'">提现</button>
					</form>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		extractCash,
		extractBank,
		extractUser
	} from '@/api/user.js';
	import {
		toLogin
	} from '@/libs/login.js';
	import {
		mapGetters
	} from "vuex";
	import {Debounce} from '@/utils/validate.js'
	let app = getApp();
	export default {
		data() {
			return {
				navList: [{
						'name': '银行卡',
						'icon': 'icon-yinhangqia'
					},
					{
						'name': '微信',
						'icon': 'icon-weixin2'
					},
					{
						'name': '支付宝',
						'icon': 'icon-zhifubao'
					},
				],
				currentTab: 0,
				index: 0,
				array: [],
				minPrice: 0.00,
				extractFee: 0,
				extractFeeType: 'fixed',
				extractSwitch: '1',
				extractMultiple: 0,
				extractSource: 'brokerage',
				inputMoney: '',
				userInfo: [],
				commission:{},
				qrcodeUrlW:"",
				qrcodeUrlZ:"",
				isCommitted: false,
				theme:app.globalData.theme,
			};
		},
		computed: {
			...mapGetters(['isLogin']),
			calcFee() {
				const money = parseFloat(this.inputMoney) || 0;
				const feeVal = parseFloat(this.extractFee) || 0;
				if (this.extractFeeType === 'percent') {
					return (money * feeVal / 100).toFixed(2);
				}
				return feeVal.toFixed(2);
			},
			arrivePrice() {
				const money = parseFloat(this.inputMoney) || 0;
				const fee = parseFloat(this.calcFee) || 0;
				const arrive = money - fee;
				return arrive > 0 ? arrive.toFixed(2) : '0.00';
			}
		},
		watch:{
			isLogin:{
				handler:function(newV){
					if(newV){
						this.getUserExtractBank();
						this.getExtractUser();
					}
				},
				deep:true
			}
		},
		onLoad(options) {
			if (options && options.source === 'balance') {
				this.extractSource = 'balance';
			}
			if (this.isLogin) {
				this.getUserExtractBank();
				this.getExtractUser();
			} else {
				toLogin();
			}
		},
		methods: {
			switchSource(source) {
				if (this.extractSource === source) return;
				this.extractSource = source;
				this.inputMoney = '';
				this.getExtractUser();
			},
			onMoneyInput(e) {
				const val = e.detail.value;
				this.inputMoney = (val && val.match(/^\d*(\.?\d{0,2})/g) && val.match(/^\d*(\.?\d{0,2})/g)[0]) || '';
			},
			uploadpic: function (type) {
			  let that = this;
			  that.$util.uploadImageOne({
			  	url: 'upload/image',
			  	name: 'multipart',
			  	model: "user",
			  	pid: 1
			  }, function(res) {
			  	 if(type==='W'){
			  			that.qrcodeUrlW = res.data.url;
			  	 }else{
			  			that.qrcodeUrlZ = res.data.url;
			  	 }
			  });
			},
			DelPicW: function () {
			  this.qrcodeUrlW = "";
			},
			DelPicZ: function () {
			  this.qrcodeUrlZ = "";
			},
			getExtractUser(){
				extractUser(this.extractSource).then(res=>{
					this.commission = res.data;
					this.minPrice = res.data.minPrice;
					this.extractFee = res.data.extractFee || 0;
					this.extractFeeType = res.data.extractFeeType || 'fixed';
					this.extractSwitch = res.data.extractSwitch || '1';
					this.extractMultiple = res.data.extractMultiple || 0;
				})
			},
			getUserExtractBank: function() {
				let that = this;
				extractBank().then(res => {
					let array = res.data;
					array.unshift("请选择银行");
					that.$set(that, 'array', array);
				});
			},
			swichNav: function(current) {
				this.currentTab = current;
			},
			bindPickerChange: function(e) {
				this.index = e.detail.value;
			},
			subCash: Debounce(function(e) {
				let that = this,
					value = e.detail.value;
					if (that.extractSwitch !== '1') {
						return this.$util.Tips({ title: '当前提现未开启' });
					}
					if (that.currentTab == 0) {
						if (value.name.length == 0) return this.$util.Tips({
							title: '请填写持卡人姓名'
						});
						if (value.cardum.length == 0) return this.$util.Tips({
							title: '请填写卡号'
						});
						if (that.index == 0) return this.$util.Tips({
							title: "请选择银行"
						});
						value.extractType = 'bank';
						value.bankName = that.array[that.index];
					} else if (that.currentTab == 1) {
						value.extractType = 'weixin';
						if (value.name.length == 0) return this.$util.Tips({
							title: '请填写微信号'
						});
						value.wechat = value.name;
						value.qrcodeUrl = that.qrcodeUrlW;
					} else if (that.currentTab == 2) {
						value.extractType = 'alipay';
						if (!value.name || value.name.length == 0) return this.$util.Tips({
							title: '请填写真实姓名'
						});
						if (!value.alipayCode || value.alipayCode.length == 0) return this.$util.Tips({
							title: '请填写支付宝账号'
						});
						value.qrcodeUrl = that.qrcodeUrlZ;
					}
					value.extractSource = that.extractSource;
					if (value.money.length == 0) return this.$util.Tips({
						title: '请填写提现金额'
					});
					if (!(/^(\d?)+(\.\d{0,2})?$/.test(value.money))) return this.$util.Tips({
						title: '提现金额保留2位小数'
					});
					if (Number(value.money) < Number(that.minPrice)) return this.$util.Tips({
						title: '提现金额不能低于' + that.minPrice
					});
					const multiple = Number(that.extractMultiple) || 0;
					if (multiple > 0) {
						const moneyNum = Number(value.money);
						const rem = Math.round((moneyNum * 100) % (multiple * 100));
						if (rem !== 0) {
							return this.$util.Tips({
								title: '提现金额必须是' + multiple + '的倍数'
							});
						}
					}
					if (Number(value.money) <= Number(that.calcFee || 0)) return this.$util.Tips({
						title: '提现金额必须大于手续费' + that.calcFee
					});
					if(this.isCommitted==false){
						  this.isCommitted=true;
					extractCash(value).then(res => {
						return this.$util.Tips({
							title: "提现成功",
							icon: 'success'
						},{ tab: 2, url: that.extractSource === 'balance' ? '/pages/users/user_money/index' : '/pages/promoter/user_spread_user/index' });
						this.isCommitted=false;
					}).catch(err => {
						 this.isCommitted=false;
						return this.$util.Tips({
							title: err
						});
					});
				}
			})
		}
	}
</script>

<style lang="scss">
	page {
		background-color: #f5f5f5 !important;
	}

	.cash-withdrawal .source-nav {
		background: #fff;
		padding: 20rpx 30rpx 0;
	}
	.cash-withdrawal .source-item {
		flex: 1;
		text-align: center;
		padding: 18rpx 0;
		font-size: 28rpx;
		color: #666;
		border-bottom: 4rpx solid transparent;
	}
	.cash-withdrawal .source-item.on {
		color: var(--view-theme);
		font-weight: 600;
		border-bottom-color: var(--view-theme);
	}
	.cash-withdrawal .disable-tip {
		color: #e93323;
		padding: 20rpx 30rpx 0;
	}

	.cash-withdrawal .nav {
		background-color: #fff;
		height: 130rpx;
		width: 100%;
		line-height: 130rpx;
	}

	.cash-withdrawal .nav .item {
		flex: 1;
		text-align: center;
		font-size: 28rpx;
		color: #282828;
		position: relative;
	}

	.cash-withdrawal .nav .item~.item {
		border-left: 1px solid #f0f0f0;
	}

	.cash-withdrawal .nav .item .iconfont {
		font-size: 40rpx;
		margin-right: 10rpx;
		position: relative;
		top: 6rpx;
	}

	.cash-withdrawal .nav .item .iconfont.on {
		color: var(--view-theme) !important;
	}

	.cash-withdrawal .nav .item .line {
		position: absolute;
		width: 120rpx;
		height: 4rpx;
		background-color: transparent;
		left: 50%;
		margin-left: -60rpx;
		bottom: 0;
	}

	.cash-withdrawal .nav .item .line.on {
		background-color: var(--view-theme) !important;
	}

	.cash-withdrawal .wrapper .list {
		background-color: #fff;
		margin-top: 15rpx;
		padding: 0 30rpx;
	}

	.cash-withdrawal .wrapper .list .item {
		border-bottom: 1px solid #eee;
		min-height: 100rpx;
		font-size: 30rpx;
		color: #333;
	}

	.cash-withdrawal .wrapper .list .item .name {
		width: 130rpx;
	}

	.cash-withdrawal .wrapper .list .item .input {
		flex: 1;
		text-align: right;
	}

	.cash-withdrawal .wrapper .list .item .input .placeholder {
		color: #bbb;
	}

	.cash-withdrawal .wrapper .list .item .picEwm,.cash-withdrawal .wrapper .list .item .pictrue{
		width: 140rpx;
		height: 140rpx;
		margin: 20rpx 0 20rpx auto;
		position: relative;
	}
	.cash-withdrawal .wrapper .list .item .picEwm image{
		width: 100%;
		height: 100%;
		border-radius: 6rpx;
	}
	.cash-withdrawal .wrapper .list .item .picEwm .icon-guanbi1{
		position: absolute;
		right: -10rpx;
		top: -10rpx;
		font-size: 32rpx;
	}
	.cash-withdrawal .wrapper .list .item .pictrue{
		border: 1px dashed #ddd;
		font-size: 22rpx;
		color: #bbb;
	}
	.cash-withdrawal .wrapper .list .item .pictrue .icon-icon25201{
		font-size: 40rpx;
		margin-bottom: 8rpx;
	}

	.cash-withdrawal .wrapper .list .tip {
		font-size: 24rpx;
		color: #999;
		margin-top: 20rpx;
		line-height: 1.6;
	}

	.cash-withdrawal .wrapper .list .bnt {
		font-size: 32rpx;
		color: #fff;
		width: 690rpx;
		height: 86rpx;
		border-radius: 43rpx;
		text-align: center;
		line-height: 86rpx;
		margin: 50rpx auto;
	}

	.cash-withdrawal .wrapper .list .tip2 {
		font-size: 24rpx;
		color: #999;
	}

	.cash-withdrawal .wrapper .list .value {
		width: 100%;
	}

	.cash-withdrawal .wrapper .list .value input {
		text-align: left !important;
	}

	.cash-withdrawal .wrapper .list .value .placeholder2 {
		color: #bbb;
	}
	.price {
		color: #e93323;
	}
</style>
