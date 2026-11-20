/**
 * 抢购助手 · 通用平台适配层
 *
 * 设计原则：
 *   1. 只使用官方 App 的 URL Scheme / 通用链接（Universal Link），不逆向任何私有接口
 *   2. 每个平台描述「怎么打开商品」「买前要准备什么」「下单点哪里」
 *   3. 新增平台 = 在 PLATFORMS 里加一条配置，不需要改页面逻辑
 *
 * 数据来源：各平台官方开放的 scheme，以及 App Store 通用链接格式。
 * 这些 scheme 会随 App 更新变化，失效时只需改这里一行。
 */
window.PLATFORMS = {
  douyin: {
    key: 'douyin',
    name: '抖音',
    icon: '🎵',
    color: '#ff2d55',
    // 抖音商品/团购券：短链会由 App 接管，直接打开 https 短链即可唤起
    // 备选：snssdk1128://webview?url=<encodeURIComponent(长链)>
    scheme: 'snssdk1128://',
    webviewScheme: (url) => 'snssdk1128://webview?url=' + encodeURIComponent(url),
    accept: /v\.douyin\.com|douyin\.com|iesdouyin|life\.scsjsd|snssdk1128/i,
    extractId: (url) => {
      const m = url.match(/activity_id=(\d+)/) || url.match(/[?&]id=(\d+)/);
      return m ? m[1] : '';
    },
    // 抢购前必须做的准备（显示在卡片提示里）
    prep: [
      '抖音已登录，且已绑定手机号',
      '支付方式已开通（抖音支付/支付宝），免密额度已设置',
      '提前 10 分钟点一次「立即打开」，让页面缓存好',
      '直播间券在购物袋里，不是商品详情页'
    ],
    steps: [
      '进入直播间 → 右下角「购物袋」',
      '找到对应券 → 点「立即购买」',
      '确认订单 → 提交（不要停留选规格）'
    ]
  },

  meituan: {
    key: 'meituan',
    name: '美团',
    icon: '🟡',
    color: '#ffc300',
    scheme: 'imeituan://',
    webviewScheme: (url) => 'imeituan://www.meituan.com/web?url=' + encodeURIComponent(url),
    accept: /meituan\.com|dianping\.com/i,
    extractId: (url) => {
      const m = url.match(/(?:deal|shop)id=(\d+)/i);
      return m ? m[1] : '';
    },
    prep: ['美团已登录', '美团支付免密已开启', '提前打开一次商品页'],
    steps: ['进入商品页', '点「抢购」/「立即购买」', '提交订单']
  },

  dianping: {
    key: 'dianping',
    name: '大众点评',
    icon: '🟠',
    color: '#ff6633',
    scheme: 'dianping://',
    accept: /dianping\.com/i,
    extractId: (url) => '',
    prep: ['点评已登录', '绑定美团账号', '提前打开商品页'],
    steps: ['进入团购页', '点「立即抢购」', '提交订单']
  },

  taobao: {
    key: 'taobao',
    name: '淘宝/天猫',
    icon: '🟧',
    color: '#ff5000',
    scheme: 'taobao://',
    accept: /taobao\.com|tb\.cn|tmall\.com/i,
    extractId: (url) => {
      const m = url.match(/[?&]id=(\d+)/);
      return m ? m[1] : '';
    },
    prep: ['淘宝已登录', '已开通免密支付', '收货地址已设为默认', '提前加入购物车'],
    steps: ['活动开始 → 购物车/详情页', '点「立即购买」', '提交订单（地址已默认，直接提交）']
  },

  jd: {
    key: 'jd',
    name: '京东',
    icon: '🔴',
    color: '#e1251b',
    scheme: 'openapp.jdmobile://',
    accept: /jd\.com|jd\.hk|3\.cn/i,
    extractId: (url) => {
      const m = url.match(/(?:sku|wareId)=(\d+)/i);
      return m ? m[1] : '';
    },
    prep: ['京东已登录', '白条/免密已开通', '地址默认', '提前预约'],
    steps: ['到点进入详情页', '点「立即抢购」', '提交订单']
  },

  pdd: {
    key: 'pdd',
    name: '拼多多',
    icon: '🔺',
    color: '#e02e24',
    scheme: 'pinduoduo://',
    accept: /yangkeduo\.com|pinduoduo\.com/i,
    extractId: (url) => {
      const m = url.match(/goods_id=(\d+)/i);
      return m ? m[1] : '';
    },
    prep: ['拼多多已登录', '微信免密已开', '地址默认'],
    steps: ['进入商品页', '点「发起拼单」', '提交订单']
  },

  xiaohongshu: {
    key: 'xiaohongshu',
    name: '小红书',
    icon: '📕',
    color: '#ff2442',
    scheme: 'xhsdiscover://',
    accept: /xiaohongshu\.com|xhslink\.com/i,
    extractId: (url) => '',
    prep: ['小红书已登录', '支付方式已绑'],
    steps: ['进入商品/直播', '点「立即购买」', '提交']
  },

  other: {
    key: 'other',
    name: '其他',
    icon: '🔗',
    color: '#3d8bff',
    scheme: '',
    accept: /.*/,
    extractId: () => '',
    prep: ['确认已登录', '确认支付方式可用'],
    steps: ['打开链接', '找到购买按钮', '提交订单']
  }
};

// 按顺序匹配，避免 other 抢先
window.PLATFORM_ORDER = ['douyin','meituan','dianping','taobao','jd','pdd','xiaohongshu','other'];

/** 识别 URL 属于哪个平台 */
window.detectPlatform = function (url) {
  if (!url) return 'other';
  for (const k of window.PLATFORM_ORDER) {
    if (k === 'other') continue;
    if (window.PLATFORMS[k].accept.test(url)) return k;
  }
  return 'other';
};

/** 解析出平台 + 活动 ID */
window.parseLink = function (url) {
  const plat = window.detectPlatform(url);
  const p = window.PLATFORMS[plat];
  return { plat, actId: p.extractId(url) };
};
