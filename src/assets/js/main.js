const toolsList = document.getElementById("tools-list");
const currentYear = document.getElementById("current-year");

// フッターの年を自動更新
if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

// tools.jsonからツール情報を読み込む
async function loadTools() {
  try {
    const response = await fetch("./tools.json");

    if (!response.ok) {
      throw new Error("tools.jsonの読み込みに失敗しました。");
    }

    const tools = await response.json();

    if (!Array.isArray(tools) || tools.length === 0) {
      toolsList.innerHTML =
        '<p class="empty-message">現在公開中のツールはありません。</p>';
      return;
    }

    toolsList.innerHTML = "";

    tools.forEach((tool) => {
      const article = document.createElement("article");
      article.className = "tool-card";

const useButton = tool.useUrl
  ? `
      <a
        href="${escapeAttribute(tool.useUrl)}"
        class="button button--primary"
        target="_blank"
        rel="noopener noreferrer"
      >
        使ってみる
      </a>
    `
  : "";

const detailButton = tool.detailUrl
  ? `
      <a
        href="${escapeAttribute(tool.detailUrl)}"
        class="button button--secondary"
        target="_blank"
        rel="noopener noreferrer"
      >
        詳細を見る
      </a>
    `
  : "";

      article.innerHTML = `

${tool.image ? `
  ${tool.useUrl ? `
    <a
      href="${escapeAttribute(tool.useUrl)}"
      class="tool-card__image"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src="${escapeAttribute(tool.image)}"
        alt="${escapeAttribute(tool.name)}"
        loading="lazy"
      >
    </a>
  ` : `
    <div class="tool-card__image">
      <img
        src="${escapeAttribute(tool.image)}"
        alt="${escapeAttribute(tool.name)}"
        loading="lazy"
      >
    </div>
  `}
` : ""}

<div class="tool-card__meta">
  <span class="tool-card__category">${escapeHtml(tool.category)}</span>
  <span class="tool-card__version">v${escapeHtml(tool.version)}</span>
</div>

<h3 class="tool-card__title">
  ${tool.useUrl ? `
    <a
      href="${escapeAttribute(tool.useUrl)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      ${escapeHtml(tool.name)}
    </a>
  ` : escapeHtml(tool.name)}
</h3>

        <p class="tool-card__description">
          ${escapeHtml(tool.description)}
        </p>

        <div class="tool-card__footer">
          <span class="tool-card__status">
            ${escapeHtml(tool.status)}
          </span>

          <div class="tool-card__actions">
  ${useButton}
  ${detailButton}
</div>
        </div>
      `;

      toolsList.appendChild(article);
    });
  } catch (error) {
    console.error(error);

    toolsList.innerHTML = `
      <p class="error-message">
        ツール一覧を読み込めませんでした。
      </p>
    `;
  }
}

// HTMLとして解釈されないようにする
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// hrefなどの属性用
function escapeAttribute(value) {
  return escapeHtml(value);
}

loadTools();