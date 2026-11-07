
<?php
$sessionDirectory = dirname(__DIR__) . "/data/admin-sessions";

if (!is_dir($sessionDirectory)) {
if (!mkdir($sessionDirectory, 0700, true) && !is_dir($sessionDirectory)) {
http_response_code(500);
exit("管理用セッションの保存先を作成できません。");
}
}

if (!is_writable($sessionDirectory)) {
http_response_code(500);
exit("管理用セッションの保存先に書き込めません。");
}

session_name("gururi_watch_dev_admin");
session_save_path($sessionDirectory);
session_set_cookie_params([
"path" => "/tools/gururi-watch-dev/",
"secure" => true,
"httponly" => true,
"samesite" => "Strict"
]);

if (!session_start()) {
http_response_code(500);
exit("管理用セッションを開始できません。");
}