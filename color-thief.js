const ColorThief = require('color-thief-node');

const fs = require('fs');
const path = require('path');

async function main() {
    const baseDir = path.resolve(__dirname, 'Leagues', 'Premier_League');

    // Read the directory containing all team folders
    fs.readdir(baseDir, { withFileTypes: true }, async (err, folders) => {
        if (err) {
            console.error('Error reading the Premier League directory:', err);
            return;
        }

        // Loop through each folder (each team)
        for (let folder of folders) {
            if (folder.isDirectory()) {
                const teamName = folder.name;
                const teamDir = path.join(baseDir, teamName);
                const files = fs.readdirSync(teamDir);

                // Assuming there's one PNG file per folder
                const logoFile = files.find(file => file.endsWith('.png'));
                if (logoFile) {
                    const filePath = path.join(teamDir, logoFile);
                    try {
                        // Generate and save the color profile
                        await generateColorProfile(filePath, teamName);
                        console.log(`Processed colors for team: ${teamName}`);
                    } catch (error) {
                        console.error(`Error processing ${teamName}:`, error);
                    }
                }
            }
        }
    });
}


function isNearWhiteOrBlack([r, g, b]) {
    // Define thresholds for near white or near black
    const nearWhiteThreshold = 230; // RGB values are close to 255
    const nearBlackThreshold = 25;  // RGB values are close to 0

    return r > nearWhiteThreshold && g > nearWhiteThreshold && b > nearWhiteThreshold ||
           r < nearBlackThreshold && g < nearBlackThreshold && b < nearBlackThreshold;
}

async function generateColorProfile(filePath, teamName) {
    let palette = await ColorThief.getPaletteFromURL(filePath, 4); // Get 4 colors now
    let colors = palette.map(color => `rgb(${color.join(',')})`);

    let baseColor = null;

    // Check for colors near white or black
    for (let i = 0; i < 3; i++) {
        if (isNearWhiteOrBlack(palette[i])) {
            baseColor = colors[i];
            // Remove the base color from the array and push it at the end
            colors.splice(i, 1);
            colors.push(baseColor);
            break;
        }
    }

    const [primaryColor, secondaryColor, accentColor] = colors;

    const colorProfile = {
        primaryColor,
        secondaryColor,
        accentColor,
        ...(baseColor && { baseColor }) // Include baseColor only if it's set
    };

    const colorProfilePath = path.join(filePath, '..', `${teamName}_colors.json`);
    fs.writeFileSync(colorProfilePath, JSON.stringify(colorProfile, null, 4));

    return colorProfile;
}

main();
