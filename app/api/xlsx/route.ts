import { NextApiRequest } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { replacePromptArgs } from '@/lib/utils';


interface ContentItem {
    value: string;
    args: Record<string, string>;
}

export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return new NextResponse('Method not allowed', { status: 405 });
    }

    try {
        // Step 1: Parse JSON input
        const { prompt, contents } = await req.json();
        if (!prompt || !contents) {
            return new NextResponse('Invalid request body', { status: 400 });
        }
        console.log('Prompt:', prompt);
        console.log('Contents:', contents);
        // Step 2: Validate contents structure (implicitly done in Step 5)

        // Step 3: Initialize workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheetData = [];

        // Step 4: Determine columns
        const columns = ['prompt', 'response', ...Object.keys(contents[0].args)];
        worksheetData.push(columns);

        // Step 5: Iterate over contents to fill worksheet data
        console.log('Contents:', contents);
        contents.forEach(({ value, args }: ContentItem) => {
            const formattedPrompt = replacePromptArgs(prompt, args);
            console.log(value, args);
            const row = [formattedPrompt, value, ...Object.values(args)];
            worksheetData.push(row);
        });

        // Convert data to worksheet and add to workbook
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Contents');

        // Step 6: Set response headers for file download
        const dateTime = new Date().toISOString().replace(/[:\-T\.Z]/g, '');
        const fileName = `chat_${dateTime}.xlsx`;

        // Step 7: Send workbook
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Since NextResponse does not directly support sending buffers, you might need to adjust this part
        // For demonstration, this will be a placeholder for the correct response handling
        // Adjust this based on your server or serverless function setup
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename=${fileName}`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });
    } catch (err) {
        console.error(err);
        return new NextResponse(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
    }
}