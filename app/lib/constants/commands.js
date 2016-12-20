module.exports = {
	//Lobby
	NOTIFY_ALL : "notify_all",
	USER_INFO : "user_info",
	UPDATE_INFO : "update_info",
	QUICKPLAY : "quickplay",
	CHALLENGE_LIST_ROOM : "challenge_list_room",
	CHALLENGE_FIND_ROOM : "challenge_find_room",
	CHALLENGE_QUICK_SELECT_ROOM : "challenge_quick_select_room",
	GET_USER_STATISTIC : "get_user_statistic",
	GET_USER_MESSAGE : "get_user_message",
	READ_USER_MESSAGE : "read_user_message",
	LOBBY_INFO : "lobby_info",

	//Game
	LEAVE_ROOM : "leave_room", //User thoat khoi phong
	DISCONNECT : "disconnect", //User bi disconnect
	JOIN_ROOM : "join_room", //User vao phong
	STAND_UP : "stand_up", //User đứng dậy (lúc này server sẽ gửi về tổng kết)
	PLAYER_LEAVE : "player_leave", //Nguoi choi khac thoat khoi cho ngoi (stand_up or leave_room)
	PLAYER_JOIN : "player_join", //Nguoi choi khac join vao cho ngoi
	TABLE_INFO : "table_info", //Lay thong tin ban choi
	ENTER_GAME : "enter_game", //Nguoi choi ngoi xuong choi game
	NEW_PLAYER_ENTER : "new_player_enter", //Bao cho cac nguoi choi khac la co nguoi choi moi join vao
	NEW_FISH_ENTER : "new_fish_enter", //Con ca moi duoc tha vao ban choi
	CHANGE_GUN : "change_gun", //Doi sung
	FIRE : "fire", //User bắn lên (Gửi về cho user)
	PLAYER_FIRE : "player_fire", //Gui ve cho cac user khac khi co user ban
	FIRE_HIT : "fire_hit", //Player bắn đạn trúng cá gửi lên cho server, cái này ko cần response trả về
	BULLET_OUT_OF_GAME : "fire_out_of_game", //Dan bay ra khoi man hinh
	FISH_DEAD : "fish_dead", //Khi cá chết gửi request về cho tất cả người chơi trong phòng
	PICK_UP_ITEM : "pick_up_item", //User nhặt được item khi bắn cá chết
	USE_ITEM : "use_item", //User sử dụng item
	ITEM_TIME_OUT : "item_time_out", //Những item có thời gian sử dụng bị timeout
	UPDATE_USER_MONEY : "update_user_money", //Cập nhật tiền của user
	QL_TOTAL_RESULT : "ql_total_result", //Kết quả tổng kết của phần quick play

	CL_UPDATE_POINT : "cl_update_point", //Cập nhật điểm của user trong phần thách đấu
	CL_BET_MONEY : "cl_bet_money", //Server gửi về tiền cược mỗi ván ở phần thách đấu
	CL_FINISH_MATCH : "cl_finish_match", //Ván chơi thách đấu kết thúc

	PING : "ping",
	PONG : "pong",
	PREPARE_NEW_MATCH : "prepare_new_match",
	LEVEL_UP : "level_up",
	CL_BET : "bet_money",
	START : "start",
	ONCHAT : "onChat",

	FIRE_HIT_ITEM : "fire_hit_item",
	FISH_DEAD_ITEM : "fish_dead_item",
	CONFIRM_ITEM_TIME_OUT : "confirm_item_time_out",
	CHANGE_ITEM_STATE : "change_item_state",

	GET_SYSTEM_MESSAGE : "get_system_message",
	POPUP : "popup",
	RECHARGE_CARD : "recharge_card",
	GIFT_EXCHANGE : "gift_exchange",
	GIFT_INFO : "gift_info",
	TOP_RICH : "top_rich",
	TRANSACTION_LOG : "transaction_log",

	FL_TOTAL_RESULT : "fl_total_result",
	FREEPLAY : "freeplay",
	FISH_INFO : "fish_info",

	UNREAD_MESSAGE : "unread_message",
	CONFIRM_INVITE_CODE : "confirm_invite_code",
	GIFTEXCHANGE_LOG : "giftexchange_log",
};