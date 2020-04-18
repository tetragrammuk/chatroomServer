<!-- 會員資料 -->
<template>
    <div class="imRecord-wrapper">
                <el-form ref="form"  label-width="120px" :rules="rules">
                    <el-form-item label="Line頭相">
                        <el-col :span="10">
                        <img  :src="selectedChatEn.clientChatId" style="width: 5vw;height: 5vw">
                        </el-col>
                    </el-form-item>
                    <el-form-item label="姓名" >
                        <el-col :span="5">
                        <el-button >{{selectedChatEn.clientChatName}}</el-button>
                        </el-col>
                    </el-form-item>
                    <el-form-item label="性別" >
                        <el-col :span="5">
                        <el-button >TBD</el-button>
                        </el-col>
                    </el-form-item>
                    <el-form-item label="Line_User_ID">
                        <el-col :span="15">
                       <el-button >{{selectedChatEn.clientChatId}}</el-button>
                        </el-col>
                    </el-form-item>
                    <!-- 分割線 -->
                    <el-divider></el-divider> 
                    <el-form-item label="電子信箱" prop="row_email">
                        <el-col :span="15">
                        <el-input > TBD </el-input>
                        </el-col>
                    </el-form-item>
                    <el-form-item label="電話號碼" prop="row_phone">
                        <el-col :span="15">
                        <el-input > TBD</el-input>
                        </el-col>
                    </el-form-item>
                    <el-form-item label="最後對話時間" prop="row_jointime">
                        <el-col :span="15">
                        <el-date-picker type="datetime" v-model="selectedChatEn.lastMsgShowTime" style="width: 100%;"></el-date-picker>
                        </el-col>
                    </el-form-item>
                 </el-form>
    <!-- {{selectedChatEn.clientChatId}}
    {{selectedChatEn.clientChatName}}
    {{selectedChatEn.state}}
    
{ "clientChatId": 1584626539845, "clientChatName": "囂張的張539845", "msgList": [ { "role": "sys", "contentType": "text", "content": "22:02" }, { "role": "sys", "contentType": "text", "content": "新客户接入", "createTime": "2020-03-19T14:02:20.007Z" }, { "role": "sys", "contentType": "text", "content": "22:40" }, { "contentType": "text", "content": "12211212", "role": "client", "avatarUrl": "static/image/im_client_avatar.png", "createTime": "2020-03-19T14:40:43.930Z" }, { "contentType": "text", "content": "21212121DSADASSDADSAASD", "role": "client", "avatarUrl": "static/image/im_client_avatar.png", "createTime": "2020-03-19T14:40:51.836Z" }, { "contentType": "text", "content": "123312132", "role": "server", "avatarUrl": "/static/image/im_server_avatar.png", "createTime": "2020-03-19T14:41:10.362Z" }, { "contentType": "text", "content": "132321321132321132", "role": "server", "avatarUrl": "/static/image/im_server_avatar.png", "createTime": "2020-03-19T14:41:15.939Z" }, { "contentType": "text", "content": "DSASDASDASAD", "role": "server", "avatarUrl": "/static/image/im_server_avatar.png", "createTime": "2020-03-19T14:41:20.484Z" } ], "state": "on", "accessTime": "2020-03-19T14:02:19.988Z", "inputContent": "", "newMsgCount": 0, "isFollow": false, "lastMsgTime": "2020-03-19T14:41:20.484Z", "lastMsgShowTime": "2020-03-19T14:40:43.930Z", "lastMsgContent": "DSASDASDASAD" } -->

    </div>
</template>

<script>
export default {
    data() {
        return {};
    },
    computed: {
        selectedChatEn() {
            return this.$store.imServerStore.getters.selectedChatEn;
        },
        storeServerChatEn() {
            return this.$store.imServerStore.getters.serverChatEn;
        }
    },
    watch: {},
    methods: {
        /**
         * 选中当前列表的chat
         * @param {Object} en call实体类
         */
        selectChat: function(en) {
            this.$store.imServerStore.dispatch('selectChat', { clientChatId: en.clientChatId });
            this.$emit('selectedChat', {}); // 事件上传
        },

        /**
         * 设置关注
         */
        toggleFollowIcon: function(en) {
            en.isFollow = !en.isFollow;
            // 排序
            this.$store.imServerStore.commit('sortCurrentChatEnlist', {});
        },

        /**
         * 获取背景class
         * @param {string} clientChatName 姓名
         */
        getBgClass: function(clientChatName) {
            var rs = clientChatName.charCodeAt(0) % 5;
            return 'bg' + rs;
        },

        /**
         * 返回chat对象的最后一次消息时间
         * @param {String|Date} sValue 传入的时间字符串
         */
        getLastMsgTimeStr: function(sValue) {
            if (sValue == null) {
                return '';
            }
            var rs = this.$ak.Utils.getDateTimeStr(sValue, 'H:i:s');
            return rs;
        }
    }
};
</script>

