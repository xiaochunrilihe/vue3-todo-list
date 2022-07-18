const TASKSTATUS = {
  CREATED: 0,
  UNDONE: 1,
  DONE: 2,
};

const NOTIFYFREQ = 3;

const WEEKCHINESE = [
  '星期天',
  '星期一',
  '星期二',
  '星期三',
  '星期四',
  '星期五',
  '星期六',
];

const str2Time = (str) => {
  let date = new Date(str - '0');
  return date.toTimeString().substring(0, 5);
};

const CUSTOMCOLORS = [
  { color: '#d2d2d2', percentage: 10 },
  { color: '#2687c5', percentage: 20 },
  { color: '#5a3895', percentage: 30 },
  { color: '#8f268d', percentage: 40 },
  { color: '#ed2930', percentage: 50 },
  { color: '#f3783e', percentage: 60 },
  { color: '#fdc336', percentage: 70 },
  { color: '#ffe335', percentage: 80 },
  { color: '#8bc43e', percentage: 90 },
  { color: '#3cb54f', percentage: 100 },
];

export default { TASKSTATUS, NOTIFYFREQ, WEEKCHINESE, str2Time, CUSTOMCOLORS };
