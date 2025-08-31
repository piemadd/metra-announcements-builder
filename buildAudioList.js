import fs from 'fs';
import inquirer from 'inquirer';

const files = fs.readdirSync('./public/announcements');

console.log(files)