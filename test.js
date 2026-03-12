import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('job-scraper-backend/src/scrapers/temp.html', 'utf8');
const $ = cheerio.load(html);

// try to find job cards. They seem to contain a[href^="/jobs/"]
const jobs = [];
$('a[href^="/jobs/"]').each((i, el) => {
  const link = $(el).attr('href');
  
  // They are probably wrapped in a div. Let's find the nearest parent div that might be a card
  const container = $(el).closest('div.group'); // or something
  if (container.length) {
    jobs.push({
      link,
      text: container.text().replace(/\s+/g, ' ').trim()
    });
  } else {
    // maybe the link is inside the card
    const card = $(el).parent().parent().parent();
    jobs.push({
      link,
      text: card.text().replace(/\s+/g, ' ').trim()
    });
  }
});
console.log(JSON.stringify(jobs.slice(0, 2), null, 2));

// check if there's any NEXT_DATA script
const nextData = $('#__NEXT_DATA__').html();
if (nextData) console.log('Found NEXT_DATA');

// check if there's any other json script
$('script[type="application/json"]').each((i, el) => {
   console.log('Found JSON script of length', $(el).html().length);
});

