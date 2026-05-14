#!/usr/bin/env node

/**
 * Simple script to convert Markdown files to HTML for hosting
 * Usage: node scripts/convert-policies.js
 */

const fs = require('fs');
const path = require('path');

function markdownToHtml(markdown, title) {
  // Simple markdown to HTML conversion
  let html = markdown
    // Headers
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Lists
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap in HTML structure
  html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nidush - ${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3 {
            color: #2e7d32;
        }
        strong {
            color: #5C8D58;
        }
        li {
            margin-bottom: 8px;
        }
        p {
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <p>${html}</p>
</body>
</html>`;

  return html;
}

function convertFile(inputPath, outputPath, title) {
  try {
    const markdown = fs.readFileSync(inputPath, 'utf8');
    const html = markdownToHtml(markdown, title);
    fs.writeFileSync(outputPath, html);
    console.log(` Converted ${inputPath} -> ${outputPath}`);
  } catch (error) {
    console.error(` Error converting ${inputPath}:`, error.message);
  }
}

// Convert policies to HTML
const repoRoot = path.join(__dirname, '..');
convertFile(path.join(repoRoot, 'PRIVACY_POLICY.md'), path.join(repoRoot, 'privacy-policy.html'), 'Privacy Policy');
convertFile(path.join(repoRoot, 'TERMS_OF_SERVICE.md'), path.join(repoRoot, 'terms-of-service.html'), 'Terms of Service');

console.log('\n📋 Files ready for hosting!');
console.log('Upload these HTML files to your web server:');
console.log('- privacy-policy.html');
console.log('- terms-of-service.html');