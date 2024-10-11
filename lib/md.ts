import { Lexer } from 'marked';

export function isMarkdownTableExists(markdown: string): boolean {
    const lexer = new Lexer()
    const tokens = lexer.lex(markdown)
    let result = false
    tokens.forEach((token)=> {
        if (token.type ==='table'){
            result = true
        }
    })
    return result
}
interface Table {
    header: string[]
    rows: Record<string, string>[]
}

export function parseMarkdownTable(markdown: string): Table[] {
    const lexer = new Lexer();
    const tokens = lexer.lex(markdown);
    let result: Table[] = [];
    tokens.forEach((token) => {
        if (token.type === 'table') {
            const headers = token.header.map((header: any) => header.text);
            // Convert rows from array of arrays to array of objects
            const rows = token.rows.map((row: any[]) => {
                let rowObject: { [key: string]: string } = {};
                row.forEach((cell: any, index: number) => {
                    rowObject[headers[index]] = cell.text;
                });
                return rowObject;
            });
            result.push({ header: headers, rows: rows });
        }
    });
    console.log(result)
    return result;
}