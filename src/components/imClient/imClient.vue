<!-- im客户端 入口 -->
<template>
    <div class="imClient-wrapper">
        <div class="imClient-inner">
            <div class="imClient-header">
                <div class="name-wrapper position-v-mid">
                    <span >FL@W Nice la</span>
                </div>
                <div class="opr-wrapper position-v-mid">
                    <el-tooltip content="關閉對話" placement="bottom" effect="light">
                        <i class="fa fa-close" @click="closeChat()"></i>
                    </el-tooltip>
                </div>
            </div>
            <div class="imClient-main">
                <!-- 聊天框 -->
                    <common-chat ref="common_chat" :chatInfoEn="chatInfoEn" :oprRoleName="'client'" @sendMsg="sendMsg" @chatCallback="chatCallback"></common-chat>
            </div>
        </div>
    </div>
</template>

<script >
import commonChat from '@/components/common/common_chat.vue';
import imRate from './imRate.vue';
import imLeave from './imLeave.vue';
import imTransfer from './imTransfer.vue';

export default {
    components: {
        commonChat: commonChat,
        imRate: imRate,
        imLeave: imLeave,
        imTransfer: imTransfer
    },
    data() {
        return {
            socket: null,
            chatInfoEn: {
                chatState: 'agent', // chat状态；robot 机器人、agent 客服
                inputContent: '', // 输入框内容
                msgList: [], // 消息列表
                state: 'on', // 连接状态;on ：在线；off：离线
                lastMsgShowTime: null // 最后一个消息的显示时间
            }, // 会话信息，包括聊天记录、状态
            clientChatEn: {
                clientChatId: '', // UserID
                clientChatName: '',// User name
                avatarUrl: 'static/image/im_client_avatar.png' //User ava.
            }, // 当前账号的信息
            serverChatEn: {
                serverChatName: '', 
                avatarUrl: ''
            }, // 服务端chat信息
            robotEn: {
                robotName: '小旺',
                avatarUrl: 'static/image/im_robot_avatar.png'
            },
            faqSelected: '-1',
            inputContent_setTimeout: null, // 输入文字时在输入结束才修改具体内容
            selectionRange: null, // 输入框选中的区域
            shortcutMsgList: [], // 聊天区域的快捷回复列表
        };
    },
    computed: {},
    watch: {},
    methods: {
        /**
         * 注册账号信息
         */
        regClientChatEn: function() {
           
            this.$data.clientChatEn.clientChatId = Number.parseInt(Date.now() + Math.random());
            // 名称格式：姓+6位数字
            var userName = '';
            switch (this.$data.clientChatEn.clientChatId % 5) {
                case 0:
                    userName = '囂張的張';
                    break;
                case 1:
                    userName = '小李飛刀';
                    break;
                case 2:
                    userName = '服部半藏';
                    break;
                case 3:
                    userName = '趙信';
                    break;
                case 4:
                    userName = '孫紅雷';
                    break;
            }
            var tmpId = this.$data.clientChatEn.clientChatId.toString();
            userName += tmpId.substr(tmpId.length - 6, 6);
            this.$data.clientChatEn.clientChatName = userName;

            // 模拟消息
            this.addChatMsg({
                role: 'robot',
                avatarUrl: this.$data.robotEn.avatarUrl,
                contentType: 'transformServer'
            });
        },

        /**
         * 注册socket
         * @param {String} serverChatId 服务端chatId
         */
        regSocket: function() {
            this.$data.socket = require('socket.io-client')('http://localhost:3001');
            this.$data.socket.on('connect', () => {
               
                // 客互一連 加 userdata pass to server
                this.$data.socket.emit('CLIENT_ON', {
                    clientChatEn: this.$data.clientChatEn,
                    serverChatId: 'ieat'
                });
                // 服务端链接
                this.$data.socket.on('SERVER_CONNECTED', (data) => {
                    // 1)获取客服消息
                    this.$data.serverChatEn = data.serverChatEn;
                    // 2)添加消息
                    this.addChatMsg({
                        role: 'sys',
                        contentType: 'text',
                        content:   data.serverChatEn.serverChatName + ' 來啦~'
                    });
                });
                // 接受服务端信息
                this.$data.socket.on('SERVER_SEND_MSG', (data) => {
                    data.msg.avatarUrl = this.$data.serverChatEn.avatarUrl;
                    console.log(data.msg);
                    this.addChatMsg(data.msg, () => {
                        this.$refs.common_chat.goEnd();
                    });
                });
                // 載入歷史信息
                // this.$data.socket.on('SERVER_HISTORY_MSG', (data) => {
                //     console.log(data.msgList);
                //     this.$data.chatInfoEn.msgList = data.msgList;
                // });


                // 离开
                window.addEventListener('beforeunload', () => {
                    this.closeChat();
                });
            });
        },

        /**
         * 结束会话
         */
        closeChat: function() {
            if (this.$data.chatInfoEn.chatState == 'agent') {
                this.$data.socket.emit('CLIENT_OFF', {
                    clientChatEn: this.$data.clientChatEn,
                    serverChatId: 'ieat'
                });
                this.$data.socket.close();
                this.$data.chatInfoEn.state = 'off';
            }
        },

        /**
         * 添加chat对象的msg
         * @param {Object} msg 消息对象；eg：{role:'sys',content:'含有新的消息'}
         * @param {String} msg.role 消息所有者身份；eg：'sys'系统消息；
         * @param {String} msg.contentType 消息类型；text:文本(默认)；image:图片
         * @param {String} msg.content 消息内容
         * @param {Function} successCallback 添加消息后的回调
         */
        addChatMsg: function(msg, successCallback) {
            // 1.设定默认值
            msg.role = msg.role == undefined ? 'sys' : msg.role;
            msg.contentType = msg.contentType == undefined ? 'text' : msg.contentType;
            msg.createTime = msg.createTime == undefined ? new Date() : msg.createTime;

            var msgList = this.$data.chatInfoEn.msgList ? this.$data.chatInfoEn.msgList : [];

            // 2.插入消息
            // 1)插入日期
            // 实际场景中，在消息上方是否显示时间是由后台传递给前台的消息中附加上的，可参考 微信Web版
            // 此处进行手动设置，5分钟之内的消息，只显示一次消息
            msg.createTime = new Date(msg.createTime);
            if (this.$data.chatInfoEn.lastMsgShowTime == null || msg.createTime.getTime() - this.$data.chatInfoEn.lastMsgShowTime.getTime() > 1000 * 60 * 5) {
                msgList.push({
                    role: 'sys',
                    contentType: 'text',
                    content: this.$ak.Utils.getDateTimeStr(msg.createTime, 'Y-m-d H:i:s')
                });
                this.$data.chatInfoEn.lastMsgShowTime = msg.createTime;
            }

            // 2)插入消息
            msgList.push(msg);

            // 3.设置chat对象相关属性
            this.$data.chatInfoEn.msgList = msgList;

            // 4.回调
            successCallback && successCallback();
        },

        /**
         * 发送消息
         * @param {Object} rs 回调对象
         */
        sendMsg: function(rs) {
            var msg = rs.msg;
            msg.role = 'client';
            msg.avatarUrl = this.$data.clientChatEn.avatarUrl;
            if (this.$data.chatInfoEn.chatState == 'robot') {
                // 机器人发送接口
            } else if (this.$data.chatInfoEn.chatState == 'agent') {
                // 客服接口
                this.$data.socket.emit('CLIENT_SEND_MSG', {
                    serverChatId: 'ieat',
                    clientChatEn: this.$data.clientChatEn,
                    msg: msg
                });
            }
            // 2.添加到消息集合李
            var self = this;
            this.addChatMsg(msg, function() {
                self.goEnd();
            });
        },
        /**
         * 聊天记录滚动到底部
         */
        goEnd: function() {
            this.$refs.common_chat.goEnd();
        },

        /**
         * chat回调
         */
        chatCallback: function(rs) {
            if (rs.eventType == 'transformServer') {
                this.transferDialog_show();
            }
        }
    },
    mounted() {
        this.regClientChatEn();
        this.regSocket();
    }
};
</script>

