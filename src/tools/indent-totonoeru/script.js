const inputCode = document.getElementById('inputCode');
const outputCode = document.getElementById('outputCode');

const formatButton = document.getElementById('formatButton');
const copyButton = document.getElementById('copyButton');


// ------------------------------
// インデントを整える
// ------------------------------

formatButton.addEventListener('click', function () {

    const code = inputCode.value;

    if (!code.trim()) {
        outputCode.value = '';
        return;
    }

    const formatted = formatCode(code);

    outputCode.value = formatted;
});


// ------------------------------
// コード整形
// ------------------------------

function formatCode(code) {

    // タブをスペース4つに統一
    code = code.replace(/\t/g, '    ');

    // 行末の不要な空白を削除
    const lines = code.split('\n').map(line => {
        return line.trimEnd();
    });

    // 全体に共通しているインデントを削除
    const nonEmptyLines = lines.filter(line => line.trim() !== '');

    if (nonEmptyLines.length > 0) {

        const indents = nonEmptyLines.map(line => {
            const match = line.match(/^ */);
            return match ? match[0].length : 0;
        });

        const minimumIndent = Math.min(...indents);

        if (minimumIndent > 0) {

            return lines
                .map(line => {
                    if (line.trim() === '') {
                        return '';
                    }

                    return line.slice(minimumIndent);
                })
                .join('\n');
        }
    }

    return lines.join('\n');
}


// ------------------------------
// 全文コピー
// ------------------------------

copyButton.addEventListener('click', async function () {

    const text = outputCode.value;

    if (!text) {
        return;
    }

    try {

        await navigator.clipboard.writeText(text);

        const originalText = copyButton.textContent;

        copyButton.textContent = 'コピーしました';

        setTimeout(function () {
            copyButton.textContent = originalText;
        }, 1500);

    } catch (error) {

        outputCode.select();
        document.execCommand('copy');

    }
});