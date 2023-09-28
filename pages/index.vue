<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col sm="9">
        <v-card>
          <v-card-text class="text-center">
            <div class="d-flex dense">
              <v-btn @click="startTimer">Start</v-btn>
              <v-btn class="ml-2" @click="stopTimer">Stop</v-btn>
              <v-btn class="ml-2" @click="resetTimer">Reset</v-btn>
              <v-btn class="ml-2" @click="startWork">Work</v-btn>
              <v-btn class="ml-2" @click="startShortBreak">Short Break</v-btn>
              <v-btn class="ml-2" @click="startLongBreak">Long Break</v-btn>
              <v-btn class="ml-2" icon @click="settingsDialog = true">
                <v-icon>mdi-cog</v-icon>
              </v-btn>
            </div>
            <div class="mt-5 display-3">{{ minutes.toString().padStart(2, '0') }}:{{ seconds.toString().padStart(2, '0') }}</div>
            <v-textarea class="mt_5" v-model="comment" label="Current Task Comment"></v-textarea>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="settingsDialog" @close="saveSettings">
      <v-card>
        <v-card-title>Settings</v-card-title>
        <v-card-text>
          <v-text-field label="Work Minutes" v-model="workMinutes"></v-text-field>
          <v-text-field label="Short Break" v-model="shortBreak"></v-text-field>
          <v-text-field label="Long Break" v-model="longBreak"></v-text-field>
          <v-text-field label="Notion API Key" v-model="apiKey"></v-text-field>
          <v-text-field label="Notion Database Id" v-model="databaseId"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="settingsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      workMinutes   : localStorage.getItem('workMinutes') || 25,
      shortBreak    : localStorage.getItem('shortBreak') || 5,
      longBreak     : localStorage.getItem('longBreak') || 15,
      apiKey        : localStorage.getItem('apiKey') || '',
      databaseId    : localStorage.getItem('databaseId') || '',
      minutes       : parseInt(localStorage.getItem('workMinutes')) || 25,
      seconds       : 0,
      timer         : null,
      mode          : 'work',                                                // or 'shortBreak' or 'longBreak'
      settingsDialog: false,
      startTime     : null,
      comment       : '',
    };
  },
  methods: {
    startTimer() {
      if (this.timer) clearInterval(this.timer);

      this.playSound();

      this.startTime = new Date(); // 作業開始時間を設定

      this.timer = setInterval(() => {
        if (this.seconds === 0) {
          if (this.minutes === 0) {
            this.playSound();
            clearInterval(this.timer);
            this.switchMode();
          } else {
            this.minutes--;
            this.seconds = 59;
          }
        } else {
          this.seconds--;
        }
      }, 1000);
    },
    stopTimer(){
      if (this.timer) clearInterval(this.timer);
      this.playSound();
      this.notifyNotion('end');
    },
    resetTimer() {
      if (this.timer) clearInterval(this.timer);
      this.minutes = 25;
      this.seconds = 0;
    },
    async notifyNotion(eventType) {
      if (!this.startTime) return false;

      try {
        const endTime = new Date();
        const startTimeISO = this.startTime.toISOString();
        const endTimeISO   = endTime.toISOString();

        axios.post('/api/create-page', {
          pageTitle: this.comment,
          mode     : this.mode,
          parentId : this.databaseId,   // オプション。指定しない場合は .envファイルの NOTION_DATABASE_ID が使用されます。
          apiToken : this.apiKey,
          startTime: startTimeISO,
          endTime  : endTimeISO,

        })
          .then(response => {
            console.log(response.data);
          })
          .catch(error => {
            console.error(error);
          });

      } catch (error) {
        console.error('Error adding to Notion', error);
      }
    },
    playSound() {
      const audio = new Audio('/ice.mp3');
      audio.play();
    },
    startShortBreak() {
      this.notifyNotion('short_break_start');
      this.mode = 'shortBreak';
      this.resetTimer();
      this.minutes = parseInt(localStorage.getItem('shortBreak')) || 5;
      this.startTimer();
    },
    startLongBreak() {
      this.notifyNotion('long_break_start');
      this.mode = 'longBreak';
      this.resetTimer();
      this.minutes = parseInt(localStorage.getItem('longBreak')) || 15;
      this.startTimer();
    },
    startWork() {
      this.notifyNotion('work_start');
      this.mode = 'work';
      this.resetTimer();
      this.minutes = parseInt(localStorage.getItem('workMinutes')) || 25;
      this.startTimer();
    },
    switchMode() {

      if (this.mode === 'work') {
        this.breakCount++;
        if (this.breakCount % 3 === 0) {
          this.startLongBreak();
        } else {
          this.startShortBreak();
        }
      } else {
        this.startWork();
      }
    },
    saveSettings() {
      localStorage.setItem('workMinutes', this.workMinutes);
      localStorage.setItem('shortBreak', this.shortBreak);
      localStorage.setItem('longBreak', this.longBreak);
      localStorage.setItem('apiKey', this.apiKey);
    },
  },
  watch: {
    workMinutes(val) {
      localStorage.setItem('workMinutes', val);
    },
    shortBreak(val) {
      localStorage.setItem('shortBreak', val);
    },
    longBreak(val) {
      localStorage.setItem('longBreak', val);
    },
    apiKey(val) {
      localStorage.setItem('apiKey', val);
    },
    databaseId(val) {
      localStorage.setItem('databaseId', val);
    },
  },
};
</script>
