const fs = require('fs');
const path = require('path');

const newsData = JSON.parse(fs.readFileSync('news.json', 'utf8'));
const newsDir = 'images/news';

const results = {
    missingFiles: [],
    nullVideos: [],
    validVideos: []
};

newsData.forEach(item => {
    if (item.video) {
        const fullPath = path.resolve(item.video);
        if (fs.existsSync(fullPath)) {
            results.validVideos.push({ id: item.id, path: item.video });
        } else {
            results.missingFiles.push({ id: item.id, path: item.video, date: item.date });
        }
    } else {
        // Check if text suggests there should be a video
        const text = item.text.toLowerCase();
        if (text.includes('video') || text.includes('videolavha') || text.includes('chellenj')) {
            results.nullVideos.push({ id: item.id, date: item.date, text: item.text.substring(0, 100) });
        }
    }
});

console.log(`Total News: ${newsData.length}`);
console.log(`Valid Videos: ${results.validVideos.length}`);
console.log(`Missing Files: ${results.missingFiles.length}`);
console.log(`Suspected Null Videos: ${results.nullVideos.length}`);

if (results.validVideos.length > 0) {
    console.log('\n--- Valid Videos ---');
    results.validVideos.forEach(v => {
        const item = newsData.find(n => n.id === v.id);
        console.log(`${item.date} | ${item.id} | ${v.path}`);
    });
}


if (results.nullVideos.length > 0) {
    console.log('\n--- Suspected Null Videos (All) ---');
    results.nullVideos.forEach(v => console.log(`${v.date} | ${v.id} | ${v.text}`));
}

