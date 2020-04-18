// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import { imServerStore } from './store/imServerStore.js';
// axios
import http from '@/common/http.js';
Vue.prototype.$http = http;
// ak
import ak from '@/common/ak.js';
Vue.prototype.$ak = ak;
// element-ui
// font-awesome
import 'font-awesome/css/font-awesome.min.css'

// config

/* eslint-disable no-new */
