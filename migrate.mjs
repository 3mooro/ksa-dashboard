import fs from 'fs';
import path from 'path';

const coursesDir = path.resolve('../my-math-site/src/content/courses');
const blogDir = path.resolve('../my-math-site/src/content/blog');
const outputFile = path.resolve('./data-migration.sql');

let sql = '';

// Helper to escape single quotes in SQL strings
const escapeSql = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
};

// 1. Migrate Courses
if (fs.existsSync(coursesDir)) {
  const files = fs.readdirSync(coursesDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const slug = file.replace('.json', '');
    const content = JSON.parse(fs.readFileSync(path.join(coursesDir, file), 'utf-8'));
    
    sql += `INSERT INTO courses (slug, title, instructor, rating, image, tag, level, display_order, packages, syllabus, body) VALUES (
      ${escapeSql(slug)},
      ${escapeSql(content.title)},
      ${escapeSql(content.instructor || 'نخبة من المعلمين')},
      ${content.rating || 5.0},
      ${escapeSql(content.image)},
      ${escapeSql(content.tag || '')},
      ${escapeSql(content.level || 'primary')},
      ${content.order || 0},
      ${escapeSql(JSON.stringify(content.packages || []))},
      ${escapeSql(JSON.stringify(content.syllabus || []))},
      ${escapeSql(content.body || '')}
    );\n`;
  }
}

// 2. Migrate Blog Posts
if (fs.existsSync(blogDir)) {
  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  for (const file of files) {
    const slug = file.replace(/\.mdx?$/, '');
    const rawContent = fs.readFileSync(path.join(blogDir, file), 'utf-8');
    
    // Very basic frontmatter parser
    const match = rawContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (match) {
      const frontmatterRaw = match[1];
      const body = match[2].trim();
      
      const meta = {};
      frontmatterRaw.split('\n').forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > -1) {
          const key = line.substring(0, colonIdx).trim();
          let val = line.substring(colonIdx + 1).trim();
          
          if (val.startsWith('[')) {
            try { val = JSON.parse(val.replace(/'/g, '"')); } catch(e) {}
          } else if (val.startsWith('"') || val.startsWith("'")) {
            val = val.substring(1, val.length - 1);
          }
          meta[key] = val;
        }
      });

      let isoDate = new Date().toISOString();
      if (meta.pubDate) {
        try {
          isoDate = new Date(meta.pubDate).toISOString();
        } catch(e) {}
      }

      sql += `INSERT INTO blog (slug, title, description, pubDate, heroImage, author, readingTime, tags, body) VALUES (
        ${escapeSql(slug)},
        ${escapeSql(meta.title)},
        ${escapeSql(meta.description || '')},
        ${escapeSql(isoDate)},
        ${escapeSql(meta.heroImage || '')},
        ${escapeSql(meta.author || 'أكاديمية KSA')},
        ${escapeSql(meta.readingTime || '5 دقائق')},
        ${escapeSql(Array.isArray(meta.tags) ? JSON.stringify(meta.tags) : '[]')},
        ${escapeSql(body)}
      );\n`;
    }
  }
}

fs.writeFileSync(outputFile, sql);
console.log('Migration SQL generated successfully at ' + outputFile);
