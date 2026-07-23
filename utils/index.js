// +----------------------------------------------------------------------
// | CRMEB [ CRMEB赋能开发者，助力企业发展 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2016~2025 https://www.crmeb.com All rights reserved.
// +----------------------------------------------------------------------
// | Licensed CRMEB并不是自由软件，未经许可不能去掉CRMEB相关版权
// +----------------------------------------------------------------------
// | Author: CRMEB Team <admin@crmeb.com>
// +----------------------------------------------------------------------

import { spread } from "@/api/user";
import Cache from "@/utils/cache";
import { getCity } from '@/api/api.js';

/**
 * 解析当前可分享的推广人 uid（vuex / 缓存 / 用户信息）
 * @param {Object} vm 页面 this，可选
 * @returns {Number}
 */
export function resolveShareUid(vm) {
	let uid = 0;
	if (vm) {
		uid = parseInt(vm.uid, 10) || 0;
		if (!uid && vm.$store && vm.$store.state && vm.$store.state.app) {
			uid = parseInt(vm.$store.state.app.uid, 10) || 0;
		}
		if (!uid && vm.userInfo && vm.userInfo.uid) {
			uid = parseInt(vm.userInfo.uid, 10) || 0;
		}
		if (!uid && vm.$Cache) {
			uid = parseInt(vm.$Cache.get('UID'), 10) || 0;
		}
	}
	if (!uid) {
		uid = parseInt(Cache.get('UID'), 10) || 0;
	}
	return uid > 0 ? uid : 0;
}

/**
 * 生成带推广人参数的微信分享链接（覆盖已有 spread，避免重复）
 * @param {String|Number} spreadUid 推广人 uid
 * @param {String} href 可选，默认当前页地址
 * @returns {String}
 */
export function buildWechatShareLink(spreadUid, href) {
	// #ifdef H5
	let url = href || (typeof location !== 'undefined' ? location.href : '');
	// #endif
	// #ifndef H5
	let url = href || '';
	// #endif
	const uid = parseInt(spreadUid, 10);
	if (!url || !uid || Number.isNaN(uid) || uid <= 0) {
		return url;
	}
	// 去掉 hash，避免分享链异常
	const hashIndex = url.indexOf('#');
	if (hashIndex !== -1) {
		url = url.slice(0, hashIndex);
	}
	// 去掉已有 spread
	url = url
		.replace(/([?&])spread=[^&]*/g, '$1')
		.replace(/[?&]$/, '')
		.replace(/\?&/, '?')
		.replace(/\?$/, '');
	const joiner = url.indexOf('?') === -1 ? '?' : '&';
	return url + joiner + 'spread=' + uid;
}

/**
 * 静默授权绑定上下级，使用在已经登录后扫描了别人的推广二维码
 * @param {Object} puid
 */
export function silenceBindingSpread() {
	//#ifdef H5
	let puid = Cache.get('spread');
	//#endif 
	//#ifdef MP || APP-PLUS
	let puid = getApp().globalData.spread;
	//#endif

	puid = parseInt(puid);
	if (Number.isNaN(puid)) {
		puid = 0;
	}
	if (puid) {
		spread(puid).then(res => {}).catch(res => {
			//#ifdef H5
			Cache.clear("spread");
			//#endif
			
			//#ifdef MP || APP-PLUS
			getApp().globalData.spread = 0;
			//#endif
		});
	} else {
		Cache.set('spread', 0);
	}
}

export function isWeixin() {
	return navigator.userAgent.toLowerCase().indexOf("micromessenger") !== -1;
}

export function parseQuery() {
	const res = {};

	const query = (location.href.split("?")[1] || "")
		.trim()
		.replace(/^(\?|#|&)/, "");

	if (!query) {
		return res;
	}

	query.split("&").forEach(param => {
		const parts = param.replace(/\+/g, " ").split("=");
		const key = decodeURIComponent(parts.shift());
		const val = parts.length > 0 ? decodeURIComponent(parts.join("=")) : null;

		if (res[key] === undefined) {
			res[key] = val;
		} else if (Array.isArray(res[key])) {
			res[key].push(val);
		} else {
			res[key] = [res[key], val];
		}
	});

	return res;
}

// #ifdef H5
const VUE_APP_WS_URL = process.env.VUE_APP_WS_URL || `ws://${location.hostname}:20001`;
export {
	VUE_APP_WS_URL
}
// #endif

// 获取地址数据
export function getCityList() {
	return new Promise((resolve, reject) => {
		getCity().then(res => {
			resolve(res.data);
			let oneDay = 24 * 3600 * 1000;
			Cache.setItem({
				name: 'cityList',
				value: res.data,
				expires: oneDay * 7
			}); //设置七天过期时间
		})
	});
}

export default parseQuery;
