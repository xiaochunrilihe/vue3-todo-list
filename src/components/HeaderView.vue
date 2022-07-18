<template>
  <el-card :body-style="{ padding: '5px' }">
    <div class="card-header">
      <el-alert
        center
        :closable="false"
        effect="dark"
        :title="dateTitle"
        type="error"
      >
        <!-- href="https://github.com/xiaochunrilihe/vue3-todo-list" -->
        <el-link :underline="false" href="" @click="() => lightBtn()">
          <svg viewBox="0 0 16 16" color="#fff">
            <path
              fill-rule="evenodd"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59c.4.07.55-.17.55-.38c0-.19-.01-.82-.01-1.49c-2.01.37-2.53-.49-2.69-.94c-.09-.23-.48-.94-.82-1.13c-.28-.15-.68-.52-.01-.53c.63-.01 1.08.58 1.23.82c.72 1.21 1.87.87 2.33.66c.07-.52.28-.87.51-1.07c-1.78-.2-3.64-.89-3.64-3.95c0-.87.31-1.59.82-2.15c-.08-.2-.36-1.02.08-2.12c0 0 .67-.21 2.2.82c.64-.18 1.32-.27 2-.27c.68 0 1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82c.44 1.1.16 1.92.08 2.12c.51.56.82 1.27.82 2.15c0 3.07-1.87 3.75-3.65 3.95c.29.25.54.73.54 1.48c0 1.07-.01 1.93-.01 2.2c0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
              fill="currentColor"
            />
          </svg>
        </el-link>
      </el-alert>
      <el-input
        v-model="todo"
        :disabled="$store.getters['todos/todosLen'] >= 10"
        maxlength="20"
        placeholder="做点什么呢?"
        @keydown.enter="updateTodo(todo)"
        style="margin-bottom: 10px"
      >
        <template #prepend>
          <el-time-picker
            v-model="pickTime"
            placeholder="开始时间"
            format="HH:mm"
            style="width: 100px; !important"
          />
        </template>
        <template #append>
          <el-button @click="() => updateTodo(todo)" size="small"
            >新增</el-button
          >
        </template>
      </el-input>
      <el-progress
        :text-inside="true"
        :stroke-width="20"
        :percentage="$store.getters['todos/completePercent']"
        :color="customColors"
      >
        <span
          >已完成 {{ $store.getters['todos/doneTodosLen'] }} /
          {{ $store.getters['todos/todosLen'] }}</span
        >
      </el-progress>
    </div>
  </el-card>
  <!-- 注意音频文件路径 -->
  <audio
    id="noticeTag"
    src="./assets/newTaskPleaseHandle.mp3"
    preload="auto"
    type="audio/mpeg"
  ></audio>
</template>

