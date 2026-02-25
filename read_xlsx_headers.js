import XLSX from 'xlsx';
import path from 'path';

const filePath = 'C:\\Users\\rjgut\\Documents\\Trabajadrs\\AlumnosCilindro262302.xlsx';
try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log('Headers:', JSON.stringify(data[0]));
    console.log('First row:', JSON.stringify(data[1]));
} catch (error) {
    console.error('Error reading XLSX:', error.message);
}
