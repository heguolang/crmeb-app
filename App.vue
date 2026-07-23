<script>
	import {
		checkLogin,
		toLogin,
		isLoginPage,
		goLoginPage
	} from "./libs/login";
	import {
		HTTP_REQUEST_URL
	} from './config/app';
	import Auth from './libs/wechat.js';
	import Routine from './libs/routine.js';
	import Apps from './libs/apps.js';
	import Cache from './utils/cache.js';
	import {
		getTheme,
		loginConfigApi,
		tokenIsExistApi
	} from './api/api.js';
	import {
		mapActions
	} from 'vuex'
	import {
		spread
	} from "@/api/user";
	var statusBarHeight = uni.getSystemInfoSync().statusBarHeight; //手机端头部手机时间位置高度
	// const app = getApp();
	export default {
		globalData: {
			statusBarHeight: statusBarHeight, //手机端头部手机时间位置高度
			spread: 0, //推广人id
			code: 0,
			isLogin: false,
			userInfo: {},
			MyMenus: [],
			windowHeight: 0,
			navHeight: 0,
			navH: 0,
			id: 0, //商品id
			isIframe: false,
			theme: 'theme1', //主题色
			publicLoginType: Cache.get('publicLoginType') ? Cache.get('publicLoginType') : '', //公众号登录方式(单选),1微信授权，2手机号登录
			routinePhoneVerification: '', //小程序手机号校验类型（多选）1微信小程序验证 2短信验证
			companyName: uni.getStorageSync('companyName') ? uni.getStorageSync('companyName') : '欢迎你', //公司名称
			tokenIsExist: false, //登录是否失效 false 失效，true没失效
			mobileLoginLogo: uni.getStorageSync('mobileLoginLogo') || `${Cache.get("imgHost")}crmebimage/perset/staticImg/logo2.png`, //登录页logo
			forceLoginModalShown: false, // 未登录强制弹框是否已展示
			forceLoginReady: false // token/登录配置是否已就绪
		},
		onLaunch: function(option) {
			let that = this;
			//获取登录配置
			const loginConfigReady = this.getLoginConfig();

			//校验token是否有效,true为有效，false为无效
			const tokenReady = tokenIsExistApi().then(res => {
				this.globalData.tokenIsExist = res.data;
				// token 失效但本地仍有登录态时清理
				if (!res.data && that.$store.getters.isLogin) {
					that.$store.commit('LOGOUT');
				}
				return res.data;
			}).catch(() => {
				this.globalData.tokenIsExist = false;
				return false;
			})

			// #ifdef APP-PLUS || H5
			uni.getSystemInfo({
				success: function(res) {
					// 首页没有title获取的整个页面的高度，里面的页面有原生标题要减掉就是视口的高度  
					// 状态栏是动态的可以拿到 标题栏是固定写死的是44px
					let height = res.windowHeight - res.statusBarHeight - 44
					// #ifdef H5 || APP-PLUS
					that.globalData.windowHeight = res.windowHeight + 'px'
					// #endif
				}
			});
			// #endif	
			// #ifdef MP
			const updateManager = uni.getUpdateManager();
			updateManager.onCheckForUpdate(function(res) {
				// 请求完新版本信息的回调
				if (res.hasUpdate) {
					updateManager.onUpdateReady(function(res2) {
						uni.showModal({
							title: '更新提示',
							content: '发现新版本，是否重启应用?',
							cancelColor: '#eeeeee',
							confirmColor: '#FF0000',
							success(res2) {
								if (res2.confirm) {
									// 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
									updateManager.applyUpdate();
								}
							}
						});
					});
				}
			});

			updateManager.onUpdateFailed(function(res) {
				// 新的版本下载失败
				uni.showModal({
					title: '提示',
					content: '检查到有新版本，但下载失败，请检查网络设置',
					success(res) {
						if (res.confirm) {
							// 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
							updateManager.applyUpdate();
						}
					}
				});
			});

			if (HTTP_REQUEST_URL == '') {
				console.error(
					"请配置根目录下的config.js文件中的 'HTTP_REQUEST_URL'\n\n请修改开发者工具中【详情】->【AppID】改为自己的Appid\n\n请前往后台【小程序】->【小程序配置】填写自己的 appId and AppSecret"
				);
				return false;
			}
			//小程序扫码进入场景
			if (option.query.hasOwnProperty('scene')) {
				switch (option.scene) {
					case 1047: //扫描小程序码
					case 1048: //长按图片识别小程序码
					case 1049: //手机相册选取小程序码
					case 1001: //直接进入小程序

					let value = this.$util.getUrlParams(decodeURIComponent(option.query.scene));
					let mapeMpQrCodeValue = this.$util.formatMpQrCodeData(value);
					// that.globalData = mapeMpQrCodeValue;
					that.globalData = Object.assign(that.globalData,mapeMpQrCodeValue);
					that.globalData.spread = mapeMpQrCodeValue.spread ? mapeMpQrCodeValue.spread : '';
                    break;
				}
			}
			if (option.spread) that.globalData.spread = option.spread;
			// #endif
			// 获取导航高度；
			uni.getSystemInfo({
				success: function(res) {
					that.globalData.navHeight = res.statusBarHeight * (750 / res.windowWidth) + 91;
				}
			});
			// #ifdef MP
			let menuButtonInfo = uni.getMenuButtonBoundingClientRect();
			that.globalData.navH = menuButtonInfo.top * 2 + menuButtonInfo.height / 2;
			// #endif

			// #ifdef H5	
			if (option.query.hasOwnProperty('type') && option.query.type == "iframeVisualizing") {
				this.globalData.isIframe = true;
			} else {
				this.globalData.isIframe = false;
			}
			// #endif

			// 任意端：未登录强制弹窗登录/注册
			Promise.all([loginConfigReady, tokenReady]).then(() => {
				that.globalData.forceLoginReady = true;
				that.handleForceLogin(option || {});
			});

			// 主题变色
			getTheme().then(resP => {
				that.globalData.theme = `theme${Number(resP.data.value)}`
				that.$Cache.set('theme', that.globalData.theme);
				// #ifdef H5
				window.document.documentElement.setAttribute('data-theme', that.globalData.theme);
				// #endif
			})
		},
		async mounted() {
			if (this.$store.getters.isLogin && !this.$Cache.get('USER_INFO')) await this.$store.dispatch('USERINFO');
		},
		methods: {
			//获取登录配置
			getLoginConfig() {
				return loginConfigApi().then(res => {
					let data = res.data;
					//公众号登录方式(单选),1微信授权，2手机号登录
					this.globalData.publicLoginType = data.publicLoginType;
					this.$Cache.set('publicLoginType', data.publicLoginType);
					//小程序手机号校验类型（多选）1微信小程序验证 2短信验证
					this.globalData.routinePhoneVerification = data.routinePhoneVerification;
					//公司名称
					this.globalData.companyName = data.siteName || '欢迎你';
					uni.setStorageSync('companyName', data.siteName);
					//登录页logo
					this.globalData.mobileLoginLogo = data.mobileLoginLogo;
					uni.setStorageSync('mobileLoginLogo', data.mobileLoginLogo);
					//版权title
					uni.setNavigationBarTitle({
							title:data.siteName
					});
					return data;
				}).catch(() => {
					return null;
				})
			},
			/**
			 * 当前是否在登录/注册页
			 */
			isCurrentLoginPage() {
				// #ifdef H5
				const href = (location.pathname || '') + (location.hash || '');
				return isLoginPage(href) || isLoginPage(location.pathname);
				// #endif
				// #ifndef H5
				const pages = getCurrentPages();
				const cur = pages[pages.length - 1];
				if (!cur) return false;
				const route = cur.route || '';
				return isLoginPage('/' + route) || isLoginPage(route);
				// #endif
			},
			/**
			 * 任意端：授权回调处理 / 未登录强制弹框登录
			 */
			handleForceLogin(option) {
				if (this.globalData.isIframe) return;

				const query = (option && option.query) || {};

				// #ifdef H5
				// 微信公众号授权回调
				if (Auth.isWeixin()) {
					const onLoginPage = this.isCurrentLoginPage();
					const {
						code
					} = query;
					if (code && code != uni.getStorageSync('snsapiCode') && !onLoginPage) {
						uni.setStorageSync('snsapiCode', code);
						Auth.auth(code)
							.then(res => {
								uni.setStorageSync('snRouter', decodeURIComponent(decodeURIComponent(query.back_url || '')));
								if (res.type === 'register') {
									this.$Cache.set('snsapiKey', res.key);
									uni.navigateTo({
										url: '/pages/users/wechat_login/index'
									});
								}
								if (res.type === 'login') {
									this.$store.commit('LOGIN', {
										token: res.token
									});
									this.$store.commit("SETUID", res.uid);
									const backUrl = query.back_url
										? decodeURIComponent(decodeURIComponent(query.back_url))
										: (uni.getStorageSync('snRouter') || '/pages/index/index');
									location.replace(backUrl);
								}
							})
							.catch(() => {
								this.showForceLoginModal();
							});
						return;
					}

					if (query.back_url && this.$store.getters.isLogin) {
						location.replace(uni.getStorageSync('snRouter') || '/pages/index/index');
						return;
					}

					if (this.$Cache.has('snsapiKey') && !this.$store.getters.isLogin && !this.globalData.tokenIsExist) {
						uni.navigateTo({
							url: '/pages/users/wechat_login/index'
						});
						return;
					}
				}
				// #endif

				// #ifdef MP
				// 小程序：先尝试静默授权，失败再强制弹窗
				if (!this.$store.getters.isLogin && !this.globalData.tokenIsExist) {
					Routine.getCode().then(code => {
						return Routine.authUserInfo(code);
					}).catch(() => {
						uni.hideLoading();
					}).finally(() => {
						this.checkAndForceLogin();
					});
					return;
				}
				// #endif

				this.checkAndForceLogin();
			},
			/**
			 * 检查未登录并强制弹窗
			 */
			checkAndForceLogin() {
				if (this.globalData.isIframe) return;
				if (!this.globalData.forceLoginReady) return;
				if (this.$store.getters.isLogin || this.globalData.tokenIsExist) return;
				if (this.isCurrentLoginPage()) return;
				this.showForceLoginModal();
			},
			/**
			 * 未登录强制弹框（不可取消）
			 */
			showForceLoginModal() {
				if (this.globalData.isIframe) return;
				if (this.globalData.forceLoginModalShown) return;
				if (this.isCurrentLoginPage()) return;
				this.globalData.forceLoginModalShown = true;
				uni.showModal({
					title: '登录提示',
					content: '请先登录或注册后再使用商城功能',
					showCancel: false,
					confirmText: '去登录',
					confirmColor: '#E93323',
					success: (res) => {
						this.globalData.forceLoginModalShown = false;
						if (res.confirm) {
							toLogin();
						} else {
							// 兜底：仍强制进入登录页
							goLoginPage(true);
						}
					},
					fail: () => {
						this.globalData.forceLoginModalShown = false;
						goLoginPage(true);
					}
				});
			}
		},
		onShow: function() {
			// #ifdef H5
			uni.getSystemInfo({
				success(e) {
					/* 窗口宽度大于420px且不在PC页面且不在移动设备时跳转至 PC.html 页面 */
					if (e.windowWidth > 430 && !window.top.isPC && !/iOS|Android/i.test(e.system)) {
						// window.location.pathname = 'https://java.crmeb.net/';
						/* 若你的项目未设置根目录（默认为 / 时），则使用下方代码 */
						window.location.pathname = '/static/html/pc.html';
					}
				}
			})
			// #endif
			// 回到前台 / 切页后仍未登录则再次强制
			this.checkAndForceLogin();
		},
		onHide: function() {}
	}
</script>
<style lang="scss">
	@import url("@/plugin/animate/animate.min.css");
	@import 'static/css/base.css';
	@import 'static/iconfont/iconfont.css';
	@import 'static/css/guildford.css';
	@import 'static/css/style.scss';
	@import 'static/css/unocss.css';
	@import 'static/fonts/font.css';

	/* 条件编译，仅在H5平台生效 */
	// #ifdef H5
	body::-webkit-scrollbar,
	html::-webkit-scrollbar {
		display: none;
	}

	// #endif
	view {
		box-sizing: border-box;
	}

	.bg-color-red {
		background-color: #E93323;
	}

	.syspadding {
		padding-top: var(--status-bar-height);
	}

	.flex {
		display: flex;
	}

	.uni-scroll-view::-webkit-scrollbar {
		/* 隐藏滚动条，但依旧具备可以滚动的功能 */
		display: none
	}

	::-webkit-scrollbar {
		width: 0;
		height: 0;
		color: transparent;
	}
</style>