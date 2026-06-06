// Classify a clipboard string as a link, code snippet, or plain text.
function detectType(text) {
  if (/^https?:\/\//i.test(text.trim())) return "link";
  if (
    /[{}[\];]/.test(text) ||
    /^\s*(const|let|var|function|import|export|def |class |if |for |while )/.test(text)
  ) {
    return "code";
  }
  return "text";
}

if (typeof module !== "undefined") module.exports = { detectType };
