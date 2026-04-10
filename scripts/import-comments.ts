import fs from 'fs';
import path from 'path';
import readline from 'readline';

const csvFile = path.resolve(process.cwd(), 'public', 'enriched_comments.csv');
const outputFile = path.resolve(process.cwd(), 'scripts', 'db', 'import_comments.sql');

async function main() {
  if (!fs.existsSync(csvFile)) {
    throw new Error(`CSV file not found at ${csvFile}`);
  }

  const fileStream = fs.createReadStream(csvFile, 'utf8');
  const reader = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  const lines = [];
  for await (const line of reader) {
    if (line.trim()) {
      lines.push(line.split(','));
    }
  }

  if (lines.length < 2) {
    throw new Error('CSV data is empty or invalid.');
  }

  const headers = lines[0].map((value) => value.trim());
  const rows = lines.slice(1);

  const statements = rows.map((columns) => {
    const row: Record<string, string> = {};
    columns.forEach((value, index) => {
      row[headers[index]] = value.replace(/'/g, "''").trim();
    });

    const images = row.images ? JSON.stringify(row.images.split('|').filter(Boolean)) : '[]';
    return `insert into comments (hotel_name, location, reviewer_name, review_title, review_text, review_date, rating, category, images) values ('${row.hotel_name}', '${row.location}', '${row.reviewer_name}', '${row.review_title}', '${row.review_text}', '${row.review_date}', ${Number(row.rating) || 0}, '${row.category}', '${images.replace(/'/g, "''")}');`;
  });

  fs.writeFileSync(outputFile, statements.join('\n') + '\n', 'utf8');
  console.log(`Generated ${statements.length} insert statements to ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