<style lang="less">
@import '../../common/css/base.less';

.imClient-wrapper {
   display:flex;
   flex-direction:column;
   height: 100%;
   width: 100%;
}

.imClient-inner {
    display:flex;
    flex-direction:column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    box-shadow: 0 1px 5px 2px #ccc;
    .imClient-header {
        display:flex;
        justify-content:space-between;
        position: relative;
        height: 5%;
        min-height: 5%;
        box-sizing: border-box;
        background: #1072b5;
        font-size: 16px;
        color: #ffffff;
        .name-wrapper {
            margin-top: 10px;
            margin-left: 10px;
        }
        .opr-wrapper {
            font-size: 16px;
            cursor: pointer;
            margin-right: 10px;
            margin-top: 10px;

        }
    }
    .imClient-main {
        height: 95%;
        & > .item {
            float: left;
            height: 100%;
            border-top-width: 0px;
            border-right-width: 0px;
            box-sizing: border-box;
            &:last-child {
                border-right-width: 1px;
            }
        }
        & > .imClientChat-wrapper {
            display:flex;
            width: 100%;
            border-right: 1px solid #ccc;
        }
    }
}

// 信息区域
.imClientInfo-wrapper {
    width: 100%;
    height: 100%;
    background: #ffffff;
    .imClientInfo-notice-wrapper,
    .imClientInfo-faq-wrapper {
        .imClientInfo-item-header {
            font-weight: bolder;
            font-size: 16px;
            color: #1072b5;
            padding: 10px 15px 0;
        }
    }
    .imClientInfo-notice-wrapper {
        .imClientInfo-notice-main {
            padding: 0 15px;
            & > .link {
                margin: 10px 0;
                font-size: 12px;
                color: #000000;
            }
        }
    }
    .imClientInfo-faq-wrapper {
        height: 380px;
        border-top: 1px solid #ccc;
        .imClientInfo-faq-main {
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            .el-collapse {
                border: 0px;
                .el-collapse-item__header {
                    position: relative;
                    padding: 0px 15px;
                    font-size: 12px;
                    background: transparent;
                    color: #000000;
                    &.is-active {
                        color: #f7455d;
                    }
                    .el-collapse-item__arrow {
                        position: absolute;
                        left: 267px;
                    }
                }
                .el-collapse-item__wrap {
                    background: transparent;
                    .el-collapse-item__content {
                        font-size: 12px;
                        color: #959699;
                        padding: 0px 15px 10px;
                    }
                }
            }
        }
    }
}

// element-UI
.el-dialog {
    width: 500px;
    background: #ffffff;
    color: #000000;
}
</style>
