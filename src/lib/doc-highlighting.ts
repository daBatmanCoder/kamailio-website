import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import lua from "highlight.js/lib/languages/lua";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import c from "highlight.js/lib/languages/c";
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("python", python);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("lua", lua);
hljs.registerLanguage("json", json);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("c", c);
hljs.registerLanguage("kamailio", () => ({
  name: "Kamailio",
  keywords: {
    keyword:
      "if else route request_route reply_route failure_route branch_route event_route onreply_route return exit drop break switch case default while loadmodule modparam include_file import_file",
    literal: "yes no true false null",
  },
  contains: [
    hljs.HASH_COMMENT_MODE,
    hljs.C_LINE_COMMENT_MODE,
    hljs.C_BLOCK_COMMENT_MODE,
    hljs.QUOTE_STRING_MODE,
    { className: "variable", begin: /\$[A-Za-z_][\w]*(?:\([^\n]*?\))?/ },
    { className: "number", begin: /\b\d+\b/ },
    { className: "built_in", begin: /\b[A-Za-z_][\w]*(?=\s*\()/ },
  ],
}));
export function highlight(code: string, language: string) {
  const aliases: Record<string, string> = {
    sh: "bash",
    shell: "bash",
    cfg: "kamailio",
    conf: "kamailio",
    text: "plaintext",
    txt: "plaintext",
    js: "javascript",
    py: "python",
    html: "xml",
  };
  const lang = aliases[language] || language;
  if (lang === "plaintext")
    return code
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  return hljs.highlight(code, {
    language: hljs.getLanguage(lang) ? lang : "kamailio",
    ignoreIllegals: true,
  }).value;
}
