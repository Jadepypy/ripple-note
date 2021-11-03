class Node {
  constructor(id, firstChild, next, type, name) {
    this.id = id
    this.type = String(type)
    this.name = name
    this.parent = null 
    this.prev = null
    this.next = next
    this.firstChild = firstChild
    this.lastChild = null
    this.depth = 0
  }
}
const backlink = {
  name: 'backlink',
  level: 'inline',                                     // Is this a block-level or inline-level tokenizer?
  start(src) { return src.match(/^\[\[(.+?)\]\]/)?.index; }, // Hint to Marked.js to stop and check for a match
  tokenizer(src, tokens) {
    const rule = /^\[\[(.*\S.*)\]\]/;    // Regex for the complete token
    const match = rule.exec(src);
    if (match) {
      const token = {                                 // Token to generate
        type: 'backlink',                      // Should match "name" above
        raw: match[0],                                // Text to consume from the source
        backlink: this.lexer.inlineTokens(match[1].trim())
      };
      return token;
    }
  },
  renderer(token) {
    return `<backlink>${this.parser.parseInline(token.backlink)}</backlink>`; // parseInline to turn child tokens into HTML
  }
}
// marked.use({ extensions: [backlink]})
const config = {
  ADD_TAGS: ['backlink']
}

export {Node, backlink,}