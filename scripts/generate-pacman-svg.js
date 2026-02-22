const fs = require('fs');
const https = require('https');

const username = process.argv[2] || 'Ajaykannagit';
const outputPath = process.argv[3] || 'dist/pacman.svg';
const token = process.env.GITHUB_TOKEN;

if (!token) {
    console.error('Error: GITHUB_TOKEN is required');
    process.exit(1);
}

const query = `
query($username:String!) {
  user(login: $username) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            color
            contributionCount
            date
            level
          }
        }
      }
    }
  }
}
`;

function post(url, data, headers) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'NodeJS',
                ...headers
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function run() {
    try {
        console.log(`Fetching contributions for ${username}...`);
        console.log(`Token available: ${token ? 'YES (length: ' + token.length + ')' : 'NO'}`);

        const result = await post('https://api.github.com/graphql', {
            query,
            variables: { username }
        }, {
            'Authorization': `Bearer ${token}`
        });

        if (result.errors) {
            console.error('GraphQL Errors:', JSON.stringify(result.errors, null, 2));
            process.exit(1);
        }

        if (!result.data) {
            console.error('No data in response. Full response:', JSON.stringify(result, null, 2));
            process.exit(1);
        }

        if (!result.data.user) {
            console.error(`User '${username}' not found. Response:`, JSON.stringify(result.data, null, 2));
            process.exit(1);
        }

        const calendar = result.data.user.contributionsCollection.contributionCalendar;
        const weeks = calendar.weeks;
        console.log(`Total contributions: ${calendar.totalContributions}`);

        console.log('Generating SVG...');
        const svg = generateSVG(weeks);

        if (!fs.existsSync('dist')) fs.mkdirSync('dist', { recursive: true });
        fs.writeFileSync(outputPath, svg);
        console.log(`SVG generated successfully at ${outputPath}`);
    } catch (err) {
        console.error('Error:', err.message || err);
        console.error('Stack:', err.stack);
        process.exit(1);
    }
}

function generateSVG(weeks) {
    const boxSize = 10;
    const gap = 2;
    const width = 53 * (boxSize + gap);
    const height = 7 * (boxSize + gap) + 20; // Plus margin for labels

    // Flatten days to get coordinates for Pac-Man path
    const days = [];
    weeks.forEach((week, x) => {
        week.contributionDays.forEach((day, y) => {
            days.push({ x, y, level: day.level, color: day.color });
        });
    });

    // Sort days by date to ensure sequential traversal
    // But contributionDays are already mostly ordered.

    const pacmanPath = days.map(d => `${d.x * (boxSize + gap) + boxSize / 2},${d.y * (boxSize + gap) + boxSize / 2}`).join(' ');

    let rects = '';
    days.forEach(d => {
        const color = d.level === 'NONE' ? '#161b22' : d.color;
        const opacity = d.level === 'NONE' ? '0.3' : '1';
        const glow = d.level !== 'NONE' ? `filter="url(#glow)"` : '';
        rects += `<rect x="${d.x * (boxSize + gap)}" y="${d.y * (boxSize + gap)}" width="${boxSize}" height="${boxSize}" rx="2" fill="${color}" opacity="${opacity}" ${glow} />\n`;
    });

    return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <style>
            .pacman { fill: #FFFF00; filter: drop-shadow(0 0 5px #FFFF00); }
            .ghost-red { fill: #FF0000; filter: drop-shadow(0 0 5px #FF0000); }
            .ghost-pink { fill: #FFB8FF; filter: drop-shadow(0 0 5px #FFB8FF); }
            
            @keyframes mouth {
                0%, 100% { clip-path: polygon(100% 50%, 0% 0%, 0% 100%); }
                50% { clip-path: polygon(100% 50%, 100% 50%, 0% 50%); }
            }
            .pacman-body {
                animation: mouth 0.3s infinite ease-in-out;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-2px); }
            }
            .ghost { animation: float 1s infinite ease-in-out; }
        </style>
    </defs>
    
    <rect width="100%" height="100%" fill="#0d1117" rx="5" />
    
    <g transform="translate(10, 10)">
        ${rects}
        
        <!-- Pac-Man Animation -->
        <g class="pacman">
            <animateMotion dur="20s" repeatCount="indefinite" path="M ${pacmanPath}" />
            <circle r="4" class="pacman-body" />
        </g>
        
        <!-- Red Ghost (Blinky) Following -->
        <g class="ghost ghost-red">
            <animateMotion dur="20s" repeatCount="indefinite" path="M ${pacmanPath}" begin="0.3s" />
            <path d="M -3,0 A 3,3 0 0 1 3,0 L 3,3 L 1.5,2 L 0,3 L -1.5,2 L -3,3 Z" />
        </g>
        
        <!-- Pink Ghost (Pinky) Following -->
        <g class="ghost ghost-pink">
            <animateMotion dur="20s" repeatCount="indefinite" path="M ${pacmanPath}" begin="0.6s" />
            <path d="M -3,0 A 3,3 0 0 1 3,0 L 3,3 L 1.5,2 L 0,3 L -1.5,2 L -3,3 Z" />
        </g>
    </g>
</svg>
    `.trim();
}

run();
