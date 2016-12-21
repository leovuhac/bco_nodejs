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



