/**
 * QuickShare GitHub Pages Setup Helper
 * 
 * This script helps users set up QuickShare for GitHub Pages by:
 * 1. Updating the GitHub repository URL in home.html
 * 2. Creating a docs folder with all necessary files (if needed)
 * 
 * Usage:
 * node setup-github-pages.js <your-github-username> [--docs]
 * 
 * Example:
 * node setup-github-pages.js johndoe
 * node setup-github-pages.js johndoe --docs
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const username = args[0];
const createDocs = args.includes('--docs');

if (!username) {
    console.error('Error: GitHub username is required');
    console.log('Usage: node setup-github-pages.js <your-github-username> [--docs]');
    process.exit(1);
}

console.log(`Setting up QuickShare for GitHub Pages for user: ${username}`);

// Update GitHub repository URL in home.html
try {
    const homeHtmlPath = path.join(__dirname, 'home.html');
    let homeHtml = fs.readFileSync(homeHtmlPath, 'utf8');
    
    // Replace the GitHub URL
    homeHtml = homeHtml.replace(
        /https:\/\/github\.com\/yourusername\/quickshare/g,
        `https://github.com/${username}/quickshare`
    );
    
    fs.writeFileSync(homeHtmlPath, homeHtml);
    console.log('✅ Updated GitHub repository URL in home.html');
} catch (error) {
    console.error('❌ Error updating home.html:', error.message);
}

// Create docs folder if requested
if (createDocs) {
    try {
        const docsDir = path.join(__dirname, 'docs');
        
        // Create docs directory if it doesn't exist
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir);
        }
        
        // Files to copy to docs folder
        const filesToCopy = [
            'index.html',
            'home.html',
            'index-p2p.html',
            'client-p2p.js',
            'style-p2p.css',
            'README-GITHUB.md'
        ];
        
        // Copy files
        filesToCopy.forEach(file => {
            const sourcePath = path.join(__dirname, file);
            const destPath = path.join(docsDir, file);
            
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
                console.log(`✅ Copied ${file} to docs folder`);
            } else {
                console.warn(`⚠️ Warning: ${file} not found, skipping`);
            }
        });
        
        console.log('\n✅ Docs folder created successfully!');
        console.log('\nNext steps:');
        console.log('1. Push these changes to your GitHub repository');
        console.log('2. Go to your repository settings');
        console.log('3. Navigate to Pages under "Code and automation"');
        console.log('4. Select your branch and set the folder to "/docs"');
        console.log('5. Click Save');
    } catch (error) {
        console.error('❌ Error creating docs folder:', error.message);
    }
} else {
    console.log('\n✅ Setup completed!');
    console.log('\nNext steps:');
    console.log('1. Push these changes to your GitHub repository');
    console.log('2. Go to your repository settings');
    console.log('3. Navigate to Pages under "Code and automation"');
    console.log('4. Select your branch and set the folder to "/" (root)');
    console.log('5. Click Save');
}

console.log('\nFor more details, see GITHUB_SETUP.md');