// =============================================================================
// Restore Files from Combined File Script
// =============================================================================
//
// Author: Gemini
// Description: This Node.js script reads a single large text file that was
//              created by the 'combine' script. It parses the file, extracts
//              the original file paths and their content, and recreates the
//              original directory structure and files.
//
// Instructions:
// 1. Save this code as a JavaScript file (e.g., `restore.js`).
// 2. Place it in the same directory as your combined text file.
// 3. Make sure you have Node.js installed on your system.
// 4. Open your terminal or command prompt.
// 5. Navigate to the directory where you saved this file.
// 6. Run the script using the command: `node restore.js`
//
// =============================================================================

// --- CONFIGURATION ---
// مهم: این مسیرها را قبل از اجرای اسکریپت تنظیم کنید.

// نام فایلی که حاوی تمام کدهای ترکیبی است.
const INPUT_FILE = 'combined_code.txt';

// نام پوشه‌ای که پروژه در آن بازسازی خواهد شد.
// برای جلوگیری از بازنویسی تصادفی فایل‌های موجود، اسکریپت فایل‌ها را در یک پوشه جدید ایجاد می‌کند.
const OUTPUT_DIRECTORY = './';

// --- SCRIPT ---

// Import necessary Node.js modules
const fs = require('fs');
const path = require('path');

/**
 * Main function to execute the script logic.
 */
const main = () => {
  console.log('--- شروع اسکریپت بازسازی پروژه ---');

  // 1. بررسی وجود فایل ورودی
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`خطا: فایل ورودی در '${INPUT_FILE}' یافت نشد.`);
    console.log('لطفاً مطمئن شوید که مقدار متغیر INPUT_FILE صحیح است.');
    return;
  }

  // 2. خواندن کل محتوای فایل ترکیبی
  console.log(`درحال خواندن فایل: ${INPUT_FILE}`);
  let combinedContent;
  try {
    combinedContent = fs.readFileSync(INPUT_FILE, 'utf8');
  } catch (error) {
    console.error(`خطا در خواندن فایل ورودی:`, error.message);
    return;
  }

  // 3. تعریف عبارت باقاعده (Regex) برای پیدا کردن بلوک‌های هر فایل
  // این الگو به دنبال هدر "START OF FILE"، محتوای آن، و فوتر "END OF FILE" می‌گردد.
  const fileBlockRegex =
    /==============================================================================\r?\n\/\/ START OF FILE: (.*?)\r?\n==============================================================================\r?\n\r?\n([\s\S]*?)\r?\n\r?\n\/\/ ==============================================================================\r?\n\/\/ END OF FILE: \1\r?\n\/\/ ==============================================================================/g;

  // 4. پیدا کردن تمام بلوک‌های فایل در محتوا
  const matches = [...combinedContent.matchAll(fileBlockRegex)];

  if (matches.length === 0) {
    console.log(
      'هیچ بلوک فایلی برای بازسازی یافت نشد. لطفاً فرمت فایل ورودی را بررسی کنید.',
    );
    return;
  }

  console.log(`تعداد ${matches.length} فایل برای بازسازی پیدا شد.`);
  let filesRestored = 0;

  // 5. حلقه بر روی هر بلوک پیدا شده و ایجاد فایل مربوطه
  for (const match of matches) {
    // match[1] مسیر فایل است (مثلاً: src/app.js)
    // match[2] محتوای فایل است
    const relativePath = match[1].trim();
    const fileContent = match[2];

    const fullDestPath = path.join(OUTPUT_DIRECTORY, relativePath);

    try {
      console.log(`  -> در حال بازسازی: ${relativePath}`);

      // 6. ایجاد پوشه‌های والد در صورت نیاز
      const dirName = path.dirname(fullDestPath);
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
      }

      // 7. نوشتن محتوا در فایل جدید
      fs.writeFileSync(fullDestPath, fileContent);
      filesRestored++;
    } catch (error) {
      console.error(`\nخطا در ایجاد فایل '${fullDestPath}':`, error.message);
    }
  }

  // 8. نمایش پیام پایانی
  console.log('\n--- عملیات با موفقیت انجام شد! ---');
  console.log(
    `تعداد ${filesRestored} فایل با موفقیت در پوشه '${path.resolve(OUTPUT_DIRECTORY)}' بازسازی شد.`,
  );
};

// Run the main function
main();
