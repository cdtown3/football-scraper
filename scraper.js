const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function main() {
    const html = await fetchTeamsPage();
    const teams = await extractTeamsAndLogos(html);
  
    for (let team of teams) {
      await downloadSVG(team.logoUrl, team.teamName.replace(/ /g, '_'));
    }
}

async function fetchTeamsPage() {
  try {
    const url = 'https://www.premierleague.com/clubs';
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error('Error fetching the webpage: ', error);
  }
}

function extractTeamsAndLogos(html) {
    const $ = cheerio.load(html);
    const teams = [];

    $('.clubList__club').each((index, element) => {
        const teamName = $(element).find('.name').text().trim();
        const logoUrl = $(element).find('.js-badge-image').attr('src').trim();

        if (teamName && logoUrl) {
            teams.push({ teamName, logoUrl });
        }
    });

    return teams;
}

async function downloadImage(url, filename) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(path.resolve(__dirname, 'logos', `${filename}.svg`));

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading the SVG: ', error);
  }
}



main();