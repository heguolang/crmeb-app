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
	try {
		const base = typeof location !== 'undefined' ? location.origin : undefined;
		const u = new URL(url, base);
		u.searchParams.set('spread', String(uid));
		return u.toString();
	} catch (e) {
		if (/[?&]spread=/.test(url)) {
			return url.replace(/([?&])spread=[^&]*/, `$1spread=${uid}`);
		}
		return url.indexOf('?') === -1 ? `${url}?spread=${uid}` : `${url}&spread=${uid}`;
	}
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
