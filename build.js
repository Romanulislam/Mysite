const fs = require('fs-extra');
const path = require('path');
const markdownIt = require('markdown-it');

const md = new markdownIt();
const blogDir = './blog';
const outputDir = './_site';

// Clean output directory first
if (fs.existsSync(outputDir)) {
  fs.removeSync(outputDir);
}
fs.ensureDirSync(outputDir);

// Define files and directories to copy (excluding build artifacts)
const copyOptions = {
  filter: (src) => {
    const basename = path.basename(src);
    return !src.includes('node_modules') && 
           !src.includes('.git') && 
           !src.includes(outputDir) &&
           basename !== 'build.js' &&
           basename !== 'package.json' &&
           basename !== 'package-lock.json';
  }
};

// Copy specific directories and files instead of everything
const itemsToCopy = [
  'index.html',
  'online-doctor-bd.html',
  'blog.html',
  'reviews.html',
  'contact.html',
  'admin',
  'blog',
  'assets'
];

// Copy each item individually
itemsToCopy.forEach(item => {
  if (fs.existsSync(item)) {
    fs.copySync(item, path.join(outputDir, item), copyOptions);
  }
});

// Process blog posts
if (fs.existsSync(blogDir)) {
  const posts = [];
  const blogFiles = fs.readdirSync(blogDir);
  
  // Ensure blog directory exists in output
  fs.ensureDirSync(path.join(outputDir, 'blog'));
  
  blogFiles.forEach(file => {
    if (path.extname(file) === '.md') {
      try {
        const content = fs.readFileSync(path.join(blogDir, file), 'utf8');
        const frontMatterMatch = content.match(/---\s*([\s\S]*?)\s*---/);
        
        if (frontMatterMatch) {
          const frontMatter = frontMatterMatch[1];
          const body = content.slice(frontMatterMatch[0].length);
          
          const post = {
            slug: path.parse(file).name,
            title: extractFrontMatter(frontMatter, 'title') || 'No title',
            date: extractFrontMatter(frontMatter, 'date') || new Date().toISOString(),
            excerpt: extractFrontMatter(frontMatter, 'excerpt') || '',
            author: extractFrontMatter(frontMatter, 'author') || 'ডা. রোমানুল ইসলাম',
            body: md.render(body)
          };
          
          posts.push(post);
          
          // Generate individual blog post page
          const postHtml = generatePostHtml(post);
          fs.writeFileSync(path.join(outputDir, 'blog', `${post.slug}.html`), postHtml);
        }
      } catch (error) {
        console.error(`Error processing blog file ${file}:`, error);
      }
    }
  });
  
  // Generate blog index JSON
  if (posts.length > 0) {
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    fs.writeFileSync(
      path.join(outputDir, 'blog', 'index.json'), 
      JSON.stringify(posts, null, 2)
    );
  }
}

// Create _redirects file for Cloudflare Pages to handle extensionless URLs
fs.writeFileSync(path.join(outputDir, '_redirects'), '/blog/* /blog/:splat.html 200');

console.log('Build completed successfully!');

function extractFrontMatter(frontMatter, key) {
  const regex = new RegExp(`${key}:\\s*(.*)`);
  const match = frontMatter.match(regex);
  return match ? match[1].trim() : '';
}

function generatePostHtml(post) {
  const formattedDate = new Date(post.date).toLocaleDateString('bn-BD');
  return `<!DOCTYPE html>
<html lang="bn" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${post.title} | ডা. রোমানুল ইসলাম – ব্লগ</title>
  <meta name="description" content="${post.excerpt}">
  <link rel="canonical" href="https://www.romanulislam.com/blog/${post.slug}.html">
  <meta name="theme-color" content="#0ea5a5">
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${post.title}">
  <meta property="og:description" content="${post.excerpt}">
  <meta property="og:url" content="https://www.romanulislam.com/blog/${post.slug}.html">
  <meta property="og:image" content="https://www.romanulislam.com/assets/images/og-placeholder.png">
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${post.title}">
  <meta name="twitter:description" content="${post.excerpt}">
  <meta name="twitter:image" content="https://www.romanulislam.com/assets/images/og-placeholder.png">
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <!-- AOS for simple scroll animations -->
  <link rel="stylesheet" href="https://unpkg.com/aos@2.3.4/dist/aos.css">
  <link rel="stylesheet" href="../assets/css/styles.css">
</head>
<body>
<div class="skip"><a href="#main">Skip to content</a></div>
<header class="site-header">
  <div class="container nav">
    <a class="brand" href="../index.html">👨‍⚕️ডা. রোমানুল ইসলাম</a>
    <nav>
      <a href="../index.html">হোম</a>
      <a href="../online-doctor-bd.html">সেবা</a>
      <a href="../blog.html">ব্লগ</a>
      <a href="../reviews.html">রোগীর মতামত</a>
      <a href="../contact.html">যোগাযোগ</a>
    </nav>
  </div>
</header>
<main id="main">
  <section class="section">
    <div class="container">
      <article class="blog-post">
        <header class="blog-post-header">
          <div class="blog-post-meta">
            <span>${formattedDate}</span> | <span>${post.author}</span>
          </div>
          <h1 class="blog-post-title">${post.title}</h1>
        </header>
        <div class="blog-post-content">
          ${post.body}
        </div>
      </article>
    </div>
  </section>
</main>
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <h4>ডা. রোমানুল ইসলাম</h4>
        <p>২৪/৭ ঘরে বসে ডাক্তারের পরামর্শ --- Best Online Doctor BD</p>
      </div>
      <div>
        <h4>দ্রুত যোগাযোগ</h4>
        <ul>
          <li>WhatsApp: <a href="https://wa.me/8801826589958" rel="noopener" target="_blank">+8801826589958</a></li>
          <li>Email: <span>dr.romanulislam@gmail.com</span></li>
        </ul>
      </div>
      <div>
        <h4>লিংক</h4>
        <ul>
          <li><a href="../index.html">হোম</a></li>
          <li><a href="../online-doctor-bd.html">সেবা</a></li>
          <li><a href="../blog.html">ব্লগ</a></li>
          <li><a href="../reviews.html">রোগীর মতামত</a></li>
          <li><a href="../contact.html">যোগাযোগ</a></li>
        </ul>
      </div>
    </div>
    <p class="copyright">© <span id="year"></span> Dr. Romanul Islam. All rights reserved.</p>
  </div>
</footer>

<a class="whatsapp-float" href="https://wa.me/8801826589958?text=স্যার, আমি একটি অ্যাপয়ন্টমেন্ট বুক করতে চাই" target="_blank" aria-label="WhatsApp Chat">
  <img src="../assets/images/whatsapp.gif" alt="WhatsApp">
</a>

<script src="https://unpkg.com/aos@2.3.4/dist/aos.js"></script>
<script src="../assets/js/main.js"></script>
<script>
  AOS.init({ once: true, duration: 600, easing: "ease-out" });
  document.getElementById("year").textContent = new Date().getFullYear();
</script>
</body>
</html>`;
}
