DROP TABLE IF EXISTS students;
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  course TEXT,
  status TEXT DEFAULT 'جديد',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- إنشاء حساب دخول افتراضي للمدير
INSERT INTO admins (username, password) VALUES ('admin', 'Omar123');

-- جدول الكورسات
DROP TABLE IF EXISTS courses;
CREATE TABLE courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  instructor TEXT,
  rating REAL,
  image TEXT,
  tag TEXT,
  level TEXT,
  display_order INTEGER DEFAULT 0,
  packages TEXT, -- سيتم تخزينها كـ JSON
  syllabus TEXT, -- سيتم تخزينها كـ JSON
  body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول المقالات (البلوج)
DROP TABLE IF EXISTS blog;
CREATE TABLE blog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  pubDate DATETIME,
  heroImage TEXT,
  author TEXT DEFAULT 'أكاديمية KSA',
  readingTime TEXT DEFAULT '5 دقائق',
  tags TEXT, -- سيتم تخزينها كـ JSON
  body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

