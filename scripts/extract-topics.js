// Script to extract unique topics from question JSON files
const fs = require('fs');

const files = [
  '../src/data/questions-health.json',
  '../src/data/questions-history.json',
  '../src/data/questions-culture.json',
  '../src/data/questions-finance.json'
];

const topics = new Set();

files.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    data.forEach(q => {
      if (q.topic) topics.add(q.topic);
    });
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
});

console.log('Unique topics found:', Array.from(topics).sort());
console.log('Total topics:', topics.size);
