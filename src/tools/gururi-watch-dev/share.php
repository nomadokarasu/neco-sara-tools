<?php

declare(strict_types=1);

$worldId =
trim(
(string)($_GET["world"] ?? "")
);

$lang =
(string)($_GET["lang"] ?? "ja");

if (
$lang !== "ja" &&
$lang !== "en"
) {
$lang = "ja";
}

if (
!preg_match(
'/^[a-f0-9]{16}$/',
$worldId
)
) {

http_response_code(404);

exit(
$lang === "en"
? "World not found."
: "作品が見つかりませんでした。"
);

}

$dataFile =
__DIR__ . "/data/worlds.json";

if (
!file_exists(
$dataFile
)
) {

http_response_code(404);

exit(
$lang === "en"
? "World not found."
: "作品が見つかりませんでした。"
);

}

$json =
file_get_contents(
$dataFile
);

$worlds =
json_decode(
$json ?: "[]",
true
);

if (
!is_array(
$worlds
)
) {

http_response_code(500);

exit(
$lang === "en"
? "Could not load world data."
: "作品データを読み込めませんでした。"
);

}

$world =
null;

foreach (
$worlds as $item
) {

if (
($item["id"] ?? "") === $worldId &&
($item["status"] ?? "") === "published"
) {

$world =
$item;

break;

}

}

if (
$world === null
) {

http_response_code(404);

exit(
$lang === "en"
? "World not found."
: "作品が見つかりませんでした。"
);

}

$baseUrl =
"https://tools.neco-sara.com/tools/gururi-watch/";

$viewerUrl =
$baseUrl .
"?world=" .
rawurlencode(
$worldId
) .
"&lang=" .
rawurlencode(
$lang
);

$shareUrl =
$baseUrl .
"share.php?world=" .
rawurlencode(
$worldId
) .
"&lang=" .
rawurlencode(
$lang
);

$thumbnailPath =
(string)($world["thumbnail"] ?? "");

$thumbnailPath =
preg_replace(
'#^\./#',
"",
$thumbnailPath
);

$thumbnailUrl =
$baseUrl .
$thumbnailPath;

$title =
trim(
(string)($world["title"] ?? "")
);

$author =
trim(
(string)($world["author"] ?? "")
);

if (
$lang === "en"
) {

$pageTitle =
$title .
" | Gururium";

$description =
"Creator: " .
$author .
" | Explore a world created with Gururi Paint";

$siteName =
"Gururium";

$linkText =
"View this world";

} else {

$pageTitle =
$title .
"｜ぐるりうむ";

$description =
"作者：" .
$author .
"｜ぐるりペイントで描かれた世界を見る";

$siteName =
"ぐるりうむ";

$linkText =
"作品を見る";

}

function escapeHtml(
string $value
): string {

return htmlspecialchars(
$value,
ENT_QUOTES,
"UTF-8"
);

}

?>
<!DOCTYPE html>
<html lang="<?php echo escapeHtml($lang); ?>">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title><?php echo escapeHtml($pageTitle); ?></title>

<meta name="description" content="<?php echo escapeHtml($description); ?>">

<meta property="og:type" content="website">
<meta property="og:title" content="<?php echo escapeHtml($title); ?>">
<meta property="og:description" content="<?php echo escapeHtml($description); ?>">
<meta property="og:url" content="<?php echo escapeHtml($shareUrl); ?>">
<meta property="og:image" content="<?php echo escapeHtml($thumbnailUrl); ?>">
<meta property="og:site_name" content="<?php echo escapeHtml($siteName); ?>">
<meta property="og:locale" content="<?php echo $lang === "en" ? "en_US" : "ja_JP"; ?>">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?php echo escapeHtml($title); ?>">
<meta name="twitter:description" content="<?php echo escapeHtml($description); ?>">
<meta name="twitter:image" content="<?php echo escapeHtml($thumbnailUrl); ?>">

<link rel="canonical" href="<?php echo escapeHtml($shareUrl); ?>">

<script>
window.location.replace(
<?php echo json_encode($viewerUrl, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?>
);
</script>

</head>

<body>

<p>
<a href="<?php echo escapeHtml($viewerUrl); ?>">
<?php echo escapeHtml($linkText); ?>
</a>
</p>

</body>
</html>