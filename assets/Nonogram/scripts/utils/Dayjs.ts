import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import duration from 'dayjs/plugin/duration.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';
// import 'dayjs/locale/zh-cn.js';

// 扩展必要插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(isoWeek);
// dayjs.locale('zh-cn');

// 设置默认时区（可选）
dayjs.tz.setDefault('Asia/Shanghai');

// 导出预配置的 dayjs 实例
export { dayjs };
