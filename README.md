# Tổng quan
Bắn cá online gồm các chế độ chơi :

 - *Chơi tự do* : Người chơi sử dụng *kim cương*. Như chơi với máy ngoài siêu thị. Bàn chơi có 4 người ở 4 góc màn hình. Doanh thu của phần này được tính dựa vào **tiền lãi của máy** (Tiền user bắn đạn - Tiền user ăn được cá). Mỗi bàn có 1 tỉ lệ thắng thua để điều chỉnh tiền lãi sao cho phù hợp
 - *Chơi thách đấu* : Từ 2 ->4 người chơi đặt cược 1 số tiền *kim cương* (Tùy theo mức cược của bàn) rồi bắn với nhau xem ai điểm cao nhất sẽ giành được 95% tổng tiền cược **(Server ăn phế 5%)**.
 - *Chơi miễn phí* : Người chơi sử dụng *vàng* được cấp miễn phí sau khi đăng ký (mỗi user được cấp 100000 vàng khi tạo nick) để chơi. Mục đích phần này là để thu hút user tham gia vào game. Tỉ lệ thắng thua của phần này thường được đặt là 50-50

Game chia các thông tin theo **Partner**, các partner được quản lý trong table *partner_manager*, mỗi partner được định danh dựa vào trường 'name' (String) chứ không phải trường 'id' (Integer) 
# User
User trong game được quản lý trong table *user_manager* trong database. User có thể tạo tài khoản thông qua 3 hình thức *0 - Đăng ký tài khoản, 1 - Facebook Id, 2 - Chơi nhanh dựa vào device_id*. Một user có thể ở trong các trạng thái *0 - Không active, 1 - Đã active, -1 - Bị khóa, 2 - Đã tạo nick nhưng chưa bao giờ login* 

Mỗi user có một thông số *secret_key* được tạo ngay khi tạo tài khoản trên server dựa vào công thức :
> MD5(username + device_id + partner)

