// +----------------------------------------------------------------------
// | CRMEB [ CRMEB赋能开发者，助力企业发展 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2016~2025 https://www.crmeb.com All rights reserved.
// +----------------------------------------------------------------------
// | Licensed CRMEB并不是自由软件，未经许可不能去掉CRMEB相关版权
// +----------------------------------------------------------------------
// | Author: CRMEB Team <admin@crmeb.com>
// +----------------------------------------------------------------------
//移动端商城API（必须是 crmeb-front 接口域名，不是 H5 页面域名）
//let domain = 'http://127.0.0.1:8081'
// 服务器需把 /api/front 反代到 front(8081)，/api/admin 反代到 admin(8080)
let domain = 'http://47.120.18.0:20410'

module.exports = {
	// 请求域名 格式： https://您的域名
	// #ifdef MP || APP-PLUS
		// HTTP_REQUEST_URL:'',
		HTTP_REQUEST_URL: domain,
		// H5商城页面地址（给用户打开的网址）
		HTTP_H5_URL: 'http://47.120.18.0:20410',
	// #endif
		HTTP_H5_URL: 'http://47.120.18.0:20410',
	// #ifdef H5
		HTTP_REQUEST_URL: domain,
	// #endif
	HEADER:{
		'content-type': 'application/json'
	},
	HEADERPARAMS:{
		'content-type': 'application/x-www-form-urlencoded'
	},
	// 回话密钥名称 请勿修改此配置
	TOKENNAME: 'Authori-zation',
	// 缓存时间 0 永久
	EXPIRE:0,
	//分页最多显示条数
	LIMIT: 10
};
