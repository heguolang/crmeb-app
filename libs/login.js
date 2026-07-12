// +----------------------------------------------------------------------
// | CRMEB [ CRMEB赋能开发者，助力企业发展 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2016~2025 https://www.crmeb.com All rights reserved.
// +----------------------------------------------------------------------
// | Licensed CRMEB并不是自由软件，未经许可不能去掉CRMEB相关版权
// +----------------------------------------------------------------------
// | Author: CRMEB Team <admin@crmeb.com>
// +----------------------------------------------------------------------

import store from "../store";
import Cache from '../utils/cache';
import { Debounce } from '@/utils/validate.js'
// #ifdef H5 || APP-PLUS
import { isWeixin } from "../utils";
import auth from './wechat';
// #endif


import { LOGIN_STATUS, USER_INFO, EXPIRES_TIME, STATE_R_KEY, BACK_URL} from './../config/cache';

const TAB_PAGES = [
	'/pages/index/index',
	'/pages/goods_cate/goods_cate',
	'/pages/order_addcart/order_addcart',
	'/pages/user/index'
];

const LOGIN_PAGES = [
	'/pages/users/login/index',
	'/pages/users/wechat_login/index',
	'/pages/users/app_login/index'
];

function prePage(){
	let pages = getCurrentPages();
	let page = pages[pages.length - 1];
	if (!page) return '';
	// #ifdef APP-PLUS
	if (page.$page && page.$page.fullPath) {
		return page.$page.fullPath;
	}
	// #endif
	let route = page.route || page.__route__ || '';
	if (route && route.indexOf('/') !== 0) {
		route = '/' + route;
	}
	return route;
}

/**
 * 规范化登录回跳地址
 */
export function resolveLoginBackUrl(backUrl) {
	let url = backUrl;
	if (!url || url === 'undefined' || url === 'null' || typeof url !== 'string') {
		url = '/pages/index/index';
	}
	if (url.indexOf('http') === 0) {
		url = '/pages/index/index';
	}
	if (url.indexOf('/') !== 0) {
		url = '/' + url;
	}
	const pathOnly = url.split('?')[0];
	if (LOGIN_PAGES.indexOf(pathOnly) !== -1) {
		url = '/pages/index/index';
	}
	const finalPath = url.split('?')[0];
	if (TAB_PAGES.indexOf(finalPath) !== -1) {
		return finalPath;
	}
	return url;
}

/**
 * 登录/注册成功后跳转
 */
export function toLoginBack(backUrl) {
	const url = resolveLoginBackUrl(backUrl || Cache.get(BACK_URL));
	Cache.clear(BACK_URL);
	const pathOnly = url.split('?')[0];
	if (TAB_PAGES.indexOf(pathOnly) !== -1) {
		uni.switchTab({
			url: pathOnly,
			fail: () => {
				uni.reLaunch({ url: '/pages/index/index' });
			}
		});
		return;
	}
	uni.reLaunch({
		url: url,
		fail: () => {
			uni.switchTab({ url: '/pages/index/index' });
		}
	});
}

export const toLogin = Debounce(_toLogin,800)

export function _toLogin(push, pathLogin) {
	// 公众号登录方式(单选),1微信授权，2手机号登录/
	let publicLoginType = getApp().globalData.publicLoginType;
	
	store.commit("LOGOUT");
	let path = prePage();
	let login_back_url = Cache.get(BACK_URL);
	// #ifdef H5
	path = location.pathname + location.search;
	// #endif
	if (!pathLogin) {
		pathLogin = '/pages/users/login/index'
	}
	const pathOnly = (path || '').split('?')[0];
	if (path && path !== pathLogin && LOGIN_PAGES.indexOf(pathOnly) === -1) {
		Cache.set(BACK_URL, path);
	}
		
	// #ifdef H5
	if (isWeixin() && publicLoginType ==1) {
		let urlData = location.pathname + location.search
		if (urlData.indexOf('?') !== -1) {
			urlData += '&go_longin=1';
		} else {
			urlData += '?go_longin=1';
		}
		if (!Cache.has('snsapiKey')) {
			auth.oAuth('snsapi_base', urlData);
		} else {
			if (['/pages/user/index'].indexOf(login_back_url) == -1) {
				uni.navigateTo({
					url: '/pages/users/wechat_login/index'
				})
			}
		}
	} else {
		if (['/pages/user/index'].indexOf(login_back_url) == -1) {
			uni.navigateTo({
				url: '/pages/users/login/index'
			})
		}
	}
	// #endif
	
	if (['pages/user/index','/pages/user/index'].indexOf(login_back_url) == -1) {
		// #ifdef MP
		uni.navigateTo({
			 url: '/pages/users/wechat_login/index'
		})
		// #endif
		// #ifdef APP-PLUS
			uni.showModal({
			    title: '登录提示',
			    content: '登录以后可体验商城完整功能',
				cancelColor: '#000000',
				confirmColor: '#526BB1',
			    success: function (res) {
			        if (res.confirm) {
			           uni.navigateTo({
			           	url: '/pages/users/login/index'
			           })
			        } else if (res.cancel) {
			            // console.log('用户点击取消');
			        }
			    }
			});
		// #endif
	}
}


export function checkLogin()
{
	let token = Cache.get(LOGIN_STATUS);
	let expiresTime = Cache.get(EXPIRES_TIME);
	let newTime = Math.round(new Date() / 1000);
	if (expiresTime < newTime || !token){
		Cache.clear(LOGIN_STATUS);
		Cache.clear(EXPIRES_TIME);
		Cache.clear(USER_INFO);
		Cache.clear(STATE_R_KEY);
		return false;
	}else{
		store.commit('UPDATE_LOGIN',token);
		let userInfo = Cache.get(USER_INFO,true);
		if(userInfo){
			store.commit('UPDATE_USERINFO',userInfo);
		}
		return true;
	}

}
