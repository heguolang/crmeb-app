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

export const LOGIN_PAGES = [
	'/pages/users/login/index',
	'/pages/users/wechat_login/index',
	'/pages/users/app_login/index'
];

/**
 * 是否登录/注册相关页面
 */
export function isLoginPage(url) {
	if (!url || typeof url !== 'string') return false;
	const path = url.split('?')[0];
	const normalized = path.indexOf('/') === 0 ? path : '/' + path;
	return LOGIN_PAGES.indexOf(normalized) !== -1
		|| LOGIN_PAGES.some(p => normalized.indexOf(p) !== -1);
}

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

/**
 * 跳转登录/注册页（强制，不可取消）
 */
export function goLoginPage(reLaunch) {
	const go = reLaunch ? uni.reLaunch : uni.navigateTo;
	const failGo = (url) => {
		uni.reLaunch({
			url,
			fail: () => {
				uni.navigateTo({ url });
			}
		});
	};
	// #ifdef H5
	const publicLoginType = getApp().globalData.publicLoginType;
	if (isWeixin() && publicLoginType == 1) {
		if (Cache.has('snsapiKey')) {
			go({
				url: '/pages/users/wechat_login/index',
				fail: () => failGo('/pages/users/wechat_login/index')
			});
			return;
		}
		let urlData = location.pathname + location.search;
		if (urlData.indexOf('?') !== -1) {
			urlData += '&go_longin=1';
		} else {
			urlData += '?go_longin=1';
		}
		auth.oAuth('snsapi_base', urlData);
		return;
	}
	go({
		url: '/pages/users/login/index',
		fail: () => failGo('/pages/users/login/index')
	});
	// #endif
	// #ifdef MP
	go({
		url: '/pages/users/wechat_login/index',
		fail: () => failGo('/pages/users/wechat_login/index')
	});
	// #endif
	// #ifdef APP-PLUS
	go({
		url: '/pages/users/login/index',
		fail: () => failGo('/pages/users/login/index')
	});
	// #endif
}

export function _toLogin(push, pathLogin) {
	// 公众号登录方式(单选),1微信授权，2手机号登录/
	store.commit("LOGOUT");
	let path = prePage();
	// #ifdef H5
	path = location.pathname + location.search;
	// #endif
	if (!pathLogin) {
		pathLogin = '/pages/users/login/index'
	}
	const pathOnly = (path || '').split('?')[0];
	if (path && path !== pathLogin && !isLoginPage(pathOnly)) {
		Cache.set(BACK_URL, path);
	}
	goLoginPage(false);
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
