module.exports = {

    OK: 200,
    FAILED: 500,

    LOBBY : "The Lobby",
    ADMIN : "admin",
    PARTNER_DEFAULT : "default",
    GAME_NAME : "banca69",
    TOP_SIZE : 20,

    COUNTRY_ENABLE_PAYMENT : ['VN'],

    GAME_TIMER_INTERVAL : 51,

    CLIENT_GAME_LOOP_DELAY : 17,

    TIME_PLAY_CHALLENGE : 60000,

    DIFF_PLAYER_MONEY_MATCH : 10000, //user chenh nhau 1 so tien du nay co nghia la same nhau

    GAME_SCREEN : {
        WIDTH : 720,
        HEIGHT : 1280
    },
    // 4 3
    // 1 2
    GAME_LOCATION : {
        LOBBY : 'lobby',
        QUICKPLAY : 'quickplay',
        CL_CHOICE_ROOM : 'cl_choice_room',
        CL_PLAY : 'cl_play',
        FREE_PLAY : 'free_play',
    },

    GAME_TYPE : {
        QUICK_PLAY : 0, //Choi ngay may nhu ngoai sieu thi
        CHALLENGE : 1, //Thi dau phong choi co dat cuoc
        FREE_PLAY : 2 //Thi dau su dung tien vang
    },

    PREFIX : {
        GUEST_ : "Guest_",
        QUICK_ : "BCO_"
    },

    LOGIN_TYPE : {
        NORMAL : 0,
        FACEBOOK : 1,
        QUICK_LOGIN : 2
    },

    ACCOUNT_STATE : {
        ACTIVE : 1,
        INACTIVE : 0,
        BLOCKED : -1,
        EVER_LOGIN : 2
    },

    PLATFORM : {
        ANDROID : 'android',
        IOS : 'ios',
        WINDOWPHONE : 'windowphone',
        WEB : 'web',
        DESKTOP : 'desktop'
    },

    POPUP_TYPE : {
        POPUP_BOARD : 0, //Hien thi danh sach popup trong 1 bang
        DIALOG_OK : 1, //Hien thi dang popup co nut ok
        DIALOG_YES_NO : 2 //Hien thi dang dialog co 2 nut yes va ok
    },

    POPUP_STATE : {
        ACTIVE : 1,
        INACTIVE : 0
    },

    USER_MESSAGE : {
        TYPE : {
            USER_SEND_USER : 0,
            ADMIN_SEND : 1,
            PAYMENT : 2,
            GIFT_EXCHANGE : 3
        },
        STATE : {
            READ : 1,
            UNREAD : 0
        },
        MAX_MSG_TO_USER : 50
    },

    ROOM_STATE : {
        ACTIVE : 1,
        INACTIVE : 0
    },

    SYSTEM_MESSAGE_TYPE : {
        NOTIFICATION : 0,
        ADVERTISE : 1,
        EVENT : 2,
        WARNING : 3
    },

    CONFIG_PATH : {
        CHALLENGE_ROOM_BASE : './config/room/challenge/',
        QUICKPLAY_ROOM_BASE : './config/room/quickplay/',
        FREEPLAY_ROOM_BASE : './config/room/freeplay',
        FISH_ORBIT : './config/fish/orbit.json',
        SPECIAL_WAVES : './config/fish/special_waves.json'
    },

    MAX_SPECTATORS_IN_GAME : 20,

    BULLET_TIME_OUT_IN_GAME : 10000,
    FISH_TIME_OUT_IN_GAME : 60000,

    PLAYER : {
        TIME_OUT_REQUEST : 60000,
        MONEY_CHANGE_TYPE : {
            BULLET_FIRE : 0,
            FISH_DEAD : 1,
            CL_BET : 2,
            CL_WIN : 3
        }
    },

    FISH_TURN : {
        TYPE: {
            NORMAL: 0,
            SPECIAL : 1
        },
        MAX_FISH : 100,
        COUNT_TIME_NORMAL_TO_SPECIAL : 5
    },

    FISH_DEAD_TYPE : {
        ONE_HIT : 0, //1 phat chet luôn
        MUCH_HIT : 1 // Nhieu phat moi chet
    },

    RATIO_BULLET_HIT_FISH : 2,

    GUN : {
        TYPE : {
            '1' : {id : 1, coin : 2},
            '2' : {id : 2, coin : 4},
            '3' : {id : 3, coin : 8},
            '4' : {id : 4, coin : 15},
            '5' : {id : 5, coin : 30},
            '6' : {id : 6, coin : 60}
        }
    },

    ITEM : {
        TYPE : {
            BOMBER : 1,
            X2_GOLD : 2,
            X3_GOLD : 3,
            FROZEN : 4,
            MERMAID_TRAP : 5,
            TARGET_LOCK : 6,
            TORPEDO : 7,
            LASER : 8,
            ELECTRO_NET : 9
        },
        STATE : {
            WAIT : 0,
            ACTIVE : 1
        }
    },

    SERVER_FEE_PERCENT : 5,

    MONEY_TRACE_CARD_RECHARGE : 100,
    MONEY_TRACE_GIFT_EXCHANGE : 101,
    MONEY_TRACE_MONEY_BONUS : 102,

    TRANACTION_TYPE : {
        CARD_RECHARGE : 1,
        GIFT_EXCHANGE : 2
    },

    TIME_SCHEDULER_TASK : {
        LOAD_CONFIG_TASK : 3 * 60 * 1000,
        LOG_CCU_TASK : 5 * 60 * 1000
    },

    TIME_QUICKPLAY_RESET_WINLOST : 3 * 60 * 60 * 1000,

    BULLET_MONEY_TYPE : {
        ONTARGET : 0,
        MISS : 1,
        MAMMON_FISH : 2
    }
};
