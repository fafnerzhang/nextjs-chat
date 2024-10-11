import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';



export async function POST(req: NextRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file'); // Assuming 'file' is the field's name

    if (!file || typeof file === 'string') {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert the file (Blob) to a Buffer for XLSX to parse
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    // Example: Convert first sheet to JSON
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(data)
    return Response.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}