<style lang="less">
.imRecord-wrapper {
    width: 100%;
    height: 550px;
    overflow: hidden;
    border: 0px;
    & > .header {
        display: flex;
        align-items: center;
        height: 50px;
        border-bottom: 1px solid #e6e6e6;
        .kf-info-wrapper {
            position: relative;
            width: 150px;
            height: 50px;
            padding: 0 20px;
            .kf-avatar {
                width: 50px;
                height: 50px;
            }
            .kf-name {
                font-size: 16px;
            }
        }
        .client-info-wrapper {
            p:first-child {
                margin-bottom: 5px;
            }
            .fa {
                margin-right: 10px;
            }
        }
    }
    & > .main {
        height: calc(~'100% - 50px');
        position: relative;
        .item-list {
            height: calc(~'100% - 46px');
            overflow-y: auto;
            .item {
                position: relative;
                height: 63px;
                padding: 0px;
                border-bottom: 1px solid #e6e6e6;
                cursor: pointer;
                &.active,
                &:hover {
                    background-color: #0095ff;
                    .info-wrapper .first-p .name,
                    .info-wrapper .second-p .lastMsgContent,
                    .info-wrapper .first-p .lastMsgTime {
                        color: #eaf4fb;
                    }
                    .iconfont {
                        display: initial !important;
                    }
                }
                .followicon-wrapper {
                    position: relative;
                    float: left;
                    width: 25px;
                    height: 100%;
                    .iconfont {
                        display: none;
                        font-size: 12px;
                        color: #eaf4fb;
                        &.active {
                            display: initial;
                            color: #f9ce1d;
                        }
                    }
                }
                .platicon-wrapper {
                    position: relative;
                    float: left;
                    width: 50px;
                    height: 100%;
                    .header-img {
                        padding: 10px;
                        font-size: 16px;
                        color: #fff;
                        border-radius: 50%;
                        &.bg0 {
                            background-color: #ef7777;
                        }
                        &.bg1 {
                            background-color: #00bcd4;
                        }
                        &.bg2 {
                            background-color: #009688;
                        }
                        &.bg3 {
                            background-color: #ffc107;
                        }
                        &.bg4 {
                            background-color: #ff5722;
                        }
                    }
                }
                .info-wrapper {
                    position: relative;
                    float: left;
                    width: 185px;
                    padding-top: 5px;
                    padding-left: 5px;
                    .first-p {
                        clear: both;
                        padding-top: 11px;
                        .name {
                            display: inline-block;
                            float: left;
                            width: 50%;
                            font-size: 14px;
                            color: #3e3e3e;
                            white-space: nowrap;
                            text-overflow: ellipsis;
                            overflow: hidden;
                            text-align: left;
                            font-weight: bolder;
                        }
                        .lastMsgTime {
                            float: right;
                            font-size: 12px;
                            color: #8d8d8d;
                        }
                    }
                    .second-p {
                        clear: both;
                        padding-top: 5px;
                        line-height: 1.2;
                        .lastMsgContent {
                            display: inline-block;
                            width: 150px;
                            margin-top: 3px;
                            font-size: 12px;
                            color: #8d8d8d;
                            white-space: nowrap;
                            text-overflow: ellipsis;
                            text-align: left;
                            overflow: hidden;
                        }
                        .newMsgCount {
                            position: relative;
                            top: -3px;
                            float: right;
                            .el-badge__content {
                                border: 1px solid #ffffff00;
                            }
                        }
                    }
                }
            }
        }
        .empty-wrapper {
            font-size: 16px;
            color: #3e3e3e;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            .content {
                width: 170px;
                height: 200px;
                margin: 0px auto;
                text-align: center;
                color: #867c7c;
                .iconfont {
                    font-size: 90px;
                }
                .title {
                    margin-top: 25px;
                }
            }
        }
    }
}
</style>