<script>
import { onBeforeMount, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { Plus } from '@element-plus/icons-vue';
import { useDark, useToggle } from '@vueuse/core';
import utilData from '../api/utils';
import { ElMessage } from 'element-plus';

export default {
  name: 'HeaderView',
  props: {},
  setup() {
    const store = useStore();
    // 输入框变量
    const todo = ref('');
    // 标题
    const dateTitle = ref('');
    // 进度条颜色
    const customColors = utilData.CUSTOMCOLORS;
    // 时间选择器
    const pickTime = ref(new Date());
    let noticeTag = null;

    // 时间选项器处理
    // TODO: 2022-07-18 根据当前时间确定哪些时间不能选择，考虑使用 vuex getter实现
    const handlerTimerPickerLoseFocus = (e) => {
      console.log('e: ', e);
    };

    // Native.js 变量
    let main = null; //获取activity
    let receiver = null;
    let PendingIntent = null;
    let pendingIntent = null;
    let AlarmManager = null;
    let Context = null;
    let alarmManager = null;
    let System = null;
    let IntentFilter = null;
    let Intent = null;
    let filter = null;
    let taskOrder = 0;

    // 点击添加
    const updateTodo = async (key) => {
      if (store.getters['todos/todosLen'] >= 10) {
        ElMessage.warning('贪多嚼不烂');
        todo.value = '';
        return;
      }
      if (pickTime.value === null || pickTime.value === undefined) {
        ElMessage.warning('忘了设置开始时间？');
        return;
      }
      let todoObj = {
        id: String(new Date().valueOf()),
        name: key,
        startTime: pickTime.value.getTime(),
        status: utilData.TASKSTATUS.CREATED,
      };
      if (Math.abs(todoObj.startTime - todoObj.id) <= 300000) {
        ElMessage.warning('任务时间太短了');
        return;
      }
      if (key.trim() === '') {
        ElMessage.warning('总得写点啥吧');
        return;
      }
      let isRename = await store.dispatch('todos/checkName', key);
      if (isRename) {
        ElMessage.warning('已经有相同的任务了');
        return;
      }
      if (await store.dispatch('todos/checkTimeConflict', todoObj.startTime)) {
        ElMessage.warning('任务时间冲突了');
        return;
      }
      // 更新列表
      if (store.commit({ type: 'todos/addTodo', todoObj })) {
        ElMessage.warning('新建任务失败');
        return;
      }
      ElMessage.closeAll();
      store.commit('todos/saveLocal');
      todo.value = '';
      // 默认向后偏移30分钟
      pickTime.value = new Date(todoObj.startTime + 1800000);
      // TODO: 2022-07-17 是否能将定时器逻辑转移到todo.js中
      // Native.js创建定时器，接收闹钟发出的广播
      let receiver = plus.android.implements(
        'io.dcloud.feature.internal.reflect.BroadcastReceiver',
        {
          onReceive: function (context, intent) {
            // 实现onReceiver回调函数
            plus.android.importClass(intent); // 通过intent实例引入intent类，方便以后的‘.’操作
            if (
              intent.getAction() !== todoObj.id || // 是否为对应的广播消息
              store.state.todos.todos.filter((item) => item.id === todoObj.id)
                .length <= 0 || // 任务是否存在
              store.state.todos.doneTodos.indexOf(todoObj.id) >= 0 // 任务状态是否为已完成
            ) {
              return;
            }
            // 获取提醒次数
            // public int getIntExtra(String name, int defaultValue)
            let timerCnt = intent.getIntExtra(todoObj.id, 0);
            timerCnt++;
            // 提醒次数是否超过 3 次
            if (timerCnt <= utilData.NOTIFYFREQ) {
              let options = { cover: false };
              plus.push.createMessage(
                utilData.str2Time(todoObj.startTime) + ' ' + todoObj.name,
                'LocalMSG',
                options
              );
              // 震动
              plus.device.vibrate();
              // 播放提示音
              noticeTag.play();
              // 重新设置定时器
              // 设置新的Intent，传递新的提醒次数
              let newIntent = new Intent(todoObj.id);
              newIntent.putExtra(todoObj.id, timerCnt);
              pendingIntent = PendingIntent.getBroadcast(
                main,
                taskOrder,
                newIntent,
                PendingIntent.FLAG_UPDATE_CURRENT
              );
              // 60000 * (4 - timerCnt) 表示距离开始时间第 3 和第 2 分钟提醒
              alarmManager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                todoObj.startTime - 60000 * (4 - timerCnt),
                pendingIntent
              );
            } else {
              // 如果该任务状态仍然为 创建，则重置为 未完成
              for (let i = 0; i < store.state.todos.todos.length; i++) {
                if (
                  store.state.todos.todos[i].id === todoObj.id &&
                  store.state.todos.todos[i].status ===
                    utilData.TASKSTATUS.CREATED
                ) {
                  store.state.todos.todos[i].status =
                    utilData.TASKSTATUS.UNDONE;
                  break;
                }
              }
            }
          },
        }
      );
      // 重复变量
      alarmManager = main.getSystemService(Context.ALARM_SERVICE);
      filter = new IntentFilter();
      filter.addAction(todoObj.id);
      main.registerReceiver(receiver, filter); // 注册监听
      // public Intent putExtra (String name, int value)
      let newIntent = new Intent(todoObj.id);
      newIntent.putExtra(todoObj.id, 0);
      pendingIntent = PendingIntent.getBroadcast(
        main,
        taskOrder,
        newIntent,
        PendingIntent.FLAG_UPDATE_CURRENT
      );
      // 第1次定时，默认提前5分钟
      alarmManager.setExactAndAllowWhileIdle(
        AlarmManager.RTC_WAKEUP,
        todoObj.startTime - 300000,
        pendingIntent
      );
      taskOrder++;
    };

    // 开关灯
    const lightBtn = () => {
      const isDark = useDark();
      const toggleDark = useToggle(isDark);
      toggleDark();
    };
    // DOM挂载前
    onBeforeMount(() => {
      // 设定日期标题
      let date = new Date();
      let year = date.getFullYear();
      let month = date.getMonth();
      let day = date.getDate();
      dateTitle.value =
        month +
        1 +
        '月' +
        date.getDate() +
        '日 ' +
        utilData.WEEKCHINESE[date.getDay()];
      // 自动开启暗黑模式，夏季7月和8月为20:00, 其他时间为19:00
      let setTimeStr = year + '-' + (month + 1) + '-' + day;
      if (month === 6 || month === 7) {
        setTimeStr += ' 20:00:00';
      } else {
        setTimeStr += ' 19:00:00';
      }
      let setTime = new Date(setTimeStr);
      let darkTimer = setTimeout(() => {
        const isDark = useDark();
        if (!isDark) {
          const toggleDark = useToggle(isDark);
          toggleDark();
        }
        clearTimeout(darkTimer);
      }, setTime.getTime() - date.getTime());
    });
    // DOM挂载后
    onMounted(() => {
      // 监听 Native.js plus 是否加载完成
      document.addEventListener(
        'plusready',
        function () {
          // Native.js 变量初始化
          plus.device.setWakelock(true);
          main = plus.android.runtimeMainActivity(); //获取activity
          Intent = plus.android.importClass('android.content.Intent');
          PendingIntent = plus.android.importClass('android.app.PendingIntent');
          AlarmManager = plus.android.importClass('android.app.AlarmManager');
          Context = plus.android.importClass('android.content.Context');
          System = plus.android.importClass('java.lang.System');
          IntentFilter = plus.android.importClass(
            'android.content.IntentFilter'
          );
        },
        false
      );
      // 获取 audio tag
      noticeTag = document.getElementById('noticeTag');
    });

    return {
      Plus,
      todo,
      updateTodo,
      lightBtn,
      dateTitle,
      customColors,
      pickTime,
      noticeTag,
      main,
      receiver,
      PendingIntent,
      pendingIntent,
      AlarmManager,
      Context,
      alarmManager,
      System,
      IntentFilter,
      Intent,
      filter,
      taskOrder,
      // disabledHours,
      // disabledMinutes,
      handlerTimerPickerLoseFocus,
    };
  },
};
</script>

<style scoped>
.el-card {
  margin: 10px 0;
}

.el-alert {
  margin-bottom: 10px;
}

:deep(.el-alert .el-alert__content) {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.el-alert .el-alert__content .el-alert__title) {
  font-size: 18px;
  margin-left: 50%;
  transform: translateX(-50%);
}

:deep(.el-alert .el-alert__content .el-alert__description) {
  margin: 0 -10px 0 auto;
  padding: 0;
}

.el-alert .el-alert__content svg {
  width: 2em;
  height: 2em;
  vertical-align: bottom;
}

.card-header {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* align-items: center; */
}

:deep(.el-input-group__prepend, .el-input-group__append, .el-input__wrapper) {
  padding: 0px 1px 0px 0px;
}

:deep(.el-time-panel, .el-time-panel__btn, .el-time-panel__btn.confirm) {
  color: black;
}
</style>