Mỗi user có một thông số *invite_code* được tạo ngay khi tạo tài khoản. Đây là 1 chuỗi số 6 kí tự (số và chữ) đảm bảo duy nhất với mỗi user. Sử dụng thư viện [Hashids](http://hashids.org/java/) để sinh như sau :
```js
	var hashids = new Hashids('banca69', 6);
	var code = hashids.encode(id);//id trong database của user_manager
	return code;
```

Mỗi thiết bị chỉ được nhập *invite_code* một lần, được đánh dấu bằng trường *confirm_invite_code* trong database, = 0 chưa nhập code bao giờ, = 1 đã từng nhập code rồi. N tài khoản cùng 1 thiết bị thì chỉ có 1 tài khoản được nhập mã mời.

User có 2 đơn vị có thể dùng để chơi game được là *kim cương - tiền - money*, *vàng - gold*.

 - *Kim cương* : User nạp thẻ để có kim cương (Tỉ lệ được cấu hình trong table *card_exchange_rate*). Kim cương có thể sử dụng để đổi thẻ. Kim cương được sử dụng trong các phần chơi Tự do và Thách đấu.
 - *Vàng* : User được tặng 100K vàng khi tạo nick. Vàng được sử dụng trong phần chơi Tự do. Vàng không sử dụng trong nạp thẻ và đổi thưởng. User có thể kiếm được vàng khi được user khác nhập code invite.

User có trường thông tin *mode_play* để quy định chế độ chơi mà user được sử dụng *0 - Chỉ chơi chế độ miễn phí, 1 - Chơi tất cả các chế độ*, trường này đặt ra với mục đích qua mặt Google trong quá trình duyệt app. Logic cho phần này có thể tham khảo [tại đây](https://github.com/saruno/bco_nodejs/blob/master/free_mode_rule.txt) 

Khi user login có một thông tin gửi về cho user là *show_user_money_info*, = true là hiển thị thông tin kim cương trong giao diện client, = false là không hiển thị thông tin kim cương trong giao diện client. Tùy theo *mode_play* ở trên mà client gửi về thông tin trường này cho phù hợp.

#Config

Các dữ liệu config của server game có thể xem tại /app/consts/consts.js, client cũng có thể xem thể tham khảo các thông số. Khi chuyển sang Java thì viết 1 lớp Consts.java có lưu các thông số này

Game không có các file config ngoài, các config được load chủ yếu trong database. VD các table : *game_config*, *card_telco*, *card_exchange_rate*, *fish*, *client_build_manager*, *item*, *quick_room_manager*, ....

![game_config](https://github.com/saruno/bco_nodejs/blob/master/screenshots/game_config.jpg)

Khi client login thành công, join vào Lobby và gửi request user_info, server sẽ chủ động gửi về cho client command *lobby_info* để cung cấp các thông tin config cho client : Danh sách item, Danh sách súng, Danh sách nhà mạng có thể thanh toán, Tỉ giá thanh toán thẻ cào, Bật tắt thanh toán đổi thưởng, Danh sách mức cược ....

Các thông tin cấu hình được lưu trữ trong các bảng với thông tin không biến động nhiều và tương đối nhẹ vì vậy server chủ động auto reload các thông tin config với thời gian khoảng 1-3 phút / 1 lần reload *(Đặc biệt là các thông tin của phòng chơi tự do vì việc chỉnh sửa tỉ lệ thông số sẽ được tool quản trị cập nhật vào database, server phải load lại để cập nhật vào logic game)*

**Link config của client**

Thông tin link config của client load về trước khi kết nối tới server sẽ được viết dưới dạng RESTful Api. Việc tạo link config sẽ diễn ra tự động, các thông tin cấu hình sẽ được lưu trữ trong database *client_build_manager*, người quản trị có thể chỉnh sửa thông tin config dựa vào tool admin.

Link config cho game bắn cá cụ thể như sau :

- HTTP METHOD : GET
- Base url : http://config.banca69.com:8090/client_config/get
- Params : build_id, platform, partner, package_name

Ý nghĩa của các params :

- build_id : Id của bản build muốn lấy config. Đặt theo định danh như sau :

               partner + platform + package_name + số thứ tự bản build

> VD : Bản build cho partner : *default*, platform : *android*, package_name : *com.bgate.bca*, bản build này là bản build thứ 9 vậy build_id sẽ là : *default-android-com.bgate.bca-9* . Trong trường hợp database không có build_id thì API sẽ tự tạo một bản ghi mới vào database với các thông tin cấu hình mặc định.

- platform : là nền tảng của file build : android, ios, ...
- partner : Partner mà bản build được gán
- package_name (Chính là thông tin edition_id gửi lên lúc user_info) : Với android là packagename gắn trong manifest, ios là bundle_id 

Params có dạng : build_id=....&platform=....&partner=....&package_name=.....

> VD : Một link hoàn chỉnh để lấy config như sau :
http://config.banca69.com:8090/client_config/get?build_id=default-android-com.banca.doithuong-1&platform=android&partner=default&package_name=com.banca.doithuong

#Source structure

Cấu trúc source code của server bắn cá viết bằng nodejs như sau 

![source structure](https://github.com/saruno/bco_nodejs/blob/master/screenshots/Untitled.jpg)

**/app/consts** : Lưu trữ các hằng số được sử dụng trong toàn bộ server : Súng, địa chỉ các file config, ...
**/app/domain** : Chứa các lớp Quản lý phòng, Quản lý user, Service gửi nhận gói tin, Service xử lý chat
**/app/lib** : Gồm các package nhỏ hơn như sau :

- *common* : Thanh toán, các hàm thư viện static hay sử dụng trong code, thông tin popup
- *config* : Chứa tất cả các thông tin config được server load về từ database và lưu trữ lại, gồm có : *eventManager* - Quản lý các sự kiện diễn ra được lưu trữ trong bảng 'event_manager'; *gameConfig* - Quản lý các thông tin config như cá + item + game_config + popups + ....; *roomSetting* - Quản lý các setting của room được load từ file .xml hoặc từ database
- *constants* : Chứa các hằng số xử dụng trong server như : Các command, các *key* sử dụng trong dữ liệu gửi về 
- *database* : Các phương thức tương tác với database

**/app/main/entity** :  Các *entity* xử lý logic trong game :

- *bullet* : Đạn. Mỗi viên đạn đều được đánh 1 id duy nhất và thuộc về 1 người chơi duy nhất
- *fish* : Cá. Mỗi con cá đều được đánh 1 id duy nhất, có 1 quỹ đạo được cấu hình trong file */config/orbit.json*, thuộc 1 loại cá được cấu hình sẵn trong bảng 'fish'
- *fishConfig* : Cấu hình các loại cá. Cache lại thông tin cấu hình các loại cá từ bảng 'fish'
- *fishGenerator* : Sinh cá random cho phần chơi miễn phí và tự do. Nguyên tắc sinh cá : Sinh cá theo turn, Một turn có từ 200 -> 300 con cá, Trong 1 turn phải có đủ tất cả các loại cá theo tỉ lệ ít nhiều tùy loại, Cá được phân bố đều trong turn.
- *fishGeneratorCL* : Sinh cá random cho phần chơi thách đấu. Hạn chế sinh các loại cá to khó bắn chết
- *fishTurn* : Một turn (hoặc một wave) chứa nhiều con cá. Trong một turn có chứa sẵn 200 - 300 con cá. Bao giờ thả hết cá trong turn thì sinh ra turn mới. Turn có 2 loại : Turn bình thường và Turn đặc biệt (Quỹ đạo ngôi sao, Quỹ đạo hình vuông, ...). 
- *item* : Thông tin của một item sử dụng trong game. VD : Đóng băng, bom, bẫy tiên cá, ....
- *itemConfig* : Cấu hình item. Cache lại thông tin cấu hình các item từ bảng 'item'
- *itemGenerator* : Sinh item khi cá chết. Các ràng buộc : Tỉ lệ xuất hiện item (Item càng mạnh tỉ lệ xuất hiện càng ít), Loại cá chết (Cá càng to chết càng dễ ra item), Các item mà loại cá chết có thể sinh ra (một loại cá khi chết có thể sinh ra 1 số loại item nhất định), item có đang được cấu hình là 'active' hay không.

**/app/main/room** : Các logic trong phòng chơi của các chế độ khác nhau
**/app/main/zone** : 

- *gameZone* : Load config và khởi tạo phòng chơi khi server khởi động.
- *....Task* : Thực hiện log và cập nhật định kì các thông số vào database : Load config tự động, Log ccu, ...

**/app/servers** : Bắt và xử lý các request

- *connector/entryHandler* : Xử lý đăng ký, đăng nhập
- *room/lobbyHandler* : Xử lý các request ở Lobby như : user_info, top đại gia, top săn cá vàng, thanh toán, đổi thưởng, chọn chế độ chơi, đọc tin nhắn, cập nhật thông tin user, ....
- *room/roomHandler* : Xử lý các request về phòng chơi
- *room/adminHandler* : Các request về quản trị server. VD : Kick user, Ẩn phòng, Hiện phòng, .....

**/config/fish** : Thông tin quỹ đạo của cá : *orbit.json* - Quỹ đạo tất cả các loại cá, *special_waves.json* - Cấu hình turn cá đặc biệt.


